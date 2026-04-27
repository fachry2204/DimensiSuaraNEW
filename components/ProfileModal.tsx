
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, User, Mail, Lock } from 'lucide-react';
import { api, API_BASE_URL } from '../utils/api';
import { getProfileImageUrl } from '../utils/imageUtils';
import { AlertModal, AlertState } from './AlertModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    onUpdateUser: (user: any) => void;
    user: any; // Add user prop
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, token, onUpdateUser, user }) => {
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        profilePicture: user?.profile_picture || null
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [alertState, setAlertState] = useState<AlertState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Initialize preview URL if user has profile picture
    useEffect(() => {
        if (user?.profile_picture) {
             setPreviewUrl(getProfileImageUrl(user.profile_picture));
        }
    }, [user]);

    // Fetch latest profile data when modal opens (optional, but good for sync)
    useEffect(() => {
        if (isOpen && token) {
            fetchProfile();
        }
    }, [isOpen, token]);

    const fetchProfile = async () => {
        try {
            const data = await api.getProfile(token);
            setUserData({
                username: data.username,
                email: data.email,
                password: '',
                profilePicture: data.profile_picture
            });
            if (data.profile_picture) {
                setPreviewUrl(getProfileImageUrl(data.profile_picture));
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data: any = {};
            if (userData.username) data.username = userData.username;
            if (userData.email) data.email = userData.email;
            if (userData.password) data.password = userData.password;
            if (selectedFile) data.profilePicture = selectedFile;

            const response = await api.updateProfile(token, data);
            
            // Update parent state
            onUpdateUser(response.user);
            
            setAlertState({
                isOpen: true,
                title: 'Sukses',
                message: 'Profil berhasil diperbarui!',
                type: 'success'
            });
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setAlertState({
                isOpen: true,
                title: 'Gagal',
                message: `Gagal memperbarui profil: ${err.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Edit Profile</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                                    {previewUrl ? (
                                        <>
                                            <img 
                                                src={previewUrl} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover relative z-10" 
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            {/* Fallback behind image */}
                                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                                <User size={40} className="text-slate-400" />
                                            </div>
                                        </>
                                    ) : (
                                        <User size={40} className="text-slate-400" />
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Camera size={24} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Click to change photo</p>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Username</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={userData.username}
                                        onChange={(e) => setUserData({...userData, username: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        value={userData.email}
                                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        placeholder="Email Address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">New Password (Optional)</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input 
                                        type="password" 
                                        value={userData.password}
                                        onChange={(e) => setUserData({...userData, password: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
