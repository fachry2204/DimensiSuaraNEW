import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Users, 
    Shield, 
    User as UserIcon,
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    Plus,
    Mail,
    Lock,
    Trash2,
    Edit
} from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';
import { AlertModal, AlertState } from '../components/AlertModal';

interface Props {
  currentUserRole?: string;
  token: string | null;
}

export const UserManagement: React.FC<Props> = ({ currentUserRole, token: propToken }) => {
  // --- USER MANAGEMENT LOGIC ---
  const [userTab, setUserTab] = useState<'REGISTERED' | 'INTERNAL' | 'ALL'>('REGISTERED');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const token = propToken || '';
  const userRole = currentUserRole || '';
  const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [statusDraft, setStatusDraft] = useState<User['status'] | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // Add/Edit User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addUserContext, setAddUserContext] = useState<'INTERNAL' | 'REGISTERED'>('INTERNAL');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Operator' as 'Admin' | 'Operator' | 'User',
    password: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Pending' | 'Review' | 'Approved'
  });

  const navigate = useNavigate();
  // Fetch Users
  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
        const data = await api.getUsers(token);
        setUsers(data);
    } catch (err) {
        console.error("Failed to fetch users:", err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) return;
    if (!editingUserId && !newUser.password) return;
    
    setIsSubmitting(true);
    try {
        if (editingUserId) {
            const payload: any = { ...newUser };
            if (!payload.password) delete payload.password;
            
            const response = await api.updateUser(token, editingUserId, payload);
            setUsers(prev => prev.map(u => u.id === editingUserId ? response.user : u));
            setAlertState({
                isOpen: true,
                title: 'Sukses',
                message: 'User berhasil diperbarui',
                type: 'success'
            });
        } else {
            const payload = {
                ...newUser,
                role: addUserContext === 'REGISTERED' ? 'User' : newUser.role,
                status: addUserContext === 'REGISTERED' ? 'Pending' : newUser.status
            };
            const response = await api.createUser(token, payload);
            setUsers(prev => [response.user, ...prev]);
            setAlertState({
                isOpen: true,
                title: 'Sukses',
                message: 'User berhasil dibuat',
                type: 'success'
            });
        }
        closeModal();
    } catch (err: any) {
        setAlertState({
            isOpen: true,
            title: 'Gagal',
            message: `Gagal menyimpan user: ${err.message}`,
            type: 'error'
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
      setEditingUserId(user.id);
      setNewUser({
          name: user.name,
          email: user.email,
          role: user.role as any,
          password: '',
          status: user.status as any
      });
      setAddUserContext(user.role === 'User' ? 'REGISTERED' : 'INTERNAL');
      setShowAddUserModal(true);
  };

  const closeModal = () => {
      setShowAddUserModal(false);
      setEditingUserId(null);
      setNewUser({ name: '', email: '', role: 'Operator', password: '', status: 'Active' });
  };

  const handleDeleteUser = (user: User) => {
      setUserToDelete(user);
  };

  const confirmDelete = async () => {
      if (!userToDelete) return;
      
      setIsDeleting(true);
      try {
          await api.deleteUser(token, userToDelete.id);
          setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
          setUserToDelete(null);
          setAlertState({
            isOpen: true,
            title: 'Sukses',
            message: 'User berhasil dihapus',
            type: 'success'
          });
      } catch (err: any) {
          setAlertState({
            isOpen: true,
            title: 'Gagal',
            message: `Gagal menghapus user: ${err.message}`,
            type: 'error'
          });
      } finally {
          setIsDeleting(false);
      }
  };

  const handleImpersonate = async (user: User) => {
    if (!token) return;
    
    try {
        const res = await api.impersonateUser(token, user.id);
        
        // Save current admin session to restore later
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', localStorage.getItem('cms_user') || '');
        localStorage.setItem('admin_role', localStorage.getItem('cms_role') || 'Admin');
        
        // Set new impersonated session
        localStorage.setItem('cms_token', res.token);
        localStorage.setItem('cms_user', res.user.username);
        localStorage.setItem('cms_role', res.user.role || 'User');
        localStorage.setItem('is_impersonating', 'true');
        
        // Reload page to apply changes
        window.location.href = '/';
    } catch (err: any) {
        setAlertState({
            isOpen: true,
            title: 'Gagal Impersonate',
            message: err.message || 'Terjadi kesalahan saat mencoba impersonate',
            type: 'error'
        });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (userTab === 'INTERNAL') {
        return matchesSearch && (user.role === 'Admin' || user.role === 'Operator');
    } else if (userTab === 'REGISTERED') {
        return matchesSearch && user.role === 'User';
    } else {
        return matchesSearch; // ALL
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
       <div className="mb-6 border-b border-gray-200 pb-4 md:hidden">
            <h1 className="text-lg text-white tracking-tight flex items-center gap-2">
                <Users size={22} className="text-slate-400" />
                User Management
            </h1>
            <p className="text-slate-400 mt-1 ml-8 text-[12px]">Manage system access and registered users.</p>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">User Management</h2>
                        <p className="text-sm text-slate-400">Manage system access and registered users.</p>
                    </div>
                </div>
                
                {(userTab === 'INTERNAL' || userTab === 'REGISTERED') && (
                    <button 
                        onClick={() => {
                            setAddUserContext(userTab === 'REGISTERED' ? 'REGISTERED' : 'INTERNAL');
                            setNewUser({
                                name: '',
                                email: '',
                                role: userTab === 'REGISTERED' ? 'User' : 'Operator',
                                password: ''
                            });
                            setShowAddUserModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add New User
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setUserTab('REGISTERED')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        userTab === 'REGISTERED' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <UserIcon size={16} />
                    Registered Users
                </button>
                <button
                    onClick={() => setUserTab('INTERNAL')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        userTab === 'INTERNAL' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Shield size={16} />
                    Internal Users (Admin/Operator)
                </button>
                <button
                    onClick={() => setUserTab('ALL')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        userTab === 'ALL' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Users size={16} />
                    All Users
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            {userTab !== 'INTERNAL' && (
                                <>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aggregator %</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Publishing %</th>
                                </>
                            )}
                            {userTab !== 'REGISTERED' && (
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            )}
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reject Date</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {(user.full_name || user.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{user.full_name || user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                                    </td>
                                    {userTab !== 'INTERNAL' && (
                                        <>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {user.role !== 'Admin' && user.aggregator_percentage !== null && user.aggregator_percentage !== undefined ? `${user.aggregator_percentage}%` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {user.role !== 'Admin' && user.publishing_percentage !== null && user.publishing_percentage !== undefined ? `${user.publishing_percentage}%` : '-'}
                                            </td>
                                        </>
                                    )}
                                    {userTab !== 'REGISTERED' && (
                                      <td className="py-3 px-4">
                                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                              user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                              user.role === 'Operator' ? 'bg-blue-100 text-blue-800' :
                                              'bg-gray-100 text-gray-800'
                                          }`}>
                                              {user.role}
                                          </span>
                                      </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                            user.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                            user.status === 'Review' ? 'bg-blue-100 text-blue-700' :
                                            user.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            user.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            user.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            user.status === 'Inactive' ? 'bg-gray-100 text-gray-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {user.status === 'Rejected' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                        {user.registeredDate || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                        {user.joinedDate || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                        {user.rejectedDate || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {userTab !== 'INTERNAL' && (
                                                <Link
                                                    to={`/users/${user.id}`}
                                                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold"
                                                    title="View User"
                                                >
                                                    View
                                                </Link>
                                            )}
                                            {userTab === 'INTERNAL' && (
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold flex items-center gap-1"
                                                    title="Edit User"
                                                >
                                                    <Edit size={12} /> Edit
                                                </button>
                                            )}
                                            {user.role === 'User' && userRole === 'Admin' && (
                                                <button
                                                    onClick={() => handleImpersonate(user)}
                                                    disabled={isImpersonating}
                                                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-bold flex items-center gap-1 disabled:opacity-50"
                                                    title="Impersonate User"
                                                >
                                                    <UserIcon size={12} /> Impersonate
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteUser(user)}
                                                className="text-red-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={userTab === 'INTERNAL' ? 7 : (userTab === 'REGISTERED' ? 8 : 9)} className="py-6 text-center text-slate-500 text-sm">
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
       </div>

       {/* Add User Modal */}
       {showAddUserModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-800">
                            {editingUserId ? 'Edit User' : (addUserContext === 'INTERNAL' ? 'Add Internal User' : 'Add Registered User')}
                        </h3>
                        <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={24} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="John Doe"
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="john@dimensisuara.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                />
                            </div>
                        </div>
                        {addUserContext === 'INTERNAL' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select 
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value as 'Admin' | 'Operator' | 'User'})}
                                    >
                                        <option value="Operator">Operator</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <div className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-700">
                                    User
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                                {editingUserId && <span className="text-slate-400 text-xs font-normal ml-2">(Leave blank to keep unchanged)</span>}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="password" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="••••••••"
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-slate-50">
                        <button 
                            onClick={closeModal}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveUser}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editingUserId ? 'Update User' : 'Create User'
                            )}
                        </button>
                    </div>
                </div>
            </div>
       )}

       {/* View User Modal */}
       {showUserViewModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-scale-in">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-base font-bold text-slate-800">User Detail</h3>
                        <button onClick={() => {
                            setShowUserViewModal(false);
                            setStatusDraft(null);
                            setRejectReason('');
                        }} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={20} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="space-y-3">
                            <div>
                                <div className="font-medium text-slate-800 text-base">{selectedUser.name}</div>
                                <div className="text-xs text-slate-500">{selectedUser.email}</div>
                                <div className="text-xs text-slate-500">Role: {selectedUser.role}</div>
                                <div className="text-xs text-slate-500">Joined: {selectedUser.registeredDate}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <tbody className="[&>tr>td]:py-2 [&>tr>td]:px-3 [&>tr:nth-child(even)]:bg-slate-50">
                                            <tr><td className="text-slate-600">Account Type</td><td className="font-medium">{selectedUser.account_type || '-'}</td></tr>
                                            {(selectedUser.account_type === 'COMPANY') && (
                                                <tr><td className="text-slate-600">Company</td><td className="font-medium">{selectedUser.company_name || '-'}</td></tr>
                                            )}
                                            <tr><td className="text-slate-600">Full Name</td><td className="font-medium">{selectedUser.full_name || '-'}</td></tr>
                                            <tr><td className="text-slate-600">NIK</td><td className="font-medium">{selectedUser.nik || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Phone</td><td className="font-medium">{selectedUser.phone || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Address</td><td className="font-medium">{selectedUser.address || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Country</td><td className="font-medium">{selectedUser.country || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Province</td><td className="font-medium">{selectedUser.province || '-'}</td></tr>
                                            <tr><td className="text-slate-600">City</td><td className="font-medium">{selectedUser.city || '-'}</td></tr>
                                            <tr><td className="text-slate-600">District</td><td className="font-medium">{selectedUser.district || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Subdistrict</td><td className="font-medium">{selectedUser.subdistrict || '-'}</td></tr>
                                            <tr><td className="text-slate-600">Postal Code</td><td className="font-medium">{selectedUser.postal_code || '-'}</td></tr>
                                            {(selectedUser.account_type === 'COMPANY') && (
                                                <>
                                                    <tr><td className="text-slate-600">PIC Name</td><td className="font-medium">{selectedUser.pic_name || '-'}</td></tr>
                                                    <tr><td className="text-slate-600">PIC Position</td><td className="font-medium">{selectedUser.pic_position || '-'}</td></tr>
                                                    <tr><td className="text-slate-600">PIC Phone</td><td className="font-medium">{selectedUser.pic_phone || '-'}</td></tr>
                                                </>
                                            )}
                                            <tr><td className="text-slate-600">Approved</td><td className="font-medium">{selectedUser.joinedDate || '-'}</td></tr>
                                            {(selectedUser.status === 'Rejected' || statusDraft === 'Rejected') && (
                                                <>
                                                    <tr><td className="text-slate-600">Reject Date</td><td className="font-medium">{selectedUser.rejectedDate || '-'}</td></tr>
                                                    <tr><td className="text-slate-600">Rejection Reason</td><td className="font-medium">{selectedUser.rejection_reason || '-'}</td></tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-slate-800">Documents</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedUser.ktp_doc_path && (
                                            <div className="border border-slate-200 rounded-xl p-3">
                                                <div className="text-xs font-medium mb-2">KTP</div>
                                                {selectedUser.ktp_doc_path.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe src={selectedUser.ktp_doc_path} className="w-full h-40 rounded-md" />
                                                ) : (
                                                    <img src={selectedUser.ktp_doc_path} alt="KTP" className="w-full h-40 object-cover rounded-md" />
                                                )}
                                                <div className="flex gap-3 mt-2">
                                                    <a href={selectedUser.ktp_doc_path} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Preview</a>
                                                    <a href={selectedUser.ktp_doc_path} download className="text-slate-600 text-xs">Download</a>
                                                </div>
                                            </div>
                                        )}
                                        {selectedUser.npwp_doc_path && (
                                            <div className="border border-slate-200 rounded-xl p-3">
                                                <div className="text-xs font-medium mb-2">NPWP</div>
                                                {selectedUser.npwp_doc_path.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe src={selectedUser.npwp_doc_path} className="w-full h-40 rounded-md" />
                                                ) : (
                                                    <img src={selectedUser.npwp_doc_path} alt="NPWP" className="w-full h-40 object-cover rounded-md" />
                                                )}
                                                <div className="flex gap-3 mt-2">
                                                    <a href={selectedUser.npwp_doc_path} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Preview</a>
                                                    <a href={selectedUser.npwp_doc_path} download className="text-slate-600 text-xs">Download</a>
                                                </div>
                                            </div>
                                        )}
                                        {(selectedUser.account_type === 'COMPANY') && selectedUser.nib_doc_path && (
                                            <div className="border border-slate-200 rounded-xl p-3">
                                                <div className="text-xs font-medium mb-2">NIB</div>
                                                {selectedUser.nib_doc_path.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe src={selectedUser.nib_doc_path} className="w-full h-40 rounded-md" />
                                                ) : (
                                                    <img src={selectedUser.nib_doc_path} alt="NIB" className="w-full h-40 object-cover rounded-md" />
                                                )}
                                                <div className="flex gap-3 mt-2">
                                                    <a href={selectedUser.nib_doc_path} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Preview</a>
                                                    <a href={selectedUser.nib_doc_path} download className="text-slate-600 text-xs">Download</a>
                                                </div>
                                            </div>
                                        )}
                                        {(selectedUser.account_type === 'COMPANY') && selectedUser.kemenkumham_doc_path && (
                                            <div className="border border-slate-200 rounded-xl p-3">
                                                <div className="text-xs font-medium mb-2">Kemenkumham</div>
                                                {selectedUser.kemenkumham_doc_path.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe src={selectedUser.kemenkumham_doc_path} className="w-full h-40 rounded-md" />
                                                ) : (
                                                    <img src={selectedUser.kemenkumham_doc_path} alt="Kemenkumham" className="w-full h-40 object-cover rounded-md" />
                                                )}
                                                <div className="flex gap-3 mt-2">
                                                    <a href={selectedUser.kemenkumham_doc_path} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Preview</a>
                                                    <a href={selectedUser.kemenkumham_doc_path} download className="text-slate-600 text-xs">Download</a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-800">Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        setStatusDraft('Pending');
                                        setRejectReason('');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                                        statusDraft === 'Pending' ? 'bg-yellow-100 border-yellow-200 text-yellow-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusDraft('Review');
                                        setRejectReason('');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                                        statusDraft === 'Review' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    Di Riview
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusDraft('Approved');
                                        setRejectReason('');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                                        statusDraft === 'Approved' ? 'bg-green-100 border-green-200 text-green-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    Di Approved
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusDraft('Rejected');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                                        statusDraft === 'Rejected' ? 'bg-red-100 border-red-200 text-red-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    Di Tolak
                                </button>
                            </div>
                        </div>
                        {statusDraft === 'Rejected' && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-800 font-semibold">Alasan penolakan (wajib diisi)</p>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Tulis alasan penolakan di sini..."
                                    className={`w-full min-h-20 p-2 border rounded-xl text-sm ${!rejectReason?.trim() ? 'border-red-300' : 'border-slate-200'}`}
                                />
                                {!rejectReason?.trim() && <p className="text-xs text-red-500">Alasan penolakan wajib diisi.</p>}
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-slate-50">
                        <button 
                            onClick={() => setShowUserViewModal(false)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={async () => {
                                if (!selectedUser) return;
                                const s = statusDraft || selectedUser.status;
                                if (s === 'Rejected' && (!rejectReason || !rejectReason.trim())) {
                                    setAlertState({
                                        isOpen: true,
                                        title: 'Perhatian',
                                        message: 'Alasan penolakan wajib diisi',
                                        type: 'warning'
                                    });
                                    return;
                                }
                                try {
                                    const res = await api.updateUserStatus(
                                        token,
                                        selectedUser.id,
                                        s,
                                        s === 'Rejected' ? rejectReason.trim() : undefined
                                    );
                                    setUsers(prev => prev.map(u => {
                                        if (u.id !== selectedUser.id) return u;
                                        return {
                                            ...u,
                                            ...res.user,
                                            registeredDate: (res.user as any).registeredDate ?? u.registeredDate,
                                            joinedDate: (res.user as any).joinedDate ?? u.joinedDate,
                                            rejectedDate: (res.user as any).rejectedDate ?? u.rejectedDate,
                                            rejection_reason: (res.user as any).rejection_reason ?? u.rejection_reason
                                        } as User;
                                    }));
                                    setSelectedUser(prev => {
                                        const merged = {
                                            ...(prev as User),
                                            ...res.user,
                                            registeredDate: (res.user as any).registeredDate ?? (prev as User).registeredDate,
                                            joinedDate: (res.user as any).joinedDate ?? (prev as User).joinedDate,
                                            rejectedDate: (res.user as any).rejectedDate ?? (prev as User).rejectedDate,
                                            rejection_reason: (res.user as any).rejection_reason ?? (prev as User).rejection_reason
                                        } as User;
                                        return merged;
                                    });
                                    setStatusDraft(res.user.status);
                                    if (s !== 'Rejected') setRejectReason('');
                                    setAlertState({
                                        isOpen: true,
                                        title: 'Sukses',
                                        message: 'Perubahan status berhasil',
                                        type: 'success'
                                    });
                                    setShowUserViewModal(false);
                                } catch (err: any) {
                                    setAlertState({
                                        isOpen: true,
                                        title: 'Gagal',
                                        message: err.message,
                                        type: 'error'
                                    });
                                }
                            }}
                            className={`px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 ${statusDraft === 'Rejected' && !rejectReason?.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
       )}

       {/* Delete Confirmation Modal */}
       {userToDelete && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-scale-in">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus User?</h3>
                    <p className="text-slate-600 mb-6 text-sm">
                        Apakah Anda yakin ingin menghapus user <span className="font-semibold">{userToDelete.full_name || userToDelete.name}</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setUserToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};
