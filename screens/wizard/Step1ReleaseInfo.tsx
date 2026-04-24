import React, { useRef, useState, useEffect } from 'react';
import { ReleaseData, ReleaseType } from '../../types';
import { TextInput, SelectInput } from '../../components/Input';
import { LANGUAGES, VERSIONS, TRACK_GENRES, SUB_GENRES_MAP } from '../../constants';
import { ImagePlus, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { AlertModal } from '../../components/AlertModal';

interface Props {
  data: ReleaseData;
  updateData: (updates: Partial<ReleaseData> | ((prev: ReleaseData) => Partial<ReleaseData>)) => void;
  releaseType: ReleaseType;
  isProcessingCover: boolean;
  setIsProcessingCover: (val: boolean) => void;
}

export const Step1ReleaseInfo: React.FC<Props> = ({ data, updateData, releaseType, isProcessingCover, setIsProcessingCover }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userType, setUserType] = useState<'Company' | 'Personal' | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    const fetchUserType = async () => {
        const token = localStorage.getItem('cms_token');
        if (token) {
            try {
                const profile = await api.getProfile(token);
                // Check account_type, default to Personal if not Company
                const type = (profile.account_type === 'Company' || profile.account_type === 'COMPANY') ? 'Company' : 'Personal';
                setUserType(type);
                setUserRole(profile.role);
                
                if (profile.role === 'Admin') {
                    try {
                        const allUsers = await api.getUsers(token);
                        setUsers(allUsers.map((u: any) => ({ 
                            id: u.id, 
                            username: u.full_name ? `${u.full_name} (${u.email})` : (u.name || u.username || u.email) 
                        })));
                    } catch (error) {
                        console.error("Failed to fetch users list", error);
                    }
                }
                
                if (type === 'Personal' && profile.role !== 'Admin') {
                    updateData({ 
                        label: 'Dimensi Suara',
                        pLine: 'Dimensi Suara',
                        cLine: 'Dimensi Suara'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        }
    };
    fetchUserType();
  }, []);

  // --- Image Validation Logic ---
  const validateImage = async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // 1. Check File Type (Strict JPG)
      if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        setAlertState({
          isOpen: true,
          title: 'Format File Salah',
          message: 'Format gambar WAJIB JPG/JPEG. Tidak boleh format lain.',
          type: 'error'
        });
        resolve(false);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        // 2. Check Dimensions (Strict 3000x3000px)
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
      img.onerror = (err) => {
        setAlertState({
          isOpen: true,
          title: 'Error',
          message: 'Gagal membaca file gambar.',
          type: 'error'
        });
        resolve(false);
      };
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      setIsProcessingCover(true);
      try {
        const isValid = await validateImage(file);
        if (!isValid) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const token = localStorage.getItem('cms_token') || '';
        let storedCover: any = file;
        
        if (token) {
          try {
            // Use TMP upload
            const resp = await api.uploadTmpReleaseFile(
              token,
              { title: (data.title && data.title.trim()) || `Cover-${Date.now()}`, primaryArtists: (data.primaryArtists || []).map(a => typeof a === 'string' ? a : a.name).filter(a => a && a.trim() !== '') },
              'coverArt',
              file
            );
            if (resp && resp.paths && resp.paths['coverArt']) {
              storedCover = resp.paths['coverArt'];
            }
          } catch (err) {
            console.error('Upload cover art failed:', err);
          }
        }
        updateData({ coverArt: storedCover });
      } catch (error) {
        console.error("Image processing failed", error);
        setAlertState({
            isOpen: true,
            title: 'Error',
            message: 'Failed to process image.',
            type: 'error'
        });
      } finally {
        setIsProcessingCover(false);
      }
    }
  };

  const removeCover = () => {
    updateData({ coverArt: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Multi Artist Logic ---
  const handleArtistChange = (index: number, field: 'name' | 'spotifyLink', value: string) => {
    const newArtists = [...data.primaryArtists];
    const currentArtist = newArtists[index];

    if (typeof currentArtist === 'string') {
        newArtists[index] = { 
            name: field === 'name' ? value : currentArtist, 
            spotifyLink: field === 'spotifyLink' ? value : '' 
        };
    } else {
        newArtists[index] = { ...currentArtist, [field]: value };
    }
    updateData({ primaryArtists: newArtists });
  };

  const addArtist = () => {
    updateData({ primaryArtists: [...data.primaryArtists, { name: '', spotifyLink: '' }] });
  };

  const removeArtist = (index: number) => {
    if (data.primaryArtists.length > 1) {
      const newArtists = data.primaryArtists.filter((_, i) => i !== index);
      updateData({ primaryArtists: newArtists });
    }
  };

  const detectSpotifyArtist = async (index: number, link: string) => {
    const val = String(link || '').trim();
    if (!val) return;
    try {
      const result = await api.spotify.getArtistByLink(val);
      const name = result?.name;
      if (name) {
        const newArtists = [...data.primaryArtists];
        const current = newArtists[index];
        const currentName = typeof current === 'string' ? current : current?.name || '';
        if (!currentName || currentName.trim().length === 0) {
          if (typeof current === 'string') {
            newArtists[index] = { name, spotifyLink: val };
          } else {
            newArtists[index] = { ...(current || {}), name };
          }
          updateData({ primaryArtists: newArtists });
        }
      }
    } catch (e) {
      console.error('Spotify detect failed', e);
    }
  };

  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const toSpotifyUrl = (s: string) => {
    const v = String(s || '').trim();
    if (!v) return '';
    if (v.startsWith('spotify:artist:')) {
      const id = v.split(':').pop() || '';
      return id ? `https://open.spotify.com/artist/${id}` : '';
    }
    return v;
  };

  useEffect(() => {
    let t: any;
    if (searchIdx !== null && searchQuery && searchQuery.trim().length > 2) {
      t = setTimeout(async () => {
        try {
          setSearchLoading(true);
          setSearchError(null);
          const res = await api.spotify.searchArtist(searchQuery, 5);
          const items = Array.isArray(res?.items) ? res.items : [];
          if (res && (res as any).unavailable) {
            setSearchError('Pencarian Spotify tidak tersedia');
          }
          setSearchResults(items);
          setShowDropdown(true);
        } catch (e: any) {
          setSearchResults([]);
          setSearchError('Pencarian Spotify tidak tersedia');
          setShowDropdown(true);
        } finally {
          setSearchLoading(false);
        }
      }, 400);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setSearchError(null);
    }
    return () => t && clearTimeout(t);
  }, [searchIdx, searchQuery]);

  const selectArtistResult = (index: number, item: any) => {
    const newArtists = [...data.primaryArtists];
    const link = item?.url || (item?.id ? `https://open.spotify.com/artist/${item.id}` : '');
    if (typeof newArtists[index] === 'string') {
      newArtists[index] = { name: item?.name || '', spotifyLink: link };
    } else {
      newArtists[index] = { ...(newArtists[index] as any), name: item?.name || '', spotifyLink: link };
    }
    updateData({ primaryArtists: newArtists });
    setShowDropdown(false);
    setSearchResults([]);
    setSearchIdx(null);
  };
  
  const addCustomArtistFromQuery = (index: number) => {
    const name = (searchQuery || '').trim();
    if (!name) return;
    const newArtists = [...data.primaryArtists];
    if (typeof newArtists[index] === 'string') {
      newArtists[index] = { name, spotifyLink: '' };
    } else {
      newArtists[index] = { ...(newArtists[index] as any), name, spotifyLink: '' };
    }
    updateData({ primaryArtists: newArtists });
    setShowDropdown(false);
    setSearchResults([]);
    setSearchIdx(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Basic Information</h2>
        <p className="text-xs text-slate-600">Let's start with the essentials of your release.</p>
      </div>
      
      <div className="flex flex-col gap-6 items-start w-full">
          {/* Group 1: Main Info */}
          {userRole === 'Admin' && (
              <div className="w-full bg-white border border-gray-200 rounded p-6 relative">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-2 left-4 bg-white px-2">Admin Controls</h3>
                  <div className="mb-3">
                    <SelectInput
                        label="Release Owner (Admin Only)"
                        options={users.map(u => u.username)}
                        value={users.find(u => u.id === Number(data.userId))?.username || ""}
                        onChange={(e) => {
                            const selectedUser = users.find(u => u.username === e.target.value);
                            if (selectedUser) {
                                updateData({ userId: selectedUser.id });
                            }
                        }}
                    />
                  </div>
              </div>
          )}

          <div className="w-full bg-white border border-gray-200 rounded p-6 relative mt-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-2 left-4 bg-white px-2">Release Identity</h3>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Text Inputs */}
                <div className="flex-1 space-y-4">
                  {/* UPC Field Removed - Moved to Step 3 */}


                  <div>
                      <TextInput 
                        label={<>Release Title <span className="text-red-500">*</span></>}
                        value={data.title} 
                        onChange={(e) => updateData({ title: e.target.value })} 
                        placeholder="e.g. Midnight Memories"
                      />
                  </div>

                  {/* Primary Artists (Multiple) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Primary Artist(s) <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                      {data.primaryArtists.map((artist, index) => {
                        const artistName = typeof artist === 'string' ? artist : artist.name;
                        const spotifyLink = typeof artist === 'string' ? '' : artist.spotifyLink || '';

                        return (
                        <div key={index} className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 relative">
                            <input 
                              value={artistName}
                              onChange={(e) => {
                                handleArtistChange(index, 'name', e.target.value);
                                setSearchIdx(index);
                                setSearchQuery(e.target.value);
                              }}
                              onFocus={() => {
                                setSearchIdx(index);
                                setSearchQuery(artistName || '');
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-400 transition-all font-medium"
                              placeholder="Artist Name"
                            />
                            {searchIdx === index && showDropdown && (
                              <div className="absolute left-0 top-full mt-1 w-full z-20 bg-white border border-slate-200 rounded shadow overflow-hidden">
                                {searchLoading && (
                                  <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>
                                )}
                                {!searchLoading && searchError && (
                                  <div className="px-3 py-2 text-xs text-red-600">{searchError}</div>
                                )}
                                {!searchLoading && !searchError && searchResults.length > 0 && (
                                  <div className="max-h-64 overflow-auto">
                                    {searchResults.map((item, i) => (
                                      <button
                                        key={item.id || i}
                                        type="button"
                                        onClick={() => selectArtistResult(index, item)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        {item.image ? (
                                          <img src={item.image} alt="" className="w-5 h-5 rounded object-cover" />
                                        ) : (
                                          <div className="w-5 h-5 rounded bg-slate-200" />
                                        )}
                                        <span className="text-slate-700">{item.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {!searchLoading && !searchError && searchResults.length === 0 && (
                                  <div className="px-3 py-2 text-xs text-slate-600">Tidak ada hasil untuk “{searchQuery}”.</div>
                                )}
                                <div className="border-t border-slate-200 px-3 py-2">
                                  <button
                                    type="button"
                                    className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-xs"
                                    onClick={() => addCustomArtistFromQuery(index)}
                                  >
                                    Tambahkan Artist “{(searchQuery || '').trim()}”
                                  </button>
                                </div>
                              </div>
                            )}
                            {data.primaryArtists.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => removeArtist(index)}
                                className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                                value={spotifyLink}
                                onChange={(e) => handleArtistChange(index, 'spotifyLink', e.target.value)}
                                onBlur={(e) => detectSpotifyArtist(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-400 transition-all font-medium"
                                placeholder="Spotify Artist Link (Optional)"
                            />
                            {spotifyLink && (spotifyLink.includes('spotify.com') || spotifyLink.startsWith('spotify:')) && (
                              <a
                                href={toSpotifyUrl(spotifyLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-[11px]"
                                aria-label="Open Spotify Artist Page"
                              >
                                <svg viewBox="0 0 168 168" className="w-4 h-4 fill-green-600">
                                  <path d="M84,0a84,84,0,1,0,84,84A84,84,0,0,0,84,0Zm38.4,121.5a6.5,6.5,0,0,1-9,2.1c-24.6-15-55.6-18.4-92-10.2a6.5,6.5,0,1,1-2.8-12.7c39.1-8.7,73.1-4.8,100.7,11.6A6.5,6.5,0,0,1,122.4,121.5Zm12.8-28.7a8.1,8.1,0,0,1-11.2,2.6c-28.2-17.3-71.2-22.3-104.5-12.3a8.1,8.1,0,1,1-4.7-15.6c36.7-11,84.6-5.5,116,13.3A8.1,8.1,0,0,1,135.2,92.8Zm1.8-30.3c-33.8-20-89.8-21.8-121.8-12.1a9.7,9.7,0,0,1-5.5-18.6c36.3-10.8,98.3-8.6,135.7,13.5a9.7,9.7,0,1,1-8.4,17.2Z"/>
                                </svg>
                                <span>Page Artist</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                    <button 
                      type="button"
                      onClick={addArtist}
                      className="mt-2 flex items-center text-blue-600 font-medium text-xs hover:underline"
                    >
                      <UserPlus size={16} className="mr-1" />
                      Add Another Artist
                    </button>
                    
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <SelectInput 
                          label={<>Release Version <span className="text-red-500">*</span></>}
                          options={VERSIONS}
                          value={data.version}
                          onChange={(e) => updateData({ version: e.target.value })}
                        />
                        <SelectInput 
                          label={<>Language / Territory <span className="text-red-500">*</span></>}
                          options={LANGUAGES}
                          value={data.language}
                          onChange={(e) => updateData({ language: e.target.value })}
                        />
                    </div>
                  </div>
                </div>



                {/* Right Column: Cover Art */}
                <div className="w-full md:w-56 flex-shrink-0">
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Cover Art</label>
                    <div className="flex flex-col gap-2">
                        <div
                          className="w-full aspect-square bg-blue-50 rounded flex items-center justify-center overflow-hidden border-2 border-dashed border-blue-200 relative group hover:border-blue-400 transition-colors cursor-pointer"
                          onClick={() => !data.coverArt && !isProcessingCover && fileInputRef.current?.click()}
                        >
                          {isProcessingCover ? (
                            <div className="flex flex-col items-center text-blue-500">
                              <Loader2 size={24} className="animate-spin mb-2" />
                              <span className="text-xs font-medium">Processing...</span>
                            </div>
                          ) : data.coverArt ? (
                            <img
                              src={typeof data.coverArt === 'string' ? data.coverArt : URL.createObjectURL(data.coverArt)}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center p-4 text-center">
                              <ImagePlus size={32} className="text-blue-500 mb-2" />
                              <p className="text-xs font-medium text-blue-600">Upload Cover</p>
                              <p className="text-[10px] text-slate-400 mt-1">3000x3000px</p>
                            </div>
                          )}
                          {data.coverArt && !isProcessingCover && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCover();
                                }}
                                className="p-2 bg-white text-red-500 rounded-full shadow hover:bg-red-50"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-red-600 font-medium space-y-1 mt-2 p-2 bg-red-50 border border-red-200 rounded text-center leading-tight">
                            <p>Wajib menggunakan format JPG/JPEG dengan resolusi tepat 3000x3000px.</p>
                        </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".jpg, .jpeg"
                      onChange={handleCoverUpload}
                    />
                  </div>
                </div>
              </div>
          </div>

          {/* Group 2: Publishing & Classification (Only for Album/Company) */}
          {(releaseType === 'ALBUM' || userType === 'Company' || userRole === 'Admin') && (
          <div className="w-full bg-white border border-gray-200 rounded p-6 relative mt-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-2 left-4 bg-white px-2">Details & Classification</h3>
              


              {(userType === 'Company' || userRole === 'Admin') && (
                <>
                  <div className="mb-3">
                      <TextInput 
                        label="Record Label" 
                        value={data.label} 
                        onChange={(e) => updateData({ label: e.target.value })} 
                        placeholder="Your Label Name"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <TextInput 
                        label="P-Line (Copyright)" 
                        value={data.pLine} 
                        onChange={(e) => updateData({ pLine: e.target.value })} 
                        placeholder="℗ 2024 Your Label"
                      />
                      <TextInput 
                        label="C-Line (Publishing)" 
                        value={data.cLine} 
                        onChange={(e) => updateData({ cLine: e.target.value })} 
                        placeholder="© 2024 Your Label"
                      />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {releaseType === 'ALBUM' && (
                    <>
                        <SelectInput 
                          label="Genre"
                          options={TRACK_GENRES}
                          value={data.genre || ""}
                          onChange={(e) => updateData({ genre: e.target.value, subGenre: "" })}
                        />
                        <SelectInput
                          label="Sub Genre"
                          options={SUB_GENRES_MAP[data.genre || ""] || []}
                          value={data.subGenre || ""}
                          onChange={(e) => updateData({ subGenre: e.target.value })}
                        />
                    </>
                  )}
              </div>
          </div>
          )}
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
