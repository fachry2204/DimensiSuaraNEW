import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, FileBadge, Loader2 } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';

interface Props {
  currentUserData: User;
  defaultTab?: 'aggregator' | 'publishing';
}

export const MyContracts: React.FC<Props> = ({ currentUserData, defaultTab }) => {
  const user = currentUserData || {} as User;
  
  // State for Admin View
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // If Admin/Operator and accessing Aggregator Contracts, fetch all users
  const isAdminView = (user.role === 'Admin' || user.role === 'Operator') && defaultTab === 'aggregator';

  useEffect(() => {
    if (isAdminView) {
      fetchUsers();
    }
  }, [isAdminView]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token'); // Simple token retrieval
      const res = await api.getUsers(token || '');
      // Filter only role 'User'
      const users = Array.isArray(res) ? res : [];
      setAdminUsers(users.filter((u: any) => u.role === 'User'));
    } catch (error) {
      console.error("Failed to fetch users for contracts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to calculate End Contract Date (Date + 5 Years)
  const getEndDate = (startDate: string) => {
    if (!startDate) return '-';
    try {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) return '-';
      date.setFullYear(date.getFullYear() + 5);
      return date.toISOString().split('T')[0];
    } catch {
      return '-';
    }
  };

  // --- Render for Admin Aggregator View ---
  if (isAdminView) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-screen">
        <div className="mb-6">
          <h1 className="text-lg text-slate-800 tracking-tight">Kontrak Aggregator (Admin)</h1>
          <p className="text-slate-500 mt-0.5 text-[12px]">Daftar kontrak user aggregator.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <FileBadge size={24} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">Daftar Kontrak User</div>
              <div className="text-slate-500 text-sm">Semua user dengan role 'User'.</div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">No</th>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Nama User</th>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Tanggal Approved</th>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Persentase</th>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Akhir Kontrak (+5 Thn)</th>
                    <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUsers.length > 0 ? (
                    adminUsers.map((u, index) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3 text-slate-500 border-r border-slate-100 last:border-r-0">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 border-r border-slate-100 last:border-r-0">
                          {u.full_name || u.name || u.username}
                        </td>
                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100 last:border-r-0">
                          {u.joinedDate || u.joined_date || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100 last:border-r-0">
                          {u.aggregator_percentage !== undefined ? `${u.aggregator_percentage}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100 last:border-r-0">
                          {getEndDate(u.joinedDate || u.joined_date)}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100 last:border-r-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            u.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 
                            u.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            <CheckCircle size={12} />
                            {u.status === 'Active' ? 'Selesai' : (u.status || 'Pending')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-bold shadow-sm transition-all">
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Tidak ada data user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Default Render for Normal User (My Contracts) ---
  
  // Define contracts array with type
  const contracts: Array<{
    id: number;
    type: string;
    percentage: number;
    date: string | null | undefined;
    status: string;
    doc: any;
  }> = [];

  const addAggregator = user.aggregator_percentage !== undefined || user.role === 'Admin' || user.account_type;
  const addPublishing = user.publishing_percentage !== undefined;

  if (addAggregator && (!defaultTab || defaultTab === 'aggregator')) {
    contracts.push({
      id: 1,
      type: 'Aggregator',
      percentage: user.aggregator_percentage || 0,
      date: user.joinedDate,
      status: 'Active',
      doc: null
    });
  }

  if (addPublishing && (!defaultTab || defaultTab === 'publishing')) {
    contracts.push({
      id: 2,
      type: 'Publishing',
      percentage: user.publishing_percentage || 0,
      date: user.joinedDate,
      status: 'Active',
      doc: null
    });
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg text-slate-800 tracking-tight">Kontrak Saya</h1>
        <p className="text-slate-500 mt-0.5 text-[12px]">Dokumen kontrak Anda.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <FileBadge size={24} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">Kontrak</div>
            <div className="text-slate-500 text-sm">Daftar kontrak Aggregator dan Publishing.</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">No</th>
                <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Jenis Kontrak</th>
                <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Tanggal Mulai</th>
                <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Persentase</th>
                <th className="px-4 py-3 border-r border-slate-200 last:border-r-0">Status</th>
                <th className="px-4 py-3">Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.length > 0 ? (
                contracts.map((contract, index) => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 text-slate-500 border-r border-slate-100 last:border-r-0">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 border-r border-slate-100 last:border-r-0">{contract.type}</td>
                    <td className="px-4 py-3 text-slate-600 border-r border-slate-100 last:border-r-0">{contract.date || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 border-r border-slate-100 last:border-r-0">{contract.percentage}%</td>
                    <td className="px-4 py-3 border-r border-slate-100 last:border-r-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
                        <CheckCircle size={12} />
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all" disabled={!contract.doc}>
                        <Download size={14} />
                        Unduh
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data kontrak.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
