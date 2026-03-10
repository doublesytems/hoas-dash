/* js/store.js */

export class Store {
    constructor() {
        this.config = this.loadConfig();
        this.visibleEntities = this.loadVisibleEntities(); // Array of {id, priority, order}
        this.favorites = this.loadFavorites();
        this.kioskMode = localStorage.getItem('ha_kiosk') === '1';
    }

    loadConfig() {
        return {
            url: localStorage.getItem('ha_url') || '',
            token: localStorage.getItem('ha_token') || ''
        };
    }

    saveConfig(url, token) {
        localStorage.setItem('ha_url', url);
        localStorage.setItem('ha_token', token);
        this.config = { url, token };
    }

    clearConfig() {
        localStorage.removeItem('ha_url');
        localStorage.removeItem('ha_token');
        this.config = { url: '', token: '' };
    }

    loadVisibleEntities() {
        try {
            const raw = localStorage.getItem('ha_visible');
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            // Migration: handle old format [id1, id2] vs new [{id, priority, order}]
            return parsed.map((item, index) => {
                if (typeof item === 'string') {
                    return { id: item, priority: 0, order: index };
                }
                return {
                    priority: 0, // Default
                    order: index,
                    ...item
                };
            });
        } catch (e) { return []; }
    }

    saveVisibleEntities(entities) {
        // entities is an array of {id, priority, order}
        this.visibleEntities = entities;
        localStorage.setItem('ha_visible', JSON.stringify(entities));
    }

    loadFavorites() {
        try {
            const raw = localStorage.getItem('ha_favs');
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    toggleFavorite(id) {
        if (this.favorites.includes(id)) {
            this.favorites = this.favorites.filter(f => f !== id);
        } else {
            this.favorites.push(id);
        }
        localStorage.setItem('ha_favs', JSON.stringify(this.favorites));
        return this.favorites;
    }

    toggleKiosk() {
        this.kioskMode = !this.kioskMode;
        localStorage.setItem('ha_kiosk', this.kioskMode ? '1' : '0');
        return this.kioskMode;
    }

    exportSettings() {
        const settings = {
            url: localStorage.getItem('ha_url'),
            token: localStorage.getItem('ha_token'),
            visible: localStorage.getItem('ha_visible'),
            favs: localStorage.getItem('ha_favs'),
            kiosk: localStorage.getItem('ha_kiosk')
        };
        return JSON.stringify(settings, null, 2);
    }

    importSettings(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.url) localStorage.setItem('ha_url', data.url);
            if (data.token) localStorage.setItem('ha_token', data.token);
            if (data.visible) localStorage.setItem('ha_visible', data.visible);
            if (data.favs) localStorage.setItem('ha_favs', data.favs);
            if (data.kiosk) localStorage.setItem('ha_kiosk', data.kiosk);
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
}
