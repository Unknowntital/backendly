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
export declare class RealtimeSubscription {
    private client;
    private tableName;
    private filterConfig?;
    private listeners;
    private subscribed;
    constructor(client: RealtimeClient, tableName: string);
    filter(column: string, operator: FilterOperator, value: any): this;
    on(event: EventType, callback: (row: any) => void): this;
    subscribe(): this;
    unsubscribe(): void;
    _handleEvent(operation: string, data: any): void;
    _isSubscribed(): boolean;
    _getFilter(): Filter | undefined;
}
export declare class RealtimeClient {
    private config;
    private ws;
    private subscriptions;
    private reconnectTimer;
    private reconnectAttempts;
    private systemListeners;
    private lastMessageTime;
    constructor(config: RealtimeConfig);
    private connect;
    private scheduleReconnect;
    table(tableName: string): RealtimeSubscription;
    on(event: string, callback: Function): this;
    _emitSystem(event: string, payload: any): void;
    _sendSubscribe(table: string, filter?: Filter): void;
    _sendUnsubscribe(table: string): void;
    _removeSubscription(table: string): void;
}
export declare function createRealtimeClient(config: RealtimeConfig): RealtimeClient;
