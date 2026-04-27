import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Edit2, Trash2, FileText, CreditCard, User, MapPin, Calendar, Briefcase, Eye, CheckCircle, AlertTriangle, XCircle, MessageCircle
} from 'lucide-react';
import { api } from '../../utils/api';
import { assetUrl } from '../../utils/url';
import { useBranding } from '../../contexts/BrandingContext';

interface Creator {
    id: number;
    name: string;
    nik: string;
    birth_place: string;
    birth_date: string;
    address: string;
    nationality: string;
    ktp_path: string;
    npwp_path: string;
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    whatsapp_number: string;
}

interface Props {
  token: string | null;
  userRole?: string;
}

export const PublishingWriter: React.FC<Props> = ({ token, userRole }) => {
    const navigate = useNavigate();
    const { getButtonColor } = useBranding();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    // const [showPreviewModal, setShowPreviewModal] = useState(false); // Removed modal state
    // const [previewCreator, setPreviewCreator] = useState<Creator | null>(null); // Removed modal state
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Modals
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [formData, setFormData] = useState<any>({
        name: '', nik: '', birth_place: '', birth_date: '', address: '',
        nationality: 'Indonesia',
        bank_name: '', bank_account_name: '', bank_account_number: '', whatsapp_number: ''
    });
    const [files, setFiles] = useState<{ ktp: File | null, npwp: File | null }>({ ktp: null, npwp: null });

    useEffect(() => {
        if (token) fetchCreators();
    }, [token]);

    const fetchCreators = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await api.publishing.getCreators(token);
            setCreators(data);
        } catch (error) {
            console.error('Failed to fetch creators', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: fileList } = e.target;
        if (fileList && fileList[0]) {
            setFiles({ ...files, [name]: fileList[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (files.ktp) data.append('ktp', files.ktp);
        if (files.npwp) data.append('npwp', files.npwp);

        try {
            if (isEditing && currentId) {
                await api.publishing.updateCreator(token, String(currentId), data);
                setModalMessage('Data berhasil diperbarui');
            } else {
                await api.publishing.createCreator(token, data);
                setModalMessage('Data berhasil ditambahkan');
            }
            setShowModal(false);
            fetchCreators();
            resetForm();
            setShowSuccessModal(true);
        } catch (error: any) {
            setModalMessage('Gagal menyimpan data: ' + error.message);
            setShowErrorModal(true);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await api.publishing.deleteCreator(token, String(deleteId));
            setShowDeleteModal(false);
            setDeleteId(null);
            fetchCreators();
            setModalMessage('Data berhasil dihapus');
            setShowSuccessModal(true);
        } catch (error: any) {
            setShowDeleteModal(false);
            setDeleteId(null);
            setModalMessage('Gagal menghapus: ' + error.message);
            setShowErrorModal(true);
        }
    };

    const handlePreview = (creator: Creator) => {
        // setPreviewCreator(creator);
        // setShowPreviewModal(true);
        navigate(`/publishing/writers/${creator.id}`);
    };

    const openEditModal = (creator: Creator) => {
        setIsEditing(true);
        setCurrentId(creator.id);
        setFormData({
            name: creator.name,
            nik: creator.nik,
            birth_place: creator.birth_place,
            birth_date: creator.birth_date ? creator.birth_date.split('T')[0] : '',
            address: creator.address,
            nationality: creator.nationality,
            bank_name: creator.bank_name,
            bank_account_name: creator.bank_account_name,
            bank_account_number: creator.bank_account_number,
            whatsapp_number: creator.whatsapp_number
        });
        setFiles({ ktp: null, npwp: null });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '', nik: '', birth_place: '', birth_date: '', address: '',
            nationality: 'Indonesia',
            bank_name: '', bank_account_name: '', bank_account_number: '', whatsapp_number: ''
        });
        setFiles({ ktp: null, npwp: null });
        setIsEditing(false);
        setCurrentId(null);
    };

    const filteredCreators = creators.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nik?.includes(searchTerm)
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Data Pencipta (Songwriters)</h1>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:opacity-90 font-bold text-xs shadow-sm"
                    style={{ backgroundColor: getButtonColor() }}
                >
                    <Plus size={18} />
                    Tambah Pencipta
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau NIK..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-bold">Nama</th>
                                <th className="px-6 py-3 font-bold">NIK / NPWP</th>
                                <th className="px-6 py-3 font-bold">Kontak & Alamat</th>
                                <th className="px-6 py-3 font-bold">Bank</th>
                                <th className="px-6 py-3 font-bold">WhatsApp</th>
                                <th className="px-6 py-3 text-right font-bold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredCreators.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Tidak ada data pencipta</td></tr>
                            ) : (
                                filteredCreators.map((creator) => (
                                    <tr key={creator.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-bold">{creator.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded w-fit">NIK: {creator.nik || '-'}</span>
                                                {creator.npwp_path && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded w-fit">NPWP Available</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-xs mb-1">
                                                <MapPin size={12} /> {creator.address || '-'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs">
                                                <Calendar size={12} /> {creator.birth_place}, {new Date(creator.birth_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">{creator.bank_name}</div>
                                            <div className="text-xs">{creator.bank_account_number}</div>
                                            <div className="text-xs text-slate-500">{creator.bank_account_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {creator.whatsapp_number ? (
                                                <a 
                                                    href={`https://wa.me/${creator.whatsapp_number.replace(/^0/, '62').replace(/\D/g, '')}`}
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium w-fit"
                                                    title="Chat WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                    <span>WhatsApp</span>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handlePreview(creator)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(creator)}
                                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(creator.id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Edit Data Pencipta' : 'Tambah Data Pencipta'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                    <input 
                                        type="text" name="name" required
                                        value={formData.name} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">NIK</label>
                                    <input 
                                        type="text" name="nik" required
                                        value={formData.nik} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                                    <input 
                                        type="text" name="birth_place"
                                        value={formData.birth_place} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                                    <input 
                                        type="date" name="birth_date"
                                        value={formData.birth_date} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                                    <textarea 
                                        name="address" rows={2}
                                        value={formData.address} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kewarganegaraan</label>
                                    <input 
                                        type="text" name="nationality"
                                        value={formData.nationality} onChange={handleInputChange}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Whatsapp</label>
                                    <input 
                                        type="text" name="whatsapp_number"
                                        value={formData.whatsapp_number} onChange={handleInputChange}
                                        placeholder="08xxxxxxxxxx"
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <CreditCard size={16} /> Informasi Bank
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Bank</label>
                                        <input 
                                            type="text" name="bank_name"
                                            value={formData.bank_name} onChange={handleInputChange}
                                            className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Rekening</label>
                                        <input 
                                            type="text" name="bank_account_number"
                                            value={formData.bank_account_number} onChange={handleInputChange}
                                            className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Atas Nama</label>
                                        <input 
                                            type="text" name="bank_account_name"
                                            value={formData.bank_account_name} onChange={handleInputChange}
                                            className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText size={16} /> Dokumen
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Foto KTP</label>
                                        <input 
                                            type="file" name="ktp" accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        />
                                        {isEditing && formData.ktp_path && <span className="text-xs text-green-600">File tersimpan (upload baru untuk ganti)</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Foto NPWP</label>
                                        <input 
                                            type="file" name="npwp" accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        />
                                        {isEditing && formData.npwp_path && <span className="text-xs text-green-600">File tersimpan (upload baru untuk ganti)</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    {isEditing ? 'Simpan Perubahan' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

{/* Preview Modal - Removed */}{/*
            {showPreviewModal && previewCreator && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">Detail Pencipta</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Nama Lengkap</label>
                                    <div className="font-medium text-slate-800">{previewCreator.name}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">NIK</label>
                                    <div className="font-medium text-slate-800">{previewCreator.nik}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Tempat, Tanggal Lahir</label>
                                    <div className="font-medium text-slate-800">
                                        {previewCreator.birth_place}, {new Date(previewCreator.birth_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Kewarganegaraan</label>
                                    <div className="font-medium text-slate-800">{previewCreator.nationality}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 block mb-1">Nomor Whatsapp</label>
                                    <div className="font-medium text-slate-800">{previewCreator.whatsapp_number || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 block mb-1">Alamat</label>
                                    <div className="font-medium text-slate-800">{previewCreator.address}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <CreditCard size={16} /> Informasi Bank
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Nama Bank</label>
                                        <div className="font-medium text-slate-800">{previewCreator.bank_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Nomor Rekening</label>
                                        <div className="font-medium text-slate-800">{previewCreator.bank_account_number}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-500 block mb-1">Atas Nama</label>
                                        <div className="font-medium text-slate-800">{previewCreator.bank_account_name}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText size={16} /> Dokumen
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">KTP</label>
                                        {previewCreator.ktp_path ? (
                                            <a href={assetUrl(previewCreator.ktp_path)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                                Lihat KTP
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400">Tidak ada file</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">NPWP</label>
                                        {previewCreator.npwp_path ? (
                                            <a href={assetUrl(previewCreator.npwp_path)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                                Lihat NPWP
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400">Tidak ada file</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t mt-4">
                                <button 
                                    onClick={() => setShowPreviewModal(false)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            */}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Berhasil!</h3>
                        <p className="text-slate-600 mb-6">{modalMessage}</p>
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Gagal!</h3>
                        <p className="text-slate-600 mb-6">{modalMessage}</p>
                        <button 
                            onClick={() => setShowErrorModal(false)}
                            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
                        <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
