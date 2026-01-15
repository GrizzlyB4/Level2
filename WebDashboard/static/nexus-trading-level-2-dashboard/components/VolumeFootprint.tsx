import React, { useMemo, useRef, useEffect } from 'react';
import { analyzeVolumeProfile, ProfileAnalysis, EdgeZone } from '../utils/VolumeProfileAnalyzer';

interface VolumeFootprintProps { data?: any[]; currentPrice: number; }

const VolumeFootprint: React.FC<VolumeFootprintProps> = ({ data = [], currentPrice }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPriceRef = useRef<HTMLDivElement>(null);

    const aggregatedProfile = useMemo(() => {
        const profileMap = new Map<string, { bid: number; ask: number }>();
        if (data.length > 0) {
            data.forEach((c: any) => {
                if (c.fp) {
                    Object.entries(c.fp).forEach(([priceStr, v]: [string, any]) => {
                        const existing = profileMap.get(priceStr) || { bid: 0, ask: 0 };
                        profileMap.set(priceStr, { bid: existing.bid + (v.b || 0), ask: existing.ask + (v.a || 0) });
                    });
                }
            });
        }
        return Array.from(profileMap.entries()).map(([priceStr, vol]) => ({ price: parseFloat(priceStr), bid: vol.bid, ask: vol.ask, delta: vol.bid - vol.ask, total: vol.bid + vol.ask })).sort((a, b) => b.price - a.price);
    }, [data]);

    const analysis: ProfileAnalysis = useMemo(() => analyzeVolumeProfile(data, currentPrice), [data, currentPrice]);
    const maxVol = useMemo(() => aggregatedProfile.length === 0 ? 1 : Math.max(...aggregatedProfile.map(l => Math.max(l.bid, l.ask))), [aggregatedProfile]);

    const currentPriceIndex = useMemo(() => {
        if (aggregatedProfile.length === 0) return -1;
        let closestIdx = 0, minDiff = Infinity;
        aggregatedProfile.forEach((lvl, i) => { const diff = Math.abs(lvl.price - currentPrice); if (diff < minDiff) { minDiff = diff; closestIdx = i; } });
        return closestIdx;
    }, [aggregatedProfile, currentPrice]);

    useEffect(() => { if (currentPriceRef.current && containerRef.current) currentPriceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [currentPriceIndex]);

    const getEdgeForPrice = (price: number): EdgeZone | undefined => analysis.edgeZones.find(z => price >= z.priceStart && price <= z.priceEnd);
    const getEdgeStyles = (edge: EdgeZone | undefined) => {
        if (!edge) return { bg: '', border: '', indicator: '' };
        switch (edge.type) {
            case 'STRONG_SUPPORT': return { bg: 'bg-emerald-500/20', border: 'border-l-2 border-emerald-500', indicator: '🛡️' };
            case 'STRONG_RESISTANCE': return { bg: 'bg-red-500/20', border: 'border-l-2 border-red-500', indicator: '🚫' };
            case 'POC': return { bg: 'bg-yellow-500/15', border: 'border-l-2 border-yellow-500', indicator: '⭐' };
            case 'LVN': return { bg: 'bg-purple-500/10', border: 'border-l-2 border-purple-500 border-dashed', indicator: '⚡' };
            case 'HVN': return { bg: 'bg-blue-500/10', border: 'border-l-2 border-blue-400', indicator: '📊' };
            case 'VALUE_AREA_HIGH': case 'VALUE_AREA_LOW': return { bg: 'bg-orange-500/10', border: 'border-l-2 border-orange-400 border-dashed', indicator: 'VA' };
            default: return { bg: '', border: '', indicator: '' };
        }
    };

    if (aggregatedProfile.length === 0) return (<div className="h-full flex flex-col"><div className="p-3 border-b border-cyan-500/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Edge Detector</div><div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Waiting for data...</div></div>);

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 border-b border-cyan-500/20 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edge Detector</div>
                <div className={`text-xs font-bold mt-1 ${analysis.overallBias === 'BULLISH' ? 'text-emerald-400' : analysis.overallBias === 'BEARISH' ? 'text-red-400' : 'text-slate-400'}`}>
                    {analysis.overallBias} ({Math.round(analysis.biasStrength)}%)
                </div>
            </div>
            <div className="p-2 border-b border-cyan-500/10 bg-black/30">
                <div className="text-[8px] text-slate-500 uppercase mb-1">Key Zones</div>
                <div className="flex flex-wrap gap-1">
                    {analysis.edgeZones.filter(z => z.type === 'STRONG_SUPPORT' || z.type === 'STRONG_RESISTANCE').slice(0, 4).map((zone, i) => (
                        <div key={i} className={`text-[8px] px-1.5 py-0.5 rounded ${zone.tradeBias === 'BUY' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}>
                            {zone.tradeBias === 'BUY' ? '🛡️' : '🚫'} {((zone.priceStart + zone.priceEnd) / 2).toFixed(2)}
                        </div>
                    ))}
                </div>
            </div>
            <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-black/40">
                <div className="flex flex-col">
                    {aggregatedProfile.map((lvl, i) => {
                        const isCurrentPrice = i === currentPriceIndex;
                        const edge = getEdgeForPrice(lvl.price);
                        const edgeStyles = getEdgeStyles(edge);
                        return (
                            <div key={i} ref={isCurrentPrice ? currentPriceRef : null} className={`h-5 flex border-b border-white/5 relative group ${edgeStyles.bg} ${edgeStyles.border}`}>
                                {edge && edgeStyles.indicator && <div className="absolute left-0.5 top-0 h-full flex items-center text-[8px]">{edgeStyles.indicator}</div>}
                                <div className="flex-1 flex justify-end items-center pr-1 relative overflow-hidden ml-3">
                                    <div className="h-full bg-gradient-to-r from-emerald-600/40 to-emerald-500/60 absolute right-0" style={{ width: `${Math.min(100, (lvl.bid / maxVol) * 100)}%` }} />
                                    <span className={`text-[9px] mono relative z-10 ${lvl.delta > 0 ? 'text-emerald-400 font-bold' : 'text-emerald-300/70'}`}>{lvl.bid}</span>
                                </div>
                                <div className={`w-14 flex items-center justify-center text-[8px] mono border-x ${isCurrentPrice ? 'bg-cyan-500 text-black font-bold border-cyan-400' : edge?.type === 'POC' ? 'bg-yellow-500/20 text-yellow-400 font-bold border-yellow-500/30' : 'bg-black/40 text-slate-500 border-cyan-500/10 group-hover:text-white'}`}>{lvl.price.toFixed(2)}</div>
                                <div className="flex-1 flex items-center pl-1 relative overflow-hidden mr-3">
                                    <div className="h-full bg-gradient-to-l from-red-600/40 to-red-500/60 absolute left-0" style={{ width: `${Math.min(100, (lvl.ask / maxVol) * 100)}%` }} />
                                    <span className={`text-[9px] mono relative z-10 ${lvl.delta < 0 ? 'text-red-400 font-bold' : 'text-red-300/70'}`}>{lvl.ask}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="p-2 border-t border-cyan-500/20 flex flex-wrap justify-center gap-2 text-[7px]">
                <div className="flex items-center gap-0.5"><span>🛡️</span><span className="text-emerald-400">Support</span></div>
                <div className="flex items-center gap-0.5"><span>🚫</span><span className="text-red-400">Resistance</span></div>
                <div className="flex items-center gap-0.5"><span>⭐</span><span className="text-yellow-400">POC</span></div>
                <div className="flex items-center gap-0.5"><span>⚡</span><span className="text-purple-400">LVN</span></div>
            </div>
        </div>
    );
};

export default VolumeFootprint;
