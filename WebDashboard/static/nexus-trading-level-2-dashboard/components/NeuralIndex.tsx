import React from 'react';
import { Brain, Clock, Activity } from 'lucide-react';

interface NeuralIndexProps { ai: any; }

const NeuralIndex: React.FC<NeuralIndexProps> = ({ ai }) => {
    if (!ai) return (<div className="cyber-border bg-[#0d151d] p-3"><div className="flex items-center gap-2 text-purple-400/80 font-bold text-[10px] tracking-wider uppercase mb-3"><Brain size={12} /> Neural Index</div><div className="text-slate-500 text-[10px] italic text-center py-4">Awaiting brain...</div></div>);
    const buyProb = ai.buy || 0, sellProb = ai.sell || 0, neutralProb = ai.neutral || 0, signal = ai.signal || 'NEUTRAL', isAtt = ai.att || false, session = ai.session || 'OFF';
    let signalClass = 'text-slate-400 bg-slate-800/50';
    if (signal.includes('BUY') || signal.includes('BULLISH')) signalClass = 'text-cyan-400 bg-cyan-900/30 border-cyan-500/30';
    if (signal.includes('SELL') || signal.includes('BEARISH')) signalClass = 'text-rose-400 bg-rose-900/30 border-rose-500/30';
    if (signal.includes('EDGE') || signal.includes('STRONG')) signalClass = 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30 animate-pulse';
    const sessionStyles: Record<string, string> = { 'OVERLAP': 'bg-gradient-to-r from-rose-500 to-amber-500 text-black', 'LONDON': 'bg-blue-600 text-white', 'NEW YORK': 'bg-green-600 text-white', 'ASIA': 'bg-pink-600 text-white', 'OFF': 'bg-slate-700 text-slate-400' };
    return (
        <div className="cyber-border bg-[#0d151d] p-3 border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-400/80 font-bold text-[10px] tracking-wider uppercase"><Activity size={12} className="animate-pulse" /> Neural Index</div>
                <div className="flex gap-2">{isAtt && <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white animate-pulse flex items-center gap-1"><Clock size={8} /> ATT</span>}<span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${sessionStyles[session] || sessionStyles['OFF']}`}>{session}</span></div>
            </div>
            <div className={`text-center py-2 px-3 rounded border ${signalClass} font-bold text-sm mb-4 tracking-wide`}>{signal}</div>
            <div className="space-y-2">
                <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500 w-16">NEUTRAL</span><div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-slate-500 transition-all duration-500" style={{ width: `${neutralProb}%` }} /></div><span className="text-[10px] text-slate-400 w-8 text-right font-mono">{neutralProb}%</span></div>
                <div className="flex items-center gap-2"><span className="text-[9px] text-cyan-500 font-bold w-16">BULLISH</span><div className="flex-1 h-3 bg-cyan-900/20 rounded-full overflow-hidden border border-cyan-500/20"><div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500" style={{ width: `${buyProb}%` }} /></div><span className="text-[11px] text-cyan-400 w-8 text-right font-mono font-bold">{buyProb}%</span></div>
                <div className="flex items-center gap-2"><span className="text-[9px] text-rose-500 font-bold w-16">BEARISH</span><div className="flex-1 h-3 bg-rose-900/20 rounded-full overflow-hidden border border-rose-500/20"><div className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-500" style={{ width: `${sellProb}%` }} /></div><span className="text-[11px] text-rose-400 w-8 text-right font-mono font-bold">{sellProb}%</span></div>
            </div>
        </div>
    );
};

export default NeuralIndex;
