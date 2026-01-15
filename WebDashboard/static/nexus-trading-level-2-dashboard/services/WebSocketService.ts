type WebSocketCallback = (data: any) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string = 'ws://localhost:8000/ws/orderflow';
    private callbacks: Map<string, WebSocketCallback[]> = new Map();
    private isConnected: boolean = false;
    private reconnectInterval: any = null;

    constructor() { this.connect = this.connect.bind(this); this.send = this.send.bind(this); }

    public get isConnectedStatus(): boolean { return this.isConnected; }
    public get socket(): WebSocket | null { return this.ws; }

    public connect(url?: string) {
        if (url) this.url = url;
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
        console.log(`Connecting to ${this.url}...`);
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => { console.log('WS Connected'); this.isConnected = true; this.dispatch('status', 'connected'); if (this.reconnectInterval) { clearInterval(this.reconnectInterval); this.reconnectInterval = null; } };
        this.ws.onclose = () => { console.log('WS Disconnected'); this.isConnected = false; this.dispatch('status', 'disconnected'); this.ws = null; this.startReconnect(); };
        this.ws.onerror = (err) => { console.error('WS Error:', err); this.ws?.close(); };
        this.ws.onmessage = (event) => { try { const msg = JSON.parse(event.data); if (msg.type) this.dispatch(msg.type, msg); } catch (e) { console.error('WS Parse Error', e); } };
    }

    private startReconnect() { if (this.reconnectInterval) return; this.reconnectInterval = setInterval(() => { console.log('Attempting reconnect...'); this.connect(); }, 3000); }
    public on(event: string, callback: WebSocketCallback) { if (!this.callbacks.has(event)) this.callbacks.set(event, []); this.callbacks.get(event)?.push(callback); }
    public off(event: string, callback: WebSocketCallback) { const listeners = this.callbacks.get(event); if (listeners) this.callbacks.set(event, listeners.filter(l => l !== callback)); }
    private dispatch(event: string, data: any) { const listeners = this.callbacks.get(event); if (listeners) listeners.forEach(cb => cb(data)); }
    public send(data: any) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data)); else console.warn('WS not open, cannot send:', data); }
}

export const wsService = new WebSocketService();
export default wsService;
