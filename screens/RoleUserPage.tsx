import React, { useEffect, useState } from 'react';
import { Users, User as UserIcon, Shield, Search, CheckCircle, XCircle } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AlertModal, AlertState } from '../components/AlertModal';

export const RoleUserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [token] = useState(localStorage.getItem('cms_token') || '');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const all = await api.getUsers(token);
        const onlyUsers = (all as User[]).filter(u => u.role === 'User');
        setUsers(onlyUsers);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [token]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const counts = {
    total: users.length,
    pending: users.filter(u => u.status === 'Pending' || u.status === 'Review').length,
    approved: users.filter(u => u.status === 'Approved' || u.status === 'Active').length,
    rejected: users.filter(u => u.status === 'Rejected').length
  };

  const updateStatus = async (userId: string, status: User['status']) => {
    if (!token) return;
    setIsUpdating(userId);
    try {
      await api.updateUserStatus(token, userId, status);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status } : u)));
    } catch (err: any) {
      setAlertState({
        isOpen: true,
        title: 'Gagal Update Status',
        message: err?.message || 'Gagal memperbarui status',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6 border-b border-gray-200 pb-4 md:hidden">
        <h1 className="text-lg text-slate-800 tracking-tight flex items-center gap-2">
          <Shield size={22} className="text-slate-400" />
          Role User
        </h1>
        <p className="text-slate-500 mt-1 ml-8 text-[12px]">Kelola pengguna berperan 'User'.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Role User</h2>
              <p className="text-sm text-slate-500">Daftar pengguna dengan role 'User'.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            Ke User Management
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 rounded-2xl shadow-sm border bg-indigo-50 border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total User</p>
              <h3 className="text-2xl font-bold text-slate-800">{counts.total}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Terdaftar</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
              <UserIcon size={20} />
            </div>
          </div>
          <div className="p-5 rounded-2xl shadow-sm border bg-yellow-50 border-yellow-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Pending/Review</p>
              <h3 className="text-2xl font-bold text-slate-800">{counts.pending}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Menunggu keputusan</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-yellow-100 text-yellow-600">
              <Shield size={20} />
            </div>
          </div>
          <div className="p-5 rounded-2xl shadow-sm border bg-green-50 border-green-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Approved/Active</p>
              <h3 className="text-2xl font-bold text-slate-800">{counts.approved}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Sudah aktif</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="p-5 rounded-2xl shadow-sm border bg-red-50 border-red-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Rejected</p>
              <h3 className="text-2xl font-bold text-slate-800">{counts.rejected}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Perlu perhatian</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
              <XCircle size={20} />
            </div>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 text-sm">Loading...</td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 text-sm">Tidak ada data.</td>
                </tr>
              )}
              {!isLoading && filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      u.status === 'Review' ? 'bg-blue-100 text-blue-700' :
                      u.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      u.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      u.status === 'Active' ? 'bg-green-100 text-green-700' :
                      u.status === 'Inactive' ? 'bg-gray-100 text-gray-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.status === 'Rejected' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{u.registeredDate || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={isUpdating === u.id}
                        onClick={() => updateStatus(u.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        disabled={isUpdating === u.id}
                        onClick={() => updateStatus(u.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        Reject
                      </button>
                      <button
                        disabled={isUpdating === u.id}
                        onClick={() => updateStatus(u.id, 'Active')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm shadow-blue-100"
                        title="Set Active"
                      >
                        Set Active
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
