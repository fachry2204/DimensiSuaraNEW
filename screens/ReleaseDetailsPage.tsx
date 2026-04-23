import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReleaseData } from '../types';
import { api } from '../utils/api';
import { ReleaseDetailModal } from '../components/ReleaseDetailModal';
import { AlertModal } from '../components/AlertModal';

interface Props {
  token: string;
  userRole: 'Admin' | 'Operator' | 'User' | string;
  aggregators: string[];
  onReleaseUpdated?: (release: ReleaseData) => void;
  onEditRelease?: (release: ReleaseData) => void;
  onDeleteRelease?: (release: ReleaseData) => void;
  resolveOwnerName?: (raw: any) => string;
}

export const ReleaseDetailsPage: React.FC<Props> = ({ token, userRole, aggregators, onReleaseUpdated, onEditRelease, onDeleteRelease, resolveOwnerName }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) { setError('Invalid release id'); setLoading(false); return; }
      try {
        const raw: any = await api.getRelease(token, id);
        const mapArtists = (arr: any) => {
          if (Array.isArray(arr)) return arr;
          if (typeof arr === 'string') {
            try {
              const parsed = JSON.parse(arr);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
            return [arr];
          }
          return [];
        };
        const primaryArtists = mapArtists(raw.primaryArtists);

        const ownerDisplayName =
          (typeof resolveOwnerName === 'function' ? resolveOwnerName(raw) : '') ||
          raw.ownerDisplayName ||
          '';

        const mapped: ReleaseData = {
          id: String(raw.id),
          userId: raw.user_id,
          status: raw.status,
          submissionDate: raw.submission_date,
          aggregator: raw.aggregator,
          coverArt: raw.cover_art || null,
          type: raw.release_type,
          upc: raw.upc || '',
          title: raw.title || '',
          language: raw.language || '',
          primaryArtists,
          label: raw.label || '',
          genre: raw.genre || '',
          subGenre: raw.sub_genre || '',
          pLine: raw.p_line || '',
          cLine: raw.c_line || '',
          version: raw.version || '',
          tracks: (raw.tracks || []).map((t: any) => {
            const p = mapArtists(t.primaryArtists ?? t.primary_artists);
            const f = mapArtists(t.featuredArtists ?? t.featured_artists);
            return {
              id: String(t.id ?? `${raw.id}_${t.track_number}`),
              audioFile: t.audio_file || null,
              audioClip: t.audio_clip || null,
              videoFile: null,
              trackNumber: String(t.track_number ?? ''),
              releaseDate: '',
              isrc: t.isrc || '',
              title: t.title || '',
              duration: t.duration || '',
              artists: [
                ...p.map((item: any) => ({ name: typeof item === 'string' ? item : item.name, role: 'MainArtist' })),
                ...f.map((item: any) => ({ name: typeof item === 'string' ? item : item.name, role: 'FeaturedArtist' })),
              ],
              genre: t.genre || '',
              subGenre: t.sub_genre || '',
              isInstrumental: undefined,
              explicitLyrics: t.explicit_lyrics || 'No',
              composer: t.composer || '',
              lyricist: t.lyricist || '',
              lyrics: t.lyrics || '',
              contributors: Array.isArray(t.contributors) ? t.contributors : []
            };
          }),
          isNewRelease: raw.original_release_date ? false : true,
          originalReleaseDate: raw.original_release_date || '',
          plannedReleaseDate: raw.planned_release_date || ''
        };
        (mapped as any).ownerDisplayName = ownerDisplayName;
        setRelease(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load release detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, token]);

  if (loading) return null;
  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
        <button onClick={() => navigate('/releases')} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Back</button>
      </div>
    );
  }
  if (!release) return null;

  return (
    <>
      <ReleaseDetailModal 
        release={release}
        isOpen={true}
        onClose={() => navigate('/releases')}
        onUpdate={async (r) => {
          try {
            await api.updateReleaseWorkflow(token, r);
            if (onReleaseUpdated) onReleaseUpdated(r);
            navigate('/releases');
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
        onEdit={(r) => {
          if (userRole === 'Admin') {
            onEditRelease?.(r);
          }
        }}
        onDelete={onDeleteRelease}
        userRole={userRole}
        token={token}
        onCoverArtUpdated={(newUrl) => {
             setRelease(prev => prev ? ({ 
                 ...prev, 
                 coverArt: newUrl, 
                 status: userRole !== 'Admin' ? 'Request Edit' : prev.status 
             }) : null);
             if (userRole !== 'Admin') {
                 setAlertState({
                     isOpen: true,
                     title: 'Cover Art Updated',
                     message: 'Cover art updated. Status changed to Request Edit.',
                     type: 'success'
                 });
             }
        }}
      />
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
