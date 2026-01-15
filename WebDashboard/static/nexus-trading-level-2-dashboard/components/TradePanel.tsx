import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface TradePanelProps { onSendOrder: (order: { type: 'BUY' | 'SELL'; lots: number; sl: number; tp: number }) => void; isConnected: boolean; }

const TradePanel: React.FC<TradePanelProps> = ({ onSendOrder, isConnected }) => {
    const [lots, setLots] = useState(0.1);
    const [sl, setSl] = useState(30);
    const [tp, setTp] = useState(60);
    const [useHotkeys, setUseHotkeys] = useState(true);

    const handleBuy = () => { if (!isConnected) return; onSendOrder({ type: 'BUY', lots, sl, tp }); };
    const handleSell = () => { if (!isConnected) return; onSendOrder({ type: 'SELL', lots, sl, tp }); };
    const handleCloseAll = () => { if (!isConnected) return; console.log('Close all positions'); };

    return (
        <div className="bg-black/40 rounded-lg border border-cyan-500/20 p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Trade</div>
            <div className="mb-3">
                <label className="text-[9px] text-slate-500 uppercase">Lot Size</label>
                <input type="number" value={lots} onChange={(e) => setLots(parseFloat(e.target.value) || 0.01)} step="0.01" min="0.01" className="w-full bg-black/60 border border-cyan-500/20 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div><label className="text-[9px] text-slate-500 uppercase">SL (pts)</label><input type="number" value={sl} onChange={(e) => setSl(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-red-500/30 rounded px-2 py-1 text-sm text-red-400 focus:border-red-500 focus:outline-none" /></div>
                <div><label className="text-[9px] text-slate-500 uppercase">TP (pts)</label><input type="number" value={tp} onChange={(e) => setTp(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-emerald-500/30 rounded px-2 py-1 text-sm text-emerald-400 focus:border-emerald-500 focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={handleBuy} disabled={!isConnected} className={`py-2 rounded font-bold text-sm transition-all ${isConnected ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>BUY</button>
                <button onClick={handleSell} disabled={!isConnected} className={`py-2 rounded font-bold text-sm transition-all ${isConnected ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>SELL</button>
            </div>
            <button onClick={handleCloseAll} disabled={!isConnected} className={`w-full py-1.5 rounded text-xs font-bold transition-all ${isConnected ? 'bg-amber-600/80 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>CLOSE ALL</button>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyan-500/10">
                <span className="text-[9px] text-slate-500 uppercase">Hotkeys (B/S/X)</span>
                <button onClick={() => setUseHotkeys(!useHotkeys)} className="text-cyan-400">{useHotkeys ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[8px] uppercase ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
        </div>
    );
};

export default TradePanel;
