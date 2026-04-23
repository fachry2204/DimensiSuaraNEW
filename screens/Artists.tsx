import React, { useEffect, useMemo, useState } from 'react';
import { ReleaseData } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

interface Props {
  releases: ReleaseData[];
}

export const Artists: React.FC<Props> = ({ releases }) => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Record<string, { image?: string | null; url?: string | null }>>({});

  const artists = useMemo(() => {
    const map: Record<string, { name: string; spotifyLink?: string; trackCount: number; releaseCount: number; albumCount: number; singleCount: number }> = {};
    releases.forEach(r => {
      const prim = (r.primaryArtists || []).map(a => typeof a === 'string' ? { name: a } : a);
      prim.forEach(a => {
        const key = (a.name || '').trim();
        if (!key) return;
        if (!map[key]) map[key] = { name: key, spotifyLink: a.spotifyLink, trackCount: 0, releaseCount: 0, albumCount: 0, singleCount: 0 };
        map[key].releaseCount += 1;
        if (Array.isArray(r.tracks) && r.tracks.length > 1) map[key].albumCount += 1; else map[key].singleCount += 1;
      });
      r.tracks?.forEach(t => {
        t.artists?.forEach(ta => {
          if (ta.role === 'MainArtist') {
            const key = (ta.name || '').trim();
            if (!key) return;
            if (!map[key]) map[key] = { name: key, spotifyLink: (ta as any).spotifyLink, trackCount: 0, releaseCount: 0, albumCount: 0, singleCount: 0 };
            map[key].trackCount += 1;
          }
        });
      });
    });
    return Object.values(map).sort((a, b) => b.trackCount - a.trackCount || a.name.localeCompare(b.name));
  }, [releases]);

  // Fetch Spotify images/urls for cards
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      const tasks = artists.map(async (a) => {
        if (profiles[a.name]) return;
        try {
          let prof: any = null;
          if (a.spotifyLink) {
            prof = await api.spotify.getArtistByLink(a.spotifyLink);
          }
          if (!prof || (!prof.image && !prof.thumbnail)) {
            const res = await api.spotify.searchArtist(a.name, 1);
            const first = Array.isArray(res?.items) ? res.items[0] : null;
            // Only use if name matches (case insensitive)
            if (first && first.name?.toLowerCase() === a.name.toLowerCase()) {
              prof = first;
            } else {
              prof = null;
            }
          }
          if (!aborted && prof) {
            setProfiles(prev => ({ ...prev, [a.name]: { image: prof.image || prof.thumbnail || null, url: prof.url || null } }));
          } else if (!aborted) {
            // Ensure we mark it as no profile so we don't keep searching
            setProfiles(prev => ({ ...prev, [a.name]: { image: null, url: null } }));
          }
        } catch {
          // ignore
        }
      });
      await Promise.allSettled(tasks);
    };
    if (artists.length > 0) run();
    return () => { aborted = true; };
  }, [artists]);

  const palette = [
    'from-indigo-900/20 to-indigo-900/40 border-indigo-500/20',
    'from-purple-900/20 to-purple-900/40 border-purple-500/20',
    'from-blue-900/20 to-blue-900/40 border-blue-500/20',
    'from-emerald-900/20 to-emerald-900/40 border-emerald-500/20',
    'from-amber-900/20 to-amber-900/40 border-amber-500/20',
    'from-rose-900/20 to-rose-900/40 border-rose-500/20',
    'from-violet-900/20 to-violet-900/40 border-violet-500/20',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Artists</h1>
        <p className="text-xs text-slate-400">Daftar artis berdasarkan rilisan yang tersedia</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {artists.map((a, idx) => {
          const bg = palette[idx % palette.length];
          const prof = profiles[a.name];
          return (
            <div key={a.name} className={`border rounded-xl p-4 flex flex-col gap-3 shadow-sm bg-brand-card bg-gradient-to-br ${bg}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/70 flex items-center justify-center">
                  {prof?.image ? (
                    <img src={prof.image} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">{a.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{a.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Albums: {a.albumCount} • Singles: {a.singleCount}
                  </div>
                </div>
              </div>
              {prof?.url && (
                <a
                  href={prof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 text-xs rounded text-center font-bold inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
                  title="Open Spotify Artist Page"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.284 17.383a.748.748 0 0 1-1.028.27c-2.813-1.72-6.356-2.107-10.533-1.146a.75.75 0 1 1-.33-1.464c4.55-1.026 8.474-.584 11.524 1.28.356.217.47.682.367 1.06zM17.5 14.1a.6.6 0 0 1-.824.216c-2.415-1.454-6.092-1.88-8.946-1.02a.6.6 0 1 1-.349-1.151c3.227-.978 7.283-.506 10.017 1.147.28.168.372.53.102.808zM15.9 10.9a.5.5 0 0 1-.69.181c-2.14-1.26-5.387-1.375-7.768-.734a.5.5 0 0 1-.259-.966c2.679-.72 6.233-.573 8.676.88.24.141.32.452.041.639z"/>
                  </svg>
                  Artist Page
                </a>
              )}
              <Link
                to={`/aggregator/artists/${encodeURIComponent(a.name)}`}
                className="w-full px-3 py-2 text-xs rounded bg-brand-purple text-white font-bold hover:opacity-90 text-center"
                title="Detail Artist"
              >
                Detail
              </Link>
            </div>
          );
        })}
        {artists.length === 0 && (
          <div className="text-sm text-slate-500">Belum ada artis</div>
        )}
      </div>
    </div>
  );
};
