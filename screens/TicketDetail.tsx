import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Send, ArrowLeft, XCircle } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';

interface TicketMessage {
    id: number;
    sender_id: number;
    sender_role: 'Admin' | 'User';
    message: string;
    created_at: string;
    sender_name: string;
}

interface Ticket {
    id: number;
    subject: string;
    status: 'Pending' | 'Replied' | 'Closed';
    created_at: string;
    user_name?: string;
    user_email?: string;
}

interface TicketDetailProps {
    token: string;
    userRole: string;
    onAuthExpired?: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ token, userRole, onAuthExpired }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchTicketDetails();
    }, [id, token]);

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const data = await api.tickets.get(token, id);
            setTicket(data.ticket);
            setMessages(data.messages);
            setError('');
        } catch (err: any) {
            console.error('Failed to fetch ticket details', err);
            if (err?.message === 'AUTH') {
                if (onAuthExpired) {
                    onAuthExpired();
                } else {
                    setError('Sesi berakhir. Mohon refresh halaman.');
                }
            } else {
                setError('Gagal memuat detail tiket.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        try {
            setSending(true);
            await api.tickets.reply(token, id, reply);
            setReply('');
            fetchTicketDetails(); // Refresh messages
        } catch (err: any) {
            console.error('Failed to reply', err);
            setAlertState({
                isOpen: true,
                title: 'Gagal Membalas',
                message: 'Gagal mengirim balasan.',
                type: 'error'
            });
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm('Apakah Anda yakin ingin menutup tiket ini?')) return;
        try {
            await api.tickets.close(token, id);
            fetchTicketDetails();
        } catch (err: any) {
            console.error('Failed to close ticket', err);
            setAlertState({
                isOpen: true,
                title: 'Gagal Menutup Tiket',
                message: 'Gagal menutup tiket.',
                type: 'error'
            });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat detail tiket...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!ticket) return <div className="p-8 text-center text-gray-500">Tiket tidak ditemukan.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate('/tickets')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>#{ticket.id}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleString('id-ID')}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'Replied' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {ticket.status}
                        </span>
                    </div>
                </div>
                {userRole === 'Admin' && ticket.status !== 'Closed' && (
                    <button 
                        onClick={handleCloseTicket}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <XCircle size={20} />
                        Tutup Tiket
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-6 mb-4 space-y-6 border border-gray-200">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 italic">Belum ada pesan.</div>
                ) : (
                    messages.map((msg) => {
                        const alignRight = msg.sender_role === userRole; 

                        return (
                            <div key={msg.id} className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 mb-1 ${alignRight ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-sm font-medium text-gray-900">
                                        {msg.sender_role === 'Admin' ? 'Admin Support' : msg.sender_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(msg.created_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    alignRight 
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100' 
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {ticket.status !== 'Closed' ? (
                <form onSubmit={handleReply} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                    <input 
                        type="text"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Tulis balasan..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={sending || !reply.trim()}
                        className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send size={20} />
                    </button>
                </form>
            ) : (
                <div className="bg-gray-100 p-4 rounded-xl text-center text-gray-500 font-medium">
                    Tiket ini telah ditutup. Anda tidak dapat membalas lagi.
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

export default TicketDetail;
