import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  username: string;
  status?: 'Pending' | 'Review' | 'Approved' | 'Active' | 'Inactive' | string;
}

export const UserStatusScreen: React.FC<Props> = ({ username, status }) => {
  const location = useLocation();
  const finalUsername = location.state?.username || username;
  const finalStatus = location.state?.status || status;

  console.log('UserStatusScreen rendering, finalUsername:', finalUsername, 'finalStatus:', finalStatus);
  
  const normalized = (finalStatus || 'Pending') as string;
  const navigate = useNavigate();

  const getLabel = () => {
    if (normalized === 'Approved' || normalized === 'Active') return 'Approved';
    if (normalized === 'Review') return 'Under Review';
    if (normalized === 'Inactive') return 'Inactive';
    return 'Pending';
  };

  const getBadgeClass = () => {
    if (normalized === 'Approved' || normalized === 'Active') return 'bg-green-100 text-green-700';
    if (normalized === 'Review') return 'bg-amber-100 text-amber-700';
    if (normalized === 'Inactive') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const label = getLabel();
  const badgeClass = getBadgeClass();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-white p-8 md:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
            Account Status
          </h1>
          <p className="text-slate-500 text-sm">
            Hi <span className="font-semibold text-slate-700">{username}</span>, akun kamu belum di-approve.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">
              Status Registrasi
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tim Dimensi Suara akan melakukan review terhadap data registrasi kamu. 
            Setelah status berubah menjadi <span className="font-semibold">Approved</span>, 
            kamu bisa login dan menggunakan CMS seperti biasa.
          </p>
        </div>

        <div className="space-y-3 text-xs text-slate-500">
          <p>
            Jika kamu merasa status ini terlalu lama tidak berubah, 
            silakan hubungi tim support atau admin Dimensi Suara.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
};
