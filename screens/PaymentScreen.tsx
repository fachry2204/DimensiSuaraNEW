import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Download, Upload, CheckCircle, Clock, AlertCircle, Plus, Search, Filter, X, ChevronRight } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';
import { useBranding } from '../contexts/BrandingContext';

// Mock types for Payment
interface PaymentInvoice {
    id: string;
    userId: string;
    userName: string;
    userType: 'PERSONAL' | 'COMPANY';
    period: string; // e.g., "Q1 2024"
    quarter: 1 | 2 | 3 | 4;
    year: number;
    grossAmount: number;
    taxRate: number; // 0.025 or 0.02
    additionalFee: number;
    status: 'Pending Payment' | 'Proses Payment' | 'Payment';
    proofDoc?: string | File | null;
    generatedDate: string;
    type: 'Aggregator' | 'Publishing';
}

interface Props {
    token: string | null;
    defaultTab?: 'aggregator' | 'publishing';
}

export const PaymentScreen: React.FC<Props> = ({ token, defaultTab = 'aggregator' }) => {
    const navigate = useNavigate();
    const { getButtonColor } = useBranding();
    const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>(defaultTab);

    // Update activeTab if defaultTab changes
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);
    const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Generate Modal State
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        year: new Date().getFullYear(),
        quarter: 1
    });

    // Mock Data Initialization
    useEffect(() => {
        // Simulate fetching data
        setIsLoading(true);
        setTimeout(() => {
            const mockInvoices: PaymentInvoice[] = [
                {
                    id: 'INV-2024-001',
                    userId: '1',
                    userName: 'John Doe',
                    userType: 'PERSONAL',
                    period: 'Q1 2024',
                    quarter: 1,
                    year: 2024,
                    grossAmount: 5000000,
                    taxRate: 0.025,
                    additionalFee: 0,
                    status: 'Pending Payment',
                    generatedDate: '2024-04-01',
                    type: 'Aggregator'
                },
                {
                    id: 'INV-2024-002',
                    userId: '2',
                    userName: 'Music Corp',
                    userType: 'COMPANY',
                    period: 'Q1 2024',
                    quarter: 1,
                    year: 2024,
                    grossAmount: 15000000,
                    taxRate: 0.02,
                    additionalFee: 50000,
                    status: 'Proses Payment',
                    generatedDate: '2024-04-01',
                    type: 'Publishing'
                }
            ];
            setInvoices(mockInvoices);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleGenerate = () => {
        // Logic to generate invoices would go here
        // For now, we mock adding a new invoice
        const newInvoice: PaymentInvoice = {
            id: `INV-${generateForm.year}-${Math.floor(Math.random() * 1000)}`,
            userId: '3',
            userName: 'New Artist',
            userType: 'PERSONAL',
            period: `Q${generateForm.quarter} ${generateForm.year}`,
            quarter: generateForm.quarter as 1|2|3|4,
            year: generateForm.year,
            grossAmount: Math.floor(Math.random() * 10000000),
            taxRate: 0.025,
            additionalFee: 0,
            status: 'Pending Payment',
            generatedDate: new Date().toISOString().split('T')[0],
            type: activeTab === 'aggregator' ? 'Aggregator' : 'Publishing'
        };
        
        setInvoices([newInvoice, ...invoices]);
        setShowGenerateModal(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const calculateNet = (inv: PaymentInvoice, currentFee: number) => {
        const tax = inv.grossAmount * inv.taxRate;
        return inv.grossAmount - tax - currentFee;
    };

    const filteredInvoices = invoices.filter(inv => 
        (activeTab === 'aggregator' ? inv.type === 'Aggregator' : inv.type === 'Publishing')
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Menu Pembayaran</h1>
                    <p className="text-slate-500">Kelola pembayaran royalti berdasarkan kuartal</p>
                </div>
                <button 
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg transition-all font-medium hover:opacity-90"
                    style={{ backgroundColor: getButtonColor() }}
                >
                    <Plus size={18} />
                    Generate Pembayaran
                </button>
            </div>

            {/* Tabs - REMOVED */}
            {/* <div className="flex items-center gap-4">
                <button 
                    onClick={() => setActiveTab('aggregator')}
                    className={`px-4 py-2 rounded-lg border font-bold transition-colors ${activeTab === 'aggregator' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                    Aggregator
                </button>
                <button 
                    onClick={() => setActiveTab('publishing')}
                    className={`px-4 py-2 rounded-lg border font-bold transition-colors ${activeTab === 'publishing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                    Publishing
                </button>
            </div> */}

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Invoice ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Periode</th>
                                <th className="px-6 py-4 text-right">Total (Net)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Belum ada data pembayaran.</td></tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-600">{inv.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{inv.userName}</div>
                                            <div className="text-xs text-slate-500">{inv.userType}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                {inv.period}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            {formatCurrency(calculateNet(inv, inv.additionalFee))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                inv.status === 'Payment' 
                                                    ? 'bg-green-50 text-green-600 border-green-100'
                                                    : inv.status === 'Proses Payment'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => {
                                                    navigate(`/reports/payments/detail/${inv.id}`, { state: { invoice: inv } });
                                                }}
                                                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-bold shadow-sm transition-all"
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">Generate Pembayaran</h3>
                            <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                                <select 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={generateForm.year}
                                    onChange={(e) => setGenerateForm({...generateForm, year: Number(e.target.value)})}
                                >
                                    {[2023, 2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quarter</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setGenerateForm({...generateForm, quarter: q})}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                generateForm.quarter === q 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            Q{q}
                                            <span className="block text-[10px] font-normal opacity-70 mt-1">
                                                {q === 1 ? 'Jan - Mar' : q === 2 ? 'Apr - Jun' : q === 3 ? 'Jul - Sep' : 'Oct - Dec'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={handleGenerate}
                                    className="w-full py-3 text-white rounded-xl font-bold transition-colors shadow-lg hover:opacity-90"
                                    style={{ backgroundColor: getButtonColor() }}
                                >
                                    Generate Laporan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};
