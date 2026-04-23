import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Plus, MessageSquare, Search } from 'lucide-react';
import { ReleaseData } from '../types';
import { AlertModal } from '../components/AlertModal';

interface Ticket {
    id: number;
    subject: string;
    status: 'Pending' | 'Replied' | 'Closed';
    created_at: string;
    updated_at: string;
    user_name?: string;
    user_email?: string;
}

interface TicketsProps {
    token: string;
    userRole: string;
}

const Tickets: React.FC<TicketsProps> = ({ token, userRole }) => {
    const navigate = useNavigate();
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [category, setCategory] = useState('Lainnya');
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [youtubeLink, setYoutubeLink] = useState('');
    const [selectedReleaseId, setSelectedReleaseId] = useState('');
    
    // Data State
    const [releases, setReleases] = useState<ReleaseData[]>([]);
    const [loadingReleases, setLoadingReleases] = useState(false);
    
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        'Whitelist Youtube / Youtube Claim',
        'Rilisan',
        'Takedown Rilisan',
        'Publishing',
        'Lainnya'
    ];

    useEffect(() => {
        fetchTickets();
    }, [token]);

    useEffect(() => {
        if ((category === 'Rilisan' || category === 'Takedown Rilisan') && releases.length === 0) {
            fetchReleases();
        }
    }, [category]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await api.tickets.list(token);
            setTickets(data);
            setError('');
        } catch (err: any) {
            console.error('Failed to fetch tickets', err);
            if (err?.message === 'AUTH') {
                // Handle auth expiration if needed, or let parent handle it
                setError('Sesi berakhir. Mohon refresh halaman.');
            } else {
                setError('Gagal memuat tiket.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchReleases = async () => {
        try {
            setLoadingReleases(true);
            const data = await api.getReleases(token);
            // Filter releases based on requirements if needed
            // For now, we fetch all, filtering can be done in render
            setReleases(data);
        } catch (err) {
            console.error('Failed to fetch releases', err);
        } finally {
            setLoadingReleases(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim() || !newMessage.trim()) return;

        let finalMessage = `[Kategori: ${category}]\n`;

        if (category === 'Whitelist Youtube / Youtube Claim') {
            finalMessage += `[Youtube Link: ${youtubeLink}]\n`;
        } else if ((category === 'Rilisan' || category === 'Takedown Rilisan') && selectedReleaseId) {
            const release = releases.find(r => r.id === selectedReleaseId);
            if (release) {
                const isrcs = release.tracks?.map(t => t.isrc).join(', ') || '-';
                finalMessage += `[Release Info]\nJudul: ${release.title}\nUPC: ${release.upc || '-'}\nISRC: ${isrcs}\n`;
            }
        }

        finalMessage += `\n${newMessage}`;

        try {
            setSubmitting(true);
            await api.tickets.create(token, {
                subject: newSubject,
                message: finalMessage
            });
            setIsCreating(false);
            // Reset form
            setNewSubject('');
            setNewMessage('');
            setCategory('Lainnya');
            setYoutubeLink('');
            setSelectedReleaseId('');
            
            fetchTickets();
        } catch (err: any) {
            console.error('Failed to create ticket', err);
            setAlertState({
                isOpen: true,
                title: 'Gagal Membuat Tiket',
                message: 'Gagal membuat tiket: ' + (err.message || 'Server error'),
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTickets = tickets.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.user_name && t.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Replied': return 'bg-blue-100 text-blue-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg text-gray-900">Tiket Bantuan</h1>
                    <p className="text-xs text-gray-500">
                        {userRole === 'Admin' 
                            ? 'Kelola tiket bantuan dari pengguna' 
                            : 'Kirim tiket bantuan jika Anda mengalami kendala'}
                    </p>
                </div>
                {userRole !== 'Admin' && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-xs"
                    >
                        <Plus size={16} />
                        Buat Tiket Baru
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-sm mb-4">Buat Tiket Baru</h2>
                    <form onSubmit={handleCreateTicket}>
                        <div className="mb-4">
                            <label className="block text-xs text-gray-700 mb-1">Subjek</label>
                            <input 
                                type="text" 
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                                placeholder="Contoh: Kendala Upload Lagu"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-gray-700 mb-1">Kategori</label>
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setYoutubeLink('');
                                    setSelectedReleaseId('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {category === 'Whitelist Youtube / Youtube Claim' && (
                            <div className="mb-4 animate-fade-in">
                                <label className="block text-xs text-gray-700 mb-1">Link Youtube (yang mau di-whitelist)</label>
                                <input 
                                    type="url" 
                                    value={youtubeLink}
                                    onChange={(e) => setYoutubeLink(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                                    placeholder="https://youtube.com/..."
                                    required
                                />
                            </div>
                        )}

                        {(category === 'Rilisan' || category === 'Takedown Rilisan') && (
                            <div className="mb-4 animate-fade-in">
                                <label className="block text-xs text-gray-700 mb-1">
                                    {category === 'Takedown Rilisan' ? 'Pilih Rilisan (Live Only)' : 'Pilih Rilisan'}
                                </label>
                                {loadingReleases ? (
                                    <div className="text-xs text-gray-500">Memuat rilisan...</div>
                                ) : (
                                    <select
                                        value={selectedReleaseId}
                                        onChange={(e) => setSelectedReleaseId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                                        required
                                    >
                                        <option value="">-- Pilih Rilisan --</option>
                                        {releases
                                            .filter(r => category === 'Takedown Rilisan' ? r.status === 'Live' : true)
                                            .map(r => {
                                                const label = r.status === 'Live' ? 'Released' : (r.status || 'Pending');
                                                return (
                                                  <option key={r.id} value={r.id}>
                                                    {r.title} ({r.upc || 'No UPC'}) - {label}
                                                  </option>
                                                );
                                            })}
                                    </select>
                                )}
                                {selectedReleaseId && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-[10px] text-gray-600 border border-gray-200">
                                        {(() => {
                                            const r = releases.find(rel => rel.id === selectedReleaseId);
                                            if (!r) return null;
                                            const isrcs = r.tracks?.map(t => t.isrc).join(', ') || '-';
                                            return (
                                                <div className="space-y-1">
                                                    <div><span className="font-medium">Judul:</span> {r.title}</div>
                                                    <div><span className="font-medium">UPC:</span> {r.upc || '-'}</div>
                                                    <div><span className="font-medium">ISRC:</span> {isrcs}</div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs text-gray-700 mb-1">Pesan</label>
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                                rows={4}
                                placeholder="Jelaskan kendala Anda secara detail..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-xs"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-xs"
                            >
                                {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text"
                            placeholder="Cari tiket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat tiket...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada tiket.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs">
                            <tr>
                                <th className="px-6 py-3 font-normal">Subjek</th>
                                {userRole === 'Admin' && <th className="px-6 py-3 font-normal">Pengguna</th>}
                                <th className="px-6 py-3 font-normal">Status</th>
                                <th className="px-6 py-3 font-normal">Terakhir Update</th>
                                <th className="px-6 py-3 font-normal">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 text-xs">{ticket.subject}</div>
                                        <div className="text-[10px] text-gray-500">ID: #{ticket.id}</div>
                                    </td>
                                    {userRole === 'Admin' && (
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 text-xs">{ticket.user_name || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-500">{ticket.user_email}</div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {new Date(ticket.updated_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                                            className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1"
                                        >
                                            <MessageSquare size={16} />
                                            Lihat Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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

export default Tickets;
