/**
 * Security System - Web Native 2026
 * Pure JavaScript implementation for file validation and memory safety.
 */

export class SecurityEngine {
    constructor() {
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 
            'application/pdf', 'video/mp4', 'audio/mpeg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        this.maxSize = 100 * 1024 * 1024; // 100MB
    }

    validate(file) {
        // 1. Type Validation
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                msg: `نوع الملف (${file.type}) غير مدعوم أمنياً في نظام 2026.`
            };
        }

        // 2. Size Validation
        if (file.size > this.maxSize) {
            return {
                valid: false,
                msg: 'حجم الملف كبير جداً. الحد الأقصى هو 100 ميجابايت.'
            };
        }

        // 3. Name Sanitization
        const safeName = file.name.replace(/[^\w\s\u0600-\u06FF.-]/gi, '_');
        
        return {
            valid: true,
            safeName: safeName
        };
    }

    /**
     * Prevent Memory Leaks (Sandboxing)
     */
    wipe(urls) {
        urls.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
                console.log(`[Security] Memory Cleared: ${url}`);
            }
        });
    }

    /**
     * XSS Protection for Results
     */
    sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export const security = new SecurityEngine();
