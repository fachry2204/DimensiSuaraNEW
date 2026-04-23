import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReleaseData, Track } from '../types';
import { api } from '../utils/api';
import { assetUrl } from '../utils/url';
import { ChevronLeft } from 'lucide-react';
const SpotifyIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.284 17.383a.748.748 0 0 1-1.028.27c-2.813-1.72-6.356-2.107-10.533-1.146a.75.75 0 1 1-.33-1.464c4.55-1.026 8.474-.584 11.524 1.28.356.217.47.682.367 1.06zM17.5 14.1a.6.6 0 0 1-.824.216c-2.415-1.454-6.092-1.88-8.946-1.02a.6.6 0 1 1-.349-1.151c3.227-.978 7.283-.506 10.017 1.147.28.168.372.53.102.808zM15.9 10.9a.5.5 0 0 1-.69.181c-2.14-1.26-5.387-1.375-7.768-.734a.5.5 0 0 1-.259-.966c2.679-.72 6.233-.573 8.676.88.24.141.32.452.041.639z"/>
  </svg>
);

interface Props {
  releases: ReleaseData[];
  token: string;
}

export const ArtistDetail: React.FC<Props> = ({ releases, token }) => {
  const params = useParams();
  const navigate = useNavigate();
  const artistName = decodeURIComponent(params.name || '');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trackTab, setTrackTab] = useState<'SINGLE' | 'ALBUM'>('SINGLE');

  const artistInfo = useMemo(() => {
    let spotifyLink: string | undefined;
    releases.forEach(r => {
      (r.primaryArtists || []).forEach(a => {
        const nm = typeof a === 'string' ? a : a.name;
        if (nm && nm.trim().toLowerCase() === artistName.toLowerCase()) {
          if (!spotifyLink && typeof a !== 'string') spotifyLink = a.spotifyLink || undefined;
        }
      });
      r.tracks?.forEach(t => {
        t.artists?.forEach(ta => {
          if (ta.role === 'MainArtist' && ta.name && ta.name.trim().toLowerCase() === artistName.toLowerCase()) {
            if (!spotifyLink) spotifyLink = (ta as any).spotifyLink || undefined;
          }
        });
      });
    });
    return { spotifyLink };
  }, [releases, artistName]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let prof: any = null;
        // 1) Try by stored spotifyLink (if available)
        if (artistInfo.spotifyLink) {
          prof = await api.spotify.getArtistByLink(artistInfo.spotifyLink);
        }
        // 2) Fallback to search by name
        if (!prof || (!prof.thumbnail && !prof.image)) {
          const res = await api.spotify.searchArtist(artistName, 1);
          const first = Array.isArray(res?.items) ? res.items[0] : null;
          // Only use if name matches (case insensitive)
          if (first && first.name?.toLowerCase() === artistName.toLowerCase()) {
            // If both exist, prefer object with image
            if (first && (!prof || !prof.thumbnail)) prof = first;
            // Ensure url present
            if (prof && !prof.url && first?.url) prof.url = first.url;
          } else if (!artistInfo.spotifyLink) {
            // Only nullify if we didn't have a direct link success
            prof = null;
          }
        }
        setProfile(prof || null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    if (artistName) run();
  }, [artistName, artistInfo.spotifyLink]);

  const tracks: { track: Track; release: ReleaseData }[] = useMemo(() => {
    const out: { track: Track; release: ReleaseData }[] = [];
    const norm = (s?: string) => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const target = norm(artistName);

    releases.forEach(r => {
      const primaryMatch = (r.primaryArtists || []).some(a => {
        const nm = typeof a === 'string' ? a : a?.name;
        return norm(nm) === target;
      });
      (r.tracks || []).forEach(t => {
        const hasMain = (t.artists || []).some(a => a.role === 'MainArtist' && norm(a.name) === target);
        if (hasMain || primaryMatch) {
          out.push({ track: t, release: r });
        }
      });
    });
    // Remove duplicates by track id + release id
    const uniq: Record<string, boolean> = {};
    const deduped = out.filter(({ track, release }) => {
      const k = `${release.id || ''}:${track.id}`;
      if (uniq[k]) return false;
      uniq[k] = true;
      return true;
    });
    return deduped.sort((a, b) => {
      const an = Number(a.track.trackNumber || 0);
      const bn = Number(b.track.trackNumber || 0);
      return an - bn;
    });
  }, [releases, artistName]);

  const imageUrl = profile?.image || profile?.thumbnail || null;
  const openUrl = profile?.url || (profile?.id ? `https://open.spotify.com/artist/${profile.id}` : null);
  const displayName = artistName;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/aggregator/artists')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          title="Kembali ke Daftar Artist"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Artist Detail</h1>
      </div>
      <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8 flex items-center gap-4 shadow-md">
        <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 text-sm">{displayName.charAt(0)}</div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-slate-800">{displayName}</div>
          {openUrl ? (
            <a 
              href={openUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700"
              title="Open Spotify Artist Page"
            >
              <SpotifyIcon /> Artist Page
            </a>
          ) : (
            !loading && <div className="text-xs text-red-600 font-medium">Artist Tidak Terdaftar di Spotify</div>
          )}
          {(profile?.followers || profile?.popularity) && (
            <div className="mt-2 flex items-center gap-2">
              {typeof profile?.followers === 'number' && profile.followers > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700 font-medium">Followers: {profile.followers.toLocaleString()}</span>
              )}
              {typeof profile?.popularity === 'number' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700 font-medium">Popularity: {profile.popularity}/100</span>
              )}
            </div>
          )}
          {loading && <div className="text-xs text-slate-500">Loading Spotify profile...</div>}
          {!loading && !profile && <div className="text-xs text-slate-500">Spotify profile tidak tersedia</div>}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTrackTab('SINGLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                trackTab === 'SINGLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setTrackTab('ALBUM')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                trackTab === 'ALBUM' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              EP/Album
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tracks
            .filter(({ release }) => String(release.status || '').toLowerCase() === 'live')
            .filter(({ release }) => {
              const cnt = Array.isArray(release.tracks) ? release.tracks.length : 0;
              return trackTab === 'ALBUM' ? cnt > 1 : cnt <= 1;
            })
            .map(({ track, release }) => (
            <div key={track.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                  {(() => {
                    const c: any = (release as any).coverArt;
                    let url: string | null = null;
                    if (typeof c === 'string') url = assetUrl(c);
                    else if (c && typeof c === 'object') {
                      try { url = URL.createObjectURL(c); } catch { url = null; }
                    }
                    return url ? (
                      <img 
                        src={url} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Art</div>
                    );
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{release.title || 'Untitled Release'}</div>
                  <div className="text-xs text-slate-600">
                    Main Artist: {(() => {
                      const mains = (track.artists || []).filter(a => a.role === 'MainArtist').map(a => a.name).filter(Boolean);
                      if (mains.length > 0) return mains.join(', ');
                      const prim = (release.primaryArtists || []).map(a => typeof a === 'string' ? a : (a?.name || '')).filter(Boolean);
                      return prim.join(', ') || '-';
                    })()}
                  </div>
                  <div className="text-xs text-slate-500">UPC: {release.upc || '-'}</div>
                  <div className="text-xs text-slate-500">ISRC: {track.isrc || '-'}</div>
                </div>
              </div>
            </div>
          ))}
          {tracks
            .filter(({ release }) => String(release.status || '').toLowerCase() === 'live')
            .filter(({ release }) => {
              const cnt = Array.isArray(release.tracks) ? release.tracks.length : 0;
              return trackTab === 'ALBUM' ? cnt > 1 : cnt <= 1;
            }).length === 0 && (
            <div className="text-sm text-slate-500">Belum ada lagu untuk artis ini.</div>
          )}
        </div>
      </div>
    </div>
  );
};
