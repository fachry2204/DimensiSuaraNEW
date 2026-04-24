import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle, ListMusic, Music4, Settings, LayoutDashboard, BarChart3, ClipboardList, DollarSign, Upload, UserPlus, FileText, Library, PieChart, Users, Shield, User, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentUser: string;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, userRole }) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboard: false,
    aggregator: false,
    publishing: false,
    report: false,
    reportUser: false,
    system: false,
    dataSaya: false,
    bantuan: false,
    statistics: false,
    payments: false,
    reportList: false,
    revenue: false,
    importReports: false,
    kontrak: false
  });

  const toggleSection = (section: string) => {
    const TOP_SECTIONS = ['dashboard','aggregator','publishing','report','reportUser','system','dataSaya','bantuan', 'kontrak'];
    const REPORT_SUBS = ['statistics','reportList','importReports','payments','revenue'];
    setExpandedSections(prev => {
      const next = { ...prev };
      // Accordion for top-level sections
      if (TOP_SECTIONS.includes(section)) {
        TOP_SECTIONS.forEach(s => { next[s] = false; });
        next[section] = !prev[section];
        return next;
      }
      // Accordion for report sub-sections
      if (REPORT_SUBS.includes(section)) {
        REPORT_SUBS.forEach(s => { next[s] = false; });
        next[section] = !prev[section];
        // ensure parent report container is open
        next.report = true;
        return next;
      }
      // Default toggle
      next[section] = !prev[section];
      return next;
    });
  };

  useEffect(() => {
      fetch('/api/settings/branding')
          .then(res => res.json())
          .then(data => {
              if (data.logo) setLogo(data.logo);
          })
          .catch(err => console.error("Failed to fetch branding:", err));
  }, []);

  const getLinkClass = (isActive: boolean) => 
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] ${
      isActive
        ? 'bg-[#aa91cc] text-white shadow-lg shadow-[#aa91cc]/20'
        : 'text-slate-400 hover:bg-[#aa91cc] hover:text-white'
    }`;

  const getIconClass = (isActive: boolean) =>
    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white';

  const getSubLinkClass = (isActive: boolean) => 
    `w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-[12px] ${
      isActive
        ? 'text-white bg-[#aa91cc] shadow-sm'
        : 'text-slate-500 hover:text-white hover:bg-[#aa91cc]/40'
    }`;

  return (
    <aside className="w-64 bg-brand-card border-r border-brand-border h-screen md:min-h-screen flex flex-col shadow-2xl transition-all duration-300 sticky top-0 overflow-y-auto pb-6 md:pb-0 sidebar-scroll">
      {/* Brand Logo */}
      <div className="min-h-[80px] h-auto py-4 flex flex-col items-center justify-center px-6 border-b border-brand-border flex-shrink-0">
        {logo ? (
            <img src={logo} alt="Logo" className="w-auto h-auto max-h-[150px] object-contain mb-2" />
        ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-2">
                <Music4 size={24} />
            </div>
        )}
        <div className="text-center">
            <span className="text-xs font-bold text-white block tracking-wide">Aggregator & Publishing</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto sidebar-scroll">
        
        {/* Dashboard Menu */}
        <div>
          <NavLink to="/dashboard" className={({ isActive }) => getLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <LayoutDashboard size={20} className={getIconClass(isActive)} />
                Dashboard
              </>
            )}
          </NavLink>
        </div>

        {/* Aggregator Menu */}
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('aggregator')}
          >
            Aggregator
            {expandedSections.aggregator ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.aggregator && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/aggregator" end className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <BarChart3 size={20} className={getIconClass(isActive)} />
                    Aggregator
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to={userRole === 'User' ? "/my-releases" : "/releases"} className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <ListMusic size={20} className={getIconClass(isActive)} />
                    {userRole === 'User' ? 'My Releases' : 'All Release'}
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/aggregator/artists" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users size={20} className={getIconClass(isActive)} />
                    Artist
                  </>
                )}
              </NavLink>
            </li>
          </ul>
          )}
        </div>

        {/* Publishing Menu */}
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('publishing')}
          >
            Publishing
            {expandedSections.publishing ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.publishing && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/publishing/writer" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <UserPlus size={20} className={getIconClass(isActive)} />
                    Data Pencipta
                  </>
                )}
              </NavLink>
            </li>
             <li>
              <NavLink to="/publishing/songs" className={({ isActive }) => getLinkClass(isActive)}>
                 {({ isActive }) => (
                  <>
                    <ListMusic size={20} className={getIconClass(isActive)} />
                    Data Lagu
                  </>
                )}
              </NavLink>
            </li>
          </ul>
          )}
        </div>

        {/* Report Section */}
        {userRole !== 'User' && (
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('report')}
          >
            Report
            {expandedSections.report ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.report && (
            <ul className="space-y-2">
            
            {/* Statistik Dropdown */}
            <li>
                <div 
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] text-slate-400 hover:bg-[#aa91cc] hover:text-white cursor-pointer"
                    onClick={() => toggleSection('statistics')}
                >
                    <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-white/70 group-hover:text-white" />
                        Statistik
                    </div>
                    {expandedSections.statistics ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedSections.statistics && (
                    <ul className="pl-4 mt-1 space-y-1 border-l border-brand-border ml-6">
                        <li>
                            <NavLink to="/statistics/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Aggregator
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/statistics/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Publishing
                            </NavLink>
                        </li>
                    </ul>
                )}
            </li>

            {/* Laporan Dropdown */}
            <li>
                <div 
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] text-white/80 hover:bg-[#aa91cc] hover:text-white cursor-pointer"
                    onClick={() => toggleSection('reportList')}
                >
                    <div className="flex items-center gap-3">
                        <ClipboardList size={20} className="text-white/70 group-hover:text-white" />
                        Laporan
                    </div>
                    {expandedSections.reportList ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedSections.reportList && (
                    <ul className="pl-4 mt-1 space-y-1 border-l border-white/10 ml-6">
                        <li>
                            <NavLink to="/reports/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Aggregator
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/reports/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Publishing
                            </NavLink>
                        </li>
                    </ul>
                )}
            </li>

            {/* Pendapatan Dropdown - REMOVED */}
            {/* <li>
                <div 
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] text-white/80 hover:bg-[#aa91cc] hover:text-white cursor-pointer"
                    onClick={() => toggleSection('revenue')}
                >
                    <div className="flex items-center gap-3">
                        <DollarSign size={20} className="text-white/70 group-hover:text-white" />
                        Pendapatan
                    </div>
                    {expandedSections.revenue ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedSections.revenue && (
                    <ul className="pl-4 mt-1 space-y-1 border-l border-white/10 ml-6">
                        <li>
                            <NavLink to="/revenue/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Aggregator
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/revenue/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Publishing
                            </NavLink>
                        </li>
                    </ul>
                )}
            </li> */}

            {/* Import Laporan Dropdown */}
            <li>
                <div 
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] text-white/80 hover:bg-[#aa91cc] hover:text-white cursor-pointer"
                    onClick={() => toggleSection('importReports')}
                >
                    <div className="flex items-center gap-3">
                        <Upload size={20} className="text-white/70 group-hover:text-white" />
                        Import Laporan
                    </div>
                    {expandedSections.importReports ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedSections.importReports && (
                    <ul className="pl-4 mt-1 space-y-1 border-l border-white/10 ml-6">
                        <li>
                            <NavLink to="/import-reports/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Aggregator
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/import-reports/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Publishing
                            </NavLink>
                        </li>
                    </ul>
                )}
            </li>
            
            {/* Pembayaran Dropdown */}
            <li>
                <div 
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group font-bold text-[13px] text-white/80 hover:bg-[#aa91cc] hover:text-white cursor-pointer"
                    onClick={() => toggleSection('payments')}
                >
                    <div className="flex items-center gap-3">
                        <DollarSign size={20} className="text-white/70 group-hover:text-white" />
                        Pembayaran
                    </div>
                    {expandedSections.payments ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedSections.payments && (
                    <ul className="pl-4 mt-1 space-y-1 border-l border-white/10 ml-6">
                        <li>
                            <NavLink to="/reports/payments/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Aggregator
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/reports/payments/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                                Publishing
                            </NavLink>
                        </li>
                    </ul>
                )}
            </li>
          </ul>
          )}
        </div>
        )}

        {/* Kontrak Menu (Admin Only) - Moved outside of Report section */}
        {userRole === 'Admin' && (
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('kontrak')}
          >
            Kontrak
            {expandedSections.kontrak ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.kontrak && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/contracts/aggregator" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileText size={20} className={getIconClass(isActive)} />
                    Aggregator
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/contracts/publishing" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileText size={20} className={getIconClass(isActive)} />
                    Publishing
                  </>
                )}
              </NavLink>
            </li>
          </ul>
          )}
        </div>
        )}

        {userRole === 'User' && (
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('reportUser')}
          >
            Report User
            {expandedSections.reportUser ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.reportUser && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/user/reports/analytics" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <BarChart3 size={20} className={getIconClass(isActive)} />
                    Analitik
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/user/reports/payments" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <DollarSign size={20} className={getIconClass(isActive)} />
                    Pembayaran
                  </>
                )}
              </NavLink>
            </li>
          </ul>
          )}
        </div>
        )}

        {/* System / Settings Section */}
        {userRole !== 'User' && (
        <div>
            <h3 
              className="px-4 text-[14px] font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
              onClick={() => toggleSection('system')}
            >
              System
              {expandedSections.system ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </h3>
            {expandedSections.system && (
              <ul className="space-y-2">
            <li>
              <NavLink to="/settings" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Settings size={20} className={getIconClass(isActive)} />
                    Settings
                  </>
                )}
              </NavLink>
            </li>
            {(userRole === 'Admin' || userRole === 'Operator') && (
            <li>
              <NavLink to="/users" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users size={20} className={getIconClass(isActive)} />
                    User Management
                  </>
                )}
              </NavLink>
            </li>
            )}
          </ul>
            )}
        </div>
        )}
        {userRole === 'User' && (
        <div>
          <h3 
            className="px-4 text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('dataSaya')}
          >
            Data Saya
            {expandedSections.dataSaya ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.dataSaya && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/me/profile" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <User size={20} className={getIconClass(isActive)} />
                    Profile
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <div
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 ${
                  location.pathname.startsWith('/me/contracts')
                    ? 'border-[#aa91cc] bg-[#aa91cc] text-white' 
                    : 'border-transparent text-white/70 hover:bg-[#aa91cc] hover:text-white'
                }`}
                onClick={() => toggleSection('kontrak')}
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className={location.pathname.startsWith('/me/contracts') ? 'text-blue-400' : 'text-white/50'} />
                  <span className="font-medium text-[15px]">Kontrak</span>
                </div>
                {expandedSections.kontrak ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {expandedSections.kontrak && (
                <ul className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-2">
                  <li>
                    <NavLink to="/me/contracts/aggregator" className={({ isActive }) => getSubLinkClass(isActive)}>
                      Aggregator
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/me/contracts/publishing" className={({ isActive }) => getSubLinkClass(isActive)}>
                      Publishing
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
            </ul>
            )}
        </div>
        )}

        {/* Bantuan Section */}
        <div>
          <h3 
            className="px-4 text-[14px] font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSection('bantuan')}
          >
            Bantuan
            {expandedSections.bantuan ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </h3>
          {expandedSections.bantuan && (
            <ul className="space-y-2">
            <li>
              <NavLink to="/tickets" className={({ isActive }) => getLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <MessageSquare size={20} className={getIconClass(isActive)} />
                    Tiket Bantuan
                  </>
                )}
              </NavLink>
            </li>
          </ul>
          )}
        </div>
      </nav>
    </aside>
  );
};
