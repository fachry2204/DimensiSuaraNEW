export const getTextColorClass = (bgColor: string) => {
    if (!bgColor) return 'text-slate-700';

    // Handle gradient - assume dark/strong color for login buttons usually
    if (bgColor.toLowerCase().includes('gradient')) return 'text-white';

    // Handle transparent explicitly
    if (bgColor.toLowerCase().includes('transparent')) return 'text-white';
    
    // Handle RGBA
    if (bgColor.startsWith('rgba')) {
        const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const a = match[4] ? parseFloat(match[4]) : 1;
            
            // If very transparent, assume dark background behind it (user preference: transparent -> white font)
            if (a < 0.5) return 'text-white';
            
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'text-slate-700' : 'text-white';
        }
    }
    
    // Handle Hex
    if (bgColor.startsWith('#')) {
        let hex = bgColor.substring(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'text-slate-700' : 'text-white';
        }
    }
    
    return 'text-slate-700';
};

export const getShadowColor = (btnColor: string) => {
    // Try to find a hex code
    const hexMatch = (btnColor || '').match(/#[0-9a-fA-F]{6}/);
    if (hexMatch) {
        const hex = hexMatch[0];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`; // 50% opacity for shadow
    }
    return 'rgba(37, 99, 235, 0.5)'; // Default blue shadow
};
