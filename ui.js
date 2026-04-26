// ui.js - أدوات واجهة المستخدم (نسخة خارقة)
const UI = {
    // تتبع التوست النشط لمنع تراكمها
    _activeToast: null,

    showToast(msg) {
        // إزالة أي توست سابق لتجنب تكدس الإشعارات
        if (this._activeToast) {
            this._activeToast.remove();
            this._activeToast = null;
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg; // textContent آمن ضد XSS
        document.body.appendChild(toast);
        this._activeToast = toast;

        // إزالة تلقائية بعد المدة
        const removeToast = () => {
            if (toast.parentNode) {
                toast.remove();
                if (this._activeToast === toast) this._activeToast = null;
            }
        };
        setTimeout(removeToast, 3000);
    },

    renderHistory(list, container) {
        if (!list.length) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">لا توجد ترجمات سابقة</p>';
            return;
        }

        // عرض آخر 30 عنصرًا فقط
        const items = list.slice(0, 30);
        const fragment = document.createDocumentFragment();

        for (const item of items) {
            const card = document.createElement('div');
            card.style.cssText = 
                'padding:10px; margin:4px 0; background:rgba(0,0,0,0.2); border-radius:8px; ' +
                'display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;';

            // نص المصدر مقتطع بشكل آمن (يحافظ على الأحرف المركبة والعربية)
            const sourceSpan = document.createElement('span');
            sourceSpan.textContent = this._truncateText(item.sourceText, 40);

            const arrow = document.createElement('span');
            arrow.style.color = 'var(--neon-purple)';
            arrow.textContent = '←';

            // نص الهدف
            const targetSpan = document.createElement('span');
            targetSpan.textContent = this._truncateText(item.targetText, 40);

            // الطابع الزمني
            const timeSmall = document.createElement('small');
            timeSmall.style.color = 'var(--text-muted)';
            timeSmall.textContent = this._formatTime(item.timestamp);

            card.appendChild(sourceSpan);
            card.appendChild(arrow);
            card.appendChild(targetSpan);
            card.appendChild(timeSmall);
            fragment.appendChild(card);
        }

        container.innerHTML = ''; // تنظيف الحاوية
        container.appendChild(fragment);
    },

    updateConnection() {
        const badge = document.getElementById('connectionBadge');
        const label = document.getElementById('connectionLabel');
        if (!badge || !label) return;

        const isOnline = navigator.onLine;
        badge.className = `connection-badge ${isOnline ? 'online' : 'offline'}`;
        label.textContent = isOnline ? 'متصل' : 'غير متصل';
    },

    // ---- دوال مساعدة داخلية ----

    /**
     * قص النص بشكل آمن مع المحافظة على الأحرف المركبة (emojis, العربية, إلخ)
     * @param {string} text - النص الأصلي
     * @param {number} max - أقصى عدد من الحروف (المقاطع المرئية)
     * @returns {string} النص المقتطع مع علامة ... إن لزم
     */
    _truncateText(text, max) {
        if (!text) return '';
        // Array.from يحول النص إلى مصفوفة من الرموز الحقيقية (Unicode aware)
        const symbols = Array.from(text);
        if (symbols.length <= max) return text;
        return symbols.slice(0, max).join('') + '…';
    },

    /**
     * تنسيق وقت مع دعم احتياطي للمتصفحات التي لا تدعم ar-SA
     * @param {number|string|Date} timestamp
     * @returns {string} توقيت منسق
     */
    _formatTime(timestamp) {
        let date;
        try {
            date = new Date(timestamp);
            if (isNaN(date.getTime())) throw new Error('تاريخ غير صالح');
        } catch (e) {
            return '--:--';
        }

        // محاولة استخدام التنسيق العربي أولاً
        try {
            return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            // احتياطي: تنسيق 24 ساعة عادي
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
};
