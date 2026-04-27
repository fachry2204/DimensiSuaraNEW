import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Search, Filter, Plus, RefreshCw, CheckCircle, Clock, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  token: string;
  defaultTab?: 'aggregator' | 'publishing';
}

interface ContractData {
  id: number;
  name: string; // user.username or writer.name
  full_name?: string; // user.full_name
  email?: string; // user.email
  contract_status: 'Not Generated' | 'On Review' | 'Done';
  joinedDate?: string; // for users
  created_at?: string; // for writers
}

export const Contracts: React.FC<Props> = ({ token, defaultTab = 'aggregator' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL or props
  const activeTab = location.pathname.includes('publishing') ? 'publishing' : 'aggregator';

  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<ContractData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContractData | null>(null);

  // Add Contract User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        let res;
        if (activeTab === 'aggregator') {
            res = await api.getAggregatorContracts(token);
        } else {
            res = await api.getPublishingContracts(token);
        }
        
        // Normalize data structure
        const normalized = res.map((item: any) => ({
            id: item.id,
            name: item.username || item.name || 'Unknown',
            full_name: item.full_name,
            email: item.email || item.user_email,
            contract_status: item.contract_status || 'Not Generated',
            date: item.joinedDate || item.created_at
        }));
        
        setData(normalized);
    } catch (err) {
        console.error("Failed to fetch contracts:", err);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchUsersForContract = async () => {
      setIsLoadingUsers(true);
      try {
          // Fetch all users to select from
          // In a real app, you might want a specific endpoint for "users without contracts" or just fetch all and filter client-side
          // Re-using getAggregatorContracts for now as it returns user data including contract_status
          // Ideally, we need an endpoint that returns ALL users, not just those with contracts if the previous endpoint filtered them.
          // Assuming getAggregatorContracts returns all users and their status.
          
          const res = await api.getAggregatorContracts(token);
          // Filter logic can be applied here or in the modal rendering
          setAvailableUsers(res);
      } catch (err) {
          console.error("Failed to fetch users:", err);
      } finally {
          setIsLoadingUsers(false);
      }
  };

  const handleOpenAddModal = () => {
      if (activeTab === 'aggregator') {
          fetchUsersForContract();
          setIsAddUserModalOpen(true);
          setSelectedUser(null);
      } else {
          // Logic for publishing if needed, or just redirect/open different modal
          // For now, only Aggregator as requested
          console.log("Add Publishing Contract clicked");
      }
  };

  const handleAddContractUser = async () => {
      if (!selectedUser) return;
      
      try {
          // TODO: Call API to create/initiate contract for selectedUser.id
          console.log(`Adding contract for user: ${selectedUser.username} (ID: ${selectedUser.id})`);
          
          /* 
             Example API: 
             await api.createContract(token, { userId: selectedUser.id, type: 'aggregator' });
          */

          setIsAddUserModalOpen(false);
          fetchData(); // Refresh list
      } catch (err) {
          console.error("Failed to add contract:", err);
          alert("Gagal menambahkan kontrak.");
      }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
        if (activeTab === 'aggregator') {
            await api.deleteAggregatorContract(token, itemToDelete.id); 
        } else {
            await api.deletePublishingContract(token, itemToDelete.id);
        }
        
        // Optimistic update - actually refetch to be safe or update state correctly
        // Instead of removing item, we should update its status to 'Not Generated' if we want to keep user in list
        // BUT, based on current UI which shows list of contracts, maybe removing it from list is what is expected?
        // Wait, the list is list of users/creators. If we "delete contract", we reset status.
        // So the user should still appear but with 'Not Generated' status? 
        // OR if the list only shows those WITH contracts?
        // The current fetch implementation fetches ALL users/creators.
        // So we should just update the status in local state.
        
        setData(prev => prev.map(item => 
            item.id === itemToDelete.id 
                ? { ...item, contract_status: 'Not Generated' } 
                : item
        ));

        setDeleteModalOpen(false);
        setItemToDelete(null);
        
        // Optional: Refetch to ensure sync
        fetchData();
        
    } catch (err) {
        console.error("Failed to delete:", err);
        alert("Gagal menghapus data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);

  const handleTabChange = (tab: 'aggregator' | 'publishing') => {
    navigate(`/contracts/${tab}`);
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Done': return 'bg-green-100 text-green-700 border-green-200';
          case 'On Review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case 'Not Generated': return activeTab === 'aggregator' 
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-slate-100 text-slate-600 border-slate-200';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  const getStatusIcon = (status: string) => {
      switch (status) {
          case 'Done': return <CheckCircle size={14} />;
          case 'On Review': return <Clock size={14} />;
          default: return <AlertCircle size={14} />;
      }
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FileText size={24} />
          </div>
          Manajemen Kontrak
        </h1>
        <p className="text-slate-400 mt-1 ml-14">Kelola kontrak kerjasama Aggregator dan Publishing.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => handleTabChange('aggregator')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'aggregator' 
                ? 'text-blue-600 bg-blue-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Kontrak Aggregator
            {activeTab === 'aggregator' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('publishing')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'publishing' 
                ? 'text-purple-600 bg-purple-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Kontrak Publishing
            {activeTab === 'publishing' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'aggregator' ? "Cari user..." : "Cari pencipta..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchData}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shadow-lg shadow-blue-100"
              >
                <Plus size={18} />
                {activeTab === 'aggregator' ? 'Tambah Kontrak User' : 'Buat Kontrak Baru'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left bg-white">
              <thead className="bg-[#f1f5f9] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16">No</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {activeTab === 'aggregator' ? 'User / Label' : 'Pencipta Lagu'}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {activeTab === 'aggregator' ? 'Tanggal Bergabung' : 'Tanggal Didaftarkan'}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Kontrak</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            <div className="flex justify-center items-center gap-2">
                                <RefreshCw className="animate-spin" size={16} />
                                Loading data...
                            </div>
                        </td>
                    </tr>
                ) : filteredData.length > 0 ? (
                    filteredData.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-[11px] text-slate-500 font-bold font-mono">{idx + 1}</td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-bold text-slate-800 text-[11px]">
                                        {activeTab === 'aggregator' ? (item.full_name || item.name) : item.name}
                                    </p>
                                    {activeTab === 'aggregator' && item.name !== (item.full_name || item.name) && (
                                        <p className="text-[10px] text-slate-500 font-bold">{item.email}</p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-[11px] text-slate-600 font-bold">
                                {item.date ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.contract_status)}`}>
                                    {getStatusIcon(item.contract_status)}
                                    {item.contract_status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                                        title="Lihat Detail"
                                        onClick={() => {
                                            if (activeTab === 'aggregator') {
                                                navigate(`/contracts/aggregator/${item.id}`);
                                            } else {
                                                // Assuming there is a creator detail page or handled elsewhere
                                                console.log('View Publishing Contract', item.id);
                                            }
                                        }}
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button 
                                        className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors shadow-sm"
                                        title="Edit Kontrak"
                                        onClick={() => console.log('Edit', item.id)}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                                        title="Hapus Kontrak"
                                        onClick={() => {
                                            setItemToDelete(item);
                                            setDeleteModalOpen(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                      <td className="px-6 py-8 text-center text-slate-500 text-sm" colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <FileText size={32} className="text-slate-300" />
                          </div>
                          <p className="font-medium text-slate-600">Belum ada data kontrak</p>
                          <p className="text-slate-400 text-xs mt-1">Silakan buat kontrak baru untuk memulai.</p>
                        </div>
                      </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Contract Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Tambah Kontrak User</h3>
                    <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Pilih User</label>
                    <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                        {isLoadingUsers ? (
                            <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                                <RefreshCw className="animate-spin" size={16} /> Memuat user...
                            </div>
                        ) : availableUsers.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {availableUsers.map((user) => {
                                    const hasContract = user.contract_status && user.contract_status !== 'Not Generated';
                                    const isSelected = selectedUser?.id === user.id;
                                    
                                    return (
                                        <div 
                                            key={user.id}
                                            onClick={() => !hasContract && setSelectedUser(user)}
                                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                hasContract 
                                                    ? 'bg-slate-50 opacity-60 cursor-not-allowed' 
                                                    : isSelected 
                                                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                                                        : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>
                                                <p className={`font-semibold ${hasContract ? 'text-slate-500' : 'text-slate-800'}`}>
                                                    {user.username || user.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                            {hasContract ? (
                                                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-medium">
                                                    Sudah Ada Kontrak
                                                </span>
                                            ) : isSelected && (
                                                <CheckCircle size={18} className="text-blue-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500">Tidak ada user tersedia.</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsAddUserModalOpen(false)}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleAddContractUser}
                        disabled={!selectedUser}
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-colors shadow-lg ${
                            selectedUser 
                                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-100' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        Buat Kontrak
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Kontrak?</h3>
                    <p className="text-slate-500 text-sm">
                        Anda yakin ingin menghapus data kontrak untuk <span className="font-bold text-slate-700">{itemToDelete.name}</span>? 
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            setDeleteModalOpen(false);
                            setItemToDelete(null);
                        }}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
