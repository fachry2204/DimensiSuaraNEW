import { useState, useEffect } from 'react';
import { Search, Banknote, PieChart, Wallet, Filter } from 'lucide-react';
import { api } from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';

const ReportList = () => {
  const { getTextColor } = useBranding();
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_net_revenue: 0,
    total_sub_pub_share: 0,
    total_tbw_share: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;

      const res = await api.get('/reports', { params });
      setReports(res.data.reports);
      setSummary(res.data.summary || {
        total_net_revenue: 0,
        total_sub_pub_share: 0,
        total_tbw_share: 0,
        total_admin_share: 0,
        total_client_share: 0
      });
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(report => 
    (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (report.custom_id && report.custom_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (report.writer && report.writer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold" style={{ color: getTextColor() }}>Data Report</h1>
        
        {/* Filters (Moved to Right Side in Frame) */}
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-2 text-gray-500">
                <Filter size={18} />
                <span className="text-sm font-medium">Filter:</span>
            </div>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
                className="text-sm border-gray-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 py-1.5"
            >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="text-sm border-gray-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 py-1.5"
            >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - 2 + i;
                    return <option key={y} value={y}>{y}</option>;
                })}
            </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(summary.total_sub_pub_share)}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Revenue saya</p>
            <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(summary.total_client_share || summary.total_net_revenue)}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Share To Ruang Musik</p>
            <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(summary.total_admin_share || summary.total_tbw_share)}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b border-white/30 flex flex-col gap-4">
            {/* Top Bar: Search Only */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 md:max-w-md relative">
                    <input
                    type="text"
                    placeholder="Search by Custom ID, Title, or Writer..."
                    className="glass-input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="glass-input py-1 px-2 text-sm w-20"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pencipta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asal Report</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No reports found</td>
                </tr>
              ) : (
                paginatedReports.map((report, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.month && report.year ? `${new Date(0, report.month - 1).toLocaleString('default', { month: 'short' })} ${report.year}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.custom_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.writer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(report.sub_pub_share)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {report.is_matched ? (
                             <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Matched</span>
                        ) : (
                             <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Unmatched</span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/30 flex items-center justify-between bg-white/20">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredReports.length)}</span> of <span className="font-medium">{filteredReports.length}</span> results
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className={`px-3 py-1 border rounded-md ${
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
                        className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ReportList;
