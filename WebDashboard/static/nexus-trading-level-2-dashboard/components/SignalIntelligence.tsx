import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface SignalIntelligenceProps { candles: any[]; metrics?: any; }
interface Signal { type: 'alert' | 'high' | 'info' | 'edge'; text: string; icon?: React.ReactNode; }

const SignalIntelligence: React.FC<SignalIntelligenceProps> = ({ candles, metrics }) => {
    const signals = useMemo(() => {
        const result: Signal[] = [];
        if (!candles || candles.length === 0) return result;
        const lastCandle = candles[candles.length - 1];
        if (!lastCandle) return result;
        if (lastCandle.fp) {
            let buyImbalances = 0, sellImbalances = 0;
            Object.values(lastCandle.fp).forEach((v: any) => { if (v.a > v.b * 3 && v.a > 5) buyImbalances++; if (v.b > v.a * 3 && v.b > 5) sellImbalances++; });
            if (buyImbalances >= 3) result.push({ type: 'alert', text: `STRONG BUY IMBALANCE (${buyImbalances} levels)`, icon: <TrendingUp size={10} /> });
            if (sellImbalances >= 3) result.push({ type: 'alert', text: `STRONG SELL IMBALANCE (${sellImbalances} levels)`, icon: <TrendingDown size={10} /> });
        }
        const delta = (lastCandle.buy_v || 0) - (lastCandle.sell_v || 0);
        if (lastCandle.c < lastCandle.o && delta > 0) result.push({ type: 'high', text: 'BULLISH ABSORPTION DETECTED', icon: <Zap size={10} /> });
        if (lastCandle.c > lastCandle.o && delta < 0) result.push({ type: 'high', text: 'BEARISH ABSORPTION DETECTED', icon: <Zap size={10} /> });
        if (lastCandle.v > 500) result.push({ type: 'info', text: 'HIGH INSTITUTIONAL ACTIVITY', icon: <Activity size={10} /> });
        if (metrics?.ai?.signal?.includes('EDGE')) result.push({ type: 'edge', text: metrics.ai.signal, icon: <AlertTriangle size={10} /> });
        return result;
    }, [candles, metrics]);
    const typeStyles: Record<string, string> = { 'edge': 'border-l-emerald-400 bg-gradient-to-r from-emerald-900/30 to-transparent', 'alert': 'border-l-amber-400 bg-gradient-to-r from-amber-900/20 to-transparent', 'high': 'border-l-yellow-400 bg-gradient-to-r from-yellow-900/20 to-transparent', 'info': 'border-l-slate-500 bg-slate-800/30' };
    return (
        <div className="cyber-border bg-[#0d151d] p-3">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-amber-400/80 font-bold text-[10px] tracking-wider uppercase"><AlertTriangle size={12} /> Signal Intelligence</div><span className="text-[8px] text-emerald-500 animate-pulse">ACTIVE</span></div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {signals.length > 0 ? signals.map((sig, i) => (<div key={i} className={`px-2 py-1.5 rounded text-[9px] border-l-2 flex items-center gap-2 ${typeStyles[sig.type]}`}>{sig.icon}<span className="font-mono">{sig.text}</span></div>)) : <div className="text-slate-600 text-[10px] italic py-2">Scanning order flow...</div>}
            </div>
        </div>
    );
};

export default SignalIntelligence;
