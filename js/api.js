/* js/api.js */

export class HomeAssistantAPI {
    constructor(url, token) {
        this.url = url.replace(/\/$/, '');
        this.token = token;
    }

    get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async getStates() {
        try {
            const res = await fetch(`${this.url}/api/states`, { headers: this.headers });
            if (!res.ok) {
                if (res.status === 401) throw new Error('Unauthorized');
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            console.error("API Call failed:", e);
            throw e;
        }
    }

    async getHistory(entity_id, hours = 24) {
        try {
            const end = new Date();
            const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
            const startStr = start.toISOString();
            const res = await fetch(`${this.url}/api/history/period/${startStr}?filter_entity_id=${entity_id}&minimal_response`, {
                headers: this.headers
            });
            if (!res.ok) throw new Error('History fetch failed');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}
