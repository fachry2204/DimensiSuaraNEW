import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { api } from '../utils/api';
import { ChevronLeft, Save, XCircle, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';

export const UserEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem('cms_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newFiles, setNewFiles] = useState<{ [key: string]: File }>({});
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    const load = async () => {
      if (!id || !token) return;
      setIsLoading(true);
      try {
        const detail = await api.getUser(token, id);
        if (detail.role !== 'User') {
            // If not a regular user, redirect back to detail (should use modal there)
            navigate(`/users/${id}`);
            return;
        }
        setUser(detail);
        setFormData({
          full_name: detail.full_name || detail.name,
          email: detail.email,
          account_type: detail.account_type,
          company_name: detail.company_name,
          nik: detail.nik,
          phone: detail.phone,
          address: detail.address,
          country: detail.country,
          province: detail.province,
          city: detail.city,
          district: detail.district,
          subdistrict: detail.subdistrict,
          postal_code: detail.postal_code,
          pic_name: detail.pic_name,
          pic_position: detail.pic_position,
          pic_phone: detail.pic_phone,
          ktp_doc_path: detail.ktp_doc_path,
          npwp_doc_path: detail.npwp_doc_path,
          signature_doc_path: detail.signature_doc_path,
          nib_doc_path: detail.nib_doc_path,
          kemenkumham_doc_path: detail.kemenkumham_doc_path,
        });
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, token, navigate]);

  const handleSave = async () => {
    if (!user || !token) return;
    try {
      setIsSaving(true);
      const updatedData = { ...formData };

      // Upload new files if any
      const fileFields = [
        { key: 'ktp_doc_path', type: 'KTP' },
        { key: 'npwp_doc_path', type: 'NPWP' },
        { key: 'signature_doc_path', type: 'SIGNATURE' },
        { key: 'nib_doc_path', type: 'NIB' },
        { key: 'kemenkumham_doc_path', type: 'KEMENKUMHAM' }
      ];

      for (const field of fileFields) {
        if (newFiles[field.key]) {
          try {
            const res = await api.uploadUserDoc(token, field.type, newFiles[field.key]);
            if (res && res.path) {
              updatedData[field.key as keyof User] = res.path as any;
            }
          } catch (uploadErr) {
            console.error(`Failed to upload ${field.type}:`, uploadErr);
            throw new Error(`Gagal mengunggah file ${field.type}`);
          }
        }
      }

      await api.updateUser(token, user.id, updatedData);
      
      setAlertState({
        isOpen: true,
        title: 'Berhasil',
        message: 'Data user berhasil diperbarui',
        type: 'success'
      });
      
      // Delay redirect to allow user to see success message
      setTimeout(() => {
          navigate(`/users/${id}`);
      }, 1500);

    } catch (err: any) {
      setAlertState({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan saat menyimpan data',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-slate-500 flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            Memuat data user...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center">
        <XCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">User Tidak Ditemukan</h2>
        <button onClick={() => navigate('/users')} className="mt-4 text-blue-600 font-medium">Kembali ke Daftar User</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button
                onClick={() => navigate(`/users/${id}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                title="Batal dan Kembali"
            >
                <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl font-bold text-slate-800">Edit Data User</h1>
                <p className="text-sm text-slate-500">Ubah informasi profil dan dokumen pendukung.</p>
            </div>
        </div>
        <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed font-semibold"
        >
            {isSaving ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fade-in">
        {/* Basic Information Section */}
        <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                    <input
                        type="text"
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Tipe Akun</label>
                    <select
                        value={formData.account_type || 'PERSONAL'}
                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                        <option value="PERSONAL">Personal</option>
                        <option value="COMPANY">Company</option>
                    </select>
                </div>
                {formData.account_type === 'COMPANY' && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Nama Perusahaan</label>
                        <input
                            type="text"
                            value={formData.company_name || ''}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                )}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">NIK</label>
                    <input
                        type="text"
                        value={formData.nik || ''}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                    <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>
        </section>

        {/* Address Section */}
        <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Alamat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                    <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Negara</label>
                    <input
                        type="text"
                        value={formData.country || ''}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Provinsi</label>
                    <input
                        type="text"
                        value={formData.province || ''}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kota/Kabupaten</label>
                    <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kecamatan</label>
                    <input
                        type="text"
                        value={formData.district || ''}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kelurahan</label>
                    <input
                        type="text"
                        value={formData.subdistrict || ''}
                        onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kode Pos</label>
                    <input
                        type="text"
                        value={formData.postal_code || ''}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>
        </section>

        {/* PIC Section (Company Only) */}
        {formData.account_type === 'COMPANY' && (
            <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Person In Charge (PIC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Nama PIC</label>
                        <input
                            type="text"
                            value={formData.pic_name || ''}
                            onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Posisi PIC</label>
                        <input
                            type="text"
                            value={formData.pic_position || ''}
                            onChange={(e) => setFormData({ ...formData, pic_position: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">No. HP PIC</label>
                        <input
                            type="text"
                            value={formData.pic_phone || ''}
                            onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </section>
        )}

        {/* Documents Section */}
        <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-2">Dokumen Pendukung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'KTP', key: 'ktp_doc_path' },
                  { label: 'NPWP', key: 'npwp_doc_path' },
                  { label: 'Tanda Tangan', key: 'signature_doc_path' },
                  ...(formData.account_type === 'COMPANY' ? [
                    { label: 'NIB', key: 'nib_doc_path' },
                    { label: 'Kemenkumham', key: 'kemenkumham_doc_path' }
                  ] : [])
                ].map((doc) => (
                  <div key={doc.key} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all group relative">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setNewFiles({ ...newFiles, [doc.key]: file });
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className="mb-3 p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      {newFiles[doc.key] ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : (formData as any)[doc.key] ? (
                        <FileText className="text-blue-500" size={24} />
                      ) : (
                        <UploadCloud className="text-slate-400 group-hover:text-blue-500" size={24} />
                      )}
                    </div>
                    
                    <h4 className="font-medium text-slate-700 mb-1">{doc.label}</h4>
                    
                    <p className="text-xs text-slate-500 mb-2">
                      {newFiles[doc.key] ? (
                        <span className="text-green-600 font-medium truncate max-w-[150px] block mx-auto">
                          {newFiles[doc.key].name}
                        </span>
                      ) : (formData as any)[doc.key] ? (
                        <span className="text-blue-600 font-medium">Sudah Terunggah</span>
                      ) : (
                        "Belum ada file"
                      )}
                    </p>
                    
                    <div className="text-[10px] text-slate-400 px-3 py-1 bg-white rounded-full border border-slate-200">
                        {newFiles[doc.key] ? 'Klik untuk ganti' : 'Klik atau drag file ke sini'}
                    </div>
                  </div>
                ))}
            </div>
        </section>
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
};
