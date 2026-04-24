import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, FileText, CheckCircle, Clock, AlertCircle, Save, Upload, Link as LinkIcon, Eye, Download, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { getProfileImageUrl } from '../utils/imageUtils';
import { assetUrl } from '../utils/url';

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
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'link'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractLink, setContractLink] = useState('');
  
  // Preview State
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const data = await api.getUser(token, id);
        setUser(data);
        setContractStatus(data.contract_status || 'Not Generated');
        
        // Check if existing contract path is a URL or a file path
        if (data.contract_doc_path) {
          if (data.contract_doc_path.startsWith('http')) {
            setContractLink(data.contract_doc_path);
            setUploadMethod('link');
          }
        }
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
      let contractDocPath = user.contract_doc_path;
      
      // Handle based on method
      if (uploadMethod === 'pdf') {
        if (selectedFile) {
          const uploadRes = await api.uploadUserDoc(token, 'contract', selectedFile);
          if (uploadRes && uploadRes.path) {
              contractDocPath = uploadRes.path;
          }
        }
      } else {
        if (contractLink.trim()) {
          contractDocPath = contractLink.trim();
        }
      }

      // 1. Ensure contract fields are persisted in the users table
      await api.updateUser(token, user.id, {
        contract_doc_path: contractDocPath,
        contract_status: contractStatus
      });

      // 2. Update user status including contract status and path through workflow endpoint
      const res = await api.updateUserStatus(
        token, 
        user.id, 
        user.status, 
        undefined, 
        user.aggregator_percentage, 
        user.publishing_percentage,
        contractStatus,
        contractDocPath
      );
      
      // Update local state with merged data from response
      const updatedUser = { 
        ...user, 
        ...(res?.user || {}),
        contract_doc_path: contractDocPath,
        contract_status: contractStatus 
      };
      
      setUser(updatedUser);
      setSelectedFile(null);
      alert('Status kontrak berhasil diperbarui!');
    } catch (err: any) {
      console.error('Failed to update contract status:', err);
      alert('Gagal memperbarui status kontrak: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openPreview = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : assetUrl(url);
    setPreviewUrl(fullUrl);
    setPreviewIsPdf(url.toLowerCase().endsWith('.pdf'));
    setShowDocPreview(true);
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
                <label className="block text-sm font-medium text-slate-500 mb-3">Pilih Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setContractStatus('Not Generated')}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border transition-all ${
                      contractStatus === 'Not Generated'
                        ? 'border-blue-500 bg-white text-blue-600 shadow-sm'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <AlertCircle size={24} className={contractStatus === 'Not Generated' ? 'text-blue-500' : 'text-slate-400'} />
                    <span className="font-medium">Not Generated</span>
                  </button>

                  <button
                    onClick={() => setContractStatus('On Review')}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border transition-all ${
                      contractStatus === 'On Review'
                        ? 'border-blue-500 bg-white text-blue-600 shadow-sm'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <Clock size={24} className={contractStatus === 'On Review' ? 'text-blue-500' : 'text-slate-400'} />
                    <span className="font-medium">On Review</span>
                  </button>

                  <button
                    onClick={() => setContractStatus('Done')}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border transition-all ${
                      contractStatus === 'Done'
                        ? 'border-green-500 bg-green-50/30 text-green-700 shadow-sm'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <CheckCircle size={24} className={contractStatus === 'Done' ? 'text-green-600' : 'text-slate-400'} />
                    <span className="font-medium">Done</span>
                  </button>
                </div>
              </div>

              {/* Contract Method Selection */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h4 className="font-bold text-slate-700">Metode Kontrak</h4>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setUploadMethod('pdf')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        uploadMethod === 'pdf' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Upload size={14} /> UPLOAD PDF
                    </button>
                    <button 
                      onClick={() => setUploadMethod('link')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        uploadMethod === 'link' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <LinkIcon size={14} /> ADD LINK
                    </button>
                  </div>
                </div>

                {uploadMethod === 'pdf' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">File Kontrak (PDF)</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                          Choose File
                          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                          {selectedFile ? selectedFile.name : (user.contract_doc_path && !user.contract_doc_path.startsWith('http') ? 'Hanya PDF yang diperbolehkan' : 'No file chosen')}
                        </span>
                      </div>
                    </div>

                    {user.contract_doc_path && !user.contract_doc_path.startsWith('http') && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[13px] text-green-600 font-medium">
                          <CheckCircle size={16} /> 
                          <span>Kontrak terunggah: </span>
                          <button 
                            onClick={() => openPreview(user.contract_doc_path!)}
                            className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {user.contract_doc_path.split('/').pop()}
                            <Eye size={12} />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={assetUrl(user.contract_doc_path)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-colors"
                          >
                            <Download size={14} /> DOWNLOAD
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-slate-400 italic">Wajib diisi saat status kontrak "Done".</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Link Kontrak</label>
                    <input 
                      type="url" 
                      value={contractLink}
                      onChange={(e) => setContractLink(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm" 
                      placeholder="https://example.com/contract-link" 
                    />
                    {user.contract_doc_path && user.contract_doc_path.startsWith('http') && (
                        <div className="mt-2">
                             <a 
                                href={user.contract_doc_path} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                            >
                                <LinkIcon size={12} /> Buka Link Saat Ini
                            </a>
                        </div>
                    )}
                  </div>
                )}
              </div>

              {/* Catatan (Opsional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                <textarea
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm shadow-inner bg-slate-50/30"
                  rows={4}
                  placeholder="Tambahkan catatan mengenai kontrak ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">*Catatan ini hanya bersifat sementara (belum disimpan ke database).</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-70 disabled:shadow-none min-w-[200px]"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showDocPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-[96vw] md:w-full max-w-5xl h-[90svh] overflow-hidden animate-scale-in flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Preview Dokumen Kontrak</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Lihat detail dokumen yang terunggah</p>
                </div>
              </div>
              <button onClick={() => setShowDocPreview(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <XCircle size={28} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {previewIsPdf ? (
                <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
              ) : (
                <div className="w-full h-full overflow-auto p-8 flex items-center justify-center">
                  <img src={previewUrl} alt="Preview Dokumen" className="max-w-full shadow-lg rounded-xl" />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowDocPreview(false)}
                className="px-6 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 text-xs flex items-center gap-2"
              >
                <Eye size={14} /> Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
