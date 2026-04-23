import { useState, useEffect } from 'react';
import { Calculator, ChevronRight, DollarSign, Wallet, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useBranding } from '../../contexts/BrandingContext';

const Payments = () => {
  const { getTextColor } = useBranding();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchCalculatedPayments();
  }, [selectedMonth, selectedYear]);

  const fetchCalculatedPayments = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedMonth !== 'all') params.month = selectedMonth;
      if (selectedYear !== 'all') params.year = selectedYear;

      const res = await api.get('/payments/calculate', { params });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch payment calculations', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = data.filter(user => {
      if (filterStatus === 'all') return true;
      return (user.payment_status || 'pending') === filterStatus;
  });

  // Calculate totals from filtered data
  const totalRevenue = filteredData.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
  const totalAdminShare = filteredData.reduce((sum, item) => sum + (Number(item.admin_share) || 0), 0);
  const totalClientShare = filteredData.reduce((sum, item) => sum + (Number(item.net_share) || 0), 0);

  const handleUserClick = (userId: number, month?: number, year?: number) => {
    navigate(`/admin/payments/${userId}`, { 
      state: { 
          month: month || selectedMonth, 
          year: year || selectedYear 
      } 
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">SUDAH DITRANSFER</span>;
      case 'process':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">PROSES</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">BELUM DITRANSFER</span>;
    }
  };

  const getMonthName = (month: number) => {
      return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: getTextColor() }}>
        <Calculator size={24} />
        Perhitungan Pembayaran (Payment Calculation)
      </h1>

      <div className="glass-panel p-6 mb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 pb-8">
            <div className="bg-white p-6 rounded-xl border border-purple-100 flex items-center shadow-sm">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full mr-4">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Pendapatan Sub Publisher</p>
                    <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(totalRevenue)}</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-red-100 flex items-center shadow-sm">
                <div className="p-3 bg-red-50 text-red-600 rounded-full mr-4">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Pendapatan (Sub Pub - Client)</p>
                    <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(totalAdminShare)}</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-green-100 flex items-center shadow-sm">
                <div className="p-3 bg-green-50 text-green-600 rounded-full mr-4">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Share ke Pencipta (Net)</p>
                    <h3 className="text-xl font-bold" style={{ color: getTextColor() }}>{formatCurrency(totalClientShare)}</h3>
                </div>
            </div>
        </div>

        <div className="flex gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>Bulan</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="glass-input w-40"
            >
              <option value="all">Semua Bulan</option>
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
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="glass-input w-32"
            >
              <option value="all">Semua Tahun</option>
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input w-40"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Ditransfer</option>
              <option value="process">Proses</option>
              <option value="success">Sudah Ditransfer</option>
            </select>
          </div>
          <button 
            onClick={fetchCalculatedPayments}
            className="btn-primary flex items-center gap-2"
          >
            <Calculator size={18} /> Hitung Ulang
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Menghitung data pembayaran...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Tidak ada data transaksi untuk kriteria ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((user, index) => (
              <div 
                key={`${user.user_id}-${user.month}-${user.year}-${index}`}
                onClick={() => handleUserClick(user.user_id, user.month, user.year)}
                className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:border-purple-300 transition-all group hover:shadow-md"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    {user.user_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-purple-700 transition-colors" style={{ color: getTextColor() }}>{user.user_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Potongan Admin: <span className="text-purple-600 font-medium">{user.user_percentage}%</span></span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium text-gray-700">{getMonthName(user.month)} {user.year}</span>
                    </div>
                  </div>
                </div>
                  
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Revenue</p>
                    <p className="text-lg font-bold" style={{ color: getTextColor() }}>{formatCurrency(user.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Admin Share</p>
                    <p className="text-lg font-bold text-red-500">-{formatCurrency(user.admin_share)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Net Payable</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(user.net_share)}</p>
                  </div>
                  <div className="pl-4 border-l border-gray-100 flex flex-col items-center justify-center gap-2">
                      {getStatusBadge(user.payment_status)}
                      <button className="px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-md text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600">
                        Lihat <ChevronRight size={14} />
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
