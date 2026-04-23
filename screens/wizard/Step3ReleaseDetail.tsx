import React from 'react';
import { ReleaseData, ReleaseType } from '../../types';
import { TextInput } from '../../components/Input';
import { Calendar, Globe, Barcode, Disc } from 'lucide-react';
import socialLogo from '../../assets/platforms/social.svg';
import youtubeMusicLogo from '../../assets/platforms/youtube-music.svg';
import allDspLogo from '../../assets/platforms/alldsp.svg';

interface Props {
  data: ReleaseData;
  updateData: (updates: Partial<ReleaseData> | ((prev: ReleaseData) => Partial<ReleaseData>)) => void;
  releaseType?: ReleaseType;
}

export const Step3ReleaseDetail: React.FC<Props> = ({ data, updateData, releaseType }) => {
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const originalDateInputRef = React.useRef<HTMLInputElement>(null);
  
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 14);
  const minDateStr = minDate.toISOString().split('T')[0];
  const isDateInvalid = data.plannedReleaseDate && data.plannedReleaseDate < minDateStr;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xs font-bold text-slate-800 mb-2">Release Specifics</h2>
        <p className="text-xs text-slate-500">Distribution details and dates.</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 relative mt-6 mb-8">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-3 left-4 bg-white px-2">Distribution History</h3>
        
        <div className="space-y-4">
            <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${data.isNewRelease ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-200'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${data.isNewRelease ? 'border-blue-500' : 'border-gray-300'}`}>
                    {data.isNewRelease && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                </div>
                <input 
                    type="radio" 
                    name="releaseType" 
                    checked={data.isNewRelease === true} 
                    onChange={() => updateData({ isNewRelease: true })}
                    className="hidden"
                />
                <span className={`text-xs font-medium ${data.isNewRelease ? 'text-blue-900' : 'text-slate-600'}`}>No, this is a brand new release</span>
            </label>
            
            <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${!data.isNewRelease ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-200'}`}>
                 <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${!data.isNewRelease ? 'border-blue-500' : 'border-gray-300'}`}>
                    {!data.isNewRelease && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                </div>
                <input 
                    type="radio" 
                    name="releaseType" 
                    checked={data.isNewRelease === false}
                    onChange={() => updateData({ isNewRelease: false })}
                    className="hidden"
                />
                <span className={`text-xs font-medium ${!data.isNewRelease ? 'text-blue-900' : 'text-slate-600'}`}>Yes, this album has been released before</span>
            </label>
        </div>

        {!data.isNewRelease && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in-down space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Original Release Date</label>
                        <div className="relative group w-full">
                            <input 
                               ref={originalDateInputRef}
                               type="date" 
                               value={data.originalReleaseDate}
                               onChange={(e) => updateData({ originalReleaseDate: e.target.value })}
                               className="w-full px-4 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-sm transition-all pl-4 pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />
                           <div 
                               onClick={() => originalDateInputRef.current?.showPicker()}
                               className="absolute right-2 top-1 bottom-1 aspect-square rounded flex items-center justify-center cursor-pointer transition-colors shadow-sm border bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100"
                           >
                               <Calendar size={16} />
                           </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Barcode size={16} className="text-blue-500" />
                            Kode UPC (Jika pernah rilis sebelumnya)
                        </label>
                        <TextInput 
                            label=""
                            value={data.upc}
                            onChange={(e) => updateData({ upc: e.target.value })}
                            placeholder="Masukkan kode UPC sebelumnya"
                            className="w-full px-4 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-sm transition-all"
                        />
                    </div>
                    
                    {releaseType === 'SINGLE' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Disc size={16} className="text-blue-500" />
                                Kode ISRC (Jika pernah rilis sebelumnya)
                            </label>
                            <TextInput 
                                label=""
                                value={data.isrc}
                                onChange={(e) => updateData({ isrc: e.target.value })}
                                placeholder="Masukkan kode ISRC sebelumnya"
                                className="w-full px-4 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-sm transition-all"
                            />
                        </div>
                    )}
                 </div>
            </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-6 relative mt-6 mb-8">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-3 left-4 bg-white px-2">Distribution Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'SOCIAL', label: 'Social Media', logo: socialLogo },
            { id: 'YOUTUBE_MUSIC', label: 'YouTube Music', logo: youtubeMusicLogo },
            { id: 'ALL_DSP', label: 'All DSP', logo: allDspLogo },
          ].map(opt => {
            const selected = Array.isArray(data.distributionTargets) && data.distributionTargets.some(t => t.id === opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  const current = Array.isArray(data.distributionTargets) ? [...data.distributionTargets] : [];
                  const idx = current.findIndex(t => t.id === opt.id);
                  if (idx >= 0) {
                    current.splice(idx, 1);
                  } else {
                    current.push({ id: opt.id, label: opt.label, logo: opt.logo });
                  }
                  updateData({ distributionTargets: current });
                }}
                className={`flex items-center gap-3 p-4 rounded-lg border ${selected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'} hover:border-blue-200 transition-colors text-left`}
              >
                <div className="w-10 h-10 rounded flex items-center justify-center bg-white border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                  <img src={opt.logo} alt={opt.label} className="w-6 h-6 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-slate-800 truncate">{opt.label}</div>
                  <div className="text-xs text-slate-400 truncate">{selected ? 'Selected' : 'Click to select'}</div>
                </div>
                <div className={`w-5 h-5 rounded border shrink-0 ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} flex items-center justify-center`}>
                  {selected && <div className="w-2.5 h-2.5 bg-white rounded-[1px]"></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 relative mt-6">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 absolute -top-3 left-4 bg-white px-2">Schedule</h3>
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Planned Release Date</label>
            <div className="relative group max-w-xs">
                <input 
                    ref={dateInputRef}
                    type="date" 
                    min={minDateStr}
                    value={data.plannedReleaseDate}
                    onChange={(e) => updateData({ plannedReleaseDate: e.target.value })}
                    className={`w-full px-4 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-all pl-4 pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 ${
                        isDateInvalid 
                            ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                            : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 shadow-sm'
                    }`}
                />
                <div 
                    onClick={() => dateInputRef.current?.showPicker()}
                    className={`absolute right-2 top-1 bottom-1 aspect-square rounded flex items-center justify-center cursor-pointer transition-colors shadow-sm border ${
                        isDateInvalid ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                    }`}
                >
                    <Calendar size={16} />
                </div>
            </div>
            {isDateInvalid && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">
                    Date must be at least 14 days from today.
                </p>
            )}
            <p className="text-xs text-blue-500 mt-2 font-medium">
                Recommended: Set date at least 14 days from today
            </p>
        </div>
      </div>
    </div>
  );
};
