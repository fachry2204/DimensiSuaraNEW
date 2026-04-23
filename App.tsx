import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useBranding } from './contexts/BrandingContext';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ReleaseTypeSelection } from './screens/ReleaseTypeSelection';
import { ReleaseWizard } from './screens/ReleaseWizard';
import { AllReleases } from './screens/AllReleases';
import { AggregatorDashboard } from './screens/AggregatorDashboard';
import { Dashboard } from './screens/Dashboard'; 
import { Statistics } from './screens/Statistics'; 
import { ReleaseDetailsPage } from './screens/ReleaseDetailsPage';
import { SingleReleasePage } from './screens/SingleReleasePage';
import { PublishingWriter } from './screens/publishing/PublishingWriter';
import { PublishingSongs } from './screens/publishing/PublishingSongs';
import { PublishingAnalytics } from './screens/publishing/PublishingAnalytics';
import { PublishingReports } from './screens/publishing/PublishingReports';
import { Settings } from './screens/Settings';
import { UserManagement } from './screens/UserManagement';
import { RoleUserPage } from './screens/RoleUserPage';
import { UserDetailPage } from './screens/UserDetailPage';
import { ReportScreen } from './screens/ReportScreen';
import { RevenueScreen } from './screens/RevenueScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { PaymentDetailScreen } from './screens/PaymentDetailScreen';
import { LoginScreen } from './screens/LoginScreen'; 
import { RegisterScreen } from './screens/RegisterScreen';
import { UserStatusScreen } from './screens/UserStatusScreen';
import { NewReleaseFlow } from './screens/NewReleaseFlow';
import { UserAnalytics } from './screens/UserAnalytics';
import { UserPayments } from './screens/UserPayments';
import Tickets from './screens/Tickets';
import TicketDetail from './screens/TicketDetail';
import { MyProfile } from './screens/MyProfile';
import { MyContracts } from './screens/MyContracts';
import { ReleaseDetailModal } from './components/ReleaseDetailModal';
import { ProfileModal } from './components/ProfileModal';
import { AlertModal } from './components/AlertModal';
import { FloatingSupportBubble } from './components/FloatingSupportBubble';
import { ReleaseType, ReleaseData, ReportData, Notification } from './types';
import { Menu, Bell, User, LogOut, ChevronDown, AlertTriangle, CheckCircle, Info, X, Loader2 } from 'lucide-react';
import { api, API_BASE_URL } from './utils/api';
import socialLogo from './assets/platforms/social.svg';
import youtubeMusicLogo from './assets/platforms/youtube-music.svg';
import allDspLogo from './assets/platforms/alldsp.svg';
import PublishingWriterDetail from './screens/publishing/PublishingWriterDetail';
import { getProfileImageUrl } from './utils/imageUtils';
import { getTextColorClass } from './utils/colorUtils';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Artists } from './screens/Artists';
import { ArtistDetail } from './screens/ArtistDetail';
import { UserEditPage } from './screens/UserEditPage';
import { Contracts } from './screens/Contracts';
import { ContractDetail } from './screens/ContractDetail';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useBranding();

  // Header Branding State
  const [headerBgColor, setHeaderBgColor] = useState<string>('rgba(255, 255, 255, 0.8)');
  const [headerTitleColor, setHeaderTitleColor] = useState<string>('#1e293b'); // Default slate-800

  useEffect(() => {
    if (branding) {
      if (branding.login_button_color) {
        setHeaderBgColor(branding.login_button_color);
      }
      if (branding.login_title_color) {
        setHeaderTitleColor(branding.login_title_color);
      }
    }
  }, [branding]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userStatus, setUserStatus] = useState<string>('');
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [ticketUnreadCount, setTicketUnreadCount] = useState<number>(0);
  const notifIntervalRef = useRef<any>(null);
  
  // Status Tracking Refs
  const prevReleaseStatusRef = useRef<Record<string, string>>({});
  const prevSongStatusRef = useRef<Record<string, string>>({});
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Alert Modal State
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Logout Confirmation State
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global App State
  const [allReleases, setAllReleases] = useState<ReleaseData[]>([]);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  
  // IMPORTED REPORT DATA STATE
  const [reportData, setReportData] = useState<ReportData[]>([]);

  const [aggregators, setAggregators] = useState<string[]>(["LokaMusik", "SoundOn"]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  
  const handleAuthExpired = () => {
      localStorage.removeItem('cms_auth');
      localStorage.removeItem('cms_user');
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_role');
      localStorage.removeItem('cms_status');
      setIsAuthenticated(false);
      setCurrentUser('');
      setToken('');
      setUserRole('');
      setUserStatus('');
      setDataFetchError('Session expired. Please login again.');
      navigate('/');
  };
  
  const belongsToCurrentUser = (r: any) => {
    if (!r || !currentUserData) return false;
    const uid = String((currentUserData as any)?.id || '');
    const uname = String((currentUserData as any)?.username || currentUser || '').trim().toLowerCase();
    const email = String((currentUserData as any)?.email || '').trim().toLowerCase();
    const company = String((currentUserData as any)?.company_name || '').trim().toLowerCase();
    const full = String((currentUserData as any)?.full_name || '').trim().toLowerCase();

    // Strict user id match if available
    if (r.user_id && String(r.user_id) === uid) return true;
    if (r.ownerId && String(r.ownerId) === uid) return true;
    if (r.userId && String(r.userId) === uid) return true;

    // Strict owner/uploader display names (exact match only)
    const norm = (v: any) => String(v || '').trim().toLowerCase();
    const nameCandidates = [
      norm((r as any).ownerDisplayName),
      norm((r as any).ownerName),
      norm((r as any).uploaderName),
      norm((r as any).uploader),
      norm((r as any).user_name),
    ].filter(Boolean);
    if (nameCandidates.some(n => n === full || n === company || n === uname || n === email)) return true;

    // Only exact artist name match (no "includes" for company to avoid false positives)
    if (Array.isArray(r.primaryArtists)) {
      const artists = (r.primaryArtists as any[]).map(a => norm(typeof a === 'string' ? a : (a?.name || '')));
      if (full && artists.includes(full)) return true;
      if (company && artists.includes(company)) return true;
    }
    return false;
  };
  const myReleases = allReleases.filter(r => belongsToCurrentUser(r));
  const resolveOwnerName = (r: any) => {
    const byId = r.user_id || r.ownerId || r.userId;
    let u: any = null;
    if (byId && usersMap[String(byId)]) {
      u = usersMap[String(byId)];
    }
    if (!u && belongsToCurrentUser(r)) {
      u = currentUserData;
    }
    if (u) {
      if ((u.account_type || '').toUpperCase() === 'COMPANY' && u.company_name) return u.company_name;
      return u.full_name || u.name || '';
    }
    // Fallback only to release-provided fields for display
    const rawCandidates = [
      r.company_name,
      r.user_full_name,
      r.owner_name,
      r.owner,
      r.created_by
    ];
    for (const v of rawCandidates) {
      if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    }
    return '';
  };
  
  // Initialize Data
  useEffect(() => {
    const fetchData = async () => {
        if (!token) return;

        setDataFetchError(null);

        const p1 = api.getReleases(token)
            .then(data => {
                const mapped = data.map((r: any) => ({ ...r, id: String(r.id), ownerDisplayName: resolveOwnerName(r) }));
                setAllReleases(mapped);
                // Initialize status tracking ref
                mapped.forEach((r: any) => {
                    prevReleaseStatusRef.current[String(r.id)] = r.status;
                });
            })
            .catch((err: any) => {
                if (err?.message === 'AUTH') return handleAuthExpired();
                console.error('Failed to fetch releases:', err);
                setDataFetchError(err.message || 'Failed to load releases');
                setAllReleases([]);
            });

        // Fetch Songs for status tracking
        const pSongs = api.publishing.getSongs(token)
            .then(data => {
                if (Array.isArray(data)) {
                     data.forEach((s: any) => {
                         prevSongStatusRef.current[String(s.id)] = s.status;
                     });
                }
            })
            .catch(err => console.warn('Failed to fetch songs for status tracking', err));

        const p2 = api.getReports(token)
            .then(data => setReportData(data))
            .catch((err: any) => {
                if (err?.message === 'AUTH') return handleAuthExpired();
                console.warn('Failed to fetch reports:', err);
            });

        const p4 = api.getAggregators(token)
            .then(aggs => {
                if (aggs && Array.isArray(aggs) && aggs.length > 0) {
                    setAggregators(aggs);
                }
            })
            .catch((err: any) => {
                if (err?.message === 'AUTH') return handleAuthExpired();
                console.warn('Failed to fetch aggregators, using defaults', err);
            });
        const promises: Promise<any>[] = [p1, p2, p4];
        if (userRole === 'Admin' || userRole === 'Operator') {
          const p3 = api.getUsers(token)
              .then(users => {
                  setAllUsers(users || []);
                  const map: Record<string, any> = {};
                  (users || []).forEach((u: any) => { if (u.id !== undefined) map[String(u.id)] = u; });
                  setUsersMap(map);
                  setAllReleases(prev => prev.map((r: any) => ({ ...r, ownerDisplayName: resolveOwnerName(r) })));
              })
              .catch((err: any) => {
                  if (err?.message === 'AUTH') return handleAuthExpired();
                  console.warn('Failed to fetch users for owner names', err);
              });
          promises.push(p3);
        } else {
          setAllUsers([]);
          setUsersMap({});
        }

        await Promise.allSettled(promises);
    };

    if (isAuthenticated) {
        fetchData();
    }
  }, [isAuthenticated, token, userRole]);

  // Recompute ownerDisplayName once profile (currentUserData) is loaded,
  // so old releases correctly show the current admin/user as owner.
  useEffect(() => {
    if (!currentUserData) return;
    setAllReleases(prev => prev.map((r: any) => ({
      ...r,
      ownerDisplayName: resolveOwnerName(r),
    })));
  }, [currentUserData]);

  // Fetch Notifications & User Profile
  useEffect(() => {
    if (isAuthenticated && token) {
        // Fetch Notifications
        const fetchNotifications = async () => {
             try {
                 const apiNotifs = await api.getNotifications(token);
                 // Filter out Login success notifications as requested
                 const filteredApiNotifs = apiNotifs.filter((n: any) => 
                    n.type !== 'LOGIN_SUCCESS' && 
                    !n.message?.toLowerCase().includes('login success')
                 );

                 let localNotifs: Notification[] = [];
                 try {
                     localNotifs = JSON.parse(localStorage.getItem('cms_local_notifs') || '[]');
                 } catch {}

                 // 1. Fetch Tickets & Count Replies
                 try {
                     const tickets = await api.tickets.list(token);
                     const replyCount = Array.isArray(tickets) 
                         ? tickets.filter((t: any) => t.status === 'Replied').length 
                         : 0;
                     setTicketUnreadCount(replyCount);
                 } catch (e) {
                     console.warn('Failed to fetch tickets count', e);
                 }

                 // 2. Check Status Changes (Releases)
                 let hasNewLocal = false;
                 try {
                     const all = await api.getReleases(token);
                     const releases = Array.isArray(all)
                        ? (userRole === 'Admin' || userRole === 'Operator' ? all : all.filter((r: any) => belongsToCurrentUser(r)))
                        : [];
                     if (releases.length > 0) {
                         releases.forEach((r: any) => {
                             const id = String(r.id);
                             const newStatus = r.status;
                             const oldStatus = prevReleaseStatusRef.current[id];
                             
                             if (oldStatus && oldStatus !== newStatus) {
                                 const display = newStatus === 'Live' ? 'Released' : newStatus;
                                 const msg = `Status Rilisan "${r.title}" berubah menjadi ${display}`;
                                 prevReleaseStatusRef.current[id] = newStatus;
                                 
                                 localNotifs.unshift({
                                     id: -Date.now() - Math.floor(Math.random() * 10000),
                                     user_id: 0,
                                     type: 'RELEASE_STATUS',
                                     message: msg,
                                     is_read: false,
                                     created_at: new Date().toISOString()
                                 });
                                 hasNewLocal = true;
                             } else if (!oldStatus) {
                                 prevReleaseStatusRef.current[id] = newStatus;
                             }
                         });
                     }
                 } catch (e) {
                     console.warn('Failed to check release status', e);
                 }

                 // 3. Check Status Changes (Songs)
                 if (userRole === 'Admin' || userRole === 'Operator') {
                   try {
                       const songs = await api.publishing.getSongs(token);
                       if (Array.isArray(songs)) {
                           songs.forEach((s: any) => {
                               const id = String(s.id);
                               const newStatus = s.status;
                               const oldStatus = prevSongStatusRef.current[id];
                               
                               if (oldStatus && oldStatus !== newStatus) {
                                   const msg = `Status Lagu "${s.title}" berubah menjadi ${newStatus}`;
                                   prevSongStatusRef.current[id] = newStatus;
                                   
                                   localNotifs.unshift({
                                       id: -Date.now() - Math.floor(Math.random() * 10000),
                                       user_id: 0,
                                       type: 'SONG_STATUS', // Using string type as per interface
                                       message: msg,
                                       is_read: false,
                                       created_at: new Date().toISOString()
                                   });
                                   hasNewLocal = true;
                               } else if (!oldStatus) {
                                   prevSongStatusRef.current[id] = newStatus;
                               }
                           });
                       }
                   } catch (e) {
                       // Silent fail if publishing not accessible
                   }
                 }

                 if (hasNewLocal) {
                     localStorage.setItem('cms_local_notifs', JSON.stringify(localNotifs));
                 }

                const userApiNotifs = (userRole === 'Admin' || userRole === 'Operator')
                    ? filteredApiNotifs
                    : filteredApiNotifs.filter((n: any) => {
                        const curId = String((currentUserData as any)?.id || '');
                        return String(n.user_id || '') === curId;
                      });
                const combined = [...userApiNotifs, ...localNotifs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                 setNotifications(combined);
                 setUnreadCount(combined.filter((n: any) => !n.is_read).length);

             } catch (err: any) {
                 if (err?.message === 'AUTH') return handleAuthExpired();
                 console.error("Failed to fetch notifications", err);
             }
        };
        // immediate run once
        fetchNotifications();
        // ensure single interval only
        if (notifIntervalRef.current) {
          clearInterval(notifIntervalRef.current);
          notifIntervalRef.current = null;
        }
        notifIntervalRef.current = setInterval(fetchNotifications, 30000);
        return () => {
          if (notifIntervalRef.current) {
            clearInterval(notifIntervalRef.current);
            notifIntervalRef.current = null;
          }
        };
    }
  }, [isAuthenticated, token, userRole, currentUserData]);

  // Profile fetch isolated (avoid retriggering notification interval)
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    api.getProfile(token).then(user => {
        setCurrentUserData(user);
        if (user.role && user.role !== userRole) {
            setUserRole(user.role);
            localStorage.setItem('cms_role', user.role);
        }
        if (user.status && user.status !== userStatus) {
            setUserStatus(user.status);
            localStorage.setItem('cms_status', user.status);
        }
    }).catch(err => {
        if (err?.message === 'AUTH') return handleAuthExpired();
        console.error("Failed to fetch profile", err);
    });
  }, [isAuthenticated, token]);
  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
        // Handle local notification
        if (typeof notif.id === 'number' && notif.id < 0) {
            try {
                const localNotifs = JSON.parse(localStorage.getItem('cms_local_notifs') || '[]');
                const updated = localNotifs.map((n: any) => n.id === notif.id ? { ...n, is_read: true } : n);
                localStorage.setItem('cms_local_notifs', JSON.stringify(updated));
                
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch {}
            return;
        }

        try {
            await api.markNotificationRead(token, notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification read", err);
        }
    }
  };

  const handleUpdateUser = (updatedUser: any) => {
    setCurrentUserData(updatedUser);
    setCurrentUser(updatedUser.username); 
    localStorage.setItem('cms_user', updatedUser.username);
  };

  // Wizard State (Managed internally by ReleaseWizardWrapper now, or kept here if needed for cross-component state)
  const [editingRelease, setEditingRelease] = useState<ReleaseData | null>(null); 
  const [viewingRelease, setViewingRelease] = useState<ReleaseData | null>(null); 
  const [releaseToDelete, setReleaseToDelete] = useState<ReleaseData | null>(null);
  const [isDeletingRelease, setIsDeletingRelease] = useState(false);

  // Clear modal states on route change
  useEffect(() => {
      setViewingRelease(null);
      // We don't clear editingRelease here because the wizard might rely on it persisting across sub-routes
      // or we handle it specifically in the wizard flow.
      // But for the detail modal, it should definitely close when changing pages.
  }, [location.pathname]);

  // Check LocalStorage on Mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('cms_auth');
    const storedUser = localStorage.getItem('cms_user');
    const storedToken = localStorage.getItem('cms_token');
    const storedRole = localStorage.getItem('cms_role');
    const storedStatus = localStorage.getItem('cms_status');
    
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      if (storedUser) setCurrentUser(storedUser);
      if (storedToken) setToken(storedToken);
      if (storedRole) setUserRole(storedRole);
      if (storedStatus) setUserStatus(storedStatus);
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogin = (user: any, token: string) => {
    localStorage.setItem('cms_auth', 'true');
    localStorage.setItem('cms_user', user.username);
    localStorage.setItem('cms_token', token);
    localStorage.setItem('cms_role', user.role || 'User');
    if (user.status) {
      localStorage.setItem('cms_status', user.status);
    } else {
      localStorage.removeItem('cms_status');
    }
    setCurrentUser(user.username);
    setToken(token);
    setUserRole(user.role || 'User');
    setUserStatus(user.status || '');
    setCurrentUserData(user);
    const effectiveStatus = (user.status || '').toLowerCase();
    setIsAuthenticated(true);
    if (user.role === 'User') {
      if (effectiveStatus && !['approved', 'active'].includes(effectiveStatus)) {
        navigate('/user-status');
      } else {
        navigate('/my-releases');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    // Clear server-side session cookie
    api.logout().catch(() => {});
    localStorage.removeItem('cms_auth');
    localStorage.removeItem('cms_user');
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_role');
    localStorage.removeItem('cms_status');
    // Clear any wizard/draft remnants just in case
    try {
      sessionStorage.removeItem('cms_wizard_step');
      sessionStorage.removeItem('cms_wizard_type');
      localStorage.removeItem('cms_wizard_data');
      localStorage.removeItem('cms_wizard_current_step');
    } catch {}
    setIsAuthenticated(false);
    setCurrentUser('');
    setToken('');
    setUserRole('');
    setUserStatus('');
    setShowLogoutDialog(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleConfirmDeleteRelease = async () => {
      if (!releaseToDelete || !token) {
          setReleaseToDelete(null);
          return;
      }
      setIsDeletingRelease(true);
      try {
          await api.deleteRelease(token, releaseToDelete.id);
          setAllReleases(prev => prev.filter(r => r.id !== releaseToDelete.id));
          setViewingRelease(prev => (prev && prev.id === releaseToDelete.id ? null : prev));
          navigate('/releases');
      } catch (err: any) {
          setAlertState({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: err?.message || 'Gagal menghapus release',
            type: 'error'
          });
      } finally {
          setIsDeletingRelease(false);
          setReleaseToDelete(null);
      }
  };

  const handleSaveRelease = async (data: ReleaseData) => {
      try {
          const inferredOwnerDisplayName =
            (data as any).ownerDisplayName ||
            resolveOwnerName({
              ...data,
              user_id: (currentUserData as any)?.id,
              company_name: (currentUserData as any)?.company_name,
              user_full_name: (currentUserData as any)?.full_name,
              owner_name: (currentUserData as any)?.full_name,
              owner: (currentUserData as any)?.full_name,
              created_by: (currentUserData as any)?.username,
            } as any);

          const normalizedId = data.id ? String(data.id) : undefined;
          if (normalizedId) {
              setAllReleases(prev => {
                  const without = prev.filter(r => String(r.id) !== normalizedId);
                  return [{ ...(data as any), id: normalizedId, ownerDisplayName: inferredOwnerDisplayName }, ...without];
              });
          } else {
              setAllReleases(prev => ([{ ...(data as any), ownerDisplayName: inferredOwnerDisplayName }, ...prev]));
          }

          // Force re-fetch to ensure data consistency
           if (token) {
               api.getReleases(token).then(freshData => {
                   if (Array.isArray(freshData)) {
                       const mapped = freshData.map((r: any) => ({ ...r, id: String(r.id), ownerDisplayName: resolveOwnerName(r) }));
                       setAllReleases(mapped);
                   }
               }).catch(err => console.warn("Background refresh failed", err));
           }

          navigate('/releases');
          setViewingRelease(null);
      } catch (err: any) {
          console.error("Failed to save release:", err);
          setAlertState({
            isOpen: true,
            title: 'Gagal Menyimpan',
            message: `Failed to save release: ${err.message || 'Unknown error'}`,
            type: 'error'
          });
      }
  };

  const handleUpdateRelease = (updated: ReleaseData) => {
     setAllReleases(prev => prev.map(r => r.id === updated.id ? updated : r));
     if (viewingRelease && viewingRelease.id === updated.id) {
         setViewingRelease(updated);
     }
     
     // Re-fetch to ensure consistency (especially for status changes that might trigger other backend updates)
      if (token) {
         api.getReleases(token).then(freshData => {
             if (Array.isArray(freshData)) {
                 const mapped = freshData.map((r: any) => ({ ...r, id: String(r.id), ownerDisplayName: resolveOwnerName(r) }));
                 setAllReleases(mapped);
             }
         }).catch(err => console.warn("Background refresh failed", err));
      }
  };

  const handleViewDetails = async (release: ReleaseData) => {
      // Fetch full detail from API to populate missing fields (p/c-line, language, ISRC, audio paths)
      if (token && release.id) {
          try {
              const raw: any = await api.getRelease(token, release.id);
              const mapArtists = (arr: any) => Array.isArray(arr) ? arr : (typeof arr === 'string' ? [arr] : []);
              const primaryArtists = mapArtists(raw.primaryArtists);
              
              const mapped: ReleaseData = {
                  id: String(raw.id),
                  status: raw.status || release.status,
                  submissionDate: raw.submission_date || release.submissionDate,
                  aggregator: raw.aggregator || release.aggregator,

                  coverArt: raw.cover_art || release.coverArt || null,
                  type: raw.release_type || release.type,
                  upc: raw.upc || release.upc || '',
                  title: raw.title || release.title,
                  language: raw.language || release.language || '',
                  primaryArtists,
                  label: raw.label || release.label || '',
                  genre: raw.genre || release.genre,
                  subGenre: raw.sub_genre || release.subGenre,
                  pLine: raw.p_line || release.pLine || '',
                  cLine: raw.c_line || release.cLine || '',
                  version: raw.version || release.version || '',

                  tracks: (raw.tracks || []).map((t: any) => {
                      const p = mapArtists(t.primary_artists);
                      const f = mapArtists(t.featured_artists);
                      return {
                          id: String(t.id ?? `${raw.id}_${t.track_number}`),
                          audioFile: t.audio_file || null,
                          audioClip: null,
                          videoFile: null,
                          trackNumber: String(t.track_number ?? ''),
                          releaseDate: '',
                          isrc: t.isrc || '',
                          title: t.title || '',
                          duration: t.duration || '',
                          artists: [
                              ...p.map((name: string) => ({ name, role: 'MainArtist' })),
                              ...f.map((name: string) => ({ name, role: 'FeaturedArtist' })),
                          ],
                          genre: t.genre || '',
                          subGenre: t.sub_genre || '',
                          isInstrumental: undefined,
                          explicitLyrics: t.explicit_lyrics || 'No',
                          composer: t.composer || '',
                          lyricist: t.lyricist || '',
                          lyrics: t.lyrics || '',
                          contributors: []
                      };
                  }),

                  isNewRelease: raw.original_release_date ? false : true,
                  originalReleaseDate: raw.original_release_date || '',
                  plannedReleaseDate: raw.planned_release_date || release.plannedReleaseDate || ''
              };

              setViewingRelease(mapped);
              return;
          } catch (err) {
              console.warn('Failed to load full release detail, falling back to summary', err);
          }
      }
      setViewingRelease(release);
  };

  const handleEditRelease = async (release: ReleaseData) => {
      if (!release.id || !token) {
          setEditingRelease(release);
          navigate(release.type === 'SINGLE' ? '/new-release/single' : '/new-release/album');
          return;
      }
      try {
          const raw: any = await api.getRelease(token, release.id);
          const normDate = (v: any) => {
              if (!v) return '';
              if (typeof v === 'string') {
                  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
                  if (m) return m[1];
                  try {
                      const d = new Date(v);
                      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                  } catch {}
                  return v.slice(0, 10);
              }
              try {
                  const d = new Date(v);
                  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
              } catch {}
              return '';
          };
          const mapArr = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? [v] : []);
          const primaryArtists = mapArr(raw.primaryArtists);
          const toArtistObjs = (arr: any[], role: string) => (Array.isArray(arr) ? arr : []).map((name: string) => ({ name, role }));
          const tracks = (raw.tracks || []).map((t: any, idx: number) => ({
              id: String(t.id ?? `${raw.id}_${idx+1}`),
              audioFile: t.audio_file || null,
              audioClip: t.audio_clip || null,
              videoFile: null,
              iplFile: t.ipl_file || null,
              trackNumber: String(t.track_number ?? (idx+1)),
              releaseDate: '',
              isrc: t.isrc || '',
              title: t.title || '',
              duration: t.duration || '',
              artists: [
                ...toArtistObjs(mapArr(t.primary_artists), 'MainArtist'),
                ...toArtistObjs(mapArr(t.featured_artists), 'FeaturedArtist'),
              ],
              genre: t.genre || '',
              subGenre: t.sub_genre || '',
              isInstrumental: t.is_instrumental ? 'Yes' : 'No',
              explicitLyrics: t.explicit_lyrics || 'No',
              composer: t.composer || '',
              lyricist: t.lyricist || '',
              lyrics: t.lyrics || '',
              contributors: Array.isArray(t.contributors) ? t.contributors : []
          }));
          const optionMap: Record<string, { id: string; label: string; logo: string }> = {
              'SOCIAL': { id: 'SOCIAL', label: 'Social Media', logo: socialLogo },
              'YOUTUBE_MUSIC': { id: 'YOUTUBE_MUSIC', label: 'YouTube Music', logo: youtubeMusicLogo },
              'ALL_DSP': { id: 'ALL_DSP', label: 'All DSP', logo: allDspLogo },
          };
          let distributionTargets: { id: string; label: string; logo: string }[] = [];
          const dtA: any = raw.distributionTargets ?? raw.distribution_targets;
          if (Array.isArray(dtA)) {
              if (typeof dtA[0] === 'string') {
                  distributionTargets = (dtA as string[]).map(id => optionMap[id]).filter(Boolean);
              } else {
                  distributionTargets = dtA;
              }
          }
          const mapped: ReleaseData = {
              id: String(raw.id),
              userId: raw.user_id,
              status: raw.status || release.status,
              submissionDate: raw.submission_date || release.submissionDate,
              aggregator: raw.aggregator || release.aggregator,
              distributionTargets,
              coverArt: raw.cover_art || release.coverArt || null,
              type: (raw.release_type || release.type) as any,
              upc: raw.upc || release.upc || '',
              title: raw.title || release.title || '',
              language: raw.language || release.language || '',
              primaryArtists,
              label: raw.label || release.label || '',
              genre: raw.genre || release.genre || '',
              subGenre: raw.sub_genre || release.subGenre || '',
              pLine: raw.p_line || release.pLine || '',
              cLine: raw.c_line || release.cLine || '',
              version: raw.version || release.version || '',
              tracks,
              isNewRelease: raw.original_release_date ? false : true,
              originalReleaseDate: normDate(raw.original_release_date),
              plannedReleaseDate: normDate(raw.planned_release_date)
          };
          setEditingRelease(mapped);
          navigate(mapped.type === 'SINGLE' ? '/new-release/single' : '/new-release/album');
      } catch (e) {
          console.error('Failed to load full release for edit', e);
          setEditingRelease(release);
          navigate(release.type === 'SINGLE' ? '/new-release/single' : '/new-release/album');
      }
  };

  const handleSaveAggregators = async (newList: string[]) => {
      setAggregators(newList);
      if (token) {
          try {
              await api.updateAggregators(token, newList);
          } catch (err) {
              console.error("Failed to save aggregators:", err);
          }
      }
  };

  if (isAuthChecking) {
    // Allow public routes to render immediately if they are being accessed
    const path = location.pathname.toLowerCase();
    if (path === '/register' || path.startsWith('/register/')) {
      return (
        <ErrorBoundary>
            <Routes>
            <Route path="/register" element={<RegisterScreen onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
            </Routes>
        </ErrorBoundary>
      );
    }
    // Also allow login to bypass the check to avoid blank screen if check is slow
    if (path === '/login' || path.startsWith('/login/')) {
         return (
            <Routes>
                <Route path="/login" element={<LoginScreen onLogin={handleLogin} initialMode="login" />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
         );
    }
    
    // Fallback UI instead of null to identify if we are stuck here
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat aplikasi...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Routes>
            <Route path="/login" element={<LoginScreen onLogin={handleLogin} initialMode="login" />} />
            <Route path="/register" element={<RegisterScreen onLogin={handleLogin} />} />
            <Route path="/user-status" element={<UserStatusScreen username={''} status={'Pending'} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  // Determine Page Title for Header
  const getPageTitle = () => {
      const path = location.pathname;
      if (path === '/dashboard') return "Overview";
      if (path === '/aggregator') return "Aggregator";
      if (path === '/new-release') return "Music Distribution";
      if (path === '/releases') return "Catalog Manager";
      if (path === '/settings') return "System Settings";
      if (path === '/users') return "User Management";
      if (path === '/reports') return "Laporan";
      if (path === '/import-reports') return "Import Laporan";
      if (path === '/revenue') return "Pendapatan";
      if (path === '/reports/payments') return "Menu Pembayaran";
      if (path.startsWith('/reports/payments/detail')) return "Detail Pembayaran";
      if (path === '/statistics') return "Analytics & Reports";
      if (path.startsWith('/publishing')) return "Publishing";
      return "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-slate-700"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 md:w-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <Sidebar currentUser={currentUser} userRole={userRole} />
         <div 
            className={`absolute inset-0 bg-black/50 -z-10 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
            onClick={() => setIsMobileMenuOpen(false)}
         ></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-0 overflow-x-hidden min-h-screen flex flex-col relative">
        
        {/* GLOBAL HEADER */}
        <header 
            className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/20 px-6 py-3 flex items-center justify-between shadow-sm transition-colors duration-300"
            style={{ background: headerBgColor }}
        >
            {location.pathname === '/dashboard' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        Dashboard
                    </span>
                </div>
            ) : location.pathname === '/aggregator' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        Aggregator Overview
                    </span>
                </div>
            ) : location.pathname === '/releases' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        All Releases
                    </span>
                </div>
            ) : location.pathname === '/settings' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        Settings
                    </span>
                </div>
            ) : location.pathname === '/users' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        User Management
                    </span>
                </div>
            ) : location.pathname === '/statistics' ? (
                <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-sm tracking-tight" style={{ color: headerTitleColor }}>
                        statistik &amp; laporan
                    </span>
                </div>
            ) : (
                <h2 className="text-base tracking-tight hidden md:block" style={{ color: headerTitleColor }}>
                    {getPageTitle()}
                </h2>
            )}
            <div className="flex-1 md:flex-none flex justify-end items-center gap-6">
                {/* Notifications */}
                <div className="relative">
                    <button 
                        className="relative p-2 rounded-full transition-colors group hover:bg-black/5"
                        style={{ color: headerTitleColor }}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border border-white text-[10px] flex items-center justify-center text-white font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="fixed right-6 top-[60px] w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                <button 
                                    onClick={() => setShowNotifications(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 ${!notif.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
                                                {notif.type === 'RELEASE_STATUS' ? <CheckCircle size={16} /> : <Info size={16} />}
                                            </div>
                                            <div>
                                                <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div 
                    className="flex items-center gap-3 pl-6 border-l cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderColor: headerTitleColor ? headerTitleColor + '40' : 'rgba(226, 232, 240, 0.5)' }}
                    onClick={() => setShowProfileModal(true)}
                >
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold capitalize" style={{ color: headerTitleColor }}>{currentUserData?.full_name || currentUserData?.name || currentUser}</div>
                        <div className="text-[10px] font-medium opacity-70" style={{ color: headerTitleColor }}>
                            {userRole === 'Admin' 
                                ? 'Super Administrator' 
                                : userRole === 'Operator' 
                                    ? 'Content Manager' 
                                    : (currentUserData?.account_type?.toLowerCase() === 'company' ? 'PT/LABEL' : 'ARTIS')}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 overflow-hidden relative">
                        {currentUserData?.profile_picture ? (
                            <img 
                                src={getProfileImageUrl(currentUserData.profile_picture) || ''} 
                                alt={currentUser} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    console.error("Failed to load profile image:", e.currentTarget.src);
                                    e.currentTarget.style.display = 'none';
                                    // Show fallback icon by removing this image from DOM or toggling state? 
                                    // Simpler: Just hide image, the parent div background will show. 
                                    // But we need the User icon.
                                    // Better: Use a state for image error.
                                    e.currentTarget.onerror = null; // Prevent infinite loop
                                    // We can't easily inject the User icon here without state.
                                    // Let's just make sure the parent div has a fallback content if image is hidden.
                                    // Actually, the parent div is just a container.
                                    // Let's replace the content.
                                }}
                            />
                        ) : (
                            <User size={20} />
                        )}
                        {/* Fallback Icon (visible if image is hidden or missing) - Hacky but works without state */}
                        {currentUserData?.profile_picture && (
                            <div className="absolute inset-0 flex items-center justify-center -z-10">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-xs transition-colors ml-2"
                    title="Sign Out"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1">
          <Routes>
            <Route
              path="/user-status"
              element={
                <UserStatusScreen
                  username={currentUser || currentUserData?.username || ''}
                  status={userStatus}
                />
              }
            />
            <Route
              path="/"
              element={
                userRole === 'User' && userStatus && !['approved', 'active'].includes(userStatus.toLowerCase())
                  ? <Navigate to="/user-status" replace />
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="/dashboard" element={
            <Dashboard releases={allReleases} token={token} />
        } />
        <Route path="/aggregator" element={
            <AggregatorDashboard 
                releases={allReleases}
                onViewRelease={handleViewDetails}
                onNavigateToAll={() => navigate('/releases')}
            />
        } />
        <Route path="/aggregator/artists" element={<Artists releases={userRole === 'User' ? myReleases : allReleases} />} />
        <Route path="/aggregator/artists/:name" element={<ArtistDetail releases={userRole === 'User' ? myReleases : allReleases} token={token} />} />

            {/* Contracts Routes */}
            <Route path="/contracts/aggregator" element={<Contracts token={token} defaultTab="aggregator" />} />
            <Route path="/contracts/aggregator/:id" element={<ContractDetail token={token} />} />
            <Route path="/contracts/publishing" element={<Contracts token={token} defaultTab="publishing" />} />
            
            <Route path="/new-release" element={
                <NewReleaseFlow 
                    editingRelease={editingRelease}
                    setEditingRelease={setEditingRelease}
                    onSaveRelease={handleSaveRelease}
                />
            } />
            <Route path="/new-release/single" element={
                <ReleaseWizard 
                    type="SINGLE"
                    onBack={() => {
                        const targetId = editingRelease?.id;
                        setEditingRelease(null);
                        if (targetId) {
                          navigate(`/releases/${targetId}/view`);
                        } else {
                          navigate('/new-release');
                        }
                    }}
                    onSave={handleSaveRelease}
                    initialData={editingRelease || undefined}
                    userRole={userRole}
                />
            } />
            <Route path="/new-release/album" element={
                <ReleaseWizard 
                    type="ALBUM"
                    onBack={() => {
                        const targetId = editingRelease?.id;
                        setEditingRelease(null);
                        if (targetId) {
                          navigate(`/releases/${targetId}/view`);
                        } else {
                          navigate('/new-release');
                        }
                    }}
                    onSave={handleSaveRelease}
                    initialData={editingRelease || undefined}
                    userRole={userRole}
                />
            } />
            <Route path="/releases" element={
                 <AllReleases 
                    releases={allReleases} 
                    onViewDetails={(r) => navigate(`/releases/${r.id}/view`)}
                    error={dataFetchError}
                    userRole={userRole}
                />
            } />
            <Route path="/my-releases" element={
                 <AllReleases 
                    releases={myReleases} 
                    onViewDetails={(r) => navigate(`/releases/${r.id}/view`)}
                    error={dataFetchError}
                    userRole={userRole}
                 />
            } />
            <Route path="/user/reports/analytics" element={<UserAnalytics releases={allReleases} reportData={reportData} currentUserData={currentUserData} token={token} onAuthExpired={handleAuthExpired} />} />
            <Route path="/user/reports/payments" element={<UserPayments reportData={reportData} currentUserData={currentUserData} token={token} onAuthExpired={handleAuthExpired} />} />
            
            <Route path="/tickets" element={<Tickets token={token} userRole={userRole} onAuthExpired={handleAuthExpired} />} />
            <Route path="/tickets/:id" element={<TicketDetail token={token} userRole={userRole} onAuthExpired={handleAuthExpired} />} />

            <Route path="/me/profile" element={<MyProfile currentUserData={currentUserData} />} />
            <Route path="/me/contracts" element={<MyContracts currentUserData={currentUserData} />} />
            <Route path="/me/contracts/aggregator" element={<MyContracts currentUserData={currentUserData} defaultTab="aggregator" />} />
            <Route path="/me/contracts/publishing" element={<MyContracts currentUserData={currentUserData} defaultTab="publishing" />} />
            <Route path="/statistics" element={<Statistics releases={allReleases} reportData={reportData} token={token} />} />
            <Route path="/statistics/aggregator" element={<Statistics releases={allReleases} reportData={reportData} token={token} defaultTab="aggregator" />} />
            <Route path="/statistics/publishing" element={<Statistics releases={allReleases} reportData={reportData} token={token} defaultTab="publishing" />} />
            <Route 
                path="/releases/:id/view" 
                element={
                    <ReleaseDetailsPage 
                        token={token} 
                        userRole={userRole}
                        aggregators={aggregators} 
                        onReleaseUpdated={handleUpdateRelease}
                        onEditRelease={userRole === 'Admin' ? handleEditRelease : undefined}
                        onDeleteRelease={userRole === 'Admin' ? (release) => {
                            setReleaseToDelete(release);
                        } : undefined}
                        resolveOwnerName={resolveOwnerName}
                    />
                } 
            />
            <Route path="/releases/:id/single" element={<SingleReleasePage />} />
            
            {/* Publishing Routes */}
            <Route path="/publishing/writer" element={<PublishingWriter token={token} userRole={userRole} />} />
            <Route path="/publishing/writers/:id" element={<PublishingWriterDetail token={token} />} />
            <Route path="/publishing/songs" element={<PublishingSongs token={token} userRole={userRole} />} />
            <Route path="/publishing/analytics" element={<PublishingAnalytics token={token} />} />
            <Route path="/publishing/reports" element={<PublishingReports token={token} />} />

            <Route path="/settings" element={
                 <Settings 
                    aggregators={aggregators} 
                    onSaveAggregators={handleSaveAggregators} 
                />
            } />
            <Route path="/users" element={
                <UserManagement 
                    currentUserRole={userRole} 
                    token={token}
                />
            } />
            <Route path="/roles/user" element={<RoleUserPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/users/:id/edit" element={<UserEditPage />} />
            <Route path="/reports" element={
                <ReportScreen 
                    mode="view" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                />
            } />
            <Route path="/reports/aggregator" element={
                <ReportScreen 
                    mode="view" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                    defaultTab="aggregator"
                />
            } />
            <Route path="/reports/publishing" element={
                <ReportScreen 
                    mode="view" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                    defaultTab="publishing"
                />
            } />
            <Route path="/import-reports" element={
                <ReportScreen 
                    mode="import" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                />
            } />
            <Route path="/import-reports/aggregator" element={
                <ReportScreen 
                    mode="import" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                    defaultTab="aggregator"
                />
            } />
            <Route path="/import-reports/publishing" element={
                <ReportScreen 
                    mode="import" 
                    data={reportData} 
                    releases={allReleases}
                    onImport={setReportData}
                    aggregators={aggregators}
                    token={token}
                    defaultTab="publishing"
                />
            } />
            <Route path="/revenue" element={<RevenueScreen data={reportData} token={token} />} />
            <Route path="/revenue/aggregator" element={<RevenueScreen data={reportData} token={token} defaultTab="aggregator" />} />
            <Route path="/revenue/publishing" element={<RevenueScreen data={reportData} token={token} defaultTab="publishing" />} />
            <Route path="/reports/payments" element={<PaymentScreen token={token} />} />
            <Route path="/reports/payments/aggregator" element={<PaymentScreen token={token} defaultTab="aggregator" />} />
            <Route path="/reports/payments/publishing" element={<PaymentScreen token={token} defaultTab="publishing" />} />
            <Route path="/reports/payments/detail/:id" element={<PaymentDetailScreen />} />
          </Routes>
        </div>

        <Footer />

        {/* Modals */}

        {showProfileModal && (
            <ProfileModal 
                isOpen={true}
                user={currentUserData || { username: currentUser, email: '', role: userRole }}
                onClose={() => setShowProfileModal(false)}
                onUpdateUser={handleUpdateUser}
                token={token}
            />
        )}

        {showLogoutDialog && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Sign Out?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Are you sure you want to sign out? You will need to login again to access your dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={cancelLogout}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {releaseToDelete && (
            <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Release?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Apakah Anda yakin ingin menghapus release "{releaseToDelete.title}"? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setReleaseToDelete(null)}
                                disabled={isDeletingRelease}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleConfirmDeleteRelease}
                                disabled={isDeletingRelease}
                                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isDeletingRelease && <Loader2 size={16} className="animate-spin" />}
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Support Bubble */}
        <FloatingSupportBubble count={ticketUnreadCount} />
        
        {/* Release Detail Modal */}
        {viewingRelease && (
            <ReleaseDetailModal 
                release={viewingRelease} 
                isOpen={!!viewingRelease} 
                onClose={() => setViewingRelease(null)} 
                onUpdate={async (r) => {
                    try {
                        await api.updateReleaseWorkflow(token, r);
                        handleUpdateRelease(r);
                        setViewingRelease(null);
                    } catch (e: any) {
                        setAlertState({
                            isOpen: true,
                            title: 'Error',
                            message: e?.message || 'Gagal menyimpan status release',
                            type: 'error'
                        });
                    }
                }}
                availableAggregators={aggregators}
                mode="view"
                onEdit={userRole === 'Admin' ? handleEditRelease : undefined}
                onDelete={userRole === 'Admin' ? (r) => { setReleaseToDelete(r); setViewingRelease(null); } : undefined}
                userRole={userRole}
                token={token}
                onCoverArtUpdated={(newUrl) => {
                    if (viewingRelease) {
                         const updated = { ...viewingRelease, coverArt: newUrl };
                         // Reflect status change for non-admins (matching backend logic)
                         if (userRole !== 'Admin') {
                             updated.status = 'Request Edit';
                         }
                         handleUpdateRelease(updated);
                    }
                }}
            />
        )}

        <AlertModal
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        />
      </main>
    </div>
  );
};

export default App;
