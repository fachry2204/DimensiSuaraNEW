
export interface TrackArtist {
  name: string;
  role: string;
  spotifyLink?: string;
}

export interface TrackContributor {
  name: string;
  type: string;
  role: string;
}

export interface AnalysisSegment {
  start: number;
  end: number;
  status: 'CLEAN' | 'AI_DETECTED' | 'COPYRIGHT_MATCH';
  description?: string;
  confidence: number; // 0-100
}

export interface CopyrightMatch {
  title: string;
  artist: string;
  platform: 'Spotify' | 'YouTube Music';
  matchPercentage: number;
  segmentStart: number;
  segmentEnd: number;
}

export interface AnalysisResult {
  isAnalyzing: boolean;
  isComplete: boolean;
  aiProbability: number; // 0-100
  copyrightMatches: CopyrightMatch[];
  segments: AnalysisSegment[]; // Per 10 seconds
}

export interface Track {
  id: string;
  // Files
  audioFile?: File | null;
  audioClip?: File | null;
  videoFile?: File | null;
  iplFile?: File | string | null;
  tempAudioPath?: string;
  tempClipPath?: string;
  previewStart?: number;
  processingAudio?: boolean;
  processingClip?: boolean;
  
  // Metadata
  trackNumber: string;
  releaseDate: string;
  isrc: string;
  title: string;
  duration: string; // MM:SS

  // Artists
  artists: TrackArtist[];

  // Details
  genre: string;
  subGenre?: string;
  isInstrumental?: 'Yes' | 'No';
  explicitLyrics: string; // 'Yes', 'No', 'Clean'
  composer: string;
  lyricist: string;
  lyrics: string;

  // Additional Contributors
  contributors: TrackContributor[];
  
  // Optional: Store analysis if we want to persist it
  analysis?: AnalysisResult;
}

export interface PrimaryArtist {
  name: string;
  spotifyLink?: string;
}

export interface ReleaseData {
  id?: string; // Unique ID for the list
  userId?: string | number; // Owner ID
  status?: 'Pending' | 'Request Edit' | 'Processing' | 'Live' | 'Rejected' | 'Draft';
  submissionDate?: string;
  aggregator?: string; // New Field
  distributionTargets?: { id: string; label: string; logo: string }[];
  
  // Rejection Data
  rejectionReason?: string;
  rejectionDescription?: string;

  // Step 1
  coverArt: File | string | null;
  type?: 'SINGLE' | 'ALBUM'; // Added type
  upc: string;  
  isrc?: string; // Added ISRC for Single releases in Step 3
  title: string;
  language: string; 
  primaryArtists: (string | PrimaryArtist)[];
  label: string;
  genre?: string;
  subGenre?: string;
  pLine?: string;
  cLine?: string;
  version: string;

  // Step 2
  tracks: Track[];

  // Step 3
  isNewRelease: boolean;
  originalReleaseDate: string;
  plannedReleaseDate: string;
}

export enum Step {
  INFO = 1,
  TRACKS = 2,
  DETAILS = 3,
  REVIEW = 4,
}

export type ReleaseType = 'SINGLE' | 'ALBUM';

// Publishing types removed

// --- USER MANAGEMENT TYPES ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Operator' | 'User'; // User = Registered User
  status: 'Active' | 'Inactive' | 'Pending' | 'Review' | 'Approved' | 'Rejected' | 'Blocked';
  joinedDate: string;
  registeredDate?: string;
  rejectedDate?: string;
  blockedAt?: string;
  password?: string; // Optional for UI display
  profilePicture?: string;
  rejection_reason?: string;
  block_reason?: string;
  aggregator_percentage?: number;
  publishing_percentage?: number;
  account_type?: 'PERSONAL' | 'COMPANY';
  company_name?: string;
  nik?: string;
  full_name?: string;
  address?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  postal_code?: string;
  phone?: string;
  pic_name?: string;
  pic_position?: string;
  pic_phone?: string;
  nib_doc_path?: string;
  kemenkumham_doc_path?: string;
  ktp_doc_path?: string;
  npwp_doc_path?: string;
  signature_doc_path?: string;
  contract_doc_path?: string;
  contract_status?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- REPORT & REVENUE TYPES ---

export interface ReportData {
  id: string;
  upc: string;
  isrc: string;
  title: string;
  artist: string;
  platform: string;
  country: string;
  quantity: number;
  revenue: number;
  period: string; // YYYY-MM
  originalFileName: string;
  uploadTimestamp?: string;
  status?: 'Pending' | 'Reviewed';
  verificationStatus?: 'Unchecked' | 'Valid' | 'No User';
}

export interface AggregatedStats {
  totalRevenue: number;
  totalStreams: number;
  topTracks: { title: string; revenue: number; streams: number }[];
  topPlatforms: { name: string; revenue: number }[];
  topCountries: { code: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}
