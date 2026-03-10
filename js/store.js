/* js/store.js */

export class Store {
    constructor() {
        this.config = this.loadConfig();
        this.visibleEntities = this.loadVisibleEntities();
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
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    saveVisibleEntities(ids) {
        this.visibleEntities = ids;
        localStorage.setItem('ha_visible', JSON.stringify(ids));
    }

    loadFavorites() {
        try {
            const raw = localStorage.getItem('ha_favs');
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
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
}
