import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Globe, Edit2, X, Image as ImageIcon, Upload, Shield, Server, Database, GitBranch, RefreshCw, Play, AlertTriangle, CheckCircle, Terminal, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  aggregators: string[];
  onSaveAggregators: (list: string[]) => void;
}

interface BrandingSettings {
    logo: string | null;
    favicon_url: string | null;
    login_background: string | null;
    login_title: string;
    login_footer: string;
    login_button_color: string;
    login_form_bg_color: string;
    enable_registration: string; // 'true' or 'false'
    login_title_color: string;
    login_footer_color: string;
    login_form_bg_opacity: number;
    login_bg_opacity: number;
    login_glass_effect: string; // 'true' or 'false'
    login_form_text_color: string;
}

interface SystemCheckResult {
    status: string;
    missing: string[];
    checked_at: string;
}

interface UpdateCheckResult {
    updatesAvailable: boolean;
    behindCount: number;
    localHash: string;
    remoteHash: string;
    repo: string;
}

interface SecurityLog {
    id: number;
    user_identifier: string;
    ip_address: string;
    country: string;
    attack_type: string;
    details: string;
    created_at: string;
}

interface SystemLog {
    id: number;
    check_type: 'UPDATE_CHECK' | 'DB_INTEGRITY_CHECK';
    status: string;
    details: string;
    created_at: string;
}

export const Settings: React.FC<Props> = ({ aggregators, onSaveAggregators }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'login_page' | 'system' | 'security' | 'gateway'>('general');
  const [token] = useState(localStorage.getItem('cms_token') || '');

  // --- AGGREGATOR LOGIC ---
  const [newAgg, setNewAgg] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // --- BRANDING LOGIC ---
  const [branding, setBranding] = useState<BrandingSettings>({ 
      logo: null, 
      favicon_url: null,
      login_background: null,
      login_title: '',
      login_footer: '',
      login_button_color: '#2563eb', // Fallback
      login_form_bg_color: '#ffffff', // Fallback
      enable_registration: 'true',
      login_title_color: '#1e293b',
      login_footer_color: '#94a3b8',
      login_form_bg_opacity: 90,
      login_bg_opacity: 100,
      login_glass_effect: 'false',
      login_form_text_color: '#334155'
  });
  const [isLoadingBranding, setIsLoadingBranding] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  // --- SYSTEM CHECK LOGIC ---
  const [dbStatus, setDbStatus] = useState<SystemCheckResult | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateCheckResult | null>(null);
  const [checkingSystem, setCheckingSystem] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [updatingSystem, setUpdatingSystem] = useState(false);
  const [fixingDb, setFixingDb] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // --- SECURITY LOGS LOGIC ---
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // --- GATEWAY SETTINGS (SMTP & MPWA) ---
  const [smtp, setSmtp] = useState<{ host: string; port: number; secure: boolean; user: string; pass: string; from_email: string; from_name: string }>({
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from_email: '',
      from_name: ''
  });
  const [mpwa, setMpwa] = useState<{ base_url: string; token: string; device_id: string }>({
      base_url: '',
      token: '',
      device_id: ''
  });
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailMsg, setTestEmailMsg] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testWaPhone, setTestWaPhone] = useState('');
  const [testWaMsg, setTestWaMsg] = useState('');
  const [testingWa, setTestingWa] = useState(false);

  useEffect(() => {
      if (activeTab === 'general' || activeTab === 'login_page') {
          fetchBranding();
      } else if (activeTab === 'system') {
          // handleCheckSystem(); // Removed auto-check
          fetchSystemLogs();
      } else if (activeTab === 'security') {
          fetchSecurityLogs();
      } else if (activeTab === 'gateway') {
          fetchGatewaySettings();
      }
  }, [activeTab]);

  const fetchBranding = async () => {
      try {
          const data = await api.getBranding();
          if (data) {
              setBranding(data);
          }
      } catch (err) {
          console.error("Failed to fetch branding:", err);
      }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLogoFile(e.target.files[0]);
      }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setBgFile(e.target.files[0]);
      }
  };

  const handleSaveBranding = async () => {
      setIsLoadingBranding(true);
      const formData = new FormData();
      
      // Append text fields FIRST (best practice for multer/busboy)
      formData.append('login_title', branding.login_title || '');
      formData.append('login_footer', branding.login_footer || '');
      formData.append('login_button_color', branding.login_button_color || '#2563eb');
      formData.append('login_form_bg_color', branding.login_form_bg_color || '#ffffff');
      formData.append('enable_registration', String(branding.enable_registration)); // Ensure string
      formData.append('login_title_color', branding.login_title_color || '#1e293b');
      formData.append('login_footer_color', branding.login_footer_color || '#94a3b8');
      formData.append('login_form_bg_opacity', String(branding.login_form_bg_opacity ?? 90));
      formData.append('login_bg_opacity', String(branding.login_bg_opacity ?? 100));
      formData.append('login_glass_effect', String(branding.login_glass_effect ?? 'false'));
      formData.append('login_form_text_color', String(branding.login_form_text_color || '#334155'));

      // Append files LAST
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);
      if (bgFile) formData.append('login_background', bgFile);
      
      try {
          const data = await api.updateBranding(token, formData);
          if (data && data.branding) {
              setBranding(data.branding);
              setLogoFile(null);
              setFaviconFile(null);
              setBgFile(null);
              alert('Branding updated successfully!');
              // Reload page to reflect changes
              window.location.reload();
          } else {
              alert('Failed to update branding: No data returned');
          }
      } catch (err) {
          console.error("Error updating branding:", err);
          alert('Error updating branding: ' + (err as Error).message);
      } finally {
          setIsLoadingBranding(false);
      }
  };

  const handleAddAggregator = () => {
    const trimmed = newAgg.trim();
    if (!trimmed) return;
    const newList = [...aggregators, trimmed];
    onSaveAggregators(newList);
    setNewAgg('');
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(aggregators[index] || '');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    const newList = aggregators.map((agg, idx) => (idx === editingIndex ? trimmed : agg));
    onSaveAggregators(newList);
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleRequestDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex === null) return;
    const newList = aggregators.filter((_, i) => i !== deleteIndex);
    onSaveAggregators(newList);
    setDeleteIndex(null);
    if (editingIndex === deleteIndex) {
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleCancelDelete = () => {
    setDeleteIndex(null);
  };

  // --- SYSTEM CHECK HANDLERS ---
  const handleCheckDb = async () => {
      setCheckingDb(true);
      try {
          const dbRes = await fetch('/api/settings/system/check-db', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (dbRes.ok) {
              const data = await dbRes.json();
              setDbStatus(data);
          }
          fetchSystemLogs();
      } catch (err) {
          console.error("DB check failed:", err);
      } finally {
          setCheckingDb(false);
      }
  };

  const handleCheckSystem = async () => {
       setCheckingSystem(true);
       setUpdateMessage(null);
       try {
           // Check Updates
           const upRes = await fetch('/api/settings/system/check-update', {
                headers: { 'Authorization': `Bearer ${token}` }
           });
           
           if (upRes.ok) {
               const data = await upRes.json();
               if (data.error) {
                   setUpdateMessage("Check failed: " + data.error);
                   // Still set status so we can see partial info if any
                   setUpdateStatus(data);
               } else {
                   setUpdateStatus(data);
               }
           } else {
               const errData = await upRes.json().catch(() => ({}));
               setUpdateMessage("Check failed: " + (errData.error || upRes.statusText));
           }
           
           // Refresh logs after check
           fetchSystemLogs();
       } catch (err: any) {
           console.error("System check failed:", err);
           setUpdateMessage("System check failed: " + err.message);
       } finally {
           setCheckingSystem(false);
       }
   };

  const fetchSystemLogs = async () => {
      try {
          const res = await fetch('/api/settings/system/logs', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setSystemLogs(data);
              setCurrentPage(1); // Reset to first page on refresh
          }
      } catch (err) {
          console.error("Failed to fetch system logs:", err);
      }
  };

  const fetchGatewaySettings = async () => {
      setLoadingGateway(true);
      try {
          const data = await api.getGatewaySettings(token);
          if (data?.smtp) setSmtp({
              host: data.smtp.host || '',
              port: Number(data.smtp.port ?? 587),
              secure: Boolean(data.smtp.secure),
              user: data.smtp.user || '',
              pass: data.smtp.pass || '',
              from_email: data.smtp.from_email || '',
              from_name: data.smtp.from_name || ''
          });
          if (data?.mpwa) setMpwa({
              base_url: data.mpwa.base_url || '',
              token: data.mpwa.token || '',
              device_id: data.mpwa.device_id || ''
          });
      } catch (err) {
          console.error("Failed to fetch gateway settings:", err);
      } finally {
          setLoadingGateway(false);
      }
  };

  const handleSaveGateway = async () => {
      setSavingGateway(true);
      try {
          await api.updateGatewaySettings(token, { smtp, mpwa });
          alert('Gateway settings saved');
      } catch (err: any) {
          alert('Failed to save gateway settings: ' + (err?.message || 'Unknown error'));
      } finally {
          setSavingGateway(false);
      }
  };

  const currentLogs = systemLogs.slice(
      (currentPage - 1) * logsPerPage,
      currentPage * logsPerPage
  );
  
  const totalPages = Math.ceil(systemLogs.length / logsPerPage);

  const formatLogDetails = (details: string, type: string) => {
    try {
        const data = JSON.parse(details);
        if (type === 'UPDATE_CHECK') {
            if (data.updatesAvailable) {
                return `Update available (${data.behindCount} commits behind). Remote: ${data.remoteHash}`;
            }
            if (data.error) {
                 return `Check failed: ${data.error}`;
            }
            // For successful check with no updates, status might not be in the JSON detail
            if (data.updatesAvailable === false) {
                 return `System is up to date. Local commit: ${data.localHash}`;
            }
        } else if (type === 'DB_INTEGRITY_CHECK') {
             if (data.status === 'OK' && (!data.missing || data.missing.length === 0)) {
                 return 'Database structure verified. No issues found.';
             }
             if (data.missing && data.missing.length > 0) {
                 return `Missing: ${data.missing.join(', ')}`;
             }
             return `Status: ${data.status}`;
        }
        return details; // Fallback
    } catch (e) {
        return details;
    }
  };

  const handleUpdateSystem = async () => {
      if (!confirm("Are you sure you want to update the system? This will pull changes, install dependencies, build, and requires a manual restart.")) return;
      
      setUpdatingSystem(true);
      setUpdateMessage("Updating system... Please wait, this may take a while.");
      try {
          const res = await fetch('/api/settings/system/update', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
              setUpdateMessage(data.message);
              alert(data.message);
          } else {
              setUpdateMessage("Update failed: " + data.error);
          }
      } catch (err: any) {
          setUpdateMessage("Update failed: " + err.message);
      } finally {
          setUpdatingSystem(false);
      }
  };

  const handleFixDb = async () => {
      if (!confirm("Are you sure you want to attempt to repair the database structure? This will create missing tables and columns.")) return;

      setFixingDb(true);
      try {
          const res = await fetch('/api/settings/system/fix-db', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
              alert(data.message);
              handleCheckDb(); // Re-check
          } else {
              alert("Failed to repair database: " + data.error);
          }
      } catch (err: any) {
          alert("Error repairing database: " + err.message);
      } finally {
          setFixingDb(false);
      }
  };

  // --- SECURITY LOGS HANDLERS ---
  const fetchSecurityLogs = async () => {
      setLoadingLogs(true);
      try {
          const res = await fetch('/api/settings/security/logs', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
                const data = await res.json();
                // Filter out LOGIN_SUCCESS logs as requested
                const filteredData = data.filter((log: SecurityLog) => log.attack_type !== 'LOGIN_SUCCESS');
                setSecurityLogs(filteredData);
            }
      } catch (err) {
          console.error("Failed to fetch security logs:", err);
      } finally {
          setLoadingLogs(false);
      }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
       <div className="mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-lg text-slate-800 tracking-tight flex items-center gap-2">
                <SettingsIcon size={22} className="text-slate-400" />
                Settings
            </h1>
            <p className="text-slate-500 mt-1 ml-8 text-[12px]">Configure your CMS parameters and monitor system health.</p>
       </div>

       {/* Tabs Navigation */}
       <div className="flex gap-4 mb-8 border-b border-gray-100 pb-1 overflow-x-auto">
           <button 
               onClick={() => setActiveTab('general')}
               className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                   activeTab === 'general' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
               }`}
           >
               General Settings
               {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
           </button>
           <button 
               onClick={() => setActiveTab('login_page')}
               className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                   activeTab === 'login_page' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
               }`}
           >
               Halaman Login
               {activeTab === 'login_page' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
           </button>
           <button 
               onClick={() => setActiveTab('system')}
               className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                   activeTab === 'system' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
               }`}
           >
               Cek System
               {activeTab === 'system' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
           </button>
           <button 
               onClick={() => setActiveTab('security')}
               className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                   activeTab === 'security' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
               }`}
           >
               Security Logs
               {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
           </button>
           <button 
               onClick={() => setActiveTab('gateway')}
               className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                   activeTab === 'gateway' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
               }`}
           >
               Gateway
               {activeTab === 'gateway' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
           </button>
       </div>

       {/* GENERAL TAB */}
       {activeTab === 'general' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Release Configuration */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Release Configuration</h2>
                            <p className="text-sm text-slate-500">Manage distribution partners (Aggregators).</p>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Active Aggregators</label>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                value={newAgg}
                                onChange={(e) => setNewAgg(e.target.value)}
                                placeholder="Add new aggregator (e.g. Tunecore)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                            <button 
                                onClick={handleAddAggregator}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-xl border border-gray-200 overflow-hidden">
                            {aggregators.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">No aggregators defined.</div>
                            )}
                            <ul className="divide-y divide-gray-200">
                                {aggregators.map((agg, idx) => (
                                    <li key={idx} className="px-4 py-3 flex justify-between items-center bg-white">
                                        {editingIndex === idx ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                                    placeholder="Aggregator name"
                                                />
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-2.5 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-100 flex items-center gap-1"
                                                >
                                                    <X size={14} />
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-medium text-slate-700 text-sm">{agg}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleStartEdit(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit aggregator"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRequestDelete(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete aggregator"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">These options will appear when changing a release status to "Processing".</p>
                    </div>
               </div>
           </div>
       )}

       {/* LOGIN PAGE TAB */}
       {activeTab === 'login_page' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Tampilan Halaman Login</h2>
                            <p className="text-sm text-slate-500">Sesuaikan tampilan halaman login dan registrasi.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Logo System</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                {logoFile ? (
                                    <div className="relative">
                                        <img src={URL.createObjectURL(logoFile)} alt="Preview" className="h-32 object-contain mb-2" />
                                        <button onClick={() => setLogoFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                                        <p className="text-xs text-slate-500 text-center">{logoFile.name}</p>
                                    </div>
                                ) : branding.logo ? (
                                    <div className="text-center">
                                        <img src={branding.logo} alt="Current Logo" className="h-32 object-contain mb-3 mx-auto" />
                                        <p className="text-xs text-slate-400">Logo Saat Ini</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">Belum ada logo</p>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="mt-4 pointer-events-none">
                                    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                        {logoFile ? 'Ganti File' : 'Upload Logo'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Login Background Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Background Login Page</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                 {bgFile ? (
                                    <div className="relative w-full h-32">
                                        <img src={URL.createObjectURL(bgFile)} alt="Preview" className="w-full h-full object-cover rounded-lg mb-2" />
                                        <button onClick={() => setBgFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                                        <p className="text-xs text-slate-500 text-center mt-1">{bgFile.name}</p>
                                    </div>
                                ) : branding.login_background ? (
                                    <div className="w-full text-center">
                                        <div className="h-32 w-full rounded-lg overflow-hidden mb-3 relative group">
                                            <img src={branding.login_background} alt="Current Background" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-xs text-slate-400">Background Saat Ini</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">Belum ada background</p>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBgChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="mt-4 pointer-events-none">
                                    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                        {bgFile ? 'Ganti File' : 'Upload Background'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Teks Judul</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={branding.login_title_color?.startsWith('#') ? branding.login_title_color : '#1e293b'}
                                    onChange={(e) => setBranding({...branding, login_title_color: e.target.value})}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={branding.login_title_color || ''}
                                    onChange={(e) => setBranding({...branding, login_title_color: e.target.value})}
                                    placeholder="#1e293b"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Favicon Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Favicon</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                {faviconFile ? (
                                    <div className="relative">
                                        <img src={URL.createObjectURL(faviconFile)} alt="Preview" className="h-16 w-16 object-contain mb-2" />
                                        <button onClick={() => setFaviconFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                                        <p className="text-xs text-slate-500 text-center">{faviconFile.name}</p>
                                    </div>
                                ) : branding.favicon_url ? (
                                    <div className="text-center">
                                        <img src={branding.favicon_url} alt="Current Favicon" className="h-16 w-16 object-contain mb-3 mx-auto" />
                                        <p className="text-xs text-slate-400">Favicon Saat Ini</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <Globe size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">Belum ada favicon</p>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    accept="image/x-icon,image/png,image/svg+xml"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFaviconFile(e.target.files[0]);
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="mt-4 pointer-events-none">
                                    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                        {faviconFile ? 'Ganti File' : 'Upload Favicon'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Teks Footer</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={branding.login_footer_color?.startsWith('#') ? branding.login_footer_color : '#94a3b8'}
                                    onChange={(e) => setBranding({...branding, login_footer_color: e.target.value})}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={branding.login_footer_color || ''}
                                    onChange={(e) => setBranding({...branding, login_footer_color: e.target.value})}
                                    placeholder="#94a3b8"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Opacity Background Form (%)</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={branding.login_form_bg_opacity ?? 90}
                                    onChange={(e) => setBranding({...branding, login_form_bg_opacity: parseInt(e.target.value)})}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="w-12 text-center font-mono text-sm font-bold text-slate-700 bg-slate-100 py-1 rounded-lg">
                                    {branding.login_form_bg_opacity ?? 90}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Opacity Background Halaman (%)</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={branding.login_bg_opacity ?? 100}
                                    onChange={(e) => setBranding({...branding, login_bg_opacity: parseInt(e.target.value)})}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="w-12 text-center font-mono text-sm font-bold text-slate-700 bg-slate-100 py-1 rounded-lg">
                                    {branding.login_bg_opacity ?? 100}%
                                </span>
                            </div>
                        </div>

                        {/* Glass Effect Toggle */}
                        <div className="mb-4 col-span-1 md:col-span-2">
                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={branding.login_glass_effect === 'true'}
                                    onChange={(e) => setBranding({...branding, login_glass_effect: e.target.checked ? 'true' : 'false'})}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block text-sm font-bold text-slate-700">Aktifkan Glass Effect</span>
                                    <span className="block text-xs text-slate-500">Jika aktif, form login akan menjadi transparan dengan efek blur dan shadow berwarna.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Text & Color Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Judul System (H2)</label>
                            <input 
                                type="text" 
                                value={branding.login_title || ''}
                                onChange={(e) => setBranding({...branding, login_title: e.target.value})}
                                placeholder="Contoh: Agregator & Publishing Musik"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Footer Text (P)</label>
                            <input 
                                type="text" 
                                value={branding.login_footer || ''}
                                onChange={(e) => setBranding({...branding, login_footer: e.target.value})}
                                placeholder="Contoh: Protected CMS Area"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Tombol Login Page</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={branding.login_button_color?.startsWith('#') ? branding.login_button_color : '#2563eb'}
                                    onChange={(e) => setBranding({...branding, login_button_color: e.target.value})}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={branding.login_button_color || ''}
                                    onChange={(e) => setBranding({...branding, login_button_color: e.target.value})}
                                    placeholder="#2563eb or linear-gradient(...)"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Background Form Login</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={branding.login_form_bg_color?.startsWith('#') ? branding.login_form_bg_color : '#ffffff'}
                                    onChange={(e) => setBranding({...branding, login_form_bg_color: e.target.value})}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={branding.login_form_bg_color || ''}
                                    onChange={(e) => setBranding({...branding, login_form_bg_color: e.target.value})}
                                    placeholder="rgba(255, 255, 255, 0.9)"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Text Form Login</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={branding.login_form_text_color?.startsWith('#') ? branding.login_form_text_color : '#334155'}
                                    onChange={(e) => setBranding({...branding, login_form_text_color: e.target.value})}
                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={branding.login_form_text_color || ''}
                                    onChange={(e) => setBranding({...branding, login_form_text_color: e.target.value})}
                                    placeholder="#334155"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Registration Toggle */}
                    <div className="mb-8">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input 
                                type="checkbox"
                                checked={branding.enable_registration === 'true' || branding.enable_registration === true}
                                onChange={(e) => setBranding({...branding, enable_registration: e.target.checked ? 'true' : 'false'})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-bold text-slate-700">Aktifkan Pendaftaran User</span>
                                <span className="block text-xs text-slate-500">Jika dinonaktifkan, tombol "Register" akan disembunyikan di halaman login.</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-end border-t border-gray-100 pt-6">
                        <button 
                            onClick={handleSaveBranding}
                            disabled={isLoadingBranding}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingBranding ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
               </div>
           </div>
       )}

       {/* SYSTEM TAB */}
       {activeTab === 'system' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-800">System Diagnostics</h2>
               </div>

               {/* Database Check */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Database Integrity</h3>
                                <p className="text-sm text-slate-500">Checking critical tables and schema structure.</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleCheckDb}
                            disabled={checkingDb}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Check Database"
                        >
                            <RefreshCw size={20} className={checkingDb ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {checkingDb ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={32} className="text-green-600 animate-spin mb-4" />
                            <p className="text-slate-500 text-sm">Verifying database structure...</p>
                        </div>
                    ) : dbStatus ? (
                        <div>
                            <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${dbStatus.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                                {dbStatus.status === 'OK' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                {dbStatus.status === 'OK' ? 'Database Structure is Complete' : 'Missing Critical Tables'}
                            </div>
                            
                            {dbStatus.missing && dbStatus.missing.length > 0 && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                                    <p className="text-xs font-bold text-red-800 mb-2">Missing Tables:</p>
                                    <ul className="list-disc list-inside text-xs text-red-700 mb-4">
                                        {dbStatus.missing.map(t => <li key={t}>{t}</li>)}
                                    </ul>
                                    <button 
                                        onClick={handleFixDb}
                                        disabled={fixingDb}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {fixingDb ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                Repairing Database...
                                            </>
                                        ) : (
                                            <>
                                                <Database size={14} />
                                                Perbaiki Database
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-slate-400">Last checked: {new Date(dbStatus.checked_at).toLocaleString()}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Database size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-medium mb-1">Database Status Unknown</h3>
                            <p className="text-slate-500 text-sm mb-6">Check database integrity to ensure system stability.</p>
                            <button 
                                onClick={handleCheckDb}
                                disabled={checkingDb}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={checkingDb ? 'animate-spin' : ''} />
                                Check Database
                            </button>
                        </div>
                    )}
               </div>

               {/* Git Update Check */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <GitBranch size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">System Update</h3>
                                <p className="text-sm text-slate-500">Check for updates from GitHub repository.</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleCheckSystem}
                            disabled={checkingSystem}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Refresh System Status"
                        >
                            <RefreshCw size={20} className={checkingSystem ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {checkingSystem ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 size={32} className="text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">Checking for updates...</p>
                    </div>
                ) : updateStatus ? (
                        <div>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-200">
                                        <span className="text-xs font-medium text-slate-500">Repository</span>
                                        <a href={updateStatus.repo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">{updateStatus.repo}</a>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-gray-200">
                                            <span className="text-xs text-slate-400 block mb-1">Local Hash</span>
                                            <code className="text-xs font-mono font-bold text-slate-700">{updateStatus.localHash}</code>
                                        </div>
                                        <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-gray-200">
                                            <span className="text-xs text-slate-400 block mb-1">Remote Hash</span>
                                            <code className="text-xs font-mono font-bold text-slate-700">{updateStatus.remoteHash}</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-50 rounded-xl border border-gray-200 text-center">
                                    {updateStatus.updatesAvailable ? (
                                        <>
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                                <Play size={24} />
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-1">Update Available</h4>
                                            <p className="text-xs text-slate-500 mb-4">{updateStatus.behindCount} commits behind main branch.</p>
                                            <button 
                                                onClick={handleUpdateSystem}
                                                disabled={updatingSystem}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50"
                                            >
                                                {updatingSystem ? 'Updating...' : 'Update System'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                                <CheckCircle size={24} />
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-1">System sudah Update</h4>
                                            <p className="text-xs text-slate-500">You are running the latest version.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {updateMessage && (
                                <div className="mt-4 p-4 bg-slate-800 text-green-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap">
                                    {'>'} {updateMessage}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <GitBranch size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-medium mb-1">System Status Unknown</h3>
                            <p className="text-slate-500 text-sm mb-6">Check for the latest updates from the repository.</p>
                            
                            {updateMessage && (
                                <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 max-w-md mx-auto">
                                    {updateMessage}
                                </div>
                            )}
                            
                            <button 
                                onClick={handleCheckSystem}
                                disabled={checkingSystem}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={checkingSystem ? 'animate-spin' : ''} />
                                Check for Updates
                            </button>
                        </div>
                    )}
               </div>

               {/* System Logs */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                   <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">System Logs</h3>
                            <p className="text-sm text-slate-500">History of automated system checks and updates.</p>
                        </div>
                   </div>

                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                           <thead>
                               <tr className="bg-slate-50 border-b border-gray-100">
                                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                               {systemLogs.length === 0 ? (
                                   <tr>
                                       <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">No system logs available.</td>
                                   </tr>
                               ) : (
                                   currentLogs.map((log) => (
                                       <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                           <td className="px-6 py-3 text-[10px] text-slate-600 whitespace-nowrap">
                                               {new Date(log.created_at).toLocaleString()}
                                           </td>
                                           <td className="px-6 py-3 text-[10px] font-medium text-slate-800">
                                               {log.check_type === 'UPDATE_CHECK' ? 'System Update Check' : 'Database Integrity'}
                                           </td>
                                           <td className="px-6 py-3">
                                               <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                   log.status === 'OK' || log.status === 'UPDATE_AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                   'bg-red-100 text-red-700'
                                               }`}>
                                                   {log.status}
                                               </span>
                                           </td>
                                           <td className="px-6 py-3 text-[10px] text-slate-500 max-w-xs truncate" title={formatLogDetails(log.details, log.check_type)}>
                                               {formatLogDetails(log.details, log.check_type)}
                                           </td>
                                       </tr>
                                   ))
                               )}
                           </tbody>
                       </table>
                   </div>
                   
                   {/* Pagination */}
                   {totalPages > 1 && (
                       <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                           <div className="text-[10px] text-slate-500">
                               Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, systemLogs.length)} of {systemLogs.length} results
                           </div>
                           <div className="flex items-center gap-2">
                               <button 
                                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                   disabled={currentPage === 1}
                                   className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                               >
                                   Previous
                               </button>
                               <span className="text-xs text-slate-600">
                                   Page {currentPage} of {totalPages}
                               </span>
                               <button 
                                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                   disabled={currentPage === totalPages}
                                   className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                               >
                                   Next
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           </div>
       )}

       {/* GATEWAY TAB */}
       {activeTab === 'gateway' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* SMTP Settings */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Server size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">SMTP Email</h2>
                            <p className="text-sm text-slate-500">Konfigurasi pengiriman email ke user.</p>
                        </div>
                    </div>
                    {loadingGateway ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 py-6">
                            <Loader2 size={18} className="animate-spin" /> Memuat pengaturan...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Host</label>
                                <input 
                                    value={smtp.host}
                                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Port</label>
                                <input 
                                    type="number"
                                    value={smtp.port}
                                    onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value || '587') })}
                                    placeholder="587"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Secure (TLS/SSL)</label>
                                <select
                                    value={smtp.secure ? 'true' : 'false'}
                                    onChange={(e) => setSmtp({ ...smtp, secure: e.target.value === 'true' })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                >
                                    <option value="false">Tidak</option>
                                    <option value="true">Ya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">User</label>
                                <input 
                                    value={smtp.user}
                                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                                    placeholder="email akun SMTP"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                <input 
                                    type="password"
                                    value={smtp.pass}
                                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                                    placeholder="password atau app password"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">From Email</label>
                                <input 
                                    value={smtp.from_email}
                                    onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                                    placeholder="noreply@domain.com"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">From Name</label>
                                <input 
                                    value={smtp.from_name}
                                    onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
                                    placeholder="Nama Pengirim"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2 mt-6 border-t border-gray-100 pt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Test Kirim Email</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        value={testEmailTo}
                                        onChange={(e) => setTestEmailTo(e.target.value)}
                                        placeholder="Tujuan Email (contoh: user@domain.com)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        value={testEmailMsg}
                                        onChange={(e) => setTestEmailMsg(e.target.value)}
                                        placeholder="Pesan singkat (opsional)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!testEmailTo) { alert('Masukkan email tujuan'); return; }
                                            setTestingEmail(true);
                                            try {
                                                await api.testGatewayEmail(token, { to: testEmailTo, body: testEmailMsg });
                                                alert('Test email berhasil dikirim.');
                                            } catch (err: any) {
                                                alert('Gagal kirim test email: ' + (err?.message || 'Unknown error'));
                                            } finally {
                                                setTestingEmail(false);
                                            }
                                        }}
                                        disabled={testingEmail}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50"
                                    >
                                        {testingEmail ? 'Mengirim...' : 'Kirim Test Email'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Menggunakan konfigurasi SMTP di atas untuk mengirim email uji.</p>
                            </div>
                        </div>
                    )}
               </div>

               {/* MPWA Settings */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">WA Gateway (MPWA)</h2>
                            <p className="text-sm text-slate-500">Konfigurasi integrasi WhatsApp Gateway menggunakan API MPWA.</p>
                        </div>
                    </div>
                    {loadingGateway ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 py-6">
                            <Loader2 size={18} className="animate-spin" /> Memuat pengaturan...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Base URL MPWA</label>
                                <input 
                                    value={mpwa.base_url}
                                    onChange={(e) => setMpwa({ ...mpwa, base_url: e.target.value })}
                                    placeholder="https://api.mpwa.id"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Token API</label>
                                <input 
                                    type="password"
                                    value={mpwa.token}
                                    onChange={(e) => setMpwa({ ...mpwa, token: e.target.value })}
                                    placeholder="Token akses MPWA"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Device ID</label>
                                <input 
                                    value={mpwa.device_id}
                                    onChange={(e) => setMpwa({ ...mpwa, device_id: e.target.value })}
                                    placeholder="ID perangkat MPWA"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2 mt-6 border-t border-gray-100 pt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Test Kirim WhatsApp</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        value={testWaPhone}
                                        onChange={(e) => setTestWaPhone(e.target.value)}
                                        placeholder="Nomor WhatsApp (contoh: 628xxxxxxxxxx)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        value={testWaMsg}
                                        onChange={(e) => setTestWaMsg(e.target.value)}
                                        placeholder="Pesan singkat (opsional)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!testWaPhone) { alert('Masukkan nomor WhatsApp tujuan'); return; }
                                            setTestingWa(true);
                                            try {
                                                await api.testGatewayWa(token, { phone: testWaPhone, message: testWaMsg });
                                                alert('Test WA berhasil dikirim.');
                                            } catch (err: any) {
                                                alert('Gagal kirim test WA: ' + (err?.message || 'Unknown error'));
                                            } finally {
                                                setTestingWa(false);
                                            }
                                        }}
                                        disabled={testingWa}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"
                                    >
                                        {testingWa ? 'Mengirim...' : 'Kirim Test WA'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Menggunakan konfigurasi MPWA di atas untuk mengirim pesan uji.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end border-t border-gray-100 pt-6 mt-6">
                        <button 
                            onClick={handleSaveGateway}
                            disabled={savingGateway}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {savingGateway ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Simpan Pengaturan Gateway
                                </>
                            )}
                        </button>
                    </div>
               </div>
           </div>
       )}

       {/* SECURITY TAB */}
       {activeTab === 'security' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Security Logs</h2>
                            <p className="text-sm text-slate-500">Monitor failed logins, brute force attempts, and suspicious activities.</p>
                        </div>
                   </div>
                   <button 
                       onClick={fetchSecurityLogs} 
                       disabled={loadingLogs}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                   >
                       <RefreshCw size={16} className={loadingLogs ? 'animate-spin' : ''} />
                       Refresh Logs
                   </button>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">User / ID</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Attack Type</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingLogs ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[10px] text-slate-400">Loading security logs...</td>
                                    </tr>
                                ) : securityLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[10px] text-slate-400">No security incidents recorded.</td>
                                    </tr>
                                ) : (
                                    securityLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 text-[10px] text-slate-600 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-slate-800">
                                                {log.user_identifier}
                                            </td>
                                            <td className="px-6 py-3 text-[10px] font-mono text-slate-600">
                                                {log.ip_address}
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-slate-600">
                                                {log.country || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                    log.attack_type === 'BRUTE_FORCE' ? 'bg-red-100 text-red-700' :
                                                    log.attack_type === 'DDOS' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {log.attack_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-slate-500 max-w-xs truncate" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                   </div>
               </div>
           </div>
       )}

       {/* Delete Aggregator Modal */}
       {deleteIndex !== null && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                        <h3 className="text-sm font-semibold text-slate-800">Delete Aggregator</h3>
                        <button
                            onClick={handleCancelDelete}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-5 space-y-3 text-sm text-slate-600">
                        <p>Apakah Anda yakin ingin menghapus aggregator berikut?</p>
                        <p className="font-semibold text-slate-800">
                            {aggregators[deleteIndex] || ''}
                        </p>
                        <p className="text-xs text-slate-400">
                            Tindakan ini hanya menghapus dari daftar pilihan saat mengubah status rilis.
                        </p>
                    </div>
                    <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-slate-50">
                        <button
                            onClick={handleCancelDelete}
                            className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};
