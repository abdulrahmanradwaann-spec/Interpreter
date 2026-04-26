// ui.js - أدوات واجهة المستخدم
const UI = {
    showToast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    renderHistory(list, container) {
        if (!list.length) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">لا توجد ترجمات سابقة</p>';
            return;
        }
        container.innerHTML = list.slice(0, 30).map(item => `
            <div style="padding:10px; margin:4px 0; background:rgba(0,0,0,0.2); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>${item.sourceText?.substring(0, 40)}</span>
                <span style="color:var(--neon-purple);">←</span>
                <span>${item.targetText?.substring(0, 40)}</span>
                <small style="color:var(--text-muted);">${new Date(item.timestamp).toLocaleTimeString('ar-SA')}</small>
            </div>
        `).join('');
    },

    updateConnection() {
        const badge = document.getElementById('connectionBadge');
        const label = document.getElementById('connectionLabel');
        if (navigator.onLine) {
            badge.className = 'connection-badge online';
            label.textContent = 'متصل';
        } else {
            badge.className = 'connection-badge offline';
            label.textContent = 'غير متصل';
        }
    }
};