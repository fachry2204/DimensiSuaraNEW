import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Music, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../utils/api';

interface AnalyticsData {
    totalRevenue: number;
    totalSongs: number;
    pendingSongs: number;
    approvedSongs: number;
    topSongs: { title: string; revenue: number }[];
    topWriters: { name: string; revenue: number }[];
    monthlyData: { month: number; year: number; revenue: number }[];
}

interface Props {
  token: string | null;
}

export const PublishingAnalytics: React.FC<Props> = ({ token }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const res = await api.publishing.getAnalytics(token);
                setData(res);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 text-xs">Loading analytics...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-500 text-xs">Failed to load data</div>;
    }

    const maxMonthlyRevenue = Math.max(...(data.monthlyData.map(d => Number(d.revenue)) || [0]), 1);

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800">Analitik Publishing</h1>
                    <p className="text-slate-500 text-[10px]">Ringkasan performa katalog dan pendapatan</p>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-medium mb-1">Total Pendapatan</h3>
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(data.totalRevenue)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Music size={20} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-medium mb-1">Total Lagu</h3>
                    <p className="text-sm font-bold text-slate-800">{data.totalSongs}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-medium mb-1">Lagu Approved</h3>
                    <p className="text-sm font-bold text-slate-800">{data.approvedSongs}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-medium mb-1">Lagu Pending</h3>
                    <p className="text-sm font-bold text-slate-800">{data.pendingSongs}</p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Songs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-800 mb-4">Top 5 Lagu (Revenue)</h3>
                        <div className="space-y-4">
                            {data.topSongs.map((song, index) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                            {index + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[10px] font-medium text-slate-800 truncate">{song.title}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-600 whitespace-nowrap ml-2">
                                        {formatCurrency(song.revenue)}
                                    </div>
                                </div>
                            ))}
                            {data.topSongs.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-[10px]">
                                    Belum ada data lagu
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Writers (New) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-800 mb-4">Top 5 Pencipta (Revenue)</h3>
                        <div className="space-y-4">
                            {data.topWriters?.map((writer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                                            {index + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[10px] font-medium text-slate-800 truncate">{writer.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-600 whitespace-nowrap ml-2">
                                        {formatCurrency(writer.revenue)}
                                    </div>
                                </div>
                            ))}
                            {(!data.topWriters || data.topWriters.length === 0) && (
                                <div className="text-center py-8 text-slate-400 text-[10px]">
                                    Belum ada data pencipta
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-6">Pendapatan Bulanan (12 Bulan Terakhir)</h3>
                    <div className="h-64 flex items-end gap-2 sm:gap-4 justify-between">
                        {data.monthlyData.map((item, index) => {
                            const heightPercent = (Number(item.revenue) / maxMonthlyRevenue) * 100;
                            return (
                                <div key={index} className="flex flex-col items-center gap-2 flex-1 group relative">
                                    <div 
                                        className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-all duration-300 min-h-[4px]"
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    <span className="text-[10px] text-slate-500 font-medium transform -rotate-45 origin-top-left translate-y-2 whitespace-nowrap">
                                        {item.month}/{item.year}
                                    </span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {formatCurrency(item.revenue)}
                                    </div>
                                </div>
                            );
                        })}
                        {data.monthlyData.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                                Belum ada data pendapatan
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
