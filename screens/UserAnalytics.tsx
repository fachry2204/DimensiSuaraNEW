import React, { useState, useEffect } from 'react';
import { ReleaseData, ReportData } from '../types';
import { BarChart3, DollarSign, ListMusic, TrendingUp, Music, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  releases: ReleaseData[];
  reportData: ReportData[];
  currentUserData: any;
  token?: string;
  onAuthExpired?: () => void;
}

export const UserAnalytics: React.FC<Props> = ({ releases, reportData, currentUserData, token, onAuthExpired }) => {
  const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>('aggregator');
  const [pubStats, setPubStats] = useState<any>(null);
  const [isLoadingPub, setIsLoadingPub] = useState(false);

  // --- Aggregator Logic ---
  const uid = currentUserData?.id;
  const uname = currentUserData?.username;
  const email = currentUserData?.email;
  const full = currentUserData?.full_name || '';
  const belongs = (r: any) =>
    (r.user_id && uid && String(r.user_id) === String(uid)) ||
    (r.ownerId && uid && String(r.ownerId) === String(uid)) ||
    (r.uploader && (r.uploader === uname || r.uploader === email)) ||
    (Array.isArray(r.primaryArtists) && r.primaryArtists.some((a: string) => typeof a === 'string' && full ? a.includes(full) : false));
  const myReleases = releases.filter(belongs);
  const myTracks = myReleases.reduce((s, r) => s + (r.tracks?.length || 0), 0);
  const myReports = reportData.filter(d => {
    const a = (d.artist || '').toLowerCase();
    const f = (full || '').toLowerCase();
    const u = (uname || '').toLowerCase();
    return (f && a.includes(f)) || (u && a.includes(u));
  });
  const totalRevenue = myReports.reduce((s, d) => s + (d.revenue || 0), 0);
  const trackAgg: Record<string, { revenue: number; streams: number }> = {};
  myReports.forEach(d => {
    const key = d.title || 'Unknown';
    const cur = trackAgg[key] || { revenue: 0, streams: 0 };
    trackAgg[key] = { revenue: cur.revenue + (d.revenue || 0), streams: cur.streams + (d.quantity || 0) };
  });
  const topTracks = Object.entries(trackAgg).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);

  // --- Publishing Logic ---
  useEffect(() => {
    if (activeTab === 'publishing' && token && !pubStats) {
      setIsLoadingPub(true);
      api.publishing.getAnalytics(token)
        .then(setPubStats)
        .catch(err => {
            if (err?.message === 'AUTH' && onAuthExpired) {
                onAuthExpired();
            } else {
                console.error(err);
            }
        })
        .finally(() => setIsLoadingPub(false));
    }
  }, [activeTab, token, pubStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg text-slate-800 tracking-tight">User Analytics</h1>
        <p className="text-slate-500 mt-0.5 text-[12px]">Ringkasan performa rilisan Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setActiveTab('aggregator')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'aggregator' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Aggregator
        </button>
        <button
          onClick={() => setActiveTab('publishing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'publishing' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Publishing
        </button>
      </div>

      {activeTab === 'aggregator' ? (
        <>
            {/* Aggregator Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-5 rounded-2xl shadow-sm border bg-indigo-50 border-indigo-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Releases</p>
                        <h3 className="text-2xl font-bold text-slate-800">{myReleases.length}</h3>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Rilisan Anda</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                        <ListMusic size={20} />
                    </div>
                </div>
                <div className="p-5 rounded-2xl shadow-sm border bg-blue-50 border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Tracks</p>
                        <h3 className="text-2xl font-bold text-slate-800">{myTracks}</h3>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Dalam katalog Anda</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                        <BarChart3 size={20} />
                    </div>
                </div>
                <div className="p-5 rounded-2xl shadow-sm border bg-green-50 border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()}</h3>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Akumulasi</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm text-slate-800">Top Tracks</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Revenue</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Streams</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topTracks.map(([title, val]) => (
                                <tr key={title} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3 font-bold text-slate-700">{title}</td>
                                    <td className="px-6 py-3 text-slate-600">{val.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-slate-600">{val.streams.toLocaleString()}</td>
                                </tr>
                            ))}
                            {topTracks.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">Belum ada data.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      ) : (
        <>
            {/* Publishing Content */}
            {isLoadingPub ? (
                <div className="p-12 text-center text-slate-500">Loading publishing data...</div>
            ) : !pubStats ? (
                <div className="p-12 text-center text-slate-500">Failed to load data or no data available.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="p-5 rounded-2xl shadow-sm border bg-indigo-50 border-indigo-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Songs</p>
                                <h3 className="text-2xl font-bold text-slate-800">{pubStats.totalSongs}</h3>
                                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Lagu Terdaftar</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                                <Music size={20} />
                            </div>
                        </div>
                         <div className="p-5 rounded-2xl shadow-sm border bg-emerald-50 border-emerald-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Approved Songs</p>
                                <h3 className="text-2xl font-bold text-slate-800">{pubStats.approvedSongs}</h3>
                                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Lagu Disetujui</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="p-5 rounded-2xl shadow-sm border bg-green-50 border-green-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(pubStats.totalRevenue)}</h3>
                                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Royalti Publishing</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm text-slate-800">Top Songs (Revenue)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Title</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pubStats.topSongs && pubStats.topSongs.length > 0 ? (
                                        pubStats.topSongs.map((song: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-bold text-slate-700">{song.title}</td>
                                                <td className="px-6 py-3 text-slate-600">{formatCurrency(song.revenue)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="p-8 text-center text-slate-400 text-sm">Belum ada data.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
      )}
    </div>
  );
}
