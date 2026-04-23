import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, FileText, CheckCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { api } from '../utils/api';
import { getProfileImageUrl } from '../utils/imageUtils';

interface Props {
  token: string;
}

export const ContractDetail: React.FC<Props> = ({ token }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Contract State
  const [contractStatus, setContractStatus] = useState<string>('Not Generated');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const data = await api.getUser(token, id);
        setUser(data);
        setContractStatus(data.contract_status || 'Not Generated');
        // Notes could be added to backend later if needed, currently not persisted in DB for contract notes specifically
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, token]);

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      // Re-using updateUserStatus API but only sending contract_status
      // We need to pass current status to avoid changing it accidentally if the API requires it
      await api.updateUserStatus(
        token, 
        user.id, 
        user.status, // Keep existing status
        undefined, // Reason
        user.aggregator_percentage, 
        user.publishing_percentage,
        contractStatus // Update contract status
      );
      alert('Status kontrak berhasil diperbarui!');
    } catch (err) {
      console.error('Failed to update contract status:', err);
      alert('Gagal memperbarui status kontrak.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Data kontrak tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Kembali</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/contracts/aggregator')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Kontrak Aggregator</h1>
          <p className="text-slate-500 text-sm">Kelola status dan informasi kontrak user.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
              {user.profile_picture ? (
                <img src={getProfileImageUrl(user.profile_picture)} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={40} />
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{user.full_name || user.username}</h2>
            {/* Username display removed per request */}
            
            <div className="flex flex-col gap-2 text-left mt-6">
              <div className="flex items-center gap-3 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate" title={user.email}>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                <Calendar size={16} className="text-slate-400" />
                <span>
                  Bergabung: {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Status Kontrak
            </h3>

            <div className="space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Pilih Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setContractStatus('Not Generated')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      contractStatus === 'Not Generated'
                        ? 'border-red-400 bg-red-50 text-red-800 shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <AlertCircle size={18} />
                    <span className="font-medium">Not Generated</span>
                  </button>

                  <button
                    onClick={() => setContractStatus('On Review')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      contractStatus === 'On Review'
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800 shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <Clock size={18} />
                    <span className="font-medium">On Review</span>
                  </button>

                  <button
                    onClick={() => setContractStatus('Done')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      contractStatus === 'Done'
                        ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <CheckCircle size={18} />
                    <span className="font-medium">Done</span>
                  </button>
                </div>
              </div>

              {/* Additional Info / Notes (Placeholder) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  rows={4}
                  placeholder="Tambahkan catatan mengenai kontrak ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <p className="text-xs text-slate-400 mt-1">*Catatan ini hanya bersifat sementara (belum disimpan ke database).</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
