import React, { useMemo, useState } from 'react';
import { ReportData } from '../types';
import { DollarSign, TrendingUp, Music, Globe, Smartphone, Download } from 'lucide-react';
import { PublishingReports } from './publishing/PublishingReports';

interface Props {
  data: ReportData[];
  token?: string | null;
  defaultTab?: 'aggregator' | 'publishing';
}

export const RevenueScreen: React.FC<Props> = ({ data, token, defaultTab = 'aggregator' }) => {
  const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>(defaultTab);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    const tracks: Record<string, { title: string, artist: string, revenue: number, streams: number }> = {};
    const platforms: Record<string, number> = {};
    const countries: Record<string, number> = {};

    data.forEach(item => {
        totalRevenue += item.revenue;
        
        // Track Aggregation
        const trackKey = `${item.isrc}-${item.title}`;
        if (!tracks[trackKey]) {
            tracks[trackKey] = { title: item.title, artist: item.artist, revenue: 0, streams: 0 };
        }
        tracks[trackKey].revenue += item.revenue;
        tracks[trackKey].streams += item.quantity;

        // Platform Aggregation
        const platform = item.platform || 'Unknown';
        platforms[platform] = (platforms[platform] || 0) + item.revenue;

        // Country Aggregation
        const country = item.country || 'Unknown';
        countries[country] = (countries[country] || 0) + item.revenue;
    });

    return {
        totalRevenue,
        topTracks: Object.values(tracks).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        topPlatforms: Object.entries(platforms).map(([name, val]) => ({ name, revenue: val })).sort((a, b) => b.revenue - a.revenue),
        topCountries: Object.entries(countries).map(([code, val]) => ({ code, revenue: val })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    };
  }, [data]);

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
      {/* <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('aggregator')}
            className={`px-4 py-2 rounded-lg border font-bold transition-colors ${activeTab === 'aggregator' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Aggregator
          </button>
          <button 
            onClick={() => setActiveTab('publishing')}
            className={`px-4 py-2 rounded-lg border font-bold transition-colors ${activeTab === 'publishing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Publishing
          </button>
      </div> */}

      {activeTab === 'publishing' ? (
        <PublishingReports token={token || null} />
      ) : (
        <>
          {data.length === 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Pendapatan</h1>
                  <p className="text-slate-500">Ringkasan pendapatan dan royalti</p>
                </div>
              </div>
        
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <Download size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Data Belum Tersedia</h3>
                <p className="text-slate-500 max-w-md mb-6">
                  Silakan import file laporan excel pada menu <strong>Laporan</strong> untuk melihat analisis pendapatan Anda.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Pendapatan</h1>
                  <p className="text-slate-500">Ringkasan pendapatan dan royalti dari {data.length} baris data</p>
                </div>
              </div>

              {/* TOTAL REVENUE CARD */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 mb-10 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-emerald-100 font-medium mb-2 flex items-center gap-2">
                        <DollarSign size={20} /> Total Pendapatan Bersih
                    </h2>
                    <div className="text-5xl font-bold tracking-tight mb-4">
                        {formatIDR(stats.totalRevenue)}
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                        <TrendingUp size={14} />
                        <span>Berdasarkan data import terkini</span>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  {/* TOP TRACKS */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                          <Music size={20} className="text-blue-500" /> Top Lagu (Revenue)
                      </h3>
                      <div className="space-y-4">
                          {stats.topTracks.map((track, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                                          #{idx + 1}
                                      </div>
                                      <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate">{track.title}</div>
                                          <div className="text-xs text-slate-500 truncate">{track.artist}</div>
                                      </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                      <div className="font-bold text-emerald-600">{formatIDR(track.revenue)}</div>
                                      <div className="text-xs text-slate-400">{formatNumber(track.streams)} streams</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* TOP PLATFORMS */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                          <Smartphone size={20} className="text-purple-500" /> Pendapatan per Platform
                      </h3>
                      <div className="space-y-4">
                          {stats.topPlatforms.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                  <span className="font-medium text-slate-700">{p.name}</span>
                                  <div className="flex items-center gap-4">
                                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                            <div 
                                                className="h-full bg-purple-500 rounded-full" 
                                                style={{ width: `${(p.revenue / stats.totalRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-bold text-slate-800 w-24 text-right">{formatIDR(p.revenue)}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
