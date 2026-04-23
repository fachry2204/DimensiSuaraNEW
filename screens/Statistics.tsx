import React, { useMemo, useState } from 'react';
import { ReleaseData, ReportData } from '../types';
import { PublishingAnalytics } from './publishing/PublishingAnalytics';
import { 
    Music, 
    Disc, 
    Layers, 
    Mic2, 
    TrendingUp, 
    DollarSign, 
    PlayCircle, 
    Users, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    MoreHorizontal,
    ChevronDown
} from 'lucide-react';

interface Props {
  releases: ReleaseData[];
  reportData: ReportData[];
  token?: string;
  defaultTab?: 'aggregator' | 'publishing';
}

export const Statistics: React.FC<Props> = ({ releases, reportData, token, defaultTab = 'aggregator' }) => {
  const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>(defaultTab);
  const [aggregatorSubTab, setAggregatorSubTab] = useState<'all' | 'spotify' | 'youtube' | 'others' | 'top'>('all');

  // Filter States
  const [filterPlatform, setFilterPlatform] = useState('All Platforms');
  const [filterRegion, setFilterRegion] = useState('All Regions');
  const [filterDate, setFilterDate] = useState('Last 7 days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Table States
  const [tableTab, setTableTab] = useState<'tracks' | 'artists'>('tracks');
  const [searchQuery, setSearchQuery] = useState('');

  // Update activeTab if defaultTab changes (e.g. navigation)
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  // 1. Calculate Catalog Stats
  const stats = {
    totalTracks: releases.reduce((acc, r) => acc + r.tracks.length, 0),
    singles: releases.filter(r => r.tracks.length === 1).length,
    eps: releases.filter(r => r.tracks.length >= 2 && r.tracks.length <= 6).length,
    albums: releases.filter(r => r.tracks.length > 6).length,
  };

  // 2. Aggregate Report Data
  const aggregatedData = useMemo(() => {
    const platformStats: Record<string, { streams: number, revenue: number }> = {};
    let totalRev = 0;
    let totalStr = 0;

    reportData.forEach(item => {
        const platformName = (item.platform || 'Unknown').toLowerCase();
        
        // Filter logic based on aggregatorSubTab
        if (aggregatorSubTab === 'spotify' && !platformName.includes('spotify')) return;
        if (aggregatorSubTab === 'youtube' && !platformName.includes('youtube') && !platformName.includes('google')) return;
        if (aggregatorSubTab === 'others') {
            if (platformName.includes('spotify') || platformName.includes('youtube') || platformName.includes('google')) return;
        }

        totalRev += item.revenue;
        totalStr += item.quantity;
        
        const platform = item.platform || 'Unknown';
        if (!platformStats[platform]) {
            platformStats[platform] = { streams: 0, revenue: 0 };
        }
        platformStats[platform].streams += item.quantity;
        platformStats[platform].revenue += item.revenue;
    });

    const platforms = Object.entries(platformStats).map(([name, data]) => ({
        name,
        streams: data.streams,
        revenue: data.revenue,
        // Mock trend for now as we don't have historical data comparison in simple report
        trend: '0%', 
        isUp: true,
        color: getColorForPlatform(name),
        icon: name.charAt(0).toUpperCase()
    })).sort((a, b) => b.revenue - a.revenue); // Sort by revenue

    return {
        totalRevenue: totalRev,
        totalStreams: totalStr,
        platforms
    };
  }, [reportData, aggregatorSubTab]);

  const { totalRevenue, totalStreams, platforms } = aggregatedData;

  // Helper formatting
  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const StatCard = ({ title, count, icon, colorClass, bgClass, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
        <div>
            <p className="text-slate-500 text-[10px] font-bold tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{count}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtext}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
            {icon}
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto min-h-screen">
       <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Statistik Katalog Lagu Anda</h1>
            <p className="text-slate-500 mt-1 text-sm">Analisis performa katalog musik dan pendapatan Anda.</p>
       </div>

       {activeTab === 'aggregator' ? (
           <div className="animate-fade-in">
               {/* CATALOG STATS */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard 
                        title="Total Rilis Lagu" 
                        count={stats.totalTracks} 
                        icon={<Mic2 size={24} />} 
                        colorClass="text-blue-600" 
                        bgClass="bg-blue-50"
                        subtext="Total Track Individual"
                    />
                    <StatCard 
                        title="Total Album" 
                        count={stats.albums} 
                        icon={<Disc size={24} />} 
                        colorClass="text-purple-600" 
                        bgClass="bg-purple-50"
                        subtext="> 6 Tracks"
                    />
                    <StatCard 
                        title="Total EP" 
                        count={stats.eps} 
                        icon={<Layers size={24} />} 
                        colorClass="text-indigo-600" 
                        bgClass="bg-indigo-50"
                        subtext="2 - 6 Tracks"
                    />
                    <StatCard 
                        title="Total Single" 
                        count={stats.singles} 
                        icon={<Music size={24} />} 
                        colorClass="text-cyan-600" 
                        bgClass="bg-cyan-50"
                        subtext="1 Track"
                    />
               </div>

                {/* Aggregator Sub-Tabs */}
               <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                    <button 
                        onClick={() => setAggregatorSubTab('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            aggregatorSubTab === 'all' 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        All Statistik
                    </button>
                    <button 
                        onClick={() => setAggregatorSubTab('spotify')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            aggregatorSubTab === 'spotify' 
                            ? 'bg-green-600 text-white border-green-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Spotify
                    </button>
                    <button 
                        onClick={() => setAggregatorSubTab('youtube')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            aggregatorSubTab === 'youtube' 
                            ? 'bg-red-600 text-white border-red-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        YouTube
                    </button>
                    <button 
                        onClick={() => setAggregatorSubTab('others')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            aggregatorSubTab === 'others' 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Platform Lainnya
                    </button>
                    <button 
                        onClick={() => setAggregatorSubTab('top')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            aggregatorSubTab === 'top' 
                            ? 'bg-orange-500 text-white border-orange-500' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Top Katalog
                    </button>
               </div>

               {/* Filters */}
               <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                         <select 
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                         >
                            <option>All Platforms</option>
                            <option>Spotify</option>
                            <option>YouTube</option>
                            <option>TikTok</option>
                            <option>Apple Music</option>
                         </select>
                         <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-500">
                            <ChevronDown size={14} />
                         </div>
                    </div>
                    <div className="relative">
                         <select 
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                         >
                            <option>All Regions</option>
                            <option>Indonesia</option>
                            <option>United States</option>
                            <option>Global</option>
                         </select>
                         <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-500">
                            <ChevronDown size={14} />
                         </div>
                    </div>
                    <div className="relative">
                         <select 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                         >
                            <option>Last 7 days</option>
                            <option>Last 28 days</option>
                            <option>Last 90 days</option>
                            <option>Year to Date</option>
                            <option>Custom Range</option>
                         </select>
                         <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-500">
                            <ChevronDown size={14} />
                         </div>
                    </div>

                    {filterDate === 'Custom Range' && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <div className="relative">
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-slate-400 hover:bg-slate-50 transition-colors"
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="text-slate-400 text-xs font-medium">to</span>
                            <div className="relative">
                                <input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-slate-400 hover:bg-slate-50 transition-colors"
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                    )}
               </div>

               {/* Top 5 Catalog & Artist */}
                {aggregatorSubTab === 'top' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top 5 Catalog */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                         <div className="flex items-center justify-between mb-3">
                             <h3 className="font-bold text-slate-800 text-sm">Top 5 Katalog</h3>
                             <button className="text-[10px] font-medium text-slate-500 hover:text-slate-800">Lihat Semua</button>
                         </div>
                         <div className="space-y-2">
                             {[
                                 { title: 'Love Song', artist: 'MVP Band', streams: 12500, trend: '+12%', image: 'https://picsum.photos/seed/1/100' },
                                 { title: 'Bundaku Tercinta', artist: 'Nandita', streams: 8400, trend: '+5%', image: 'https://picsum.photos/seed/2/100' },
                                 { title: 'Song for Love', artist: 'Shena Ariyandi', streams: 6200, trend: '+22%', image: 'https://picsum.photos/seed/3/100' },
                                 { title: 'Guitarstik', artist: 'MVP Band', streams: 4100, trend: '-2%', image: 'https://picsum.photos/seed/4/100' },
                                 { title: 'Green Country', artist: 'Shena Ariyandi', streams: 3800, trend: '+8%', image: 'https://picsum.photos/seed/5/100' },
                             ].map((item, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
                                     <div className="flex items-center gap-3">
                                         <span className={`text-xs font-bold w-4 text-center ${idx < 3 ? 'text-blue-600' : 'text-slate-400'}`}>#{idx + 1}</span>
                                         <div className="w-8 h-8 rounded-lg bg-slate-200 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${item.image})` }}></div>
                                         <div>
                                             <h4 className="font-bold text-slate-800 text-xs">{item.title}</h4>
                                             <p className="text-[10px] text-slate-500">{item.artist}</p>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-bold text-slate-800 text-xs">{formatNumber(item.streams)}</p>
                                         <p className={`text-[9px] font-medium ${item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{item.trend}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
 
                    {/* Top 5 Artist */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                         <div className="flex items-center justify-between mb-3">
                             <h3 className="font-bold text-slate-800 text-sm">Top 5 Artist</h3>
                             <button className="text-[10px] font-medium text-slate-500 hover:text-slate-800">Lihat Semua</button>
                         </div>
                         <div className="space-y-2">
                             {[
                                 { artist: 'MVP Band', streams: 45200, trend: '+15%', image: 'https://picsum.photos/seed/10/100' },
                                 { artist: 'Shena Ariyandi', streams: 32100, trend: '+8%', image: 'https://picsum.photos/seed/11/100' },
                                 { artist: 'Nandita', streams: 28400, trend: '-3%', image: 'https://picsum.photos/seed/12/100' },
                                 { artist: 'The Rockers', streams: 15600, trend: '+25%', image: 'https://picsum.photos/seed/13/100' },
                                 { artist: 'Jazz Vibes', streams: 12000, trend: '+5%', image: 'https://picsum.photos/seed/14/100' },
                             ].map((item, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
                                     <div className="flex items-center gap-3">
                                         <span className={`text-xs font-bold w-4 text-center ${idx < 3 ? 'text-blue-600' : 'text-slate-400'}`}>#{idx + 1}</span>
                                         <div className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${item.image})` }}></div>
                                         <div>
                                             <h4 className="font-bold text-slate-800 text-xs">{item.artist}</h4>
                                             <p className="text-[10px] text-slate-500">Artist</p>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-bold text-slate-800 text-xs">{formatNumber(item.streams)}</p>
                                         <p className={`text-[9px] font-medium ${item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{item.trend}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
                )}

               {/* AGGREGATOR CHART & TABLE */}
               {aggregatorSubTab !== 'top' && (
               <div className="space-y-8 animate-fade-in">
                    {/* CHART SECTION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            {/* Legend */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full border-2 border-slate-800 bg-white mr-1"></div>
                                        <div className="w-4 h-0.5 bg-slate-800"></div>
                                    </div>
                                    <span className="font-medium text-slate-600">TikTok - Likes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                                    <span className="font-medium text-slate-600">Spotify</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-red-600"></div>
                                    <span className="font-medium text-slate-600">YouTube</span>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button className="px-4 py-1 text-xs font-bold bg-white text-slate-800 rounded-md shadow-sm">Bar</button>
                                <button className="px-4 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">Line</button>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-[300px] w-full relative">
                            {/* SVG Chart */}
                            <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                {/* Grid Lines (Left Axis - 0, 5, 10, 15, 20, 25) */}
                                {[0, 1, 2, 3, 4, 5].map((i) => {
                                    const y = 250 - (i * 50); // 250, 200, 150, 100, 50, 0
                                    return (
                                        <g key={i}>
                                            <line x1="40" y1={y} x2="960" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                            {/* Left Axis Label */}
                                            <text x="30" y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-medium">{i * 5}</text>
                                            {/* Right Axis Label (0, 2, 4, 6, 8, 10) */}
                                            <text x="970" y={y + 4} textAnchor="start" className="text-[10px] fill-slate-400 font-medium">{i * 2}</text>
                                        </g>
                                    );
                                })}

                                {/* Bars (Right Scale: 0-10 -> Height 250px range. 1 unit = 25px) */}
                                {/* 24 Feb: YouTube 3 (75px) */}
                                <rect x="130" y={250 - (3 * 25)} width="20" height={3 * 25} fill="#dc2626" rx="2" />

                                {/* 27 Feb: Spotify 3 (75px), YouTube 2 (50px) - Stacked? Or Side by side? Image looks stacked/layered. Let's stack. */}
                                {/* Spotify (Green) */}
                                <rect x="520" y={250 - (3 * 25)} width="20" height={3 * 25} fill="#22c55e" rx="2" />
                                {/* YouTube (Red) on top? Image shows Red block floating or stacked. Let's assume stacked. Total 5? */}
                                <rect x="520" y={250 - (5 * 25)} width="20" height={2 * 25} fill="#dc2626" rx="2" />

                                {/* 28 Feb: YouTube 7 (175px) */}
                                <rect x="650" y={250 - (7 * 25)} width="20" height={7 * 25} fill="#dc2626" rx="2" />

                                {/* Line (Left Scale: 0-25 -> Height 250px range. 1 unit = 10px) */}
                                {/* Points: 21, 11, 3, 4, 1, 14, 0 */}
                                {/* Y = 250 - (val * 10) */}
                                {/* X = 140, 270, 400, 530, 660, 790, 920 (Approx distributed) */}
                                <path 
                                    d="M 140 40 C 205 80, 205 140, 270 140 C 335 140, 335 220, 400 220 C 465 220, 465 210, 530 210 C 595 210, 595 240, 660 240 C 725 240, 725 110, 790 110 C 855 110, 855 250, 920 250"
                                    fill="none"
                                    stroke="#1e293b"
                                    strokeWidth="2"
                                />

                                {/* Dots */}
                                {[
                                    {x: 140, y: 40}, {x: 270, y: 140}, {x: 400, y: 220}, 
                                    {x: 530, y: 210}, {x: 660, y: 240}, {x: 790, y: 110}, {x: 920, y: 250}
                                ].map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#1e293b" strokeWidth="2" />
                                ))}

                                {/* X Axis Labels */}
                                {['2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'].map((date, i) => (
                                    <text key={i} x={140 + (i * 130)} y="270" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">{date}</text>
                                ))}
                            </svg>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Table Header & Tabs */}
                        <div className="border-b border-slate-100 p-6 pb-0">
                            <div className="flex items-center gap-8 mb-6">
                                <button 
                                    onClick={() => setTableTab('tracks')}
                                    className={`pb-4 border-b-2 font-bold text-sm transition-colors ${tableTab === 'tracks' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tracks
                                </button>
                                <button 
                                    onClick={() => setTableTab('artists')}
                                    className={`pb-4 border-b-2 font-bold text-sm transition-colors ${tableTab === 'artists' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Artists
                                </button>
                            </div>
                            
                            <div className="mb-6 relative max-w-sm">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={tableTab === 'tracks' ? "Search by ISRC, track title" : "Search by artist name"}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    {tableTab === 'tracks' ? (
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-800">Track Title</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800 cursor-pointer group">
                                            <div className="flex items-center justify-center gap-1">Videos <ArrowDownRight size={12} className="text-slate-400" /></div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800 cursor-pointer">
                                            <div className="flex items-center justify-center gap-1">Views <ArrowDownRight size={12} className="text-slate-400" /></div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800">Engagement <span className="text-slate-400 font-normal">?</span></th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800 cursor-pointer">
                                            <div className="flex items-center justify-center gap-1">Streams <ArrowDownRight size={12} className="text-slate-400" /></div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800 cursor-pointer">
                                            <div className="flex items-center justify-center gap-1">Listeners <ArrowDownRight size={12} className="text-slate-400" /></div>
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-800">Action</th>
                                    </tr>
                                    ) : (
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-800">Artist Name</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800">Total Tracks</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800">Total Streams</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-800">Growth</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-800">Action</th>
                                    </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(() => {
                                        const tracks = [
                                            { title: 'Love Song', artist: 'MVP Band', videos: 2, views: 472, growth: 26.20, engagement: '-', streams: 0, listeners: 0 },
                                            { title: 'Bundaku Tercinta', artist: 'Nandita', videos: 1, views: 28, growth: 0, engagement: '-', streams: 0, sGrowth: -100, listeners: 0 },
                                            { title: 'Song for Love', artist: 'Shena Ariyandi', videos: 1, views: 76, growth: 322.22, engagement: '-', streams: 0, sGrowth: -100, listeners: 0 },
                                            { title: 'Guitarstik', artist: 'MVP Band', videos: 0, views: 2, growth: 0, engagement: '-', streams: 0, listeners: 0 },
                                            { title: 'Green Country', artist: 'Shena Ariyandi', videos: 0, views: 7, growth: 600.00, engagement: '-', streams: 0, sGrowth: -100, listeners: 0 },
                                        ];
                                        const artists = [
                                            { name: 'MVP Band', tracks: 12, streams: 16600, growth: 12 },
                                            { name: 'Nandita', tracks: 5, streams: 8400, growth: 5 },
                                            { name: 'Shena Ariyandi', tracks: 8, streams: 10000, growth: 15 },
                                        ];

                                        if (tableTab === 'tracks') {
                                            return tracks
                                                .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.artist.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((track, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${i}/100)` }}></div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{track.title}</div>
                                                                <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{track.artist}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">{track.videos}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-bold text-slate-800">{track.views}</div>
                                                        {track.growth > 0 && <div className="text-[10px] font-bold text-green-500">+{track.growth.toFixed(2)}%</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-slate-500">-</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-bold text-slate-800">{track.streams}</div>
                                                        {track.sGrowth === -100 && <div className="text-[10px] font-bold text-red-500">-100.00%</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-bold text-slate-800">{track.listeners}</div>
                                                        {track.sGrowth === -100 && <div className="text-[10px] font-bold text-red-500">-100.00%</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline">View Insights</button>
                                                    </td>
                                                </tr>
                                            ));
                                        } else {
                                            return artists
                                                .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((artist, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${i + 10}/100)` }}></div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{artist.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">{artist.tracks}</td>
                                                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-800">{formatNumber(artist.streams)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`text-[10px] font-bold ${artist.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {artist.growth > 0 ? '+' : ''}{artist.growth}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline">View Profile</button>
                                                    </td>
                                                </tr>
                                            ));
                                        }
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
               </div>
               )}

               {/* ANALYTICS SECTION - REMOVED */}
               {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-600" />
                                    Performa Keseluruhan
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-500 text-white rounded-lg shadow-lg shadow-green-500/20">
                                            <DollarSign size={20} />
                                        </div>
                                        <span className="text-slate-500 font-bold text-xs tracking-wide">Total Pendapatan</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-4">{formatIDR(totalRevenue)}</h2>
                                    <p className="text-slate-500 text-[10px] mt-2">Akumulasi dari laporan yang diimpor</p>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                     <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20">
                                            <PlayCircle size={20} />
                                        </div>
                                        <span className="text-slate-500 font-bold text-xs tracking-wide">Total Streams</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-4">{formatNumber(totalStreams)}</h2>
                                    <p className="text-slate-500 text-[10px] mt-2">Total kuantitas stream/penjualan</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-base">Performa Platform</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 tracking-wider">Platform</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 tracking-wider">Streams</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 tracking-wider">Pendapatan</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 tracking-wider">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {platforms.length > 0 ? (
                                            platforms.map((platform, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] mr-3 ${platform.color}`}>
                                                                {platform.icon}
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-xs">{platform.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600 text-xs">
                                                        {formatNumber(platform.streams)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800 text-xs">
                                                        {formatIDR(platform.revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-2">
                                                                <div 
                                                                    className={`h-full ${platform.color.replace('bg-', 'bg-')}`} 
                                                                    style={{ width: `${(platform.revenue / totalRevenue) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-medium">
                                                                {((platform.revenue / totalRevenue) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-xs">
                                                    Data Belum Tersedia
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
               </div> */}
           </div>
       ) : (
           <div className="animate-fade-in">
                <PublishingAnalytics token={token || null} />
           </div>
       )}
    </div>
  );
};

function getColorForPlatform(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('spotify')) return 'bg-green-500';
    if (n.includes('apple') || n.includes('itunes')) return 'bg-red-500';
    if (n.includes('youtube')) return 'bg-red-600';
    if (n.includes('tiktok')) return 'bg-black';
    if (n.includes('resso')) return 'bg-orange-500';
    if (n.includes('joox')) return 'bg-green-600';
    return 'bg-blue-500';
}
