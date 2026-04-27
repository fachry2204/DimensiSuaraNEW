
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music4, User, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Loader2, Mail } from 'lucide-react';

import { api } from '../utils/api';
import { getTextColorClass, getShadowColor } from '../utils/colorUtils';

// register mode removed

interface Props {
  onLogin: (user: any, token: string) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Use relative path to leverage Vite proxy
        const res = await fetch('/api/health');
        if (res.ok) {
            const data = await res.json();
            setServerStatus(data.status === 'online' ? 'online' : 'offline');
            setDbStatus(data.database);
        } else {
            setServerStatus('offline');
            setDbStatus('unknown');
        }
      } catch (e) {
        setServerStatus('offline');
        setDbStatus('unknown');
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  const [statusModalStatus, setStatusModalStatus] = useState<string | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<string | null>(null);

  // Branding State
  const [branding, setBranding] = useState<{
      logo: string | null, 
      login_background: string | null,
      login_title: string,
      login_footer: string,
      login_button_color: string,
      login_form_bg_color: string,
      enable_registration: string,
      login_title_color: string,
      login_footer_color: string,
      login_form_bg_opacity: number,
      login_bg_opacity: number,
      login_glass_effect: string,
      login_form_text_color: string
  }>({
      logo: null,
      login_background: null,
      login_title: 'Agregator & Publishing Musik',
      login_footer: 'Protected CMS Area. Authorized personnel only.',
      login_button_color: 'linear-gradient(to right, #2563eb, #0891b2)',
      login_form_bg_color: '#ffffff',
      enable_registration: 'true',
      login_title_color: '#1e293b',
      login_footer_color: '#94a3b8',
      login_form_bg_opacity: 90,
      login_bg_opacity: 100,
      login_glass_effect: 'false',
      login_form_text_color: '#000000'
  });

  useEffect(() => {
      // Fetch branding
      fetch('/api/settings/branding')
          .then(res => res.json())
          .then(data => setBranding(data))
          .catch(err => console.error("Failed to fetch branding:", err));
  }, []);

  // register mode removed

  // register mode removed

  // register mode removed

  useEffect(() => {}, []);

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.login(username, password);
      const user = data.user;
      const status = ((user.status as string) || '').toLowerCase();
      if (user.role === 'User' && status && !['approved', 'active'].includes(status)) {
        setStatusModalUser(user.username || username);
        setStatusModalStatus(user.status || 'Pending');
        setIsLoading(false);
        return;
      }
      onLogin(user, data.token);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login gagal. Pastikan server berjalan.');
      setIsLoading(false);
    }
  };

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  const textColor = React.useMemo(() => getTextColorClass(branding.login_form_bg_color), [branding.login_form_bg_color]);
  const subTextColor = textColor === 'text-white' ? 'text-slate-300' : 'text-slate-400';

  const renderLogin = () => (
    <>
      <form onSubmit={handleLogin} className="space-y-4 mt-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-pulse">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold ml-1" style={{ color: branding.login_form_text_color || '#334155' }}>Email</label>
          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${subTextColor} group-focus-within:text-blue-500 transition-colors`}>
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50/10 border border-slate-200/50 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-normal text-xs text-black placeholder:text-slate-400 backdrop-blur-sm"
              style={{ color: branding.login_form_text_color || '#334155' }}
              placeholder="Enter email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold ml-1" style={{ color: branding.login_form_text_color || '#334155' }}>Password</label>
          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${subTextColor} group-focus-within:text-blue-500 transition-colors`}>
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50/10 border border-slate-200/50 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-normal text-xs text-black placeholder:text-slate-400 backdrop-blur-sm"
              style={{ color: branding.login_form_text_color || '#334155' }}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${subTextColor} hover:text-slate-600 transition-colors`}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-medium text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs
            ${isLoading ? 'bg-slate-300 cursor-not-allowed' : 'hover:brightness-110 hover:-translate-y-1'}`}
          style={{ 
            background: isLoading ? undefined : branding.login_button_color,
            opacity: 1 // Ensure not transparent
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {branding.enable_registration === 'true' && (
            <>
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px]">ATAU</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 text-[12px]"
                >
                    Belum punya akun? Daftar di sini
                </button>
            </>
        )}
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-[10px]" style={{ color: branding.login_footer_color }}>
          {branding.login_footer}
        </p>
      </div>
    </>
  );

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  // register mode removed

  return (
    <div 
        className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden"
    >
      {/* Background Layer with Opacity */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500 bg-gradient-to-br from-blue-50 via-white to-blue-100"
        style={{ 
            backgroundImage: branding.login_background ? `url(${branding.login_background})` : undefined,
            opacity: (branding.login_bg_opacity ?? 100) / 100
        }}
      />

      {/* Server Status Top Right */}
      <div className="absolute top-6 right-6 z-10 animate-fade-in-down">
         <div className="flex justify-center gap-3 text-[10px] font-medium bg-white/90 backdrop-blur-sm border border-white/50 shadow-sm px-4 py-2 rounded-xl text-slate-600">
            <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : serverStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className={`${serverStatus === 'online' ? 'text-green-700' : 'text-slate-500'}`}>
                    Server: {serverStatus === 'checking' ? 'Checking...' : serverStatus.toUpperCase()}
                </span>
            </div>
            {serverStatus === 'online' && (
                 <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`${dbStatus === 'connected' ? 'text-green-700' : 'text-red-500'}`}>
                        DB: {dbStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
            )}
         </div>
      </div>

      <div 
        className={`w-full max-w-sm rounded-2xl px-6 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8 animate-fade-in-up relative z-10 
            ${branding.login_glass_effect !== 'true' ? 'backdrop-blur-sm shadow-2xl shadow-blue-900/10 border border-white/50' : ''}`}
        style={branding.login_glass_effect === 'true' ? {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `0 8px 32px 0 ${getShadowColor(branding.login_button_color)}`
        } : undefined}
      >
        {/* Form Background Layer with Opacity - Only when NOT glass effect */}
        {branding.login_glass_effect !== 'true' && (
            <div 
                className="absolute inset-0 rounded-2xl -z-10 transition-opacity duration-300"
                style={{ 
                    background: branding.login_form_bg_color,
                    opacity: (branding.login_form_bg_opacity ?? 90) / 100
                }}
            />
        )}

        <div className="flex flex-col items-center mb-2">
            {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="max-h-[80px] w-auto object-contain mb-3 drop-shadow-md" />
            ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3">
                    <Music4 size={24} />
                </div>
            )}
            <div className="px-4 py-1 rounded-xl">
                <h2 className="text-xl font-bold tracking-wide text-center" style={{ color: branding.login_title_color }}>{branding.login_title}</h2>
            </div>
        </div>
        {renderLogin()}
      </div>

      {statusModalStatus && statusModalUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Status Akun Belum Approved</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hi {statusModalUser}, saat ini status akun kamu adalah{' '}
                  <span className="font-semibold">{statusModalStatus}</span>. Kamu belum bisa login ke CMS
                  sampai status berubah menjadi Approved.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setStatusModalStatus(null);
                  setStatusModalUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};
