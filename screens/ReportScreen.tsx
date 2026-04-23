import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle, CheckCircle, CheckCircle2, Download, Calendar, Clock, ChevronLeft, Search, User, XCircle } from 'lucide-react';
import { ReportData, ReleaseData } from '../types';
import { formatDMY, formatHM } from '../utils/date';
import { PublishingReports } from './publishing/PublishingReports';
import { useBranding } from '../contexts/BrandingContext';

interface ReportScreenProps {
  onImport: (data: ReportData[]) => void;
  data: ReportData[];
  releases: ReleaseData[];
  aggregators?: string[];
  mode?: 'view' | 'import';
  token?: string | null;
  defaultTab?: 'aggregator' | 'publishing';
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ onImport, data: propData, releases: propReleases, aggregators = [], mode = 'view', token = null, defaultTab = 'aggregator' }) => {
  const { getButtonColor } = useBranding();
  const [activeTab, setActiveTab] = useState<'aggregator' | 'publishing'>(defaultTab);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const data = propData || [];
  const releases = propReleases || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedAggregator, setSelectedAggregator] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        // Process data - IMPORT ALL without filtering
        const processedData: ReportData[] = [];
        const timestamp = new Date().toISOString();

        jsonData.forEach((row: any, index) => {
          let upc = '';
          let isrc = '';
          let title = 'Unknown Title';
          let artist = 'Unknown Artist';
          let platform = 'Unknown';
          let country = 'WW';
          let quantity = 0;
          let revenue = 0;
          let period = new Date().toISOString().slice(0, 7);

          if (selectedAggregator === 'Believe') {
              // Believe Format Mapping
              // Columns: Reporting month, Sales Month, Platform, Country / Region, Label Name, Artist Name, Release title, Track title, UPC, ISRC, Release Type, Sales Type, Quantity, Net Revenue
              upc = String(row['UPC'] || '');
              isrc = String(row['ISRC'] || '');
              title = row['Track title'] || row['Release title'] || 'Unknown Title';
              artist = row['Artist Name'] || 'Unknown Artist';
              platform = row['Platform'] || 'Unknown';
              country = row['Country / Region'] || 'WW';
              quantity = Number(row['Quantity'] || 0);
              revenue = Number(row['Net Revenue'] || 0);
              period = row['Reporting month'] || row['Sales Month'] || period;
          } else {
              // Default / Generic Mapping
              upc = String(row['UPC'] || row['upc'] || '');
              isrc = String(row['ISRC'] || row['isrc'] || '');
              title = row['Title'] || row['title'] || 'Unknown Title';
              artist = row['Artist'] || row['artist'] || 'Unknown Artist';
              platform = row['Platform'] || row['platform'] || 'Unknown';
              country = row['Country'] || row['country'] || 'WW';
              quantity = Number(row['Quantity'] || row['quantity'] || 0);
              revenue = Number(row['Revenue'] || row['revenue'] || 0);
              period = row['Period'] || row['period'] || period;
          }

          processedData.push({
            id: `${Date.now()}-${index}`,
            upc,
            isrc,
            title,
            artist,
            platform,
            country,
            quantity,
            revenue,
            period,
            originalFileName: file.name,
            uploadTimestamp: timestamp,
            status: 'Pending',
            verificationStatus: 'Unchecked'
          });
        });

        // Merge with existing data (or replace? Assuming append for history logic, but strictly following prop)
        // If we want to keep existing files, we should append. 
        // Current App.tsx implementation of onImport is `setReportData(data)`, so it replaces.
        // To support "History", we should probably append here or change App.tsx.
        // For now, let's append to existing data to simulate history behavior if the parent allows it,
        // but since parent controls state, we should pass [...data, ...processedData].
        const newData = [...data, ...processedData];
        onImport(newData);
        
        setSuccessMsg(`Berhasil Mengimpor ${processedData.length} Baris Data.`);
      } catch (err) {
        console.error("Import Error:", err);
        setError('Gagal Memproses File. Pastikan Format Excel Valid.');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCheckMatches = () => {
    if (!selectedFile) return;

    // Create a Set of valid UPCs/ISRCs for fast lookup
    const validUPCs = new Set(releases.map(r => r.upc));
    const validISRCs = new Set(releases.flatMap(r => r.tracks.map(t => t.isrc)));

    const updatedData = data.map(item => {
        if (item.originalFileName === selectedFile) {
            const hasMatch = validUPCs.has(item.upc) || validISRCs.has(item.isrc);
            return {
                ...item,
                verificationStatus: hasMatch ? 'Valid' : 'No User'
            } as ReportData;
        }
        return item;
    });

    onImport(updatedData);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { UPC: "123456789012", ISRC: "USABC1234567", Title: "Song Title", Artist: "Artist Name", Platform: "Spotify", Country: "ID", Quantity: 1000, Revenue: 50.00, Period: "2024-01" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Laporan_Pendapatan.xlsx");
  };

  const uploadHistory = useMemo(() => {
    const history = new Map<string, { fileName: string, timestamp: string, status: string }>();
    
    data.forEach(item => {
        const ts = item.uploadTimestamp || '';
        const key = `${item.originalFileName}-${ts}`;
        
        if (!history.has(key)) {
            history.set(key, { 
                fileName: item.originalFileName, 
                timestamp: ts,
                status: item.status || 'Pending'
            });
        }
    });
    
    return Array.from(history.values()).sort((a, b) => {
        if (!a.timestamp) return 1; 
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [data]);

  const selectedFileData = useMemo(() => {
    if (!selectedFile) return [];
    return data.filter(d => d.originalFileName === selectedFile);
  }, [data, selectedFile]);

  const totalRevenue = useMemo(() => {
    try {
        return data.reduce((acc, curr) => acc + (Number(curr?.revenue) || 0), 0);
    } catch (e) {
        return 0;
    }
  }, [data]);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
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

      {activeTab === 'publishing' ? (
          <PublishingReports token={token} mode={mode} />
      ) : (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {mode === 'import' ? 'Import Laporan' : 'Laporan'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'import' 
                ? 'Upload Laporan Excel (.xlsx) Untuk Memperbarui Statistik Dan Pendapatan' 
                : 'Ringkasan Laporan Dan Statistik Pendapatan'}
          </p>
        </div>
        {mode === 'import' && !selectedFile && (
            <div className="flex gap-3">
                <select
                    value={selectedAggregator}
                    onChange={(e) => setSelectedAggregator(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">Pilih Aggregator</option>
                    {aggregators.map(agg => (
                        <option key={agg} value={agg}>{agg}</option>
                    ))}
                </select>
                <button 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium text-xs"
                >
                    <Download size={16} />
                    Download Template
                </button>
                <div className="relative">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls"
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg transition-all font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ backgroundColor: getButtonColor() }}
                    >
                        {isProcessing ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        ) : (
                            <Upload size={16} />
                        )}
                        Import Excel
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      {/* View Mode: Summary Cards */}
      {mode === 'view' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <FileText size={24} />
                  </div>
                  <div>
                      <div className="text-xs font-medium text-slate-500">Total Baris Data</div>
                      <div className="text-2xl font-bold text-slate-800">{data.length.toLocaleString()}</div>
                  </div>
              </div>
          </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <FileText size={24} />
                  </div>
                  <div>
                      <div className="text-xs font-medium text-slate-500">Total Pendapatan Terimpor</div>
                      <div className="text-2xl font-bold text-slate-800">
                          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {mode === 'view' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 font-normal">Period</th>
                            <th className="px-6 py-3 font-normal">UPC / ISRC</th>
                            <th className="px-6 py-3 font-normal">Title</th>
                            <th className="px-6 py-3 font-normal">Platform</th>
                            <th className="px-6 py-3 font-normal">Country</th>
                            <th className="px-6 py-3 text-right font-normal">Qty</th>
                            <th className="px-6 py-3 text-right font-normal">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                             <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    Belum Ada Data Yang Diimpor. Silakan Upload File Excel.
                                </td>
                            </tr>
                        ) : (
                            data.slice(0, 100).map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3">{row.period}</td>
                                    <td className="px-6 py-3">
                                        <div className="font-mono text-xs text-slate-600">{row.upc}</div>
                                        <div className="font-mono text-xs text-slate-400">{row.isrc}</div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700">{row.title}</td>
                                    <td className="px-6 py-3">{row.platform}</td>
                                    <td className="px-6 py-3">{row.country}</td>
                                    <td className="px-6 py-3 text-right">{row.quantity.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-right font-medium text-green-600">
                                        ${row.revenue.toFixed(4)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        // IMPORT MODE
        <>
            {!selectedFile ? (
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
                                {uploadHistory.length === 0 ? (
                                     <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Belum Ada File Yang Diupload.
                                        </td>
                                    </tr>
                                ) : (
                                    uploadHistory.map((file, idx) => (
                                        <tr 
                                            key={`${file.fileName}-${idx}`} 
                                            onClick={() => setSelectedFile(file.fileName)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{file.fileName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    {file.timestamp ? formatDMY(file.timestamp) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-slate-400" />
                                                    {file.timestamp ? formatHM(file.timestamp) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                    file.status === 'Pending' 
                                                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                        : 'bg-green-50 text-green-600 border-green-100'
                                                }`}>
                                                    {file.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // FILE DETAIL VIEW
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Kembali Ke Daftar File
                        </button>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-800">{selectedFile}</h2>
                        </div>
                        <button 
                            onClick={handleCheckMatches}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg transition-all font-medium text-sm hover:opacity-90"
                            style={{ backgroundColor: getButtonColor() }}
                        >
                            <Search size={18} />
                            Cek UPC & ISRC
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 font-normal">period</th>
                                        <th className="px-6 py-3 font-normal">upc / isrc</th>
                                        <th className="px-6 py-3 font-normal">title</th>
                                        <th className="px-6 py-3 font-normal">platform</th>
                                        <th className="px-6 py-3 font-normal">country</th>
                                        <th className="px-6 py-3 text-right font-normal">qty</th>
                                        <th className="px-6 py-3 text-right font-normal">revenue</th>
                                        <th className="px-6 py-3 font-normal">status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedFileData.slice(0, 100).map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">{row.period}</td>
                                            <td className="px-6 py-3">
                                                <div className="font-mono text-xs text-slate-600">{row.upc}</div>
                                                <div className="font-mono text-xs text-slate-400">{row.isrc}</div>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{row.title}</td>
                                            <td className="px-6 py-3">{row.platform}</td>
                                            <td className="px-6 py-3">{row.country}</td>
                                            <td className="px-6 py-3 text-right">{row.quantity.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-medium text-green-600">
                                                ${row.revenue.toFixed(4)}
                                            </td>
                                            <td className="px-6 py-3">
                                                {row.verificationStatus === 'Valid' ? (
                                                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-medium border border-green-100 w-fit">
                                                        <CheckCircle2 size={12} />
                                                        valid
                                                    </span>
                                                ) : row.verificationStatus === 'No User' ? (
                                                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-medium border border-amber-100 w-fit">
                                                        <AlertCircle size={12} />
                                                        no user
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
      )}
      </>
      )}
    </div>
  );
};
