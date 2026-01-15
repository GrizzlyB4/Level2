/**
 * Volume Profile Edge Detection
 */
export interface VolumeLevel { price: number; bid: number; ask: number; total: number; delta: number; }
export interface EdgeZone { type: 'STRONG_SUPPORT' | 'STRONG_RESISTANCE' | 'LVN' | 'HVN' | 'POC' | 'VALUE_AREA_HIGH' | 'VALUE_AREA_LOW'; priceStart: number; priceEnd: number; strength: number; description: string; tradeBias: 'BUY' | 'SELL' | 'NEUTRAL'; }
export interface ProfileAnalysis { poc: number; valueAreaHigh: number; valueAreaLow: number; edgeZones: EdgeZone[]; overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; biasStrength: number; }

export function analyzeVolumeProfile(data: any[], currentPrice: number): ProfileAnalysis {
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
    const levels: VolumeLevel[] = Array.from(profileMap.entries()).map(([priceStr, vol]) => ({ price: parseFloat(priceStr), bid: vol.bid, ask: vol.ask, total: vol.bid + vol.ask, delta: vol.bid - vol.ask })).sort((a, b) => b.price - a.price);
    if (levels.length === 0) return { poc: currentPrice, valueAreaHigh: currentPrice + 1, valueAreaLow: currentPrice - 1, edgeZones: [], overallBias: 'NEUTRAL', biasStrength: 0 };
    
    const poc = levels.reduce((max, lvl) => lvl.total > max.total ? lvl : max, levels[0]);
    const totalVolume = levels.reduce((sum, lvl) => sum + lvl.total, 0);
    const targetVolume = totalVolume * 0.70;
    let vaVolume = poc.total, vaHighIdx = levels.findIndex(l => l.price === poc.price), vaLowIdx = vaHighIdx;
    while (vaVolume < targetVolume && (vaHighIdx > 0 || vaLowIdx < levels.length - 1)) {
        const aboveVol = vaHighIdx > 0 ? levels[vaHighIdx - 1].total : 0;
        const belowVol = vaLowIdx < levels.length - 1 ? levels[vaLowIdx + 1].total : 0;
        if (aboveVol >= belowVol && vaHighIdx > 0) { vaHighIdx--; vaVolume += levels[vaHighIdx].total; }
        else if (vaLowIdx < levels.length - 1) { vaLowIdx++; vaVolume += levels[vaLowIdx].total; }
        else break;
    }
    const valueAreaHigh = levels[vaHighIdx]?.price || poc.price + 1;
    const valueAreaLow = levels[vaLowIdx]?.price || poc.price - 1;
    
    const edgeZones: EdgeZone[] = [];
    const avgVolume = totalVolume / levels.length;
    levels.forEach((lvl) => {
        const imbalanceRatio = lvl.bid / (lvl.ask || 1);
        const reverseRatio = lvl.ask / (lvl.bid || 1);
        if (imbalanceRatio >= 2.5 && lvl.total > avgVolume * 0.5) edgeZones.push({ type: 'STRONG_SUPPORT', priceStart: lvl.price - 0.05, priceEnd: lvl.price + 0.05, strength: Math.min(100, Math.round(imbalanceRatio * 20)), description: `Strong buyers at ${lvl.price.toFixed(2)}`, tradeBias: 'BUY' });
        if (reverseRatio >= 2.5 && lvl.total > avgVolume * 0.5) edgeZones.push({ type: 'STRONG_RESISTANCE', priceStart: lvl.price - 0.05, priceEnd: lvl.price + 0.05, strength: Math.min(100, Math.round(reverseRatio * 20)), description: `Strong sellers at ${lvl.price.toFixed(2)}`, tradeBias: 'SELL' });
        if (lvl.total < avgVolume * 0.3 && lvl.total > 0) edgeZones.push({ type: 'LVN', priceStart: lvl.price - 0.05, priceEnd: lvl.price + 0.05, strength: Math.round((1 - lvl.total / avgVolume) * 100), description: `LVN at ${lvl.price.toFixed(2)}`, tradeBias: 'NEUTRAL' });
        if (lvl.total > avgVolume * 2) edgeZones.push({ type: 'HVN', priceStart: lvl.price - 0.1, priceEnd: lvl.price + 0.1, strength: Math.min(100, Math.round((lvl.total / avgVolume) * 30)), description: `HVN at ${lvl.price.toFixed(2)}`, tradeBias: 'NEUTRAL' });
    });
    edgeZones.push({ type: 'POC', priceStart: poc.price - 0.05, priceEnd: poc.price + 0.05, strength: 100, description: `POC at ${poc.price.toFixed(2)}`, tradeBias: 'NEUTRAL' });
    edgeZones.push({ type: 'VALUE_AREA_HIGH', priceStart: valueAreaHigh - 0.1, priceEnd: valueAreaHigh + 0.1, strength: 80, description: `VAH at ${valueAreaHigh.toFixed(2)}`, tradeBias: currentPrice > valueAreaHigh ? 'BUY' : 'SELL' });
    edgeZones.push({ type: 'VALUE_AREA_LOW', priceStart: valueAreaLow - 0.1, priceEnd: valueAreaLow + 0.1, strength: 80, description: `VAL at ${valueAreaLow.toFixed(2)}`, tradeBias: currentPrice < valueAreaLow ? 'SELL' : 'BUY' });
    
    const totalDelta = levels.reduce((sum, l) => sum + l.delta, 0);
    const avgDelta = levels.reduce((sum, l) => sum + l.delta, 0) / levels.length;
    let overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let biasStrength = Math.abs(totalDelta) / levels.length * 3;
    if (totalDelta > avgDelta * 2) overallBias = 'BULLISH';
    else if (totalDelta < -avgDelta * 2) overallBias = 'BEARISH';
    edgeZones.sort((a, b) => b.strength - a.strength);
    return { poc: poc.price, valueAreaHigh, valueAreaLow, edgeZones, overallBias, biasStrength };
}

export function getBestTradeZone(analysis: ProfileAnalysis, currentPrice: number): EdgeZone | null {
    const nearbyZones = analysis.edgeZones.filter(z => Math.abs((z.priceStart + z.priceEnd) / 2 - currentPrice) < 2);
    const actionableZones = nearbyZones.filter(z => z.type === 'STRONG_SUPPORT' || z.type === 'STRONG_RESISTANCE');
    return actionableZones[0] || nearbyZones[0] || null;
}
