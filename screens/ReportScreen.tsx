import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle, CheckCircle, CheckCircle2, Download, Calendar, Clock, ChevronLeft, Search, User, XCircle, Filter, FileSpreadsheet } from 'lucide-react';
import { ReportData, ReleaseData } from '../types';
import { formatDMY, formatHM } from '../utils/date';
import { PublishingReports } from './publishing/PublishingReports';
import { useBranding } from '../contexts/BrandingContext';
import { api } from '../utils/api';

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
    setSelectedFile(null); // Clear selected file view to show history after import

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        // Process data
        const processedData: ReportData[] = [];
        const timestamp = new Date().toISOString();

        // Helper to parse numbers properly
        const parseNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const cleaned = String(val).replace(/[$,]/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        };

        jsonData.forEach((row: any, index) => {
          let upc = '';
          let isrc = '';
          let title = '';
          let artist = 'Unknown Artist';
          let platform = 'Unknown';
          let country = 'WW';
          let quantity = 0;
          let revenue = 0;
          let period = new Date().toISOString().slice(0, 7);
          
          let sales_period = '';
          let reporting_period = '';
          let album_title = '';
          let release_date = '';
          let royalty_type = '';
          let sales_type = '';
          let sales_sub_type = '';

          if (selectedAggregator === 'Believe') {
              upc = String(row['UPC'] || '');
              isrc = String(row['ISRC'] || '');
              title = row['Track title'] || row['Release title'] || '';
              artist = row['Artist Name'] || 'Unknown Artist';
              platform = row['Platform'] || 'Unknown';
              country = row['Country / Region'] || 'WW';
              quantity = parseNum(row['Quantity'] || 0);
              revenue = parseNum(row['Net Revenue'] || 0);
              period = row['Reporting month'] || row['Sales Month'] || period;
          } else {
              upc = String(row['UPC Code'] || row['UPC'] || row['upc'] || '');
              isrc = String(row['ISRC'] || row['isrc'] || '');
              title = row['Track Title'] || row['Title'] || row['title'] || '';
              artist = row['Track Artists'] || row['Artist'] || row['artist'] || 'Unknown Artist';
              platform = row['Store Name'] || row['Platform'] || row['platform'] || 'Unknown';
              country = row['Sales Region'] || row['Country'] || row['country'] || 'WW';
              
              quantity = parseNum(row['Stream/Create'] || row['Quantity'] || row['quantity'] || 0);
              revenue = parseNum(row['Final Royalty'] || row['Revenue'] || row['revenue'] || 0);
              period = String(row['Sales Period'] || row['Period'] || row['period'] || period);
              
              sales_period = String(row['Sales Period'] || '');
              reporting_period = String(row['Reporting Period'] || '');
              album_title = row['Album Title'] || '';
              release_date = String(row['Release Date'] || '');
              royalty_type = row['Royalty Type'] || '';
              sales_type = row['Sales Type'] || '';
              sales_sub_type = row['Sales Sub Type'] || '';
          }

          // Skip rows that are clearly empty
          if (!upc && !isrc && !title && revenue === 0) return;

          // Ensure title is not empty
          if (!title) title = 'Unknown Title';

          // Ensure period is YYYY-MM-DD format for database date column
          let formattedPeriod = String(period || '');
          if (formattedPeriod.length === 7 && formattedPeriod.includes('-')) {
              formattedPeriod = `${formattedPeriod}-01`;
          } else if (formattedPeriod.length === 6 && !formattedPeriod.includes('-')) {
              // Handle YYYYMM format
              formattedPeriod = `${formattedPeriod.slice(0, 4)}-${formattedPeriod.slice(4, 6)}-01`;
          } else if (!formattedPeriod.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Fallback to first of current month if invalid
              formattedPeriod = new Date().toISOString().slice(0, 8) + '01';
          }

          // Safety: Truncate long strings to avoid DB errors (VARCHAR limits)
          const limit = (str: string, max: number) => String(str || '').substring(0, max);

          processedData.push({
            id: `${Date.now()}-${index}`,
            upc: limit(upc, 50),
            isrc: limit(isrc, 50),
            title: limit(title || 'Unknown Title', 255),
            artist: limit(artist || 'Unknown Artist', 255),
            platform: limit(platform, 100),
            country: limit(country, 100),
            quantity: Math.floor(quantity), // Must be integer
            revenue: parseFloat(revenue.toFixed(2)), // 2 decimal places max
            period: formattedPeriod,
            sales_period: limit(sales_period, 50),
            reporting_period: limit(reporting_period, 50),
            album_title: limit(album_title, 255),
            release_date: limit(release_date, 50),
            royalty_type: limit(royalty_type, 100),
            sales_type: limit(sales_type, 100),
            sales_sub_type: limit(sales_sub_type, 100),
            originalFileName: limit(file.name, 255),
            uploadTimestamp: timestamp,
            status: 'Pending',
            verificationStatus: 'Unchecked'
          });
        });

        console.log('Processed Data for Import:', processedData.length, 'rows');

        if (processedData.length === 0) {
            setError('File Kosong Atau Format Tidak Sesuai.');
            return;
        }

        // SAVE TO DATABASE
        if (!token) throw new Error('Token Sesi Tidak Ditemukan. Silakan Login Ulang.');
        
        await api.importReports(token, processedData);
        
        // REFRESH DATA FROM BACKEND
        const refreshedData = await api.getReports(token);
        onImport(refreshedData);
        
        setSuccessMsg(`Berhasil Mengimpor ${processedData.length} Baris Data Ke Database.`);
      } catch (err: any) {
        console.error("Import Error:", err);
        setError(err.message || 'Gagal Memproses File. Pastikan Format Excel Valid.');
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
      { 
        "Sales Period": "2024-01", 
        "Reporting Period": "2024-03", 
        "Track Title": "Judul Lagu Contoh 1", 
        "ISRC": "IDABC2400001", 
        "Track Artists": "Penyanyi Utama, Artis Fitur", 
        "UPC Code": "1234567890123", 
        "Album Title": "Nama Album Contoh",
        "Release Date": "2023-12-01",
        "Royalty Type": "Streaming",
        "Store Name": "Spotify", 
        "Sales Region": "ID", 
        "Sales Type": "Subscription",
        "Sales Sub Type": "Premium",
        "Stream/Create": 12500, 
        "Final Royalty": 625000 
      },
      { 
        "Sales Period": "2024-01", 
        "Reporting Period": "2024-03", 
        "Track Title": "Judul Lagu Contoh 2", 
        "ISRC": "IDABC2400002", 
        "Track Artists": "Penyanyi Solo", 
        "UPC Code": "1234567890123", 
        "Album Title": "Nama Album Contoh",
        "Release Date": "2023-12-01",
        "Royalty Type": "Streaming",
        "Store Name": "Apple Music", 
        "Sales Region": "US", 
        "Sales Type": "Subscription",
        "Sales Sub Type": "Premium",
        "Stream/Create": 800, 
        "Final Royalty": 450000 
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Reports");
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
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        {mode === 'import' ? 'Import Laporan Pendapatan' : 'Laporan Pendapatan'}
                    </h1>
                    <p className="text-indigo-200 text-xs mt-1 font-medium italic">
                        {mode === 'import' 
                            ? 'Gunakan template Excel standar untuk hasil import yang maksimal' 
                            : 'Ringkasan Laporan Dan Statistik Pendapatan'}
                    </p>
                </div>
                
                {mode === 'import' && (
                    <button 
                        onClick={downloadTemplate}
                        className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-3 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 shadow-md border border-white/10"
                    >
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                            <Download size={16} className="animate-pulse" />
                        </div>
                        <div className="flex flex-col items-start leading-tight text-left">
                            <span className="uppercase tracking-wider">Unduh Template</span>
                            <span className="text-[9px] text-white/70 font-medium">Format Excel (.xlsx)</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Import Controls */}
            {mode === 'import' && !selectedFile && (
                <div className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={selectedAggregator}
                            onChange={(e) => setSelectedAggregator(e.target.value)}
                            className="bg-transparent text-slate-700 font-bold text-xs focus:outline-none cursor-pointer"
                        >
                            <option value="">Pilih Aggregator</option>
                            {aggregators.map(agg => (
                                <option key={agg} value={agg}>{agg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1"></div>

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
                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl shadow-lg transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: getButtonColor() }}
                        >
                            {isProcessing ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                            ) : (
                                <Upload size={16} />
                            )}
                            MULAI IMPORT EXCEL
                        </button>
                    </div>
                </div>
            )}

            {/* Alerts */}
            <div className="space-y-3">
                {error && (
                    <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
                        <CheckCircle size={20} />
                        {successMsg}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            {mode === 'view' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">UPC / ISRC</th>
                                    <th className="px-6 py-4">Title / Album</th>
                                    <th className="px-6 py-4">Platform</th>
                                    <th className="px-6 py-4">Country</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                    <th className="px-6 py-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3 opacity-50">
                                                <FileText size={48} />
                                                <p className="font-medium text-sm">Belum Ada Data Yang Diimpor</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.slice(0, 1000).map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-500">{row.period}</td>
                                            <td className="px-6 py-3">
                                                <div className="font-mono text-slate-700 font-bold">{row.upc}</div>
                                                <div className="font-mono text-slate-400">{row.isrc}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-slate-800">{row.title}</div>
                                                {row.album_title && <div className="text-[10px] text-slate-400 truncate max-w-[150px] font-medium">{row.album_title}</div>}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">{row.platform}</span>
                                            </td>
                                            <td className="px-6 py-3 font-medium uppercase">{row.country}</td>
                                            <td className="px-6 py-3 text-right font-mono">{row.quantity.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600">
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
                /* IMPORT MODE TABLE */
                !selectedFile ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nama File</th>
                                        <th className="px-6 py-4">Periode Upload</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {uploadHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-20 text-center text-slate-400">
                                                Belum Ada File Yang Diupload
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
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                            <FileSpreadsheet size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{file.fileName}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Click to view details</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4 text-slate-600">
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {file.timestamp ? formatDMY(file.timestamp) : '-'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-bold text-slate-400">
                                                            <Clock size={14} />
                                                            {file.timestamp ? formatHM(file.timestamp) : '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                        file.status === 'Pending' 
                                                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <button 
                                onClick={() => setSelectedFile(null)}
                                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs font-bold uppercase"
                            >
                                <ChevronLeft size={18} />
                                Kembali
                            </button>
                            <h2 className="text-sm font-bold text-white truncate max-w-md px-4 border-l border-white/20">{selectedFile}</h2>
                            <button 
                                onClick={handleCheckMatches}
                                className="flex items-center gap-2 px-5 py-2 text-white rounded-xl shadow-lg transition-all font-bold text-xs hover:opacity-90 active:scale-95 border border-white/10"
                                style={{ backgroundColor: getButtonColor() }}
                            >
                                <Search size={16} />
                                VALIDASI DATA
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">period</th>
                                            <th className="px-6 py-4">upc / isrc</th>
                                            <th className="px-6 py-4">title / album</th>
                                            <th className="px-6 py-4">platform</th>
                                            <th className="px-6 py-4 text-right">qty</th>
                                            <th className="px-6 py-4 text-right">revenue</th>
                                            <th className="px-6 py-4">status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedFileData.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 font-medium">{row.period}</td>
                                                <td className="px-6 py-3">
                                                    <div className="font-mono font-bold text-slate-700">{row.upc}</div>
                                                    <div className="font-mono text-slate-400">{row.isrc}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800">{row.title}</div>
                                                    {row.album_title && <div className="text-[10px] text-slate-400 truncate max-w-[150px] font-medium">{row.album_title}</div>}
                                                </td>
                                                <td className="px-6 py-3 font-bold text-slate-600">{row.platform}</td>
                                                <td className="px-6 py-3 text-right font-mono">{row.quantity.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">${row.revenue.toFixed(4)}</td>
                                                <td className="px-6 py-3">
                                                    {row.verificationStatus === 'Valid' ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-emerald-100 uppercase">
                                                            <CheckCircle size={10} />
                                                            valid
                                                        </span>
                                                    ) : row.verificationStatus === 'No User' ? (
                                                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-100 uppercase">
                                                            <AlertCircle size={10} />
                                                            no user
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-bold">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            )}
          </div>
      )}
    </div>
  );
};
