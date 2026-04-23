
import { ReleaseData, Track, TrackArtist, TrackContributor, ReleaseType } from '../types';
import { ARTIST_ROLES, TRACK_GENRES, CONTRIBUTOR_TYPES, LANGUAGES } from '../constants';

// --- DICTIONARIES ---

const FIRST_NAMES = [
    "Budi", "Siti", "Ahmad", "Dewi", "Reza", "Putri", "Agus", "Rina", "Doni", "Lestari",
    "Eko", "Maya", "Fajar", "Indah", "Gunawan", "Sari", "Hendra", "Wulan", "Joko", "Fitri",
    "Kiki", "Nina", "Lukman", "Oki", "Prasetyo", "Qory", "Rudi", "Tia", "Usman", "Vina",
    "Wahyu", "Xena", "Yoga", "Zara", "Andi", "Bella", "Chandra", "Dinda", "Erik", "Fanny"
];

const LAST_NAMES = [
    "Santoso", "Wijaya", "Saputra", "Utami", "Pratama", "Kusuma", "Hidayat", "Ningsih", "Permana", "Rahayu",
    "Setiawan", "Lestari", "Wibowo", "Anggraini", "Kurniawan", "Astuti", "Mulyadi", "Hasanah", "Firmansyah", "Puspita",
    "Siregar", "Nasution", "Simanjuntak", "Sihombing", "Pasaribu", "Ginting", "Tarigan", "Sembiring", "Sitepu", "Manullang"
];

const SONG_ADJECTIVES = [
    "Cinta", "Langit", "Malam", "Rindu", "Hati", "Jiwa", "Mimpi", "Senja", "Pagi", "Bintang",
    "Luka", "Bahagia", "Sepi", "Ramai", "Indah", "Buruk", "Hitam", "Putih", "Merah", "Biru",
    "Terakhir", "Pertama", "Abadi", "Semu", "Nyata", "Hilang", "Kembali", "Pergi", "Datang", "Jauh"
];

const SONG_NOUNS = [
    "Kita", "Dia", "Kamu", "Mereka", "Dunia", "Rasa", "Asa", "Cerita", "Lagu", "Nada",
    "Irama", "Melodi", "Harmoni", "Suara", "Diam", "Janji", "Sumpah", "Kenangan", "Harapan", "Jalan",
    "Rumah", "Kota", "Desa", "Pantai", "Gunung", "Hutan", "Laut", "Angin", "Hujan", "Badai"
];

const AGGREGATORS = ["LokaMusik", "SoundOn", "Tunecore", "DistroKid", "CDBaby", "Believe"];
const BANKS = ["BCA", "Mandiri", "BRI", "BNI", "CIMB Niaga", "Jago"];
const CITIES = ["Jakarta Selatan", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Semarang", "Denpasar", "Makassar"];

// --- HELPERS ---

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const generateDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generateName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const generateTitle = () => `${pick(SONG_ADJECTIVES)} ${pick(SONG_NOUNS)}`;

// --- GENERATORS ---

export const generateReleases = (count: number): ReleaseData[] => {
    return Array.from({ length: count }, (_, i) => {
        const statusPool: ('Pending' | 'Processing' | 'Live' | 'Rejected' | 'Draft')[] = 
            ['Live', 'Live', 'Live', 'Processing', 'Processing', 'Pending', 'Pending', 'Rejected'];
        
        const status = pick(statusPool);
        const isAlbum = Math.random() > 0.7; // 30% chance album
        const numTracks = isAlbum ? randomInt(4, 12) : 1;
        const artistName = generateName(); // Main Artist for the release

        // Generate Tracks
        const tracks: Track[] = Array.from({ length: numTracks }, (_, tIdx) => {
            const hasFeat = Math.random() > 0.8;
            const trackArtists: TrackArtist[] = [{ name: artistName, role: 'MainArtist' }];
            if (hasFeat) trackArtists.push({ name: generateName(), role: 'FeaturedArtist' });

            return {
                id: `tr_${i}_${tIdx}`,
                trackNumber: (tIdx + 1).toString(),
                title: generateTitle(),
                releaseDate: "",
                isrc: status === 'Live' ? `ID-A01-${randomInt(23, 24)}-${randomInt(10000, 99999)}` : "",
                duration: `${randomInt(2, 4)}:${randomInt(10, 59)}`,
                artists: trackArtists,
                genre: pick(TRACK_GENRES),
                explicitLyrics: Math.random() > 0.9 ? 'Yes' : 'No',
                composer: generateName(),
                lyricist: generateName(),
                lyrics: "",
                contributors: [],
                // Simulate file existence for UI logic (files themselves are null in dummy data usually, but code handles null)
                audioFile: null, 
                audioClip: null
            };
        });

        const releaseTitle = isAlbum ? generateTitle() : tracks[0].title;
        const subDate = generateDate(new Date(2023, 0, 1), new Date());
        
        // Calculate Planned Date (usually 14 days after sub)
        const subDateObj = new Date(subDate);
        subDateObj.setDate(subDateObj.getDate() + 14);
        const planDate = subDateObj.toISOString().split('T')[0];

        return {
            id: `rel_${i + 1}`,
            status,
            submissionDate: subDate,
            aggregator: (status === 'Processing' || status === 'Live') ? pick(AGGREGATORS) : undefined,
            rejectionReason: status === 'Rejected' ? "Kualitas Audio Buruk (Low Bitrate)" : undefined,
            rejectionDescription: status === 'Rejected' ? "Audio yang diunggah kurang dari 128kbps." : undefined,
            coverArt: null,
            upc: status === 'Live' ? randomInt(100000000000, 999999999999).toString() : "",
            title: releaseTitle,
            language: pick(LANGUAGES),
            primaryArtists: [artistName],
            label: `${generateName()} Records`,
            version: Math.random() > 0.9 ? 'Remix' : 'Original',
            tracks,
            isNewRelease: true,
            originalReleaseDate: "",
            plannedReleaseDate: planDate
        };
    });
};
