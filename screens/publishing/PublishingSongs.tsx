import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Edit2, Trash2, FileText, Music, User, Globe, Clock, Tag, FileAudio, Eye, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';
import { api } from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';
import { TRACK_GENRES, COUNTRIES_WITH_DIAL_CODES } from '../../constants';

import { AlertModal } from '../../components/AlertModal';

interface Writer {
    name: string;
    role: string;
    share_percent: number;
}

interface Song {
    id: number;
    song_id: string | null;
    title: string;
    other_title: string;
    authorized_rights: string;
    performer: string;
    duration: string;
    genre: string;
    language: string;
    region: string;
    iswc: string;
    isrc: string;
    note: string;
    status: 'pending' | 'review' | 'accepted' | 'rejected';
    rejection_reason?: string;
    lyrics_file: string | null;
    writers: Writer[] | string; // API might return JSON string or parsed object
    user_email?: string;
}

interface Props {
  token: string | null;
  userRole?: string;
}

export const PublishingSongs: React.FC<Props> = ({ token, userRole }) => {
    const { getButtonColor } = useBranding();
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    // Edit & Preview State
    const [isEditing, setIsEditing] = useState(false);
    const [currentSongId, setCurrentSongId] = useState<number | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewSong, setPreviewSong] = useState<Song | null>(null);
    
    // Status Update State
    const [statusUpdate, setStatusUpdate] = useState<string>('pending');
    const [songIdUpdate, setSongIdUpdate] = useState<string>('');
    const [rejectionReasonUpdate, setRejectionReasonUpdate] = useState<string>('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [modalMessage, setModalMessage] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Form State
    const [formData, setFormData] = useState({
        song_id: '',
        title: '',
        other_title: '',
        authorized_rights: '100', // Default
        performer: '',
        duration: '',
        genre: '',
        language: 'Indonesia',
        region: '',
        iswc: '',
        isrc: '',
        note: ''
    });
    
    const [writers, setWriters] = useState<Writer[]>([
        { name: '', role: 'Author / Penulis Lirik', share_percent: 100 }
    ]);
    const [allWriters, setAllWriters] = useState<any[]>([]);
    const [activeWriterIndex, setActiveWriterIndex] = useState<number | null>(null);
    
    const [lyricsFile, setLyricsFile] = useState<File | null>(null);

    useEffect(() => {
        if (token) {
            fetchSongs();
            fetchWriters();
        }
    }, [token]);

    const fetchWriters = async () => {
        if (!token) return;
        try {
            const data = await api.publishing.getCreators(token);
            setAllWriters(data);
        } catch (error) {
            console.error('Failed to fetch writers', error);
        }
    };

    const fetchSongs = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await api.publishing.getSongs(token);
            // Parse writers if it comes as a string
            const parsedData = data.map((song: any) => {
                let parsedWriters = song.writers;
                if (typeof song.writers === 'string') {
                    try {
                        parsedWriters = JSON.parse(song.writers);
                    } catch (e) {
                        console.error('Failed to parse writers for song', song.id, e);
                        parsedWriters = [];
                    }
                }
                return {
                    ...song,
                    writers: parsedWriters
                };
            });
            setSongs(parsedData);
        } catch (error) {
            console.error('Failed to fetch songs', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 4) value = value.slice(0, 4); // Limit to 4 digits

        if (value.length >= 2) {
            const minutes = value.slice(0, 2);
            const seconds = value.slice(2);
            // If deleting and we are at the colon, remove it
            if (formData.duration.length > value.length && formData.duration.endsWith(':')) {
                // Logic handled naturally by removing char from value
            }
             value = `${minutes}:${seconds}`;
        }
        
        // Simple MM:SS format enforcement
        setFormData({ ...formData, duration: value });
    };

    const handleWriterChange = (index: number, field: keyof Writer, value: string | number) => {
        const newWriters = [...writers];
        newWriters[index] = { ...newWriters[index], [field]: value };
        setWriters(newWriters);
    };

    const addWriter = () => {
        setWriters([...writers, { name: '', role: 'Composer', share_percent: 0 }]);
    };

    const removeWriter = (index: number) => {
        if (writers.length > 1) {
            const newWriters = writers.filter((_, i) => i !== index);
            setWriters(newWriters);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLyricsFile(e.target.files[0]);
        }
    };

    const handleEdit = (song: Song) => {
        setIsEditing(true);
        setCurrentSongId(song.id);
        
        setFormData({
            song_id: song.song_id || '',
            title: song.title || '',
            other_title: song.other_title || '',
            authorized_rights: song.authorized_rights || '100',
            performer: song.performer || '',
            duration: song.duration || '',
            genre: song.genre || '',
            language: song.language || 'Indonesia',
            region: song.region || 'Indonesia',
            iswc: song.iswc || '',
            isrc: song.isrc || '',
            note: song.note || ''
        });

        if (Array.isArray(song.writers)) {
            setWriters(song.writers.map(w => ({
                name: w.name,
                role: w.role,
                share_percent: w.share_percent
            })));
        } else {
            setWriters([{ name: '', role: 'Composer', share_percent: 100 }]);
        }

        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await api.publishing.deleteSong(token, deleteId);
            setModalMessage('Lagu berhasil dihapus');
            setShowDeleteModal(false);
            setDeleteId(null);
            fetchSongs();
            setShowSuccessModal(true);
        } catch (error: any) {
            setModalMessage('Gagal menghapus lagu: ' + error.message);
            setShowDeleteModal(false);
            setDeleteId(null);
            setShowErrorModal(true);
        }
    };

    const handlePreview = (song: Song) => {
        setPreviewSong(song);
        setStatusUpdate(song.status);
        setSongIdUpdate(song.song_id || '');
        setRejectionReasonUpdate(song.rejection_reason || '');
        setShowPreviewModal(true);
    };

    const handleStatusUpdate = async () => {
        if (!previewSong) return;

        // Validation
        if (statusUpdate === 'accepted' && !songIdUpdate.trim()) {
            setModalMessage('Song ID wajib diisi jika status Diterima');
            setShowErrorModal(true);
            return;
        }
        if (statusUpdate === 'rejected' && !rejectionReasonUpdate.trim()) {
            setModalMessage('Alasan penolakan wajib diisi jika status Ditolak');
            setShowErrorModal(true);
            return;
        }

        try {
            await api.publishing.updateSongStatus(
                token,
                previewSong.id.toString(), 
                statusUpdate, 
                songIdUpdate,
                statusUpdate === 'rejected' ? rejectionReasonUpdate : undefined
            );
            
            // Refresh list and close modal
            fetchSongs();
            setShowPreviewModal(false);
            setModalMessage('Status berhasil diperbarui');
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Failed to update status', error);
            setModalMessage('Gagal memperbarui status: ' + (error.message || 'Unknown error'));
            setShowErrorModal(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.title) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Judul Lagu wajib diisi',
                type: 'warning'
            });
            return;
        }

        if (!formData.performer) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Artis / Performer wajib diisi',
                type: 'warning'
            });
            return;
        }

        if (!formData.genre) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Genre wajib diisi',
                type: 'warning'
            });
            return;
        }

        if (!formData.duration || formData.duration.length < 5) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Durasi wajib diisi dengan format MM:SS',
                type: 'warning'
            });
            return;
        }

        if (!formData.region) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Region / Negara wajib diisi',
                type: 'warning'
            });
            return;
        }

        // Validate writers name
        if (writers.some(w => !w.name || !w.name.trim())) {
             setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Nama Penulis wajib diisi untuk semua penulis',
                type: 'warning'
            });
            return;
        }
        
        // Validate writers share
        const totalShare = writers.reduce((sum, w) => sum + Number(w.share_percent), 0);
        if (Math.abs(totalShare - 100) > 0.1) { // Floating point tolerance
            setAlertState({
                isOpen: true,
                title: 'Validasi Share',
                message: `Total share writer harus 100%. Saat ini: ${totalShare}%`,
                type: 'warning'
            });
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
        
        // Append writers as JSON string
        data.append('writers', JSON.stringify(writers));
        
        if (lyricsFile) {
            data.append('lyrics', lyricsFile);
        }

        try {
            if (isEditing && currentSongId) {
                await api.publishing.updateSong(token, currentSongId, data);
                setModalMessage('Lagu berhasil diperbarui');
            } else {
                await api.publishing.createSong(token, data);
                setModalMessage('Lagu berhasil ditambahkan');
            }
            setShowModal(false);
            fetchSongs();
            resetForm();
            setShowSuccessModal(true);
        } catch (error: any) {
            setModalMessage(`Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} lagu: ` + error.message);
            setShowErrorModal(true);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentSongId(null);
        setFormData({
            song_id: '', title: '', other_title: '', authorized_rights: '100', performer: '',
            duration: '', genre: '', language: 'Indonesia', region: '',
            iswc: '', isrc: '', note: ''
        });
        setWriters([{ name: '', role: 'Composer', share_percent: 100 }]);
        setLyricsFile(null);
    };

    const filteredSongs = songs.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.performer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSongs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Data Lagu (Songs)</h1>
                    <p className="text-slate-500 text-sm">Kelola katalog lagu dan pembagian royalti</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold hover:opacity-90"
                    style={{ backgroundColor: getButtonColor() }}
                >
                    <Plus size={20} />
                    Tambah Lagu
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari judul atau artis..." 
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
                                <th className="px-6 py-3 font-bold">Song ID</th>
                                <th className="px-6 py-3 font-bold">Judul Lagu</th>
                                <th className="px-6 py-3 font-bold">Artis & Genre</th>
                                <th className="px-6 py-3 font-bold">Writers (Share)</th>
                                <th className="px-6 py-3 text-center font-bold">Status</th>
                                <th className="px-6 py-3 text-center font-bold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Tidak ada data lagu</td></tr>
                            ) : (
                                currentItems.map((song) => (
                                    <tr key={song.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-indigo-600 font-bold">{song.song_id || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-bold">{song.title}</div>
                                            {song.other_title && <div className="text-xs text-slate-500 font-bold">Alt: {song.other_title}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-900 font-bold">
                                                <User size={14} className="text-slate-400" />
                                                {song.performer || '-'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-bold">
                                                <Tag size={12} /> {song.genre || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {Array.isArray(song.writers) && song.writers.map((w, idx) => (
                                                    <div key={idx} className="text-xs bg-slate-100 px-2 py-1 rounded flex justify-between w-full max-w-[200px] font-bold">
                                                        <span className="truncate mr-2 text-slate-700 font-bold">{w.name}</span>
                                                        <span className="text-slate-500 font-bold">{w.share_percent}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                song.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                song.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                song.status === 'review' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {song.status === 'accepted' ? 'Approved' : 
                                                 song.status === 'rejected' ? 'Rejected' : 
                                                 song.status === 'review' ? 'Review' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handlePreview(song)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Preview"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(song)}
                                                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(song.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">Show</span>
                        <select 
                            className="border rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm font-bold text-slate-600">entries</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1 border rounded text-sm font-bold bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-bold text-slate-600 min-w-[80px] text-center">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-3 py-1 border rounded text-sm font-bold bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Lagu' : 'Tambah Lagu Baru'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
                            {/* General Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <Music size={16} /> Informasi Utama
                                    </h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Judul Lagu</label>
                                    <input 
                                        type="text" name="title" required
                                        value={formData.title} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Song ID</label>
                                    <input 
                                        type="text" name="song_id"
                                        value={formData.song_id} onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${userRole !== 'Admin' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                        placeholder="Song ID"
                                        disabled={userRole !== 'Admin'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Judul Alternatif</label>
                                    <input 
                                        type="text" name="other_title"
                                        value={formData.other_title} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Artis / Performer</label>
                                    <input 
                                        type="text" name="performer" required
                                        value={formData.performer} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Genre <span className="text-red-500">*</span></label>
                                    <select 
                                        name="genre" required
                                        value={formData.genre} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Pilih Genre</option>
                                        {TRACK_GENRES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Durasi (MM:SS) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" name="duration" placeholder="MM:SS" required
                                        value={formData.duration} onChange={handleDurationChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        maxLength={5}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Bahasa</label>
                                    <select 
                                        name="language"
                                        value={formData.language} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Pilih Bahasa</option>
                                        {COUNTRIES_WITH_DIAL_CODES.map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Region / Negara <span className="text-red-500">*</span></label>
                                    <select 
                                        name="region" required
                                        value={formData.region} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Pilih Negara</option>
                                        {COUNTRIES_WITH_DIAL_CODES.map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Technical Codes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <Tag size={16} /> Kode & Identifikasi
                                    </h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ISRC</label>
                                    <input 
                                        type="text" name="isrc"
                                        value={formData.isrc} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ISWC</label>
                                    <input 
                                        type="text" name="iswc"
                                        value={formData.iswc} onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileAudio size={16} /> Upload Lirik / Dokumen
                                </h3>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        name="lyrics"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".pdf,.doc,.docx,.txt"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <FileText size={32} />
                                        <span className="text-sm font-medium">
                                            {lyricsFile ? lyricsFile.name : 'Klik untuk upload lirik (PDF/DOC)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Writers Section */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <User size={16} /> Penulis Lagu (Songwriters)
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={addWriter}
                                        className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Tambah Penulis
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {writers.map((writer, index) => (
                                        <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg relative">
                                            <div className="flex-1 relative">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penulis <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" required
                                                    value={writer.name}
                                                    onChange={(e) => handleWriterChange(index, 'name', e.target.value)}
                                                    onFocus={() => setActiveWriterIndex(index)}
                                                    onBlur={() => setTimeout(() => setActiveWriterIndex(null), 200)}
                                                    className="w-full px-3 py-2 border rounded text-sm"
                                                    placeholder="Cari atau ketik nama penulis"
                                                />
                                                {activeWriterIndex === index && (
                                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 left-0 top-full">
                                                        {allWriters
                                                            .filter(w => w.name.toLowerCase().includes(writer.name.toLowerCase()))
                                                            .map((w) => (
                                                                <div 
                                                                    key={w.id} 
                                                                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm border-b border-slate-50 last:border-0"
                                                                    onClick={() => {
                                                                        handleWriterChange(index, 'name', w.name);
                                                                        // If we want to auto-fill other info, we can do it here
                                                                    }}
                                                                >
                                                                    <div className="font-medium text-slate-800">{w.name}</div>
                                                                    {w.nik && <div className="text-xs text-slate-500">NIK: {w.nik}</div>}
                                                                </div>
                                                            ))}
                                                        {allWriters.filter(w => w.name.toLowerCase().includes(writer.name.toLowerCase())).length === 0 && (
                                                            <div className="px-3 py-2 text-sm text-slate-500 italic">
                                                                Tekan enter untuk menggunakan nama baru
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-1/4">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Peran <span className="text-red-500">*</span></label>
                                                <select 
                                                    value={writer.role}
                                                    onChange={(e) => handleWriterChange(index, 'role', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded text-sm"
                                                >
                                                    <option value="Composer">Composer</option>
                                                    <option value="Composer & Lyrics">Composer & Lyrics</option>
                                                    <option value="Lyricist">Lyricist</option>
                                                    <option value="Arranger">Arranger</option>
                                                </select>
                                            </div>
                                            <div className="w-1/5">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Share (%) <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="number" required min="0" max="100"
                                                    value={writer.share_percent}
                                                    onChange={(e) => handleWriterChange(index, 'share_percent', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded text-sm"
                                                />
                                            </div>
                                            {writers.length > 1 && (
                                                <button 
                                                    type="button"
                                                    onClick={() => removeWriter(index)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Total Share Display */}
                            <div className={`flex justify-end items-center gap-2 mt-3 font-bold text-sm ${
                                Math.abs(writers.reduce((sum, w) => sum + Number(w.share_percent || 0), 0) - 100) > 0.1 
                                    ? 'text-red-600' 
                                    : 'text-green-600'
                            }`}>
                                <span className="font-bold">Total Share: {writers.reduce((sum, w) => sum + Number(w.share_percent || 0), 0)}%</span>
                                {Math.abs(writers.reduce((sum, w) => sum + Number(w.share_percent || 0), 0) - 100) > 0.1 && (
                                    <span className="text-xs text-red-500 font-bold">(Harus 100%)</span>
                                )}
                            </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {isEditing ? 'Update Lagu' : 'Simpan Lagu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewSong && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">Detail Lagu</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Judul Lagu</label>
                                    <div className="font-medium text-slate-800">{previewSong.title}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Song ID</label>
                                    <div className="font-medium text-slate-800">{previewSong.song_id || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Judul Alternatif</label>
                                    <div className="font-medium text-slate-800">{previewSong.other_title || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Artis / Performer</label>
                                    <div className="font-medium text-slate-800">{previewSong.performer}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Genre</label>
                                    <div className="font-medium text-slate-800">{previewSong.genre}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Durasi</label>
                                    <div className="font-medium text-slate-800">{previewSong.duration}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Bahasa</label>
                                    <div className="font-medium text-slate-800">{previewSong.language}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Region</label>
                                    <div className="font-medium text-slate-800">{previewSong.region}</div>
                                </div>
                                {/* <div>
                                    <label className="text-xs text-slate-500 block mb-1">Authorized Rights</label>
                                    <div className="font-medium text-slate-800">{previewSong.authorized_rights}%</div>
                                </div> */}
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">ISRC</label>
                                    <div className="font-mono text-slate-800">{previewSong.isrc || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">ISWC</label>
                                    <div className="font-mono text-slate-800">{previewSong.iswc || '-'}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">Songwriters</h3>
                                <div className="space-y-2">
                                    {Array.isArray(previewSong.writers) && previewSong.writers.map((w, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                            <span className="font-medium text-sm">{w.name}</span>
                                            <div className="flex gap-4 text-xs text-slate-500">
                                                <span>{w.role}</span>
                                                <span className="font-bold text-slate-700">{w.share_percent}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {previewSong.note && (
                                <div className="border-t pt-4">
                                    <label className="text-xs text-slate-500 block mb-1">Catatan</label>
                                    <div className="text-sm text-slate-700 bg-yellow-50 p-3 rounded">{previewSong.note}</div>
                                </div>
                            )}

                            {/* Status Management */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">Status Lagu</h3>
                                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                                    {userRole === 'Admin' ? (
                                        <>
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Ubah Status</label>
                                                <select
                                                    value={statusUpdate}
                                                    onChange={(e) => setStatusUpdate(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="review">Review</option>
                                                    <option value="accepted">Diterima (Approved)</option>
                                                    <option value="rejected">Ditolak (Rejected)</option>
                                                </select>
                                            </div>

                                            {statusUpdate === 'accepted' && (
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Song ID <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={songIdUpdate}
                                                        onChange={(e) => setSongIdUpdate(e.target.value)}
                                                        placeholder="Masukkan Song ID"
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            )}

                                            {statusUpdate === 'rejected' && (
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Alasan Penolakan <span className="text-red-500">*</span></label>
                                                    <textarea
                                                        value={rejectionReasonUpdate}
                                                        onChange={(e) => setRejectionReasonUpdate(e.target.value)}
                                                        placeholder="Masukkan alasan penolakan"
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        rows={3}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    onClick={handleStatusUpdate}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    Simpan Perubahan Status
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Status Saat Ini</label>
                                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                    previewSong.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    previewSong.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    previewSong.status === 'review' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {previewSong.status === 'accepted' ? 'Approved' : 
                                                     previewSong.status === 'rejected' ? 'Rejected' : 
                                                     previewSong.status === 'review' ? 'Review' : 'Pending'}
                                                </div>
                                            </div>
                                            
                                            {previewSong.status === 'accepted' && previewSong.song_id && (
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Song ID</label>
                                                    <div className="text-sm font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                                                        {previewSong.song_id}
                                                    </div>
                                                </div>
                                            )}

                                            {previewSong.status === 'rejected' && previewSong.rejection_reason && (
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Alasan Penolakan</label>
                                                    <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-100">
                                                        {previewSong.rejection_reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                        <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus lagu ini? Tindakan ini tidak dapat dibatalkan.</p>
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
