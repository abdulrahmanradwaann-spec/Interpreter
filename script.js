// Configuration & State
const CONFIG = {
    DEFAULT_CITY: 'Aden',
    API_URL: 'https://api.aladhan.com/v1',
    UPDATE_INTERVAL: 60000, // 1 minute
    GEO_TIMEOUT: 15000,
    CITIES: {
        'Aden': { lat: 12.7855, lng: 45.0186, method: 4 },
        'Taiz': { lat: 13.5795, lng: 44.0106, method: 4 },
        'Sana\'a': { lat: 15.3694, lng: 44.1910, method: 4 },
        'Ibb': { lat: 13.9667, lng: 44.1833, method: 4 },
        'Hodeidah': { lat: 14.8014, lng: 42.9511, method: 4 },
        'Mukalla': { lat: 14.5425, lng: 49.1242, method: 4 }
    }
};

let state = {
    city: 'Aden',
    location: { lat: 12.7855, lng: 45.0186, altitude: 0 },
    timings: null,
    nextPrayer: null,
    hijriDate: null,
    hijriMonthOffset: 0,
    adhanTriggered: {}, // منع تكرار التنبيه
    isPrayerTimeUpdating: false, // قفل تحديث المواقيت المتكرر
    settings: {
        notifications: true,
        vibrate: true,
        sound: true,
        lang: 'ar',
        notificationType: 'adhan',
        focusMode: false,
        hijriAdjustment: 0,
        calcMethod: 4,
        preReminder: 0,
        adjustments: {
            Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
        }
    }
};

// Storage Helper (بدون تغيير)
const Storage = {
    set(key, value) {
        try {
            const str = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, str);
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    },
    get(key, defaultValue = null) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return defaultValue;
            try { return JSON.parse(val); } catch { return val; }
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    },
    remove(key) {
        try { localStorage.removeItem(key); return true; } catch (e) { return false; }
    }
};

// I18N (بدون تغيير)
const I18N = {
    ar: {
        Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر',
        Maghrib: 'المغرب', Isha: 'العشاء', next: 'الصلاة القادمة',
        remaining: 'متبقي على الأذان', loading: 'جاري التحميل...',
        error: 'خطأ في جلب البيانات', location_denied: 'تم رفض الوصول للموقع',
        location_error: 'تعذر تحديد الموقع'
    },
    en: {
        Fajr: 'Fajr', Sunrise: 'Sunrise', Dhuhr: 'Dhuhr', Asr: 'Asr',
        Maghrib: 'Maghrib', Isha: 'Isha', next: 'Next Prayer',
        remaining: 'Time until Adhan', loading: 'Loading...',
        error: 'Error fetching data', location_denied: 'Location access denied',
        location_error: 'Unable to get location'
    }
};

function getPrayerName(id) {
    return I18N[state.settings.lang][id] || id;
}

// Core Functions
async function init() {
    loadSettings();
    await updatePrayerTimes();
    renderPrayerGrid();
    updateUI();
    startMasterClock();
    setupUIListeners();
    setupModals();

    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loader.style.display = 'none', 500);
        }, 800);
    }
}

function loadSettings() {
    const savedSettings = Storage.get('settings');
    if (savedSettings) state.settings = { ...state.settings, ...savedSettings };
    state.city = Storage.get('lastCity', CONFIG.DEFAULT_CITY);
    if (Storage.get('theme') === 'light') document.body.classList.remove('dark-mode');
    else document.body.classList.add('dark-mode');
}

async function updatePrayerTimes() {
    if (state.isPrayerTimeUpdating) return;
    state.isPrayerTimeUpdating = true;
    try {
        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);

        let url;
        if (state.city === 'custom') {
            url = `${CONFIG.API_URL}/timings/${timestamp}?latitude=${state.location.lat}&longitude=${state.location.lng}&method=${state.settings.calcMethod}&tune=0,0,0,0,0,0,0,0,0`;
        } else {
            url = `${CONFIG.API_URL}/timingsByCity?city=${state.city}&country=Yemen&method=${state.settings.calcMethod}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200) {
            state.timings = data.data.timings;
            state.hijriDate = data.data.date.hijri;

            // تطبيق التعديلات اليدوية
            for (let prayer in state.settings.adjustments) {
                if (state.timings[prayer] && state.settings.adjustments[prayer]) {
                    const [h, m] = state.timings[prayer].split(':');
                    const adjTime = new Date();
                    adjTime.setHours(parseInt(h), parseInt(m) + parseInt(state.settings.adjustments[prayer]), 0, 0);
                    const newH = adjTime.getHours().toString().padStart(2, '0');
                    const newM = adjTime.getMinutes().toString().padStart(2, '0');
                    state.timings[prayer] = `${newH}:${newM}`;
                }
            }

            calculateNextPrayer();
            Storage.set('lastTimings', state.timings);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        const cached = Storage.get('lastTimings');
        if (cached) {
            state.timings = cached;
            calculateNextPrayer();
        }
    } finally {
        state.isPrayerTimeUpdating = false;
    }
}

function calculateNextPrayer() {
    if (!state.timings) return;

    const now = new Date();
    const prayerList = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let next = null, prev = null, prevTime = null;

    // إيجاد الصلاة التالية وآخر صلاة مضت
    for (let i = 0; i < prayerList.length; i++) {
        const prayer = prayerList[i];
        const [h, m] = state.timings[prayer].split(':');
        const pTime = new Date();
        pTime.setHours(parseInt(h), parseInt(m), 0, 0);

        if (pTime > now) {
            next = { id: prayer, time: pTime };
            // آخر صلاة مضت هي السابقة في القائمة بشرط أن يكون وقتها قد مرّ
            if (i > 0) {
                const prevPrayer = prayerList[i - 1];
                const [ph, pm] = state.timings[prevPrayer].split(':');
                const prevTimeCand = new Date();
                prevTimeCand.setHours(parseInt(ph), parseInt(pm), 0, 0);
                if (prevTimeCand <= now) {
                    prev = prevPrayer;
                    prevTime = prevTimeCand;
                } else if (i - 2 >= 0) {
                    // الصلاة السابقة لم تحن بعد، نأخذ التي قبلها
                    const earlier = prayerList[i - 2];
                    const [eh, em] = state.timings[earlier].split(':');
                    const earlierTime = new Date();
                    earlierTime.setHours(parseInt(eh), parseInt(em), 0, 0);
                    prev = earlier;
                    prevTime = earlierTime;
                }
            }
            break;
        }
    }

    // إذا تجاوزنا كل الصلوات (مواقيت اليوم انتهت) تكون الصلاة القادمة فجر اليوم التالي
    if (!next) {
        const [h, m] = state.timings['Fajr'].split(':');
        const tomorrowFajr = new Date();
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        tomorrowFajr.setHours(parseInt(h), parseInt(m), 0, 0);
        next = { id: 'Fajr', time: tomorrowFajr };

        // الصلاة التي مضت هي العشاء الحالية
        const [ih, im] = state.timings['Isha'].split(':');
        const ishaToday = new Date();
        ishaToday.setHours(parseInt(ih), parseInt(im), 0, 0);
        if (ishaToday <= now) {
            prev = 'Isha';
            prevTime = ishaToday;
        } else {
            // إذا كانت العشاء لم تأتِ بعد (حالة نادرة جداً) نأخذ المغرب
            const [mh, mm] = state.timings['Maghrib'].split(':');
            const maghribToday = new Date();
            maghribToday.setHours(parseInt(mh), parseInt(mm), 0, 0);
            prev = 'Maghrib';
            prevTime = maghribToday;
        }
    }

    state.nextPrayer = next;
    state.prevPrayerTime = prevTime;
    // إعادة تعيين تنبيه الأذان لهذه الصلاة
    if (next && state.adhanTriggered[next.id]) {
        delete state.adhanTriggered[next.id];
    }
}

function startMasterClock() {
    setInterval(() => {
        updateClockUI();
        checkPrayerTriggers();
    }, 1000);
}

function updateClockUI() {
    const now = new Date();

    // الساعة الرقمية
    const clockEl = document.getElementById('digital-clock');
    const periodEl = document.getElementById('time-period');
    if (clockEl) {
        let h = now.getHours(), m = now.getMinutes().toString().padStart(2, '0'), s = now.getSeconds().toString().padStart(2, '0');
        const period = h >= 12 ? 'م' : 'ص';
        h = h % 12 || 12;
        clockEl.textContent = `${h.toString().padStart(2, '0')}:${m}:${s}`;
        if (periodEl) periodEl.textContent = period;
    }

    if (!state.nextPrayer) return;

    const diff = state.nextPrayer.time - now;
    const countdownEl = document.getElementById('countdown');

    if (diff <= 0) {
        // موعد الصلاة حان، نُنفّذ الأذان ونجلب المواقيت الجديدة مرة واحدة
        if (!state.adhanTriggered[state.nextPrayer.id]) {
            state.adhanTriggered[state.nextPrayer.id] = true;
            triggerAdhan(state.nextPrayer.id);
        }
        // بعد ثوانٍ نُحدّث المواقيت
        if (!state.isPrayerTimeUpdating) {
            setTimeout(async () => {
                await updatePrayerTimes();
                renderPrayerGrid();
                updateUI();
            }, 2000);
        }
        if (countdownEl) countdownEl.textContent = '00:00:00';
        return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (countdownEl) {
        countdownEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // شريط التقدّم
    const progressEl = document.getElementById('prayer-progress');
    if (progressEl && state.prevPrayerTime) {
        const totalDuration = state.nextPrayer.time - state.prevPrayerTime;
        const elapsed = now - state.prevPrayerTime;
        const percentage = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
        progressEl.style.width = `${percentage}%`;
    }

    updateDynamicBackground(now.getHours());
}

function updateDynamicBackground(hour) {
    const bg = document.getElementById('dynamic-bg');
    if (!bg) return;
    bg.classList.remove('bg-dawn', 'bg-day', 'bg-dusk', 'bg-night');
    if (hour >= 4 && hour < 6) bg.classList.add('bg-dawn');
    else if (hour >= 6 && hour < 17) bg.classList.add('bg-day');
    else if (hour >= 17 && hour < 19) bg.classList.add('bg-dusk');
    else bg.classList.add('bg-night');
}

function renderPrayerGrid() {
    const grid = document.getElementById('prayer-list');
    if (!grid) return;

    const prayers = [
        { id: 'Fajr', icon: 'fa-cloud-moon' },
        { id: 'Sunrise', icon: 'fa-sun' },
        { id: 'Dhuhr', icon: 'fa-sun' },
        { id: 'Asr', icon: 'fa-cloud-sun' },
        { id: 'Maghrib', icon: 'fa-moon' },
        { id: 'Isha', icon: 'fa-star-and-crescent' }
    ];

    grid.innerHTML = prayers.map(p => `
        <div class="prayer-card" data-prayer="${p.id}">
            <div class="prayer-icon"><i class="fa-solid ${p.icon}"></i></div>
            <div class="prayer-info">
                <h3>${getPrayerName(p.id)}</h3>
                <p id="${p.id.toLowerCase()}-time" class="prayer-time">--:--</p>
            </div>
        </div>
    `).join('');
}

function updateUI() {
    if (!state.timings) return;

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('gregorian-date');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('ar-YE', options);

    if (state.hijriDate) {
        const hijri = getCorrectedHijriDate();
        const hijriEl = document.getElementById('hijri-date');
        if (hijriEl) hijriEl.textContent = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;
    }

    const locEl = document.getElementById('current-location');
    if (locEl) locEl.textContent = state.city === 'custom' ? 'موقعي الحالي' : state.city;

    updatePrayerCards();
}

function updatePrayerCards() {
    const prayerList = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    prayerList.forEach(id => {
        const timeEl = document.getElementById(`${id.toLowerCase()}-time`);
        if (timeEl) timeEl.textContent = formatTime(state.timings[id]);

        const card = document.querySelector(`[data-prayer="${id}"]`);
        if (card) card.classList.toggle('active', state.nextPrayer && state.nextPrayer.id === id);
    });

    if (state.nextPrayer) {
        const nextEl = document.getElementById('next-prayer-name');
        if (nextEl) nextEl.textContent = getPrayerName(state.nextPrayer.id);
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${period}`;
}

function getCorrectedHijriDate() {
    const hijri = { ...state.hijriDate };
    if (state.settings.hijriAdjustment !== 0 && hijri.day) {
        let day = parseInt(hijri.day) + state.settings.hijriAdjustment;
        if (day > 30) day = 1;
        if (day < 1) day = 29;
        hijri.day = day.toString();
    }
    return hijri;
}

function setupUIListeners() {
    const geoBtn = document.getElementById('geo-btn');
    if (geoBtn) geoBtn.addEventListener('click', handleGeolocation);

    const notifyBtn = document.getElementById('notification-toggle');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', toggleNotifications);
        updateNotifyBtnUI();
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            Storage.set('theme', isDark ? 'dark' : 'light');
        });
    }

    const refreshDhikrBtn = document.getElementById('refresh-dhikr');
    if (refreshDhikrBtn) {
        refreshDhikrBtn.addEventListener('click', () => {
            const dhikrArr = [
                '"أرحنا بها يا بلال"', '"ألا بذكر الله تطمئن القلوب"',
                '"سبحان الله وبحمده سبحان الله العظيم"', '"اللهم صل وسلم على نبينا محمد"',
                '"حسبي الله لا إله إلا هو عليه توكلت"'
            ];
            const randomDhikr = dhikrArr[Math.floor(Math.random() * dhikrArr.length)];
            const dhikrEl = document.getElementById('daily-dhikr');
            if (dhikrEl) {
                dhikrEl.style.opacity = '0';
                setTimeout(() => { dhikrEl.textContent = randomDhikr; dhikrEl.style.opacity = '1'; }, 300);
            }
        });
    }
}

function setupModals() {
    // فتح النوافذ
    document.getElementById('settings-btn')?.addEventListener('click', () => {
        populateSettingsModal();
        document.getElementById('settings-modal').classList.add('active');
    });
    document.getElementById('dhikr-btn')?.addEventListener('click', () => {
        loadAdhkar('morning');
        document.getElementById('adhkar-modal').classList.add('active');
    });
    document.getElementById('location-search-btn')?.addEventListener('click', () => {
        document.getElementById('location-modal').classList.add('active');
    });
    document.getElementById('qibla-btn')?.addEventListener('click', () => {
        document.getElementById('qibla-overlay').classList.add('active');
        initQibla();
    });
    document.getElementById('hijri-calendar-btn')?.addEventListener('click', () => {
        state.hijriMonthOffset = 0;
        renderHijriCalendar();
        document.getElementById('hijri-modal').classList.add('active');
    });

    // إغلاق النوافذ
    document.querySelectorAll('.close-modal, .modal-blur-bg').forEach(el => {
        el.addEventListener('click', function () {
            this.closest('.modal-luxury')?.classList.remove('active');
        });
    });

    // حفظ الإعدادات
    document.getElementById('save-settings')?.addEventListener('click', async () => {
        saveSettingsFromModal();
        document.getElementById('settings-modal').classList.remove('active');
        await updatePrayerTimes();
        renderPrayerGrid();
        updateUI();
    });

    // البحث عن مدينة
    document.getElementById('execute-search')?.addEventListener('click', () => {
        const val = document.getElementById('location-search-input').value.trim();
        if (val) {
            state.city = val;
            Storage.set('lastCity', val);
            document.getElementById('location-modal').classList.remove('active');
            updatePrayerTimes().then(updateUI);
        }
    });

    // ألسنة الأذكار
    document.querySelectorAll('.adhkar-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.adhkar-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            loadAdhkar(e.target.dataset.category);
        });
    });

    // التنقل في التقويم الهجري
    document.getElementById('prev-month')?.addEventListener('click', () => {
        state.hijriMonthOffset--;
        renderHijriCalendar();
    });
    document.getElementById('next-month')?.addEventListener('click', () => {
        state.hijriMonthOffset++;
        renderHijriCalendar();
    });
}

function renderHijriCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const monthYearLabel = document.getElementById('calendar-month-year');
    const eventsContainer = document.getElementById('events-container');
    if (!daysContainer || !monthYearLabel) return;

    // احتساب التاريخ الأساسي بناءً على الإزاحة
    const baseDate = new Date();
    baseDate.setDate(1);
    baseDate.setMonth(baseDate.getMonth() + state.hijriMonthOffset); // تقريبي

    // استخدام Intl لعرض الشهر الهجري
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { month: 'long', year: 'numeric' });
    const title = formatter.format(baseDate);
    monthYearLabel.textContent = title;

    // توليد أيام تقريبية (قد لا تطابق الواقع، للعرض فقط)
    let html = '';
    // فراغات للمحاذاة
    for (let i = 0; i < 3; i++) html += `<div class="calendar-day empty"></div>`;
    for (let i = 1; i <= 30; i++) {
        const isToday = (state.hijriMonthOffset === 0 && state.hijriDate && parseInt(state.hijriDate.day) === i);
        html += `<div class="calendar-day ${isToday ? 'active' : ''}">${i}</div>`;
    }
    daysContainer.innerHTML = html;

    // أحداث إسلامية شائعة حسب اسم الشهر
    let eventsHtml = '';
    if (title.includes('رمضان')) {
        eventsHtml = `<div class="event-item"><i class="fa-solid fa-moon"></i> شهر الصيام والقرآن</div>
                      <div class="event-item"><i class="fa-solid fa-star-and-crescent"></i> العشر الأواخر</div>`;
    } else if (title.includes('شوال')) {
        eventsHtml = `<div class="event-item"><i class="fa-solid fa-gift"></i> عيد الفطر المبارك</div>`;
    } else if (title.includes('ذي الحجة')) {
        eventsHtml = `<div class="event-item"><i class="fa-solid fa-kaaba"></i> موسم الحج</div>
                      <div class="event-item"><i class="fa-solid fa-gift"></i> عيد الأضحى المبارك</div>`;
    } else if (title.includes('محرم')) {
        eventsHtml = `<div class="event-item"><i class="fa-solid fa-calendar"></i> رأس السنة الهجرية</div>
                      <div class="event-item"><i class="fa-solid fa-hand-holding-heart"></i> يوم عاشوراء</div>`;
    } else {
        eventsHtml = `<div class="event-item text-muted">لا توجد مناسبات رئيسية في هذا الشهر</div>`;
    }
    if (eventsContainer) eventsContainer.innerHTML = eventsHtml;
}

function populateSettingsModal() {
    const s = state.settings;
    if (document.getElementById('language-switch')) document.getElementById('language-switch').value = s.lang || 'ar';
    if (document.getElementById('calc-method')) document.getElementById('calc-method').value = s.calcMethod || 4;
    if (document.getElementById('notification-type')) document.getElementById('notification-type').value = s.notificationType || 'adhan';
    if (document.getElementById('focus-mode')) document.getElementById('focus-mode').checked = !!s.focusMode;
    if (document.getElementById('pre-reminder')) document.getElementById('pre-reminder').value = s.preReminder || 0;
    if (document.getElementById('sound-toggle')) document.getElementById('sound-toggle').checked = !!s.sound;
    if (document.getElementById('vibrate-toggle')) document.getElementById('vibrate-toggle').checked = !!s.vibrate;

    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(p => {
        const input = document.getElementById(`adj-${p}`);
        if (input && s.adjustments) input.value = s.adjustments[p] || 0;
    });
}

function saveSettingsFromModal() {
    if (!state.settings.adjustments) state.settings.adjustments = {};

    const lang = document.getElementById('language-switch')?.value;
    if (lang) state.settings.lang = lang;
    const calc = document.getElementById('calc-method')?.value;
    if (calc) state.settings.calcMethod = parseInt(calc);
    const notifyType = document.getElementById('notification-type')?.value;
    if (notifyType) state.settings.notificationType = notifyType;
    const focus = document.getElementById('focus-mode')?.checked;
    if (focus !== undefined) state.settings.focusMode = focus;
    const preRem = document.getElementById('pre-reminder')?.value;
    if (preRem) state.settings.preReminder = parseInt(preRem);
    const sound = document.getElementById('sound-toggle')?.checked;
    if (sound !== undefined) state.settings.sound = sound;
    const vibe = document.getElementById('vibrate-toggle')?.checked;
    if (vibe !== undefined) state.settings.vibrate = vibe;

    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(p => {
        const input = document.getElementById(`adj-${p}`);
        if (input) state.settings.adjustments[p] = parseInt(input.value) || 0;
    });

    Storage.set('settings', state.settings);
}

function loadAdhkar(category) {
    const list = document.getElementById('adhkar-list');
    if (!list) return;

    const data = {
        morning: [
            "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ.",
            "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ.",
            "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ."
        ],
        evening: [
            "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ.",
            "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.",
            "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ."
        ],
        after_prayer: [
            "أَسْتَغْفِرُ اللَّهَ (ثلاثاً) اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ.",
            "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
            "سُبْحَانَ اللَّهِ (33)، وَالْحَمْدُ لِلَّهِ (33)، وَاللَّهُ أَكْبَرُ (33)."
        ]
    };

    list.innerHTML = data[category].map(d => `
        <div class="adhkar-card" style="padding:15px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.1);">
            <p style="font-size:1.1rem; line-height:1.6; color:#f8fafc;">${d}</p>
        </div>
    `).join('');
}

function initQibla() {
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        window.DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('يتطلب الوصول إلى البوصلة إذن المستشعر.');
                }
            })
            .catch(console.error);
    } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        // احتياط للأجهزة القديمة
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

function handleOrientation(event) {
    let alpha = event.webkitCompassHeading || (event.alpha !== null ? Math.abs(event.alpha - 360) : null);
    if (alpha === null) return;

    const meccaLat = 21.4225, meccaLng = 39.8262;
    const userLat = state.location.lat, userLng = state.location.lng;
    const dLon = (meccaLng - userLng) * Math.PI / 180;
    const lat1 = userLat * Math.PI / 180, lat2 = meccaLat * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    brng = (brng + 360) % 360;

    const compassArrow = document.getElementById('compass-arrow');
    const degEl = document.getElementById('qibla-deg');
    if (compassArrow) {
        compassArrow.style.transition = 'transform 0.1s ease-out';
        compassArrow.style.transform = `translate(-50%, -100%) rotate(${brng - alpha}deg)`;
    }
    if (degEl) degEl.textContent = Math.round(brng);
}

async function handleGeolocation() {
    if (!navigator.geolocation) return;
    const geoBtn = document.getElementById('geo-btn');
    if (geoBtn) geoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            state.location = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                altitude: pos.coords.altitude || 0
            };
            state.city = 'custom';
            Storage.set('lastCity', 'custom');
            await updatePrayerTimes();
            updateUI();
            if (geoBtn) geoBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
        },
        (err) => {
            console.error(err);
            if (geoBtn) geoBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
            alert('تعذر تحديد الموقع الجغرافي الدقيق. يرجى التأكد من تفعيل GPS.');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

function toggleNotifications() {
    state.settings.notifications = !state.settings.notifications;
    Storage.set('settings', state.settings);
    updateNotifyBtnUI();

    if (state.settings.notifications && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function updateNotifyBtnUI() {
    const btn = document.getElementById('notification-toggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.className = state.settings.notifications ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
        btn.classList.toggle('disabled', !state.settings.notifications);
    }
}

function checkPrayerTriggers() {
    if (!state.nextPrayer) return;
    const now = new Date();
    const diff = Math.floor((state.nextPrayer.time - now) / 1000);

    // الأذان الرئيسي (عند الصفر تماماً) لكن بشرط ألا يكون قد نُفِّذ
    if (diff <= 0 && !state.adhanTriggered[state.nextPrayer.id]) {
        state.adhanTriggered[state.nextPrayer.id] = true;
        triggerAdhan(state.nextPrayer.id);
    }

    // التذكير قبل الصلاة
    if (diff > 0 && diff === state.settings.preReminder * 60) {
        triggerPreReminder(state.nextPrayer.id, state.settings.preReminder);
    }
}

async function triggerAdhan(prayerId) {
    if (state.settings.sound && state.settings.notificationType !== 'silent') {
        const audioId = state.settings.notificationType === 'adhan' ? 'adhan-sound' : 'beep-sound';
        const audio = document.getElementById(audioId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.error("Audio play error", e);
                if (state.settings.notificationType === 'adhan') {
                    document.getElementById('beep-sound')?.play();
                }
            });
        }
    }
    if (state.settings.vibrate && navigator.vibrate && !state.settings.focusMode) {
        navigator.vibrate([200, 100, 200]);
    }

    if (state.settings.notifications) {
        const title = state.settings.lang === 'ar' ? "حان الآن وقت صلاة " + getPrayerName(prayerId) : "It's time for " + getPrayerName(prayerId);
        const body = state.settings.lang === 'ar' ? "حي على الصلاة، حي على الفلاح" : "Come to prayer, come to success";
        const icon = "icon.svg";

        if ('serviceWorker' in navigator && Notification.permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, { body, icon, badge: icon, vibrate: [200, 100, 200], tag: 'prayer-notification', renotify: true });
        } else if (Notification.permission === "granted") {
            new Notification(title, { body, icon });
        }
    }
}

async function triggerPreReminder(prayerId, mins) {
    if (state.settings.sound && state.settings.notificationType !== 'silent') {
        const audio = document.getElementById('beep-sound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
        }
    }

    if (state.settings.notifications) {
        const title = state.settings.lang === 'ar' ? "تذكير بقرب الصلاة" : "Prayer Reminder";
        const body = state.settings.lang === 'ar' ? `بقي ${mins} دقائق على صلاة ${getPrayerName(prayerId)}` : `${mins} minutes left until ${getPrayerName(prayerId)}`;
        const icon = "icon.svg";

        if ('serviceWorker' in navigator && Notification.permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, { body, icon, badge: icon, tag: 'prayer-reminder' });
        } else if (Notification.permission === "granted") {
            new Notification(title, { body, icon });
        }
    }
}

// Service Worker مع كشف التحديثات
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered:', registration);
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New content is available; please refresh.');
                        const toast = document.getElementById('update-toast');
                        if (toast) toast.classList.add('show');
                        document.getElementById('update-now')?.addEventListener('click', () => {
                            installingWorker.postMessage({ action: 'skipWaiting' });
                        });
                        document.getElementById('update-later')?.addEventListener('click', () => {
                            toast.classList.remove('show');
                        });
                    }
                };
            };
        }).catch(console.error);

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    });
}

// بدء التطبيق
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

document.addEventListener('DOMContentLoaded', init);
