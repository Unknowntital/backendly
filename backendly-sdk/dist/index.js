"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeClient = exports.RealtimeSubscription = void 0;
exports.createRealtimeClient = createRealtimeClient;
const ws_1 = __importDefault(require("ws"));
// Use native WebSocket in browser, ws in Node
const WS = typeof window !== 'undefined' ? window.WebSocket : ws_1.default;
class RealtimeSubscription {
    constructor(client, tableName) {
        this.listeners = new Map();
        this.subscribed = false;
        this.client = client;
        this.tableName = tableName;
    }
    filter(column, operator, value) {
        this.filterConfig = { column, operator, value };
        return this;
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }
    subscribe() {
        this.subscribed = true;
        this.client._sendSubscribe(this.tableName, this.filterConfig);
        return this;
    }
    unsubscribe() {
        this.subscribed = false;
        this.client._sendUnsubscribe(this.tableName);
        this.client._removeSubscription(this.tableName);
    }
    _handleEvent(operation, data) {
        const op = operation.toUpperCase();
        // Call specific listeners
        if (this.listeners.has(op)) {
            this.listeners.get(op).forEach(cb => cb(data));
        }
        // Call wildcard listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(cb => cb(data));
        }
    }
    _isSubscribed() {
        return this.subscribed;
    }
    _getFilter() {
        return this.filterConfig;
    }
}
exports.RealtimeSubscription = RealtimeSubscription;
class RealtimeClient {
    constructor(config) {
        this.ws = null;
        this.subscriptions = new Map();
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.systemListeners = new Map();
        this.lastMessageTime = 0;
        this.config = config;
        this.connect();
    }
    connect() {
        if (this.ws && (this.ws.readyState === WS.CONNECTING || this.ws.readyState === WS.OPEN)) {
            return;
        }
        let url = this.config.projectUrl;
        const params = new URLSearchParams();
        if (this.config.apiKey)
            params.append('apiKey', this.config.apiKey);
        if (this.config.token)
            params.append('token', this.config.token);
        url += (url.includes('?') ? '&' : '?') + params.toString();
        const ws = this.ws = new WS(url);
        ws.onopen = () => {
            this.reconnectAttempts = 0;
            // If disconnected for > 5 seconds, emit resync-needed
            const now = Date.now();
            if (this.lastMessageTime > 0 && now - this.lastMessageTime > 5000) {
                this._emitSystem('resync-needed', null);
            }
            this.lastMessageTime = now;
            // Resubscribe active subscriptions
            for (const [tableName, sub] of this.subscriptions.entries()) {
                if (sub._isSubscribed()) {
                    this._sendSubscribe(tableName, sub._getFilter());
                }
            }
        };
        ws.onmessage = (event) => {
            this.lastMessageTime = Date.now();
            try {
                const msg = JSON.parse(event.data.toString());
                if (msg.table && msg.operation) {
                    const sub = this.subscriptions.get(msg.table) || this.subscriptions.get('*');
                    if (sub) {
                        const data = msg.operation === 'DELETE' ? msg.old : msg.new;
                        // For wildcard, we might want to attach table name to data, but we pass msg which has .table
                        sub._handleEvent(msg.operation, msg);
                    }
                }
            }
            catch (err) {
                console.error('Error parsing WS message', err);
            }
        };
        ws.onclose = () => {
            this.scheduleReconnect();
        };
        ws.onerror = (err) => {
            // close will handle reconnect
        };
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }
    table(tableName) {
        if (!this.subscriptions.has(tableName)) {
            this.subscriptions.set(tableName, new RealtimeSubscription(this, tableName));
        }
        return this.subscriptions.get(tableName);
    }
    on(event, callback) {
        if (!this.systemListeners.has(event)) {
            this.systemListeners.set(event, []);
        }
        this.systemListeners.get(event).push(callback);
        return this;
    }
    _emitSystem(event, payload) {
        if (this.systemListeners.has(event)) {
            this.systemListeners.get(event).forEach(cb => cb(payload));
        }
    }
    _sendSubscribe(table, filter) {
        if (this.ws && this.ws.readyState === WS.OPEN) {
            this.ws.send(JSON.stringify({ type: 'subscribe', table, filter }));
        }
    }
    _sendUnsubscribe(table) {
        if (this.ws && this.ws.readyState === WS.OPEN) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', table }));
        }
    }
    _removeSubscription(table) {
        this.subscriptions.delete(table);
    }
}
exports.RealtimeClient = RealtimeClient;
function createRealtimeClient(config) {
    return new RealtimeClient(config);
}
