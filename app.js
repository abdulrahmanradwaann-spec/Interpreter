/* ==========================================================================
   Advanced App Logic (Vanilla SPA Router & Data Manager)
   ========================================================================== */

const d = document;
let state = {
    lang: 'en',
    theme: 'dark',
    countries: countriesData, // Using the static data.js array directly
    favorites: [],
    currentRoute: '/',
    searchQuery: '',
    regionFilter: 'All'
};

const translations = {
    en: {
        appTitle: "ChronoWorld", localTime: "Local Time", searchPlaceholder: "Search countries by name or capital...",
        regionAll: "All Regions", regionAfrica: "Africa", regionAmericas: "Americas", regionAsia: "Asia",
        regionEurope: "Europe", regionOceania: "Oceania", footerText: "© 2026 All Rights Reserved | Developer: Abdulrahman Radwan",
        back: "Back to Explore", capital: "Capital", population: "Population", currency: "Currency",
        languages: "Languages", timezone: "Timezone", noData: "No data available", favToggle: "Toggle Favorite",
        landmarks: "Famous Landmarks", desc: "Overview"
    },
    ar: {
        appTitle: "عالم الزمن", localTime: "الوقت المحلي", searchPlaceholder: "ابحث عن الدول أو العواصم...",
        regionAll: "جميع القارات", regionAfrica: "أفريقيا", regionAmericas: "الأمريكتان", regionAsia: "آسيا",
        regionEurope: "أوروبا", regionOceania: "أوقيانوسيا", footerText: "© 2026 جميع الحقوق محفوظة | المطور: عبد الرحمن رضوان",
        back: "العودة للاستكشاف", capital: "العاصمة", population: "عدد السكان", currency: "العملة",
        languages: "اللغات", timezone: "المنطقة الزمنية", noData: "لا توجد بيانات", favToggle: "تفضيل",
        landmarks: "أشهر المعالم", desc: "نبذة عامة"
    }
};

/* ==========================================================================
   Security
   ========================================================================== */
function initSecurity() {
    d.addEventListener('contextmenu', e => e.preventDefault());
    d.addEventListener('copy', e => { e.clipboardData.setData('text/plain', 'Protected'); e.preventDefault(); });
}

/* ==========================================================================
   State & UI Updates
   ========================================================================== */
function toArabicDigits(str) {
    if (state.lang !== 'ar' || !str) return str;
    const arabicNumbers = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    return String(str).replace(/[0-9]/g, w => arabicNumbers[+w]);
}

function updateDOMText() {
    d.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[state.lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'text') el.placeholder = translations[state.lang][key];
            else el.textContent = translations[state.lang][key];
        }
    });
}

function toggleLang() {
    state.lang = state.lang === 'en' ? 'ar' : 'en';
    d.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    d.documentElement.lang = state.lang;
    localforage.setItem('app_lang', state.lang);
    updateDOMText();
    router.render(); // Re-render current view
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    d.body.className = `theme-${state.theme}`;
    d.querySelector('#themeToggle i').className = state.theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    localforage.setItem('app_theme', state.theme);
}

/* ==========================================================================
   Time Engine
   ========================================================================== */
function getFormattedTime(tz, options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) {
    try {
        const str = new Intl.DateTimeFormat('en-US', { timeZone: tz === 'UTC' ? undefined : tz, ...options }).format(new Date());
        return toArabicDigits(str);
    } catch {
        const str = new Intl.DateTimeFormat('en-US', options).format(new Date());
        return toArabicDigits(str);
    }
}

let timeInterval;
function startGlobalTimeEngine() {
    if(timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(() => {
        // Update header time
        const headerTimeEl = d.getElementById('headerLocalTime');
        if(headerTimeEl) headerTimeEl.textContent = getFormattedTime('UTC'); // Local time
        
        // Update all elements with data-tz attribute
        d.querySelectorAll('[data-tz]').forEach(el => {
            el.textContent = getFormattedTime(el.getAttribute('data-tz'));
        });
        
        // Update date elements
        d.querySelectorAll('[data-tz-date]').forEach(el => {
            const tz = el.getAttribute('data-tz-date');
            const locale = state.lang === 'ar' ? 'ar-SA' : 'en-US';
            try {
                let dateStr = new Intl.DateTimeFormat(locale, { timeZone: tz === 'UTC' ? undefined : tz, weekday:'long', year:'numeric', month:'long', day:'numeric' }).format(new Date());
                el.textContent = state.lang === 'ar' ? toArabicDigits(dateStr) : dateStr;
            } catch(e){}
        });
    }, 1000);
}

/* ==========================================================================
   Router & Views
   ========================================================================== */
const router = {
    navigate: (path) => {
        window.history.pushState({}, '', '#' + path);
        state.currentRoute = path;
        
        // Professional Page Transition: Show loader before entering the page
        const splash = d.getElementById('splashScreen');
        if (splash) {
            splash.classList.remove('hidden');
            // Wait for loader to appear, then render and hide
            setTimeout(() => {
                router.render();
                setTimeout(() => splash.classList.add('hidden'), 600);
            }, 600);
        } else {
            router.render();
        }
    },
    init: () => {
        window.addEventListener('popstate', () => {
            state.currentRoute = window.location.hash.replace('#', '') || '/';
            router.render();
        });
        state.currentRoute = window.location.hash.replace('#', '') || '/';
    },
    render: () => {
        const container = d.getElementById('viewContainer');
        container.innerHTML = '';
        
        if (state.currentRoute === '/') {
            renderDashboard(container);
        } else if (state.currentRoute.startsWith('/country/')) {
            const id = state.currentRoute.split('/')[2];
            const country = state.countries.find(c => c.id === id);
            if (country) renderImmersiveView(container, country);
            else router.navigate('/');
        }
        updateDOMText();
        initMagneticHover();
    }
};

async function toggleFavorite(id, e) {
    e.stopPropagation();
    if(state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(fav => fav !== id);
    } else {
        state.favorites.push(id);
    }
    await localforage.setItem('favorites', state.favorites);
    router.render();
}

/* ==========================================================================
   3D Globe Engine (Three.js)
   ========================================================================== */
function init3DGlobe(container) {
    if (typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create Earth Sphere
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    // Wireframe fallback for offline if no texture
    const material = new THREE.MeshBasicMaterial({ color: 0x00f5ff, wireframe: true, transparent: true, opacity: 0.3 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 6;

    let reqId;
    function animate() {
        reqId = requestAnimationFrame(animate);
        sphere.rotation.y += 0.002;
        sphere.rotation.x = 0.2; // slight tilt
        renderer.render(scene, camera);
    }
    animate();

    // Clean up when view changes
    return () => cancelAnimationFrame(reqId);
}

function renderDashboard(container) {
    const view = d.createElement('div');
    
    // 3D Globe Section
    const globeSec = d.createElement('div');
    globeSec.className = 'globe-container glass';
    globeSec.innerHTML = `<div class="globe-overlay" data-i18n="appTitle">ChronoWorld 3D</div>`;
    view.appendChild(globeSec);

    // Controls
    const controls = d.createElement('div');
    controls.className = 'controls-bar magnetic-target';
    controls.innerHTML = `
        <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="searchInput" data-i18n="searchPlaceholder" value="${state.searchQuery}">
        </div>
        <select class="filter-select glass magnetic-target" id="regionFilter">
            <option value="All" data-i18n="regionAll" ${state.regionFilter==='All'?'selected':''}>All Regions</option>
            <option value="Africa" data-i18n="regionAfrica" ${state.regionFilter==='Africa'?'selected':''}>Africa</option>
            <option value="Americas" data-i18n="regionAmericas" ${state.regionFilter==='Americas'?'selected':''}>Americas</option>
            <option value="Asia" data-i18n="regionAsia" ${state.regionFilter==='Asia'?'selected':''}>Asia</option>
            <option value="Europe" data-i18n="regionEurope" ${state.regionFilter==='Europe'?'selected':''}>Europe</option>
            <option value="Oceania" data-i18n="regionOceania" ${state.regionFilter==='Oceania'?'selected':''}>Oceania</option>
        </select>
    `;
    view.appendChild(controls);

    // Grid
    const grid = d.createElement('div');
    grid.className = 'countries-grid';
    
    const filtered = state.countries.filter(c => {
        const name = (state.lang === 'ar' ? c.nameAr : c.nameEn).toLowerCase();
        const cap = (state.lang === 'ar' ? c.capitalAr : c.capitalEn).toLowerCase();
        const q = state.searchQuery.toLowerCase();
        const matchSearch = name.includes(q) || cap.includes(q);
        const matchRegion = state.regionFilter === 'All' || c.region === state.regionFilter;
        return matchSearch && matchRegion;
    });

    filtered.sort((a, b) => {
        const aFav = state.favorites.includes(a.id);
        const bFav = state.favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    filtered.forEach(c => {
        const isFav = state.favorites.includes(c.id);
        const name = state.lang === 'ar' ? c.nameAr : c.nameEn;
        
        const card = d.createElement('div');
        card.className = 'country-card glass magnetic-target';
        card.onclick = () => router.navigate(`/country/${c.id}`);
        
        card.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''} magnetic-target" onclick="toggleFavorite('${c.id}', event)">
                <i class="fa-solid fa-star"></i>
            </button>
            <div class="card-header">
                <div>
                    <img src="https://flagcdn.com/w80/${c.id.toLowerCase()}.png" class="card-flag" alt="flag">
                    <h3 class="card-name">${name}</h3>
                </div>
            </div>
            <div class="card-time tabular-nums" data-tz="${c.tz}">--:--:--</div>
            <div class="card-meta">
                <span>${translations[state.lang]['region'+c.region] || c.region}</span>
            </div>
        `;
        grid.appendChild(card);
    });
    
    view.appendChild(grid);
    container.appendChild(view);

    // Init globe slightly after DOM insert
    setTimeout(() => init3DGlobe(globeSec), 50);

    // Event listeners
    d.getElementById('searchInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        router.render();
        const input = d.getElementById('searchInput');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    });
    d.getElementById('regionFilter').addEventListener('change', (e) => {
        state.regionFilter = e.target.value;
        router.render();
    });
}

function renderImmersiveView(container, country) {
    const view = d.createElement('div');
    view.className = 'immersive-view';
    
    const name = state.lang === 'ar' ? country.nameAr : country.nameEn;
    const capital = state.lang === 'ar' ? country.capitalAr : country.capitalEn;
    const desc = state.lang === 'ar' ? country.descAr : country.descEn;
    const insight = getAIInsight(country.id);
    const visitText = state.lang === 'ar' ? insight.visitAr : insight.visit;
    const cultureText = state.lang === 'ar' ? insight.cultureAr : insight.culture;
    
    const landmarks = getLandmarks(country.id, country.nameEn);
    const bgUrl = landmarks[0];

    // Time Intelligence: Determine Day/Night and Working Hours
    let hour = 12; // default
    try {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: country.tz, hour: 'numeric', hour12: false });
        hour = parseInt(formatter.format(new Date()));
    } catch(e) {}
    
    const isDay = hour >= 6 && hour < 18;
    const isWorking = hour >= 9 && hour < 17;
    const isSleeping = hour >= 23 || hour < 6;
    
    const bgFilter = isDay ? 'brightness(0.7)' : 'brightness(0.3) contrast(1.2)';
    
    const dayBadge = isDay 
        ? `<div class="badge day"><i class="fa-solid fa-sun"></i> ${state.lang==='ar'?'نهار':'Daytime'}</div>` 
        : `<div class="badge night"><i class="fa-solid fa-moon"></i> ${state.lang==='ar'?'ليل':'Nighttime'}</div>`;
        
    let statusBadge = '';
    if (isWorking) statusBadge = `<div class="badge working"><i class="fa-solid fa-briefcase"></i> ${state.lang==='ar'?'ساعات العمل':'Working Hours'}</div>`;
    else if (isSleeping) statusBadge = `<div class="badge night"><i class="fa-solid fa-bed"></i> ${state.lang==='ar'?'وقت النوم':'Sleeping Time'}</div>`;

    let galleryHTML = '';
    landmarks.forEach(url => {
        galleryHTML += `<div class="gallery-item glass"><img src="${url}" alt="Landmark" loading="lazy"></div>`;
    });

    view.innerHTML = `
        <button class="back-btn magnetic-target" onclick="router.navigate('/')">
            <i class="fa-solid fa-arrow-${state.lang === 'ar' ? 'right' : 'left'}"></i>
            <span data-i18n="back">Back</span>
        </button>

        <section class="hero-section glass">
            <div class="time-badges">
                ${dayBadge}
                ${statusBadge}
            </div>
            <img src="${bgUrl}" class="hero-bg" alt="Landscape" style="filter: ${bgFilter};">
            <div class="hero-content">
                <div class="hero-title-group">
                    <img src="https://flagcdn.com/w160/${country.id.toLowerCase()}.png" class="hero-flag" alt="flag">
                    <h2 class="hero-name text-gradient">${name}</h2>
                </div>
                <div class="hero-clock">
                    <div class="hero-time tabular-nums" data-tz="${country.tz}">--:--:--</div>
                    <div class="hero-date tabular-nums" data-tz-date="${country.tz}">-- -- ----</div>
                </div>
            </div>
        </section>

        <section class="details-grid">
            <!-- AI Insight Panel -->
            <div class="detail-card glass ai-insight-card">
                <i class="fa-solid fa-brain ai-icon"></i>
                <div class="ai-content">
                    <h4>Smart Insights</h4>
                    <p><strong>${state.lang==='ar'?'أفضل وقت للزيارة:':'Best time to visit:'}</strong> ${visitText}</p>
                    <p><strong>${state.lang==='ar'?'معالم ثقافية:':'Cultural Highlights:'}</strong> ${cultureText}</p>
                </div>
            </div>

            <div class="detail-card glass magnetic-target">
                <i class="fa-solid fa-city detail-icon"></i>
                <span class="detail-label" data-i18n="capital">Capital</span>
                <span class="detail-value">${capital || '-'}</span>
            </div>
            <div class="detail-card glass magnetic-target">
                <i class="fa-solid fa-users detail-icon"></i>
                <span class="detail-label" data-i18n="population">Population</span>
                <span class="detail-value tabular-nums">${toArabicDigits(country.population.toLocaleString())}</span>
            </div>
            <div class="detail-card glass magnetic-target">
                <i class="fa-solid fa-coins detail-icon"></i>
                <span class="detail-label" data-i18n="currency">Currency</span>
                <span class="detail-value">${country.currency || '-'}</span>
            </div>
            <div class="detail-card glass magnetic-target">
                <i class="fa-solid fa-language detail-icon"></i>
                <span class="detail-label" data-i18n="languages">Languages</span>
                <span class="detail-value">${country.languagesEn || '-'}</span>
            </div>
            <div class="detail-card glass magnetic-target">
                <i class="fa-solid fa-clock detail-icon"></i>
                <span class="detail-label" data-i18n="timezone">Timezone</span>
                <span class="detail-value">${country.tz}</span>
            </div>
        </section>

        <section class="gallery-section">
            <h3 data-i18n="landmarks">Famous Landmarks</h3>
            <div class="landmark-gallery">
                ${galleryHTML}
            </div>
        </section>
    `;
    
    container.appendChild(view);
}

/* ==========================================================================
   Magnetic Cursor Engine
   ========================================================================== */
function initMagneticCursor() {
    const cursor = d.getElementById('magneticCursor');
    if (!cursor) return;
    
    d.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
}
function initMagneticHover() {
    const cursor = d.getElementById('magneticCursor');
    if (!cursor) return;
    d.querySelectorAll('.magnetic-target, button, .country-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}

/* ==========================================================================
   Bootstrapping
   ========================================================================== */
async function boot() {
    initSecurity();
    initMagneticCursor();
    
    // Load local state
    const savedLang = await localforage.getItem('app_lang');
    if (savedLang) {
        state.lang = savedLang;
        d.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
        d.documentElement.lang = state.lang;
    }
    
    const savedTheme = await localforage.getItem('app_theme');
    if (savedTheme) {
        state.theme = savedTheme;
        d.body.className = `theme-${state.theme}`;
    }
    
    const favs = await localforage.getItem('favorites');
    if(favs) state.favorites = favs;

    // Event Listeners
    d.getElementById('langToggle').addEventListener('click', toggleLang);
    d.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Add magnetic class to header buttons
    d.querySelectorAll('.icon-btn, .logo').forEach(el => el.classList.add('magnetic-target'));

    // Initialize Router
    router.init();
    router.render();
    
    // Start Engine
    startGlobalTimeEngine();

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }

    // Hide Splash Screen after minimum time to show professional animation
    setTimeout(() => {
        const splash = d.getElementById('splashScreen');
        if(splash) splash.classList.add('hidden');
    }, 2000);
}

// Start App when LocalForage is ready
window.addEventListener('load', boot);
