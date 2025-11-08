// PWA Installation and Offline Features
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupInstallPrompt();
        this.setupServiceWorker();
        this.handleOfflineStatus();
    }

    checkInstallation() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('App is running in standalone mode');
        }

        // Check if running as PWA
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('App is running as PWA on iOS');
        }
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showNotification('App installed successfully! You can now use BeautyMatch offline.', 'success');
        });
    }

    showInstallButton() {
        if (this.isInstalled) return;

        // Create install button if it doesn't exist
        let installBtn = document.getElementById('pwa-install-btn');
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-btn';
            installBtn.innerHTML = `
                <i class=\"fas fa-download\"></i>
                <span>Install App</span>
            `;
            
            // Add to header or create floating button
            const header = document.querySelector('.header .nav');
            if (header) {
                header.appendChild(installBtn);
            } else {
                installBtn.className += ' floating-install-btn';
                document.body.appendChild(installBtn);
            }
        }

        installBtn.style.display = 'flex';
        installBtn.addEventListener('click', () => this.installApp());
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            this.showNotification('Installation not available on this device', 'info');
            return;\n        }\n\n        try {\n            // Show the install prompt\n            this.deferredPrompt.prompt();\n            \n            // Wait for the user to respond\n            const { outcome } = await this.deferredPrompt.userChoice;\n            \n            if (outcome === 'accepted') {\n                console.log('User accepted the install prompt');\n                this.showNotification('Installing BeautyMatch...', 'info');\n            } else {\n                console.log('User dismissed the install prompt');\n            }\n            \n            // Clear the deferredPrompt\n            this.deferredPrompt = null;\n            this.hideInstallButton();\n            \n        } catch (error) {\n            console.error('Error during installation:', error);\n            this.showNotification('Installation failed. Please try again.', 'error');\n        }\n    }\n\n    setupServiceWorker() {\n        if ('serviceWorker' in navigator) {\n            window.addEventListener('load', async () => {\n                try {\n                    const registration = await navigator.serviceWorker.register('/sw.js');\n                    console.log('ServiceWorker registered:', registration);\n                    \n                    // Listen for updates\n                    registration.addEventListener('updatefound', () => {\n                        const newWorker = registration.installing;\n                        newWorker.addEventListener('statechange', () => {\n                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {\n                                this.showUpdateNotification();\n                            }\n                        });\n                    });\n                    \n                } catch (error) {\n                    console.error('ServiceWorker registration failed:', error);\n                }\n            });\n        }\n    }\n\n    showUpdateNotification() {\n        const notification = document.createElement('div');\n        notification.className = 'update-notification';\n        notification.innerHTML = `\n            <div class=\"update-content\">\n                <i class=\"fas fa-sync-alt\"></i>\n                <span>A new version is available!</span>\n                <button class=\"btn-primary\" onclick=\"window.location.reload()\">Update</button>\n                <button class=\"btn-secondary\" onclick=\"this.parentElement.parentElement.remove()\">Later</button>\n            </div>\n        `;\n        \n        document.body.appendChild(notification);\n        \n        // Auto-remove after 10 seconds\n        setTimeout(() => {\n            if (notification.parentElement) {\n                notification.remove();\n            }\n        }, 10000);\n    }\n\n    handleOfflineStatus() {\n        // Show offline indicator\n        window.addEventListener('online', () => {\n            this.showNotification('Back online! All features are available.', 'success');\n            this.hideOfflineIndicator();\n        });\n\n        window.addEventListener('offline', () => {\n            this.showNotification('You\\'re offline. Some features may be limited.', 'warning');\n            this.showOfflineIndicator();\n        });\n\n        // Check initial status\n        if (!navigator.onLine) {\n            this.showOfflineIndicator();\n        }\n    }\n\n    showOfflineIndicator() {\n        let indicator = document.getElementById('offline-indicator');\n        if (!indicator) {\n            indicator = document.createElement('div');\n            indicator.id = 'offline-indicator';\n            indicator.className = 'offline-indicator';\n            indicator.innerHTML = `\n                <i class=\"fas fa-wifi\"></i>\n                <span>Offline Mode</span>\n            `;\n            document.body.appendChild(indicator);\n        }\n        indicator.style.display = 'flex';\n    }\n\n    hideOfflineIndicator() {\n        const indicator = document.getElementById('offline-indicator');\n        if (indicator) {\n            indicator.style.display = 'none';\n        }\n    }\n\n    showNotification(message, type) {\n        // Use existing notification system if available\n        if (window.app && window.app.showNotification) {\n            window.app.showNotification(message, type);\n        } else {\n            console.log(`${type.toUpperCase()}: ${message}`);\n        }\n    }\n\n    // Cache management\n    async clearCache() {\n        if ('caches' in window) {\n            const cacheNames = await caches.keys();\n            await Promise.all(\n                cacheNames.map(cacheName => caches.delete(cacheName))\n            );\n            this.showNotification('Cache cleared successfully', 'success');\n        }\n    }\n\n    async getCacheSize() {\n        if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {\n            const estimate = await navigator.storage.estimate();\n            return {\n                used: estimate.usage,\n                available: estimate.quota,\n                percentage: Math.round((estimate.usage / estimate.quota) * 100)\n            };\n        }\n        return null;\n    }\n}\n\n// PWA Styles\nconst pwaStyles = `\n<style>\n.pwa-install-btn {\n    background: var(--success-green);\n    color: white;\n    border: none;\n    padding: 0.8rem 1.2rem;\n    border-radius: var(--border-radius);\n    cursor: pointer;\n    transition: var(--transition);\n    display: flex;\n    align-items: center;\n    gap: 0.5rem;\n    font-weight: 500;\n    font-size: 0.9rem;\n}\n\n.pwa-install-btn:hover {\n    background: #059669;\n    transform: translateY(-2px);\n    box-shadow: var(--shadow-hover);\n}\n\n.floating-install-btn {\n    position: fixed;\n    bottom: 100px;\n    right: 20px;\n    z-index: 999;\n    box-shadow: var(--shadow-hover);\n}\n\n.update-notification {\n    position: fixed;\n    top: 20px;\n    left: 50%;\n    transform: translateX(-50%);\n    background: white;\n    border: 1px solid var(--border-color);\n    border-radius: var(--border-radius);\n    box-shadow: var(--shadow-hover);\n    z-index: 1001;\n    animation: slideDown 0.3s ease-out;\n}\n\n@keyframes slideDown {\n    from {\n        opacity: 0;\n        transform: translateX(-50%) translateY(-20px);\n    }\n    to {\n        opacity: 1;\n        transform: translateX(-50%) translateY(0);\n    }\n}\n\n.update-content {\n    display: flex;\n    align-items: center;\n    gap: 1rem;\n    padding: 1rem 1.5rem;\n}\n\n.update-content i {\n    color: var(--accent-purple);\n    font-size: 1.2rem;\n}\n\n.update-content button {\n    padding: 0.5rem 1rem;\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n    font-size: 0.9rem;\n    transition: var(--transition);\n}\n\n.offline-indicator {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    background: var(--warning-orange);\n    color: white;\n    padding: 0.5rem;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 0.5rem;\n    z-index: 1000;\n    font-size: 0.9rem;\n    font-weight: 500;\n}\n\n.offline-indicator i {\n    animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n    0%, 100% { opacity: 1; }\n    50% { opacity: 0.5; }\n}\n\n@media (max-width: 768px) {\n    .pwa-install-btn span {\n        display: none;\n    }\n    \n    .floating-install-btn {\n        bottom: 80px;\n        right: 10px;\n    }\n    \n    .update-notification {\n        left: 10px;\n        right: 10px;\n        transform: none;\n    }\n}\n</style>\n`;\n\n// Inject PWA styles\ndocument.head.insertAdjacentHTML('beforeend', pwaStyles);\n\n// Initialize PWA manager\ndocument.addEventListener('DOMContentLoaded', () => {\n    window.pwaManager = new PWAManager();\n});"
<parameter name="explanation">Creating PWA installation and offline functionality to make the app installable and work offline.