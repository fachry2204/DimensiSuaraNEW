
import React, { useState, useEffect, useRef } from 'react';
import { ReleaseData, Track } from '../types';
import { GoogleGenAI } from "@google/genai";
import { ArrowLeft, Play, Pause, FileAudio, CheckCircle, AlertTriangle, Globe, Disc, Save, Clipboard, Calendar, Tag, User, Mic2, FileText, Wand2, Loader2, Clock, Music2, Info, Download, Scissors, Users, ChevronDown, ChevronUp, Edit3, Trash2, Upload, Camera } from 'lucide-react';
import { formatDMY } from '../utils/date';
import { assetUrl } from '../utils/url';
import { api, API_BASE_URL } from '../utils/api';
import { AlertModal } from './AlertModal';

interface Props {
  release: ReleaseData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedRelease: ReleaseData) => void;
  availableAggregators: string[];
  mode?: 'view' | 'edit';
  onEdit?: (release: ReleaseData) => void;
  onDelete?: (release: ReleaseData) => void;
  userRole?: 'Admin' | 'Operator' | 'User' | string;
  isUpdatingCoverArt?: boolean;
  token?: string;
  onCoverArtUpdated?: (newCoverArtUrl: string) => void;
}

export const ReleaseDetailModal: React.FC<Props> = ({ release, isOpen, onClose, onUpdate, availableAggregators, mode = 'edit', onEdit, onDelete, userRole, isUpdatingCoverArt, token, onCoverArtUpdated }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'DISTRIBUTION'>('INFO');
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Accordion State for Tracklist
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  // Audio Preview State
  // Keys: `${trackId}_full` or `${trackId}_clip`
  const [objectUrls, setObjectUrls] = useState<{ [key: string]: string }>({});
  
  // File Input Ref for Cover Art
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);


  // Form State for Distribution
  const [status, setStatus] = useState(release.status || 'Pending');
  const [selectedAggregator, setSelectedAggregator] = useState(release.aggregator || '');
  const [upcInput, setUpcInput] = useState(release.upc || '');
  const [isrcInputs, setIsrcInputs] = useState<{ [key: string]: string }>({});

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState(release.rejectionReason || '');
  const [rejectionDesc, setRejectionDesc] = useState(release.rejectionDescription || '');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const upcDisplay = upcInput || release.upc || '';
  const primaryIsrc = release.tracks[0]?.isrc || '';

  useEffect(() => {
    if (isOpen) {
        // Initialize ISRC inputs from existing tracks
        const initialIsrcs: any = {};
        release.tracks.forEach(t => {
            initialIsrcs[t.id] = t.isrc || '';
        });
        setIsrcInputs(initialIsrcs);
        setStatus(release.status || 'Pending');
        setSelectedAggregator(release.aggregator || '');
        setUpcInput(release.upc || '');
        setRejectionReason(release.rejectionReason || '');
        setRejectionDesc(release.rejectionDescription || '');
        
        // Reset expanded track
        setExpandedTrackId(null);
    }
  }, [isOpen, release]);

  // Generate Object/Asset URLs for preview (Cover, Full Audio, Clip Audio)
  useEffect(() => {
    if (!isOpen) return;
    const newUrls: { [key: string]: string } = {};
    
    // Cover Art
    if (release.coverArt) {
        if (typeof release.coverArt === 'string') {
            newUrls['cover_art'] = assetUrl(release.coverArt);
        } else if (release.coverArt instanceof Blob) {
            newUrls['cover_art'] = URL.createObjectURL(release.coverArt);
        } else {
            // Unsupported type, skip
        }
    }

    // Tracks
    release.tracks.forEach(t => {
        if ((t as any).audioFile) {
            const af: any = (t as any).audioFile;
            if (typeof af === 'string') newUrls[`${t.id}_full`] = assetUrl(af);
            else if (af instanceof Blob) newUrls[`${t.id}_full`] = URL.createObjectURL(af);
        }
        if ((t as any).audioClip) {
            const ac: any = (t as any).audioClip;
            if (typeof ac === 'string') newUrls[`${t.id}_clip`] = assetUrl(ac);
            else if (ac instanceof Blob) newUrls[`${t.id}_clip`] = URL.createObjectURL(ac);
        }
    });
    setObjectUrls(newUrls);

    return () => {
        Object.values(newUrls).forEach(url => {
            // Revoke only blob/object urls
            if (url.startsWith('blob:')) {
                try { URL.revokeObjectURL(url); } catch {}
            }
        });
    };
  }, [isOpen, release.tracks, release.coverArt]);

  if (!isOpen) return null;

  const toggleTrackExpand = (trackId: string) => {
    setExpandedTrackId(prev => prev === trackId ? null : trackId);
  };

  const handleCoverArtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check permissions if needed, but UI already restricts it
    if (!token) {
        setAlertState({
            isOpen: true,
            title: 'Sesi Berakhir',
            message: 'Session expired. Please login again.',
            type: 'error'
        });
        return;
    }

    // 1. Strict File Type Check
    if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        setAlertState({
            isOpen: true,
            title: 'Format File Salah',
            message: 'Format gambar WAJIB JPG/JPEG. Tidak boleh format lain.',
            type: 'error'
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    // 2. Strict Dimension Check (3000x3000px)
    const isValidDimensions = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width !== 3000 || img.height !== 3000) {
                setAlertState({
                    isOpen: true,
                    title: 'Ukuran Gambar Salah',
                    message: `Ukuran gambar WAJIB 3000x3000px. Tidak boleh ukuran lain. Ukuran file anda: ${img.width}x${img.height}px`,
                    type: 'error'
                });
                resolve(false);
            } else {
                resolve(true);
            }
        };
        img.onerror = () => {
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: 'Gagal membaca file gambar.',
                type: 'error'
            });
            resolve(false);
        };
    });

    if (!isValidDimensions) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setAlertState({
            isOpen: true,
            title: 'File Terlalu Besar',
            message: 'File size exceeds 5MB limit.',
            type: 'error'
        });
        return;
    }

    setIsUploadingCover(true);
    try {
        const formData = new FormData();
        formData.append('cover_art', file);

        const response = await fetch(`${API_BASE_URL}/releases/${release.id}/cover-art`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(err.message || 'Failed to upload cover art');
        }

        const data = await response.json();
        
        if (data.cover_art_url) {
           const newUrl = assetUrl(data.cover_art_url);
           // Update local preview immediately
           setObjectUrls(prev => ({ ...prev, 'cover_art': newUrl }));
           
           if (onCoverArtUpdated) {
               onCoverArtUpdated(data.cover_art_url);
           }
           setAlertState({
               isOpen: true,
               title: 'Berhasil',
               message: 'Cover art updated successfully!',
               type: 'success'
           });
        } else {
           setAlertState({
               isOpen: true,
               title: 'Berhasil',
               message: 'Cover art uploaded. Please refresh to see changes.',
               type: 'success'
           });
        }
        
    } catch (error: any) {
        console.error("Upload error:", error);
        setAlertState({
            isOpen: true,
            title: 'Gagal Upload',
            message: error.message || "Failed to upload cover art",
            type: 'error'
        });
    } finally {
        setIsUploadingCover(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI Generation for Rejection
  const generateRejectionMessage = async () => {
      if (!rejectionReason) {
          setAlertState({
              isOpen: true,
              title: 'Peringatan',
              message: 'Mohon isi alasan utama terlebih dahulu.',
              type: 'warning'
          });
          return;
      }
      setIsGeneratingAi(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            Bertindaklah sebagai tim Quality Control distribusi musik digital. 
            Tuliskan email penolakan rilis yang **detail, sopan, dan profesional dalam Bahasa Indonesia** kepada artis.
            Jelaskan mengapa rilis mereka ditolak berdasarkan alasan utama ini: "${rejectionReason}".
            Berikan instruksi spesifik tentang apa yang perlu mereka perbaiki agar rilis dapat disetujui pada pengajuan berikutnya.
            Hindari sapaan pembuka seperti "Halo Artis", langsung ke inti permasalahan namun tetap ramah.
          `;

          const result = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt,
          });
          setRejectionDesc(result.text || "");
      } catch (error) {
          console.error("AI Generation Error", error);
          setAlertState({
              isOpen: true,
              title: 'Gagal',
              message: 'Gagal membuat deskripsi. Periksa API Key atau coba lagi manual.',
              type: 'error'
          });
          // Fallback if AI fails
          setRejectionDesc(`Rilis Anda ditolak karena: ${rejectionReason}. Mohon perbaiki masalah ini dan ajukan ulang.`);
      } finally {
          setIsGeneratingAi(false);
      }
  };

  const handleSaveStatus = () => {
      // 1. Validation for Processing
      if (status === 'Processing' && !selectedAggregator) {
          setAlertState({
              isOpen: true,
              title: 'Validasi Gagal',
              message: 'Please select an Aggregator for processing.',
              type: 'error'
          });
          return;
      }

      // 2. Validation for LIVE/RELEASED (Strict)
      if (status === 'Live') {
          if (!upcInput || upcInput.trim() === "") {
             setAlertState({
                 isOpen: true,
                 title: 'CRITICAL ERROR',
                 message: 'Album UPC is REQUIRED for Released status.',
                 type: 'error'
             });
             return;
          }
          
          const missingIsrcs = release.tracks.some(t => {
              const val = isrcInputs[t.id];
              return !val || val.trim() === "";
          });

          if (missingIsrcs) {
              setAlertState({
                  isOpen: true,
                  title: 'CRITICAL ERROR',
                  message: 'ISRC Codes are REQUIRED for ALL tracks when status is Released.',
                  type: 'error'
              });
              return;
          }
      }

      // 3. Validation for Rejection
      if (status === 'Rejected' && !rejectionReason) {
          setAlertState({
              isOpen: true,
              title: 'Validasi Gagal',
              message: 'Please provide a reason for rejection.',
              type: 'error'
          });
          return;
      }

      // Construct Updated Release
      const updatedTracks = release.tracks.map(t => ({
          ...t,
          isrc: isrcInputs[t.id] || t.isrc
      }));

      const updatedRelease: ReleaseData = {
          ...release,
          status: status,
          aggregator: selectedAggregator,
          upc: upcInput,
          rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
          rejectionDescription: status === 'Rejected' ? rejectionDesc : undefined,
          tracks: updatedTracks
      };

      onUpdate(updatedRelease);
  };

  const downloadFile = (url: string, filename: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const getFileName = (f: any, fallback = ''): string => {
      if (!f) return fallback;
      if (typeof f === 'string') {
          const parts = f.split(/[\\/]/);
          return parts[parts.length - 1] || fallback;
      }
      return f.name || fallback;
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setAlertState({
          isOpen: true,
          title: 'Disalin',
          message: 'Copied to clipboard!',
          type: 'success'
      });
  };

  const AudioPlayer = ({ track, type = 'full' }: { track: Track, type?: 'full' | 'clip' }) => {
    const key = `${track.id}_${type}`;
    const url = objectUrls[key];
    
    if (!url) return <span className="text-xs text-gray-400 italic">No Audio</span>;

    const fileName = type === 'full' ? getFileName((track as any).audioFile, 'full_audio') : getFileName((track as any).audioClip, 'audio_clip');

    return (
      <div className="flex items-center gap-3 w-full">
        <audio
          id={`audio-${key}`}
          src={url}
          controls
          preload="metadata"
          className="flex-1 h-8"
        />
        <button 
          onClick={(e) => { e.stopPropagation(); downloadFile(url, fileName || `audio_${type}.wav`); }}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 hover:text-blue-600 transition-colors"
          title={`Download ${type === 'full' ? 'Full Track' : 'Clip'}`}
        >
          <Download size={14} />
        </button>
      </div>
    );
  };

  const InfoRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
      <div className="flex flex-col mb-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-0.5">{label}</span>
          <div className={`text-[13px] font-medium flex items-center justify-between group ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>
              <span className="truncate pr-2">{value || "-"}</span>
              {value && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600 transition-opacity"
                    title="Copy"
                  >
                      <Clipboard size={12} />
                  </button>
              )}
          </div>
      </div>
  );

  return (
    <div className="w-full min-h-screen bg-white pb-12 animate-fade-in">
        
        {/* Header - No longer a modal header */}
        <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={onClose} 
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                        <ArrowLeft size={20} />
                        Back to List
                    </button>
                    {(userRole === 'Admin' || userRole === 'Operator') && (
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors">
                                Discard
                            </button>
                            <button 
                                onClick={handleSaveStatus}
                                className={`px-5 py-2 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all text-sm
                                    ${status === 'Rejected' 
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-100' 
                                        : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100'}
                                `}
                            >
                                <Save size={16} />
                                {status === 'Rejected' ? 'Save Rejection' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-3 flex-shrink-0 w-40 md:w-48">
                    <div className="w-full aspect-square rounded-xl bg-gray-200 shadow-md overflow-hidden border border-gray-300 flex flex-col relative group">
                        <div className="flex-1 relative">
                            {release.coverArt ? (
                                <img 
                                    src={objectUrls['cover_art']} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg';
                                        (e.target as HTMLImageElement).onerror = null;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Disc size={40} /></div>
                            )}
                            
                            {/* Edit Overlay */}
                            {(token && !isUpdatingCoverArt && userRole !== 'Admin') && (
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${release.coverArt ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingCover}
                                        className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 hover:text-blue-600 hover:scale-110 transition-all shadow-lg"
                                        title="Change Cover Art"
                                    >
                                        {isUploadingCover ? <Loader2 size={24} className="animate-spin text-blue-600" /> : <Camera size={24} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Hidden Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleCoverArtUpload} 
                        accept=".jpg, .jpeg" 
                        className="hidden" 
                    />

                    {/* Change Cover Button - Non-Admin Only */}
                    {userRole !== 'Admin' && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingCover}
                            className="w-full py-2 rounded-lg bg-blue-500 text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            Ganti Art Cover
                        </button>
                    )}

                    <button 
                        onClick={() => {
                            if (!release.coverArt) return;
                            const name = getFileName(release.coverArt, 'cover_art');
                            downloadFile(objectUrls['cover_art'], name);
                        }}
                        disabled={!release.coverArt}
                        className="w-full py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors
                                   border-orange-400 text-orange-600 bg-white hover:bg-orange-50 disabled:opacity-50"
                    >
                        <Download size={14} /> Album Cover
                    </button>
                    
                    <div className="text-[10px] text-red-600 font-medium leading-tight text-center mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        Wajib menggunakan format JPG/JPEG dengan resolusi tepat 3000x3000px.
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-sm text-slate-600 mb-1 font-medium">
                        {(release as any).ownerDisplayName || 'Unknown User'}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">{release.title}</h1>
                    <p className="text-slate-600 font-medium text-lg mb-3">
                        {release.primaryArtists.map(a => typeof a === 'string' ? a : a.name).join(", ")}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                            (status === 'Live' || status === 'Released') ? 'bg-green-100 text-green-700 border-green-200' :
                            status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                            {status === 'Rejected' && <AlertTriangle size={14} />}
                            <span className="uppercase tracking-wider">{(status === 'Live' || status === 'Released') ? 'Released' : status}</span>
                        </span>
                        {(userRole === 'Admin' || userRole === 'Operator') && release.aggregator && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                                <Globe size={14} /> {release.aggregator}
                            </span>
                        )}
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-slate-600 border border-gray-200 flex items-center gap-1.5">
                            <Music2 size={14} /> {release.tracks.length > 1 ? 'Album' : 'Single'}
                        </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                        <div>
                            <table className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg overflow-hidden">
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="w-40 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Planned Release Date</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{formatDMY(release.plannedReleaseDate)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="w-40 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Version</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{release.version || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="w-40 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Genre</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{release.genre || release.tracks[0]?.genre || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="w-40 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Subgenre</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{release.subGenre || release.tracks[0]?.subGenre || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <table className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg overflow-hidden">
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="w-36 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Title Language</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{release.language || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="w-36 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">UPC</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{upcDisplay || 'Not Assigned'}</td>
                                    </tr>
                                    <tr>
                                        <td className="w-36 text-[11px] uppercase text-slate-500 px-3 py-1.5 align-top bg-slate-50">Record Label</td>
                                        <td className="px-3 py-1.5 text-slate-700 align-top">{release.label || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase text-slate-500 mb-1">Primary Artists</div>
                            <ul className="text-sm text-slate-800 space-y-0.5">
                                            {(release.primaryArtists || []).map((artist, idx) => (
                                                <li key={idx} className="flex items-center gap-1">
                                                    <span>{typeof artist === 'string' ? artist : artist.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {userRole === 'Admin' && onEdit && (
                            <button
                                onClick={() => onEdit(release)}
                                disabled={!!isUpdatingCoverArt}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Edit Release"
                            >
                                <Edit3 size={14} />
                                Edit Release
                            </button>
                        )}


                        
                        {userRole === 'Admin' && onDelete && (
                            <button
                                onClick={() => onDelete(release)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                                title="Delete Release"
                            >
                                <Trash2 size={14} />
                                Delete Release
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button 
                    onClick={() => setActiveTab('INFO')}
                    className={`pb-4 px-4 mr-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'INFO' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <FileText size={16} /> Metadata & Tracks
                </button>
                {(userRole === 'Admin' || userRole === 'Operator') && (
                    <button 
                        onClick={() => setActiveTab('DISTRIBUTION')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DISTRIBUTION' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <Globe size={16} /> Distribution & Status
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'INFO' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div>
                             <div className="flex items-center gap-2 mb-4">
                                 <FileAudio size={20} className="text-blue-500" />
                                 <h3 className="font-bold text-slate-700 text-xl">Tracklist & Metadata (Detailed)</h3>
                            </div>

                            <div className="space-y-4">
                                {release.tracks.map((track) => {
                                    const isExpanded = expandedTrackId === track.id;
                                    
                                    return (
                                        <div key={track.id} className={`bg-white rounded-xl border overflow-hidden transition-all shadow-sm ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-200'}`}>
                                            {/* Track Header (Clickable for Accordion) */}
                                            <div 
                                                className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'bg-slate-50 hover:bg-slate-100'}`}
                                                onClick={() => toggleTrackExpand(track.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-gray-200'}`}>
                                                        {track.trackNumber}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-slate-800">{track.title}</h4>
                                                        <div className="mt-1 space-y-0.5">
                                                            {track.artists.map((a, idx) => (
                                                                <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                                                                    <span>{a.name}</span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
                                                                        {a.role === 'MainArtist' ? 'Primary' : a.role === 'FeaturedArtist' ? 'Featured' : a.role}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-slate-400">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* Track Details Grid (Conditionally Rendered) */}
                                            {isExpanded && (
                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in border-t border-gray-100">
                                                    {/* Column 1: Audio Files & Actions */}
                                                    <div className="space-y-6">
                                                        {/* Full Audio */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                                                                <FileAudio size={12} /> Full Audio File
                                                            </span>
                                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                <div className="text-xs font-bold text-slate-700 truncate mb-2" title={getFileName((track as any).audioFile)}>
                                                                    {getFileName((track as any).audioFile) || "No file uploaded"}
                                                                </div>
                                                                <AudioPlayer track={track} type="full" />
                                                            </div>
                                                        </div>

                                                        {/* Audio Clip */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                                                                <Scissors size={12} /> Audio Clip (Trim)
                                                            </span>
                                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                {track.audioClip ? (
                                                                    <>
                                                                        <div className="text-xs font-bold text-slate-700 truncate mb-2" title={track.audioClip.name}>
                                                                            {track.audioClip.name}
                                                                        </div>
                                                                        <AudioPlayer track={track} type="clip" />
                                                                    </>
                                                                ) : (
                                                                    <div className="text-xs text-slate-400 italic py-1">No clip generated</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">Genre</span>
                                                                <div className="text-sm font-medium text-slate-700">{track.genre}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">Sub Genre</span>
                                                                <div className="text-sm font-medium text-slate-700">{track.subGenre}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">Explicit</span>
                                                                <div className={`text-sm font-bold ${track.explicitLyrics === 'Yes' ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {track.explicitLyrics}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Column 2: Artists, Credits & Contributors */}
                                                    <div className="space-y-6">
                                                        {/* Track Title (placed above Artists) */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Judul Track</span>
                                                            <div className="mt-1 text-sm font-medium text-slate-800">
                                                                {track.title || '-'}
                                                            </div>
                                                        </div>
                                                        {/* Artists (moved above composer & lyrics) */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Artists</span>
                                                            <div className="mt-1 space-y-0.5">
                                                                {track.artists.map((a, idx) => (
                                                                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                                                                        <span>{a.name}</span>
                                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
                                                                            {a.role === 'MainArtist' ? 'Primary' : a.role === 'FeaturedArtist' ? 'Featured' : a.role}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                             <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">Composer</span>
                                                                <div className="text-sm font-medium text-slate-700">{track.composer}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">Lyricist</span>
                                                                <div className="text-sm font-medium text-slate-700">{track.lyricist}</div>
                                                            </div>
                                                        </div>
            
                                                        {/* Full Additional Contributors Display */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-2">
                                                                <Users size={12} /> Additional Contributors
                                                            </span>
                                                            {track.contributors.length > 0 ? (
                                                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                                    <table className="w-full text-left text-xs">
                                                                        <thead className="bg-gray-50 text-gray-500 font-bold">
                                                                            <tr>
                                                                                <th className="px-3 py-2">Name</th>
                                                                                <th className="px-3 py-2">Role</th>
                                                                                <th className="px-3 py-2">Type</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {track.contributors.map((c, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td className="px-3 py-2 font-medium text-slate-700">{c.name}</td>
                                                                                    <td className="px-3 py-2 text-slate-500">{c.role}</td>
                                                                                    <td className="px-3 py-2 text-slate-500">{c.type}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-slate-400 italic">None added.</div>
                                                            )}
                                                        </div>

                                                        {/* ISRC Code (moved below Additional Contributors) */}
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">ISRC Code</span>
                                                            <div className="font-mono text-sm font-medium text-slate-700 bg-white px-2 py-1 rounded border border-gray-200 mt-1">
                                                                {isrcInputs[track.id] || track.isrc || "N/A"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Column 3: Lyrics & Extras */}
                                                    <div>
                                                         <div className="flex justify-between items-center mb-1">
                                                             <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                                 <Mic2 size={10} /> Lyrics Preview
                                                             </span>
                                                             {track.lyrics && (
                                                                 <button 
                                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(track.lyrics); }}
                                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                                    title="Copy Lyrics"
                                                                 >
                                                                     <Clipboard size={14} />
                                                                 </button>
                                                             )}
                                                         </div>
                                                         <div className="bg-gray-50 rounded-lg p-3 text-xs text-slate-600 italic h-48 overflow-y-auto border border-gray-100 whitespace-pre-line">
                                                             {track.lyrics ? track.lyrics : "No lyrics provided."}
                                                         </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DISTRIBUTION ADMIN */}
                {userRole === 'Admin' && activeTab === 'DISTRIBUTION' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm mb-8 animate-fade-in-up">
                            <h3 className="font-bold text-xl text-slate-800 mb-2">Workflow Management</h3>
                            <p className="text-sm text-slate-500 mb-8 pb-4 border-b border-gray-100">Update the status of this release to move it through the pipeline.</p>
                            
                            <div className="space-y-8">
                                {/* Status Selector */}
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Release Status</label>
                                    <select 
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 font-bold text-black
                                            ${status === 'Rejected' ? 'border-red-200 bg-red-50 focus:border-red-500 focus:ring-red-100' : 
                                            status === 'Live' ? 'border-green-200 bg-green-50 focus:border-green-500 focus:ring-green-100' :
                                            'border-blue-200 bg-white focus:border-blue-500 focus:ring-blue-100'}
                                        `}
                                    >
                                        <option value="Pending" className="text-black">Pending Review</option>
                                        <option value="Request Edit" className="text-black">Request Edit</option>
                                        <option value="Processing" className="text-black">Processing (Aggregator)</option>
                                        <option value="Live" className="text-black">Released</option>
                                        <option value="Rejected" className="text-black">Rejected</option>
                                    </select>
                                </div>

                                {/* --- REJECTION WORKFLOW --- */}
                                {status === 'Rejected' && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 animate-fade-in-down">
                                        <h4 className="font-bold text-red-800 flex items-center gap-2 mb-4 text-lg">
                                            <AlertTriangle size={20} /> Rejection Details
                                        </h4>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-red-700 uppercase mb-1">Main Reason</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="e.g. Cover Art tidak sesuai guideline"
                                                        className="flex-1 px-4 py-3 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 text-sm text-black font-semibold"
                                                    />
                                                    <button 
                                                        onClick={generateRejectionMessage}
                                                        disabled={isGeneratingAi || !rejectionReason.trim()}
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 min-w-[80px] justify-center"
                                                        title="Generate Detailed Description with AI"
                                                    >
                                                        {isGeneratingAi ? <Loader2 size={16} className="animate-spin"/> : "OK"}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-red-500 mt-1.5 font-medium">Klik OK untuk membuat deskripsi detail otomatis menggunakan AI.</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-red-700 uppercase mb-1 flex justify-between">
                                                    <span>Detailed Description (Email to User)</span>
                                                </label>
                                                <textarea 
                                                    value={rejectionDesc}
                                                    onChange={(e) => setRejectionDesc(e.target.value)}
                                                    placeholder="Deskripsi detail akan muncul di sini setelah klik OK..."
                                                    rows={6}
                                                    className="w-full px-4 py-3 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 text-sm resize-none bg-white shadow-sm text-black font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- PROCESSING WORKFLOW --- */}
                                {(status === 'Processing' || status === 'Live') && (
                                    <div className="animate-fade-in-down">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            <Globe size={16} className="text-purple-500" />
                                            Select Aggregator
                                        </label>
                                        <select 
                                            value={selectedAggregator}
                                            onChange={(e) => setSelectedAggregator(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 shadow-sm text-black font-semibold"
                                        >
                                            <option value="" className="text-black">-- Choose Aggregator --</option>
                                            {availableAggregators.map(agg => (
                                                <option key={agg} value={agg} className="text-black">{agg}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* --- LIVE WORKFLOW (CODES) --- */}
                                {status === 'Live' && (
                                    <div className="animate-fade-in-down bg-green-50 p-6 rounded-xl border border-green-100 space-y-6">
                                        <div className="flex items-center gap-2 border-b border-green-200 pb-3">
                                            <CheckCircle size={20} className="text-green-600" />
                                            <span className="font-bold text-green-800 text-lg">Mandatory Release Codes</span>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase mb-1">
                                                Album UPC <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                value={upcInput}
                                                onChange={(e) => setUpcInput(e.target.value)}
                                                placeholder="Enter UPC Code (Required)"
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 font-mono text-sm shadow-sm text-black font-bold
                                                    ${!upcInput ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-white' : 'border-green-200 focus:ring-green-500'}`}
                                            />
                                            {!upcInput && <p className="text-[10px] text-red-500 mt-1 font-bold">UPC is required to set status to Released.</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase mb-3">
                                                Track ISRCs <span className="text-red-500">*</span>
                                            </label>
                                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                                {release.tracks.map(track => {
                                                    const hasVal = isrcInputs[track.id] && isrcInputs[track.id].trim() !== "";
                                                    return (
                                                        <div key={track.id} className="flex items-center gap-3 bg-white p-2 rounded border border-green-100">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs">{track.trackNumber}</div>
                                                            <span className="text-sm text-black w-1/3 truncate font-bold" title={track.title}>{track.title}</span>
                                                            <input 
                                                                value={isrcInputs[track.id] || ''}
                                                                onChange={(e) => setIsrcInputs(prev => ({...prev, [track.id]: e.target.value}))}
                                                                placeholder="ISRC (Required)"
                                                                className={`flex-1 px-3 py-2 border rounded text-sm font-mono focus:outline-none
                                                                    ${!hasVal ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-green-500'}`}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
