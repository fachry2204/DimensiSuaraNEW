
import React, { useState, useEffect } from 'react';
import { Disc, Music, Calendar, Eye, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Globe, ChevronLeft, ChevronRight, List, Plus, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ReleaseData } from '../types';
import { formatDMY } from '../utils/date';
import { assetUrl } from '../utils/url';
import { useBranding } from '../contexts/BrandingContext';

interface Props {
  releases: ReleaseData[];
  onViewDetails: (release: ReleaseData) => void;
  onEdit?: (release: ReleaseData) => void;
  availableAggregators?: string[];
  error?: string | null;
  onDelete?: (release: ReleaseData) => void;
  userRole?: string;
}

type SortKey = 'title' | 'artist' | 'type' | 'date' | 'aggregator' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const AllReleases: React.FC<Props> = ({ releases, onViewDetails, availableAggregators, error, userRole }) => {
  const navigate = useNavigate();
  const { getButtonColor } = useBranding();
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewAll, setIsViewAll] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatusTab, searchQuery, isViewAll]);

  // Define Tabs
  const tabs = [
    { id: 'ALL', label: 'All Release', statusMap: null },
    { id: 'PENDING', label: 'Pending', statusMap: 'Pending' },
    { id: 'REQUEST_EDIT', label: 'Request Edit', statusMap: 'Request Edit' },
    { id: 'PROCESSING', label: 'Proses', statusMap: 'Processing' },
    { id: 'RELEASED', label: 'Released', statusMap: 'Live' },
    { id: 'REJECTED', label: 'Reject', statusMap: 'Rejected' },
  ];

  const getCount = (statusMap: string | null) => {
    if (statusMap === null) return releases.length;
    if (statusMap === 'Live') {
        return releases.filter(r => r.status === 'Live' || r.status === 'Released').length;
    }
    return releases.filter(r => (r.status || 'Pending') === statusMap).length;
  };

  // 1. Filter Logic
  const filteredReleases = releases.filter(release => {
    // Status Filter
    const currentTab = tabs.find(t => t.id === activeStatusTab);
    const releaseStatus = release.status || 'Pending';
    let statusMatch = true;
    
    if (currentTab?.statusMap) {
        if (currentTab.statusMap === 'Live') {
            statusMatch = releaseStatus === 'Live' || releaseStatus === 'Released';
        } else {
            statusMatch = releaseStatus === currentTab.statusMap;
        }
    }
    
    // Search Filter (Expanded to include Aggregator)
    const searchLower = searchQuery.toLowerCase();
    
    // Safely handle potential undefined/null fields
    const title = release.title || '';
    const artists = Array.isArray(release.primaryArtists) ? release.primaryArtists : (typeof release.primaryArtists === 'string' ? [release.primaryArtists] : []);
    const upc = release.upc || '';
    const aggregator = release.aggregator || '';

    const searchMatch = 
        title.toLowerCase().includes(searchLower) || 
        artists.some(a => (typeof a === 'string' ? a : (a?.name || '')).toLowerCase().includes(searchLower)) ||
        upc.includes(searchLower) ||
        aggregator.toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  // 2. Sorting Logic
  const sortedReleases = [...filteredReleases].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    switch (sortConfig.key) {
        case 'title':
            return a.title.localeCompare(b.title) * direction;
        case 'artist':
            const getFirstArtist = (r: ReleaseData) => {
                const list = r.primaryArtists || [];
                const first = list[0];
                return typeof first === 'string' ? first : (first?.name || '');
            };
            return getFirstArtist(a).localeCompare(getFirstArtist(b)) * direction;
        case 'aggregator':
            return (a.aggregator || '').localeCompare(b.aggregator || '') * direction;
        case 'status':
            return (a.status || '').localeCompare(b.status || '') * direction;
        case 'type':
            const typeA = (a.tracks || []).length > 1 ? "Album" : "Single";
            const typeB = (b.tracks || []).length > 1 ? "Album" : "Single";
            return typeA.localeCompare(typeB) * direction;
        case 'date':
        default:
            const dateA = a.plannedReleaseDate || a.submissionDate || '';
            const dateB = b.plannedReleaseDate || b.submissionDate || '';
            return dateA.localeCompare(dateB) * direction;
    }
  });

  // 3. Pagination Logic
  const totalItems = sortedReleases.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  const displayedReleases = isViewAll 
    ? sortedReleases 
    : sortedReleases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
     if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-50" />;
     return sortConfig.direction === 'asc' 
        ? <ArrowUp size={14} className="text-blue-500" /> 
        : <ArrowDown size={14} className="text-blue-500" />;
  };

  const ThSortable = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: 'left'|'right' }) => (
      <th 
        className={`px-4 py-2 text-[13px] text-slate-400 tracking-wider cursor-pointer hover:bg-white/5 transition-colors group text-${align}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
            {label}
            <SortIcon columnKey={sortKey} />
        </div>
      </th>
  );

  // Stat card UI
  const StatCard = ({ title, count, icon, colorClass, bgClass, subtext, cardClass }: any) => (
    <div className={`p-5 rounded-2xl shadow-sm border border-brand-border flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md ${cardClass || 'bg-brand-card'}`}>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white">{count}</h3>
            <p className="text-[12px] text-slate-500 mt-1.5 font-normal">{subtext}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
            {icon}
        </div>
    </div>
  );

  // Meta stats
  const uniqueArtists = new Set<string>();
  releases.forEach(r => {
      if (Array.isArray(r.primaryArtists)) {
          r.primaryArtists.forEach(a => {
              const name = typeof a === 'string' ? a : a.name;
              if (name) uniqueArtists.add(name.trim());
          });
      } else if (typeof r.primaryArtists === 'string') {
          if (r.primaryArtists) uniqueArtists.add((r.primaryArtists as string).trim());
      }
  });

  const metaStats = {
    singles: releases.filter(r => r.type === 'SINGLE').length,
    albums: releases.filter(r => r.type === 'ALBUM').length,
    tracks: releases.reduce((sum, r) => sum + (r.tracks?.length || 0), 0),
    artists: uniqueArtists.size
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="md:hidden">
                <h1 className="text-[15px] text-white tracking-tight">All Releases</h1>
                <p className="text-slate-400 mt-0.5 text-[10px]">Manage and track your music catalog status.</p>
            </div>
        </div>

        {/* META COUNTS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
                title="Jumlah Single" 
                count={metaStats.singles} 
                icon={<Music size={20} />} 
                colorClass="text-indigo-600" 
                bgClass="bg-indigo-100"
                subtext="Total single releases"
                cardClass="bg-indigo-500/10 border-indigo-500/20"
            />
            <StatCard 
                title="Jumlah Album" 
                count={metaStats.albums} 
                icon={<Disc size={20} />} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-100"
                subtext="Total album releases"
                cardClass="bg-purple-500/10 border-purple-500/20"
            />
            <StatCard 
                title="Jumlah Track" 
                count={metaStats.tracks} 
                icon={<Music size={20} />} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-100"
                subtext="Tracks across catalog"
                cardClass="bg-blue-500/10 border-blue-500/20"
            />
            <StatCard 
                title="Jumlah Artis" 
                count={metaStats.artists} 
                icon={<Users size={20} />} 
                colorClass="text-emerald-600" 
                bgClass="bg-emerald-100"
                subtext="Total unique artists"
                cardClass="bg-emerald-500/10 border-emerald-500/20"
            />
            
        </div>

        {/* STATUS TABS NAVIGATION */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="font-medium">Connection Error: {error}</p>
                <p className="text-sm ml-auto text-red-400">Please check your network or server logs.</p>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar w-full md:w-auto">
            {tabs.map((tab) => {
                const isActive = activeStatusTab === tab.id;
                const count = getCount(tab.statusMap);
                const baseColors =
                    tab.id === 'PENDING'
                        ? isActive
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100/60'
                        : tab.id === 'REQUEST_EDIT'
                        ? isActive
                            ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/60'
                        : tab.id === 'PROCESSING'
                        ? isActive
                            ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                            : 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/60'
                        : tab.id === 'RELEASED'
                        ? isActive
                            ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/60'
                        : tab.id === 'REJECTED'
                        ? isActive
                            ? 'bg-red-100 text-red-800 border-red-300 shadow-sm'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/60'
                        : isActive
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : 'bg-brand-card text-slate-500 border-brand-border hover:border-slate-300 hover:bg-white/5';
                
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveStatusTab(tab.id)}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-full font-semibold text-[10px] transition-all flex items-center gap-2 border
                            ${baseColors}
                        `}
                    >
                        {tab.label}
                        <span
                            className={`
                                px-1.5 py-0.5 rounded-full text-[10px] min-w-[20px] text-center border
                                ${
                                    tab.id === 'PENDING'
                                        ? isActive
                                            ? 'bg-white/10 text-yellow-500 border-yellow-500/30'
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        : tab.id === 'PROCESSING'
                                        ? isActive
                                            ? 'bg-white/10 text-blue-500 border-blue-500/30'
                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        : tab.id === 'RELEASED'
                                        ? isActive
                                            ? 'bg-white/20 text-white border-white/40'
                                            : 'bg-green-500/10 text-green-600 border-green-500/20'
                                        : tab.id === 'REQUEST_EDIT'
                                        ? isActive
                                            ? 'bg-white/20 text-white border-white/40'
                                            : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                        : tab.id === 'REJECTED'
                                        ? isActive
                                            ? 'bg-white/10 text-red-500 border-red-500/30'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : isActive
                                        ? 'bg-white/10 text-white border-white/30'
                                        : 'bg-white/5 text-slate-500 border-brand-border'
                                }
                            `}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
            </div>

            <div className="w-full md:w-auto flex items-center gap-3">
                <div className="relative w-full md:w-80">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search Title, Artist, UPC${(userRole === 'Admin' || userRole === 'Operator') ? ', Aggregator' : ''}...`} 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white shadow-sm transition-all text-[13px] text-slate-800"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <button
                    onClick={() => navigate('/new-release')}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-[14px] font-bold shadow-md shadow-blue-100"
                    title="Create New Release"
                >
                    <Plus size={14} />
                    New Release
                </button>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1 bg-white">
                <table className="w-full text-left bg-white">
                    <thead className="bg-[#f1f5f9] border-b-2 border-slate-200">
                        <tr>
                            <ThSortable label="Release" sortKey="title" />
                            <th className="px-4 py-2 text-[13px] text-slate-500 tracking-wider">User</th>
                            <ThSortable label="Type" sortKey="type" />
                            <ThSortable label="Release Date" sortKey="date" />
                            <th className="px-4 py-2 text-[13px] text-slate-500 tracking-wider">Submit Date</th>
                            {(userRole === 'Admin' || userRole === 'Operator') && <ThSortable label="Aggregator" sortKey="aggregator" />}
                            <ThSortable label="Status" sortKey="status" />
                            <th className="px-4 py-2 text-[13px] text-slate-500 tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedReleases.map((release) => {
                            // Determine type
                            const type = (release.tracks || []).length > 1 ? "Album/EP" : "Single";
                            
                            // Date priority: Planned > Original > Submission
                            const displayDateRaw = release.plannedReleaseDate || release.originalReleaseDate || release.submissionDate || "N/A";
                            const status = release.status || "Pending";
                            const ownerName = (release as any).ownerDisplayName || "";

                            // Determine color based on status
                            let statusClass = "bg-gray-100 text-gray-600 border-gray-200";
                            if (status === 'Live' || status === 'Released') statusClass = "bg-green-100 text-green-700 border-green-200";
                            if (status === 'Processing') statusClass = "bg-blue-100 text-blue-700 border-blue-200";
                            if (status === 'Pending') statusClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
                            if (status === 'Request Edit') statusClass = "bg-orange-50 text-orange-600 border-orange-200";
                            if (status === 'Rejected') statusClass = "bg-red-100 text-red-700 border-red-200 cursor-help";

                            // ISRC Logic
                            const isSingle = (release.tracks || []).length === 1;
                            const isrcDisplay = isSingle 
                                ? (release.tracks?.[0]?.isrc || "-") 
                                : ((release.tracks || []).length > 0 ? `${release.tracks.length} Tracks` : "-");

                            // Rejection Tooltip Logic
                            const rejectionTooltip = status === 'Rejected' && release.rejectionReason 
                                ? `Reason: ${release.rejectionReason}` 
                                : undefined;

                            return (
                                <tr key={release.id || Math.random()} className="hover:bg-slate-50 transition-colors group text-[13px] bg-white">
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg bg-blue-50 overflow-hidden flex items-center justify-center text-slate-400 relative shrink-0 border border-blue-100`}>
                                                {release.coverArt ? (
                                                    <img 
                                                        src={(typeof release.coverArt === 'string')
                                                            ? assetUrl(release.coverArt)
                                                            : (release.coverArt instanceof Blob ? URL.createObjectURL(release.coverArt) : '')
                                                        } 
                                                        alt="Art" 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg'; // Local fallback
                                                            (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                                            console.error("Failed to load image:", release.coverArt);
                                                        }}
                                                    />
                                                ) : (
                                                    <Disc size={20} />
                                                )}
                                            </div>
                                            <div className="min-w-[150px]">
                                                <div className="font-medium text-slate-800 truncate max-w-[200px] text-[13px]" title={release.title}>{release.title || "Untitled Release"}</div>
                                                <div className="text-[13px] text-slate-500 truncate max-w-[200px] font-medium" title={(release.primaryArtists || []).map(a => typeof a === 'string' ? a : a.name).join(', ')}>
                                                    {(release.primaryArtists || []).map(a => typeof a === 'string' ? a : a.name).join(', ') || "Unknown Artist"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-[13px] text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-slate-400" />
                                            {ownerName || "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-medium whitespace-nowrap shadow-sm border ${
                                            type === "Single" 
                                                ? "bg-blue-100 text-blue-700 border-blue-200" 
                                                : "bg-green-100 text-green-700 border-green-200"
                                        }`}>
                                            <Music size={10} />
                                            {type}
                                        </span>
                                    </td>
                                <td className="px-4 py-2 text-[13px] text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-slate-400" />
                                            {formatDMY(displayDateRaw)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-[13px] text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-slate-400" />
                                            {release.submissionDate ? formatDMY(release.submissionDate) : 'N/A'}
                                        </div>
                                    </td>
                                    {(userRole === 'Admin' || userRole === 'Operator') && (
                                    <td className="px-4 py-2 text-[13px]">
                                        {release.aggregator ? (
                                            <div className="flex items-center gap-1 text-[13px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 w-fit">
                                                <Music size={10} />
                                                {release.aggregator}
                                            </div>
                                        ) : (
                                            <span className="text-[13px] text-slate-300 italic">Not set</span>
                                        )}
                                    </td>
                                    )}
                                    <td className="px-4 py-2">
                                        <div className="flex flex-col items-start gap-1">
                                            <span 
                                                title={rejectionTooltip}
                                                className={`inline-block px-2 py-0.5 rounded-full text-[13px] font-medium whitespace-nowrap border ${statusClass}`}
                                            >
                                                {status === 'Live' || status === 'Released' ? 'Released' : status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link 
                                                to={`/releases/${release.id}/view`}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-[14px] font-medium shadow-sm whitespace-nowrap"
                                                title="View & Manage"
                                            >
                                                <Eye size={12} /> View
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {sortedReleases.length === 0 && (
                <div className="p-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">{error ? "Connection Failed" : "No releases found"}</h3>
                    <p className="text-slate-400 text-xs">
                        {error 
                            ? "We couldn't load your releases. Please check the error message above."
                            : (activeStatusTab === 'ALL' && searchQuery === ''
                                ? "You haven't created any releases yet." 
                                : `No results found for your current filter/search.`)}
                    </p>
                </div>
            )}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="text-[13px] text-slate-500 font-medium">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min((currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE, sortedReleases.length)} of {sortedReleases.length} results
                </div>
                <div className="flex gap-2">
                     <button onClick={() => setIsViewAll(!isViewAll)} className="px-3 py-1.5 text-[14px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        {isViewAll ? "Show Paged" : "View All"}
                     </button>
                     {!isViewAll && totalPages > 1 && (
                     <div className="flex items-center gap-1">
                         <button
                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                             disabled={currentPage === 1}
                             className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                         >
                             <ChevronLeft size={16} />
                         </button>
                         
                         {Array.from({ length: totalPages }, (_, i) => i + 1)
                             .filter(page => {
                                 const distance = Math.abs(page - currentPage);
                                 return distance < 2 || page === 1 || page === totalPages;
                             })
                             .map((page, index, array) => {
                                 if (index > 0 && page - array[index - 1] > 1) {
                                     return (
                                         <span key={`ellipsis-${page}`} className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
                                     );
                                 }
                                 return (
                                     <button
                                         key={page}
                                         onClick={() => setCurrentPage(page)}
                                         className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                                             currentPage === page
                                                 ? 'bg-green-500 text-white shadow-md shadow-green-200'
                                                 : 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-sm'
                                         }`}
                                     >
                                         {page}
                                     </button>
                                 );
                             })}

                         <button
                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                             disabled={currentPage === totalPages}
                             className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                         >
                             <ChevronRight size={16} />
                         </button>
                     </div>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};
