
import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = "1.0.1";

  return (
    <footer className="w-full py-2 px-8 border-t border-gray-100 bg-white mt-auto overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
           <p className="text-[10px] font-bold text-black">
               &copy; {currentYear} Dimensi Suara
           </p>
           <p className="text-[9px] text-black/60 mt-0.5">
               CMS Version {appVersion}
           </p>
        </div>
        
        <div className="text-[10px] text-black/40 font-bold uppercase tracking-widest">
            Authorized Personnel Only
        </div>
      </div>
    </footer>
  );
};
