import React, { useState, useEffect } from 'react';
import { ReportData } from '../types';
import { DollarSign, Loader2, Music } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  reportData: ReportData[];
  currentUserData: any;
  token?: string;
  onAuthExpired?: () => void;
}

export const UserPayments: React.FC<Props> = ({ reportData, currentUserData, token, onAuthExpired }) => {
  const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>('aggregator');

  // --- Aggregator Data ---
  const uname = currentUserData?.username || '';
  const full = currentUserData?.full_name || '';
  const myReports = reportData.filter(d => {
    const a = (d.artist || '').toLowerCase();
    return a.includes((full || '').toLowerCase()) || a.includes((uname || '').toLowerCase());
  });
  const aggMonthly: Record<string, number> = {};
  myReports.forEach(d => {
    const key = d.period || 'N/A';
    aggMonthly[key] = (aggMonthly[key] || 0) + (d.revenue || 0);
  });
  const aggRows = Object.entries(aggMonthly).sort((a, b) => a[0].localeCompare(b[0]));
  const aggTotalRevenue = aggRows.reduce((s, [, v]) => s + v, 0);

  // --- Publishing Data ---
  const [pubReports, setPubReports] = useState<any[]>([]);
  const [isLoadingPub, setIsLoadingPub] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'publishing' && token) {
      // Only fetch if we haven't already (or if you want to refresh every time, remove the check)
      // Here we fetch every time tab switches to publishing if empty, or we can keep it simple.
      if (pubReports.length === 0 && !pubError) {
          setIsLoadingPub(true);
          api.publishing.getReports(token)
            .then(data => {
                if (Array.isArray(data)) {
                    setPubReports(data);
                } else {
                    setPubReports([]);
                }
            })
            .catch(err => {
                if (err?.message === 'AUTH') {
                    if (onAuthExpired) {
                        onAuthExpired();
                    } else {
                        setPubError("Sesi berakhir. Mohon refresh halaman.");
                    }
                } else {
                    console.error("Failed to fetch publishing reports", err);
                    setPubError("Gagal memuat data publishing.");
                }
            })
            .finally(() => setIsLoadingPub(false));
      }
    }
  }, [activeTab, token, pubReports.length, pubError]);

  const pubMonthly: Record<string, number> = {};
  pubReports.forEach(r => {
      // Format Period as YYYY-MM
      // Use sub_pub_share as revenue (matches Admin view)
      const amount = Number(r.sub_pub_share || 0);
      const key = (r.year && r.month) 
        ? `${r.year}-${String(r.month).padStart(2, '0')}` 
        : 'Unknown';
      pubMonthly[key] = (pubMonthly[key] || 0) + amount;
  });
  const pubRows = Object.entries(pubMonthly).sort((a, b) => a[0].localeCompare(b[0]));
  const pubTotalRevenue = pubRows.reduce((s, [, v]) => s + v, 0);

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
        <h1 className="text-lg text-slate-800 tracking-tight">Pembayaran</h1>
        <p className="text-slate-500 mt-0.5 text-[12px]">Ringkasan pendapatan Anda per periode.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-5 rounded-2xl shadow-sm border bg-green-50 border-green-100 flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(aggTotalRevenue).replace('Rp', '')}</h3>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Akumulasi (Aggregator)</p>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                    <DollarSign size={20} />
                </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm text-slate-800">Ringkasan Periode (Aggregator)</h3>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Periode</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Revenue</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {aggRows.map(([period, revenue]) => (
                        <tr key={period} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-bold text-slate-700">{period}</td>
                        <td className="px-6 py-3 text-slate-600">{formatCurrency(revenue)}</td>
                        </tr>
                    ))}
                    {aggRows.length === 0 && (
                        <tr>
                        <td colSpan={2} className="p-8 text-center text-slate-400 text-sm">Belum ada data.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </>
      ) : (
        <>
            {isLoadingPub ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <span>Loading publishing data...</span>
                </div>
            ) : pubError ? (
                <div className="p-12 text-center text-red-500">{pubError}</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="p-5 rounded-2xl shadow-sm border bg-green-50 border-green-100 flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(pubTotalRevenue).replace('Rp', '')}</h3>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Akumulasi (Publishing)</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                            <DollarSign size={20} />
                        </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm text-slate-800">Ringkasan Periode (Publishing)</h3>
                        </div>
                        <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Periode</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Revenue</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {pubRows.map(([period, revenue]) => (
                                <tr key={period} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 font-bold text-slate-700">{period}</td>
                                <td className="px-6 py-3 text-slate-600">{formatCurrency(revenue)}</td>
                                </tr>
                            ))}
                            {pubRows.length === 0 && (
                                <tr>
                                <td colSpan={2} className="p-8 text-center text-slate-400 text-sm">Belum ada data publishing.</td>
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
