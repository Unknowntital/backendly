import WebSocket from 'ws';

// Use native WebSocket in browser, ws in Node
const WS = typeof window !== 'undefined' ? (window as any).WebSocket : WebSocket;

export interface RealtimeConfig {
  apiKey?: string;
  token?: string;
  projectUrl: string;
}

export type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type FilterOperator = 'eq' | 'neq';

export interface Filter {
  column: string;
  value: any;
  operator: FilterOperator;
}

export class RealtimeSubscription {
  private client: RealtimeClient;
  private tableName: string;
  private filterConfig?: Filter;
  private listeners: Map<EventType, Function[]> = new Map();
  private subscribed: boolean = false;

  constructor(client: RealtimeClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  filter(column: string, operator: FilterOperator, value: any): this {
    this.filterConfig = { column, operator, value };
    return this;
  }

  on(event: EventType, callback: (row: any) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return this;
  }

  subscribe(): this {
    this.subscribed = true;
    this.client._sendSubscribe(this.tableName, this.filterConfig);
    return this;
  }

  unsubscribe(): void {
    this.subscribed = false;
    this.client._sendUnsubscribe(this.tableName);
    this.client._removeSubscription(this.tableName);
  }

  _handleEvent(operation: string, data: any) {
    const op = operation.toUpperCase() as EventType;
    
    // Call specific listeners
    if (this.listeners.has(op)) {
      this.listeners.get(op)!.forEach(cb => cb(data));
    }
    // Call wildcard listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*')!.forEach(cb => cb(data));
    }
  }

  _isSubscribed() {
    return this.subscribed;
  }
  
  _getFilter() {
    return this.filterConfig;
  }
}

export class RealtimeClient {
  private config: RealtimeConfig;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private systemListeners: Map<string, Function[]> = new Map();
  private lastMessageTime: number = 0;

  constructor(config: RealtimeConfig) {
    this.config = config;
    this.connect();
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WS.CONNECTING || this.ws.readyState === WS.OPEN)) {
      return;
    }

    let url = this.config.projectUrl;
    const params = new URLSearchParams();
    if (this.config.apiKey) params.append('apiKey', this.config.apiKey);
    if (this.config.token) params.append('token', this.config.token);
    
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

    ws.onmessage = (event: any) => {
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
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      this.scheduleReconnect();
    };

    ws.onerror = (err: any) => {
      // close will handle reconnect
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  table(tableName: string): RealtimeSubscription {
    if (!this.subscriptions.has(tableName)) {
      this.subscriptions.set(tableName, new RealtimeSubscription(this, tableName));
    }
    return this.subscriptions.get(tableName)!;
  }

  on(event: string, callback: Function) {
    if (!this.systemListeners.has(event)) {
      this.systemListeners.set(event, []);
    }
    this.systemListeners.get(event)!.push(callback);
    return this;
  }

  _emitSystem(event: string, payload: any) {
    if (this.systemListeners.has(event)) {
      this.systemListeners.get(event)!.forEach(cb => cb(payload));
    }
  }

  _sendSubscribe(table: string, filter?: Filter) {
    if (this.ws && this.ws.readyState === WS.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', table, filter }));
    }
  }

  _sendUnsubscribe(table: string) {
    if (this.ws && this.ws.readyState === WS.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', table }));
    }
  }

  _removeSubscription(table: string) {
    this.subscriptions.delete(table);
  }
}

export function createRealtimeClient(config: RealtimeConfig): RealtimeClient {
  return new RealtimeClient(config);
}
