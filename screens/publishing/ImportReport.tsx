import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader, Search, Check, ChevronRight, FileText, Calendar, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';

const ImportReport = () => {
  const { getTextColor } = useBranding();
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportPeriod, setReportPeriod] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [importHistory, setImportHistory] = useState<any[]>([]);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const res = await api.get('/reports/history');
      setImportHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch import history', error);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus riwayat import ini? Data laporan terkait TIDAK akan terhapus, hanya riwayat import saja.')) return;
    
    try {
        await api.delete(`/reports/history/${id}`);
        setImportHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
        console.error('Failed to delete history', error);
        alert('Gagal menghapus riwayat');
    }
  };

  const handleNextStep = () => {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
      if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('report', selectedFile);
    formData.append('month', month.toString());
    formData.append('year', year.toString());
    formData.append('period', reportPeriod || '');

    try {
      const res = await api.post('/reports/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      alert(`Import successful! Inserted: ${res.data.inserted} records.`);
      if (res.data.errors && res.data.errors.length > 0) {
        alert(`Some warnings:\n${res.data.errors.join('\n')}`);
      }
      fetchImportHistory();
      
      // Reset form
      setSelectedFile(null);
      setReportPeriod('');
      setCurrentStep(1);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      console.error('Import failed', error);
      alert(`Import failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const steps = [
      { id: 1, title: 'Bulan Laporan', icon: Calendar },
      { id: 2, title: 'Periode Pelaporan', icon: FileText },
      { id: 3, title: 'Upload Dokumen', icon: Upload }
  ];

  // Filter Logic
  const filteredHistory = importHistory.filter(history => 
    (history.file_name && history.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (history.status && history.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: getTextColor() }}>Import Report</h1>
      
      {/* Stepper Wizard */}
      <div className="glass-panel p-8 mb-8">
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div className={`flex flex-col items-center relative z-10`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                            currentStep >= step.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {currentStep > step.id ? <Check size={20} /> : <step.icon size={18} />}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-purple-600' : 'text-gray-400'}`}>
                            {step.title}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-24 h-1 mx-2 rounded -mt-6 transition-colors duration-300 ${
                            currentStep > step.id ? 'bg-purple-600' : 'bg-gray-200'
                        }`} />
                    )}
                </div>
            ))}
        </div>

        {/* Step Content */}
        <div className="max-w-md mx-auto min-h-[200px]">
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-semibold text-center mb-4" style={{ color: getTextColor() }}>Detail Bulan Laporan</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>Bulan</label>
                            <select 
                                value={month} 
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="glass-input w-full"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>Tahun</label>
                            <select 
                                value={year} 
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="glass-input w-full"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const y = new Date().getFullYear() - 2 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-semibold text-center mb-4" style={{ color: getTextColor() }}>Detail Periode Pelaporan</h3>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>Keterangan Periode (Opsional)</label>
                        <input 
                            type="text" 
                            value={reportPeriod}
                            onChange={(e) => setReportPeriod(e.target.value)}
                            placeholder="Contoh: Q1 2025, Semester 1"
                            className="glass-input w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tambahkan catatan khusus untuk periode import ini.</p>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-semibold text-center mb-4" style={{ color: getTextColor() }}>Upload Dokumen Laporan</h3>
                    
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                            selectedFile ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept=".xlsx, .xls, .csv" 
                        />
                        
                        {selectedFile ? (
                            <div className="flex flex-col items-center text-purple-700">
                                <FileText size={48} className="mb-2" />
                                <span className="font-medium truncate max-w-full">{selectedFile.name}</span>
                                <span className="text-xs text-purple-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                                <button className="mt-4 text-xs bg-white border border-purple-200 px-3 py-1 rounded-full hover:bg-purple-100">
                                    Ganti File
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 cursor-pointer">
                                <Upload size={48} className="mb-2 text-gray-400" />
                                <span className="font-medium">Klik untuk upload file</span>
                                <span className="text-xs mt-1">Format: .xlsx, .xls, .csv</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 max-w-md mx-auto border-t border-gray-100 pt-6">
            <button 
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isImporting}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                Kembali
            </button>

            {currentStep < 3 ? (
                <button 
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium shadow-md transition-transform hover:scale-105"
                >
                    Lanjut <ChevronRight size={16} />
                </button>
            ) : (
                <button 
                    onClick={handleImport}
                    disabled={!selectedFile || isImporting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isImporting ? (
                        <><Loader className="animate-spin" size={16} /> Importing...</>
                    ) : (
                        <><Upload size={16} /> Mulai Import</>
                    )}
                </button>
            )}
        </div>
      </div>

      {/* Import History */}
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
             <h3 className="text-lg font-semibold" style={{ color: getTextColor() }}>Riwayat Import</h3>
             <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search file name..."
                  className="pl-10 w-full border rounded-lg py-2 px-3 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistory.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No import history found</td>
                        </tr>
                    ) : (
                        paginatedHistory.map((history) => (
                            <tr key={history.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{history.file_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(0, history.month - 1).toLocaleString('default', { month: 'long' })} {history.year}
                                    {history.period && <span className="block text-xs text-gray-400">{history.period}</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{history.total_records}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        history.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {history.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(history.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => handleDeleteHistory(history.id)}
                                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-full transition-colors"
                                        title="Hapus Riwayat"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredHistory.length)}</span> of <span className="font-medium">{filteredHistory.length}</span> results
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                    >
                        Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                         let pageNum = i + 1;
                         if (totalPages > 5) {
                             if (currentPage > 3) {
                                 pageNum = currentPage - 2 + i;
                             } 
                             if (pageNum > totalPages) {
                                 pageNum = totalPages - (4 - i);
                             }
                         }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 border rounded text-sm ${
                                    currentPage === pageNum
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImportReport;
