import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReleaseWizard } from './ReleaseWizard';
import { ReleaseData } from '../types';
import { api } from '../utils/api';
import socialLogo from '../assets/platforms/social.svg';
import youtubeMusicLogo from '../assets/platforms/youtube-music.svg';
import allDspLogo from '../assets/platforms/alldsp.svg';

export const SingleReleasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<ReleaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cms_token') || '';
    const run = async () => {
      try {
        const raw: any = await api.getRelease(token, id!);
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
        const mapArr = (v: any) => {
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') {
            try {
              const parsed = JSON.parse(v);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
            return [v];
          }
          return [];
        };
        const primaryArtists = mapArr(raw.primaryArtists);
        const optionMap: Record<string, { id: string; label: string; logo: string }> = {
          'SOCIAL': { id: 'SOCIAL', label: 'Social Media', logo: socialLogo },
          'YOUTUBE_MUSIC': { id: 'YOUTUBE_MUSIC', label: 'YouTube Music', logo: youtubeMusicLogo },
          'ALL_DSP': { id: 'ALL_DSP', label: 'All DSP', logo: allDspLogo },
        };
        let distributionTargets: { id: string; label: string; logo: string }[] = [];
        if (Array.isArray(raw.distributionTargets)) {
          if (typeof raw.distributionTargets[0] === 'string') {
            distributionTargets = (raw.distributionTargets as string[])
              .map(id => optionMap[id])
              .filter(Boolean);
          } else {
            distributionTargets = raw.distributionTargets;
          }
        } else if (Array.isArray(raw.distribution_targets)) {
          if (typeof raw.distribution_targets[0] === 'string') {
            distributionTargets = (raw.distribution_targets as string[])
              .map(id => optionMap[id])
              .filter(Boolean);
          } else {
            distributionTargets = raw.distribution_targets;
          }
        }
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
            ...mapArr(t.primary_artists).map((item: any) => ({ name: typeof item === 'string' ? item : item.name, role: 'MainArtist' })),
            ...mapArr(t.featured_artists).map((item: any) => ({ name: typeof item === 'string' ? item : item.name, role: 'FeaturedArtist' })),
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
        const mapped: ReleaseData = {
          id: String(raw.id),
          status: raw.status,
          submissionDate: raw.submission_date,
          aggregator: raw.aggregator,
          distributionTargets,
          coverArt: raw.cover_art || null,
          type: 'SINGLE',
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
          tracks,
          isNewRelease: raw.original_release_date ? false : true,
          originalReleaseDate: normDate(raw.original_release_date),
          plannedReleaseDate: normDate(raw.planned_release_date)
        };
        setInitialData(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load release');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data rilisan...</p>
      </div>
    </div>
  );
  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
        <button onClick={() => navigate('/releases')} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Back</button>
      </div>
    );
  }
  if (!initialData) return null;

  return (
    <ReleaseWizard 
      type="SINGLE"
      initialData={initialData}
      onBack={() => navigate('/releases')}
      onSave={() => navigate('/releases')}
    />
  );
};
