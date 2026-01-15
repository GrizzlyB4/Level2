import React from 'react';

interface Trade { p: number; v: number; d: string; t: number; }
interface InstitutionalTapeProps { trades: any[]; }

const InstitutionalTape: React.FC<InstitutionalTapeProps> = ({ trades }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b border-cyan-500/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black/20">Real-Time Institutional Tape</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 mono text-[10px] leading-relaxed">
                {trades && trades.length > 0 ? trades.slice().reverse().map((trade, i) => (
                    <div key={i} className="mb-1 flex justify-between gap-4">
                        <span className={`font-bold uppercase ${trade.d === 'BUY' ? 'text-cyan-400' : 'text-rose-400'}`}>{trade.d === 'BUY' ? 'AGGRESSIVE BUY' : 'AGGRESSIVE SELL'}:</span>
                        <span className="text-slate-400">{trade.v} @ {trade.p.toFixed(2)}</span>
                    </div>
                )) : <div className="text-slate-600 text-[10px] italic">Waiting for tape data...</div>}
            </div>
        </div>
    );
};

export default InstitutionalTape;
