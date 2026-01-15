import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Wifi, WifiOff, Activity } from 'lucide-react';
import CanvasChart from './components/CanvasChart';
import InstitutionalTape from './components/InstitutionalTape';
import VolumeFootprint from './components/VolumeFootprint';
import TradePanel from './components/TradePanel';
import NeuralIndex from './components/NeuralIndex';
import SignalIntelligence from './components/SignalIntelligence';
import wsService from './services/WebSocketService';

function App() {
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [candles, setCandles] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [trades, setTrades] = useState<any[]>([]);
    const [price, setPrice] = useState(0);
    const [spread, setSpread] = useState(0);
    const [pdrLevels, setPdrLevels] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>({});
    const [aiSignals, setAiSignals] = useState<any>({ bull_prob: 50, bear_prob: 50, signal: 'HOLD' });

    useEffect(() => {
        setStatus('connecting');
        wsService.connect('ws://localhost:8000/ws/orderflow');
        wsService.on('status', (statusData: any) => {
            setStatus(statusData === 'connected' ? 'connected' : 'disconnected');
        });
        wsService.on('orderflow_update', (data: any) => {
            if (data.candles) {
                setCandles(data.candles);
                if (data.candles.length > 0) setPrice(data.candles[data.candles.length - 1].c);
            }
            if (data.positions) setOrders(data.positions.map((p: any) => ({ ticket: p.ticket, type: p.type, entry: p.price_open, sl: p.sl, tp: p.tp, lots: p.volume, pnl: p.profit })));
            if (data.trades) setTrades(prev => [...data.trades.slice(-50), ...prev].slice(0, 100));
            if (data.pdr) setPdrLevels(data.pdr);
            if (data.metrics) setMetrics(data.metrics);
            if (data.spread !== undefined) setSpread(data.spread);
            if (data.ai) setAiSignals(data.ai);
        });
        return () => {};
    }, []);

    const handleModifyOrder = useCallback((ticket: number, price: number, type: 'SL' | 'TP') => {
        wsService.send({ action: 'modify_order', ticket, [type.toLowerCase()]: price });
    }, []);
    const handleCloseOrder = useCallback((ticket: number) => {
        wsService.send({ action: 'close_order', ticket });
    }, []);
    const handleSendOrder = useCallback((order: { type: 'BUY' | 'SELL'; lots: number; sl: number; tp: number }) => {
        wsService.send({ action: 'order', type: order.type.toLowerCase(), lots: order.lots, sl: order.sl, tp: order.tp });
    }, []);

    return (
        <div className="h-screen w-screen bg-[#050910] text-white overflow-hidden flex flex-col">
            <div className="h-10 bg-black/60 border-b border-cyan-500/20 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-sm tracking-wide">CYBER-GRID SYSTEMS</span>
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">PRO</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-400 text-lg font-mono font-bold">{price.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-500">SPREAD: {spread.toFixed(1)}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : status === 'connecting' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span className="text-[10px] uppercase font-bold">{status}</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <div className="w-48 border-r border-cyan-500/10 bg-black/20 flex flex-col"><InstitutionalTape trades={trades} /></div>
                <div className="flex-1 flex flex-col"><div className="flex-1 p-1"><div className="h-full rounded-lg overflow-hidden border border-cyan-500/10"><CanvasChart data={candles} orders={orders} pdrLevels={pdrLevels} metrics={metrics} onOrderModify={handleModifyOrder} onOrderClose={handleCloseOrder} /></div></div></div>
                <div className="w-64 border-r border-cyan-500/10 bg-black/10"><VolumeFootprint data={candles} currentPrice={price} /></div>
                <div className="w-80 flex flex-col gap-3 p-2 overflow-y-auto custom-scrollbar">
                    <TradePanel onSendOrder={handleSendOrder} isConnected={status === 'connected'} />
                    <NeuralIndex ai={aiSignals} />
                    <SignalIntelligence candles={candles} metrics={metrics} />
                    <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center"><Activity className="w-3 h-3 inline mr-1" />Market Activity</div>
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                            <div className="bg-emerald-500/10 rounded p-2 text-center"><div className="text-emerald-400 font-bold text-lg">{orders.filter(o => o.type === 'BUY').length}</div><div className="text-slate-500">Long Positions</div></div>
                            <div className="bg-red-500/10 rounded p-2 text-center"><div className="text-red-400 font-bold text-lg">{orders.filter(o => o.type === 'SELL').length}</div><div className="text-slate-500">Short Positions</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
