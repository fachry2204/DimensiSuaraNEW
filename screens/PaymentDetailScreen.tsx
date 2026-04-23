import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Upload, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

interface PaymentInvoice {
    id: string;
    userId: string;
    userName: string;
    userType: 'PERSONAL' | 'COMPANY';
    period: string;
    quarter: 1 | 2 | 3 | 4;
    year: number;
    grossAmount: number;
    taxRate: number;
    additionalFee: number;
    status: 'Pending Payment' | 'Proses Payment' | 'Payment';
    proofDoc?: string | File | null;
    generatedDate: string;
    type: 'Aggregator' | 'Publishing';
}

export const PaymentDetailScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
    const [additionalFeeInput, setAdditionalFeeInput] = useState<number>(0);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [potonganRate, setPotonganRate] = useState<number>(0);

    useEffect(() => {
        const state = location.state as { invoice?: PaymentInvoice } | null;
        if (state?.invoice) {
            setInvoice(state.invoice);
            setAdditionalFeeInput(state.invoice.additionalFee);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [location.state]);

    useEffect(() => {
        if (!invoice) return;
        const token = localStorage.getItem('cms_token') || '';
        if (!token) {
            setPotonganRate(0);
            return;
        }

        let cancelled = false;
        const normalizeRate = (value: unknown) => {
            const n = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(n) || n <= 0) return 0;
            if (n > 1) return Math.min(1, n / 100);
            return Math.min(1, n);
        };

        (async () => {
            try {
                const user = await api.getUser(token, invoice.userId);
                const raw =
                    invoice.type === 'Aggregator'
                        ? (user as any)?.aggregator_percentage ?? (user as any)?.aggregatorPercentage
                        : (user as any)?.publishing_percentage ?? (user as any)?.publishingPercentage;
                const rate = normalizeRate(raw);
                if (!cancelled) setPotonganRate(rate);
            } catch {
                if (!cancelled) setPotonganRate(0);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [invoice?.userId, invoice?.type]);

    const handleStatusUpdate = (newStatus: PaymentInvoice['status']) => {
        if (!invoice) return;
        setInvoice({ ...invoice, status: newStatus });
    };

    const handleSaveDetail = () => {
        navigate(-1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const splitTotal = (total: number, parts: number) => {
        const base = Math.floor(total / parts);
        const remainder = total - base * parts;
        return Array.from({ length: parts }, (_, idx) => base + (idx < remainder ? 1 : 0));
    };

    const getQuarterMonths = (quarter: 1 | 2 | 3 | 4) => {
        const months = [
            'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember',
        ];
        const startIndex = (quarter - 1) * 3;
        return months.slice(startIndex, startIndex + 3);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!invoice) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-slate-800">Invoice not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go Back</button>
            </div>
        );
    }

    const months = getQuarterMonths(invoice.quarter);
    const penghasilanParts = splitTotal(invoice.grossAmount, 3);
    const totalSharePotongan = Math.round(invoice.grossAmount * potonganRate);
    const sharePotonganParts = splitTotal(totalSharePotongan, 3);
    const quarterRows = months.map((bulan, idx) => {
        const penghasilan = penghasilanParts[idx] ?? 0;
        const sharePotongan = sharePotonganParts[idx] ?? 0;
        const pendapatanClient = penghasilan - sharePotongan;
        return { bulan, penghasilan, sharePotongan, pendapatanClient };
    });
    const totalPenghasilan = quarterRows.reduce((a, r) => a + r.penghasilan, 0);
    const totalPotongan = quarterRows.reduce((a, r) => a + r.sharePotongan, 0);
    const totalPendapatanClient = quarterRows.reduce((a, r) => a + r.pendapatanClient, 0);
    const potonganPajak = Math.round(totalPendapatanClient * invoice.taxRate);
    const totalBersih = (totalPendapatanClient - potonganPajak) - additionalFeeInput;
    const potonganPercentLabel = `${(potonganRate * 100).toFixed(2).replace(/\.00$/, '')}%`;

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in min-h-screen pb-20">
            <button 
                onClick={() => navigate(-1)} 
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Kembali ke Daftar Pembayaran</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl text-slate-800">Invoice Detail</h1>
                            <p className="text-sm text-slate-500">{invoice.id} • {invoice.generatedDate}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                        invoice.status === 'Payment' 
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : invoice.status === 'Proses Payment'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                        {invoice.status}
                    </div>
                </div>
                
                <div className="p-8 space-y-8">
                    {/* Status Stepper */}
                    <div className="relative px-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between relative z-10">
                            {[
                                { status: 'Pending Payment', label: 'Pending' }, 
                                { status: 'Proses Payment', label: 'Proses' }, 
                                { status: 'Payment', label: 'Selesai' }
                            ].map((step, idx) => {
                                const isPast = ['Pending Payment', 'Proses Payment', 'Payment'].indexOf(invoice.status) >= idx;
                                
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 px-2 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors border-4 ${
                                            isPast 
                                                ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-200' 
                                                : 'bg-white border-slate-200 text-slate-400'
                                        }`}>
                                            {isPast ? <CheckCircle size={18} /> : idx + 1}
                                        </div>
                                        <span className={`text-sm font-medium ${isPast ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 hidden md:block" style={{ top: '40%' }}></div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-bold text-slate-800">Perhitungan Quarter</div>
                                <div className="text-[11px] text-slate-500">
                                    Q{invoice.quarter} {invoice.year} • Total Bersih: {formatCurrency(totalBersih)}
                                </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600">
                                {invoice.type}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead className="bg-white">
                                    <tr className="text-slate-500">
                                        <th className="text-left font-semibold px-4 py-3 border-b border-slate-200 whitespace-nowrap">Quarter</th>
                                        <th className="text-left font-semibold px-4 py-3 border-b border-slate-200 whitespace-nowrap">Bulan</th>
                                        <th className="text-right font-semibold px-4 py-3 border-b border-slate-200 whitespace-nowrap">Penghasilan</th>
                                        <th className="text-right font-semibold px-4 py-3 border-b border-slate-200 whitespace-nowrap">Share Potongan ({potonganPercentLabel})</th>
                                        <th className="text-right font-semibold px-4 py-3 border-b border-slate-200 whitespace-nowrap">Pendapatan Client</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {quarterRows.map((r) => (
                                        <tr key={r.bulan} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">Q{invoice.quarter}</td>
                                            <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{r.bulan}</td>
                                            <td className="px-4 py-3 text-right text-slate-800 whitespace-nowrap">{formatCurrency(r.penghasilan)}</td>
                                            <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">- {formatCurrency(r.sharePotongan)}</td>
                                            <td className="px-4 py-3 text-right text-emerald-700 font-bold whitespace-nowrap">{formatCurrency(r.pendapatanClient)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/70 border-t border-slate-200">
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-slate-700" colSpan={2}>Total</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(totalPenghasilan)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-700 whitespace-nowrap">- {formatCurrency(totalPotongan)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(totalPendapatanClient)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Informasi User</h4>
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Nama:</span>
                                    <span className="font-medium text-slate-800">{invoice.userName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tipe Akun:</span>
                                    <span className={`font-medium ${invoice.userType === 'COMPANY' ? 'text-purple-600' : 'text-blue-600'}`}>
                                        {invoice.userType}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Periode:</span>
                                    <span className="font-medium text-slate-800">{invoice.period}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pajak ({invoice.taxRate * 100}%):</span>
                                    <span className="font-medium text-slate-800">
                                        {invoice.userType === 'COMPANY' ? 'Perusahaan (2%)' : 'Personal (2.5%)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Rincian Keuangan</h4>
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Penghasilan:</span>
                                    <span className="font-medium text-slate-800">{formatCurrency(invoice.grossAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Share Potongan ({potonganPercentLabel}):</span>
                                    <span className="font-medium text-red-500">- {formatCurrency(totalSharePotongan)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-slate-200">
                                    <span className="text-slate-500">Pendapatan Kotor:</span>
                                    <span className="font-medium text-slate-800">{formatCurrency(totalPendapatanClient)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Potongan Pajak:</span>
                                    <span className="font-medium text-red-500">- {formatCurrency(potonganPajak)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-slate-200">
                                    <span className="text-slate-500">Biaya Tambahan:</span>
                                    <input 
                                        type="number" 
                                        className="w-32 px-3 py-1.5 text-right text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={additionalFeeInput}
                                        onChange={(e) => setAdditionalFeeInput(Number(e.target.value))}
                                    />
                                </div>
                                <div className="pt-3 mt-2 border-t border-slate-200 flex justify-between font-bold items-end">
                                    <span className="text-slate-800 text-lg">Total Bersih:</span>
                                    <span className="text-emerald-600 text-2xl">
                                        {formatCurrency(totalBersih)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions based on Status */}
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">Update Status Pembayaran</h4>
                        
                        {invoice.status === 'Pending Payment' && (
                            <button 
                                onClick={() => handleStatusUpdate('Proses Payment')}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Proses Pembayaran
                            </button>
                        )}

                        {invoice.status === 'Proses Payment' && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => e.target.files && setProofFile(e.target.files[0])}
                                    />
                                    <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-indigo-600 transition-colors">
                                        <div className="p-4 bg-slate-100 rounded-full group-hover:bg-indigo-50 transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <span className="text-base font-medium">
                                            {proofFile ? proofFile.name : 'Upload Bukti Transfer (Drag & Drop)'}
                                        </span>
                                        <span className="text-xs opacity-70">Format: PDF, JPG, PNG (Max 5MB)</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleStatusUpdate('Payment')}
                                    disabled={!proofFile && !invoice.proofDoc}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    Selesaikan Pembayaran
                                </button>
                            </div>
                        )}

                        {invoice.status === 'Payment' && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4 text-green-700">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Pembayaran Selesai</p>
                                    <p className="text-sm opacity-80 mt-1">Bukti transfer telah diupload dan verifikasi selesai.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSaveDetail}
                        className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};
