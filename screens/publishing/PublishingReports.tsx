import React, { useState, useEffect } from 'react';
import { ClipboardList, Upload, Filter, FileSpreadsheet, Download, Search, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';
import { AlertModal } from '../../components/AlertModal';

interface Report {
    id: number;
    song_id: number;
    custom_id: string;
    title: string;
    writer: string;
    source: string;
    gross_revenue: number;
    deduction: number;
    net_revenue: number;
    sub_pub_share: number;
    tbw_share: number;
    month: number;
    year: number;
}

interface Props {
  token: string | null;
  mode?: 'view' | 'import';
}

export const PublishingReports: React.FC<Props> = ({ token, mode = 'view' }) => {
    const { getButtonColor } = useBranding();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Filters
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [searchTerm, setSearchTerm] = useState('');

    // Upload Form
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        month: new Date().getMonth() + 1,
        year: currentYear,
        period: ''
    });
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    useEffect(() => {
        if (token) fetchReports();
    }, [selectedMonth, selectedYear, token]);

    const fetchReports = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await api.publishing.getReports(token, selectedMonth, selectedYear);
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportFile) {
            setAlertState({
                isOpen: true,
                title: 'Validasi',
                message: 'Pilih file laporan (Excel) terlebih dahulu',
                type: 'warning'
            });
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('report', reportFile);
        data.append('month', String(uploadForm.month));
        data.append('year', String(uploadForm.year));
        data.append('period', uploadForm.period);

        try {
            const res = await api.publishing.uploadReport(token, data);
            setAlertState({
                isOpen: true,
                title: 'Sukses',
                message: `Upload berhasil! ${res.inserted} data dimasukkan.`,
                type: 'success'
            });
            setShowUploadModal(false);
            setReportFile(null);
            fetchReports(); // Refresh data
        } catch (error: any) {
            setAlertState({
                isOpen: true,
                title: 'Gagal Upload',
                message: 'Gagal upload: ' + error.message,
                type: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const filteredReports = reports.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.source.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = filteredReports.reduce((sum, r) => sum + Number(r.sub_pub_share), 0);

    return (
        <div className="p-8 animate-fade-in">
            {mode === 'view' ? (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Laporan Publishing</h1>
                                <p className="text-slate-500 text-xs">Kelola dan upload laporan royalti bulanan</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm hover:opacity-90"
                            style={{ backgroundColor: getButtonColor() }}
                        >
                            <Upload size={20} />
                            Upload Laporan
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Filters & Search */}
                        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-lg shadow-sm">
                                    <Filter size={16} className="text-slate-400" />
                                    <select 
                                        value={selectedMonth} 
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="bg-transparent outline-none text-xs font-medium text-slate-700 cursor-pointer"
                                    >
                                        {months.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-transparent outline-none text-xs font-medium text-slate-700 cursor-pointer border-l pl-2 ml-1"
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                
                                <div className="text-xs font-medium text-slate-600">
                                    Total Revenue: <span className="text-emerald-600 font-bold">{formatCurrency(totalRevenue)}</span>
                                </div>
                            </div>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Cari judul atau sumber..." 
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[10px] text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2">Judul Lagu</th>
                                        <th className="px-4 py-2">Sumber (Source)</th>
                                        <th className="px-4 py-2 text-right">Gross Revenue</th>
                                        <th className="px-4 py-2 text-right">Deduction</th>
                                        <th className="px-4 py-2 text-right">Net Revenue</th>
                                        <th className="px-4 py-2 text-right text-indigo-700">Sub Pub Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading data...</td></tr>
                                    ) : filteredReports.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Tidak ada laporan untuk periode ini</td></tr>
                                    ) : (
                                        filteredReports.map((report) => (
                                            <tr key={report.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-900">
                                                    {report.title}
                                                    <div className="text-[9px] text-slate-400 font-normal">{report.writer}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-medium text-slate-600">
                                                        {report.source}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-slate-500">
                                                    {formatCurrency(report.gross_revenue)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-red-500">
                                                    {formatCurrency(report.deduction)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-medium text-slate-700">
                                                    {formatCurrency(report.net_revenue)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-bold text-indigo-600">
                                                    {formatCurrency(report.sub_pub_share)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Import Laporan Publishing</h1>
                            <p className="text-slate-500 text-sm">Upload Laporan Excel (.xlsx) Untuk Memperbarui Statistik Dan Pendapatan</p>
                        </div>
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all font-medium text-xs hover:opacity-90"
                            style={{ backgroundColor: getButtonColor() }}
                        >
                            <Upload size={16} />
                            Import Excel
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 font-normal">Nama File</th>
                                        <th className="px-6 py-3 font-normal">Tanggal Upload</th>
                                        <th className="px-6 py-3 font-normal">Jam Upload</th>
                                        <th className="px-6 py-3 font-normal">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Belum Ada File Yang Diupload.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-scale-in">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Upload Laporan Baru</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                                    <select 
                                        className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={uploadForm.month}
                                        onChange={(e) => setUploadForm({...uploadForm, month: Number(e.target.value)})}
                                    >
                                        {months.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                                    <select 
                                        className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={uploadForm.year}
                                        onChange={(e) => setUploadForm({...uploadForm, year: Number(e.target.value)})}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Periode (Opsional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Q1 2024"
                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={uploadForm.period}
                                    onChange={(e) => setUploadForm({...uploadForm, period: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">File Excel (.xlsx)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        required
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <FileSpreadsheet size={32} className="text-green-600" />
                                        <span className="text-sm font-medium">
                                            {reportFile ? reportFile.name : 'Klik untuk pilih file Excel'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 ml-1">Pastikan format kolom sesuai template.</p>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={uploading}
                                    className={`w-full py-2.5 rounded-lg text-white font-medium flex justify-center items-center gap-2
                                        ${uploading ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'}
                                    `}
                                    style={{ backgroundColor: getButtonColor() }}
                                >
                                    {uploading ? 'Uploading...' : 'Proses Upload'}
                                </button>
                            </div>
                        </form>
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
