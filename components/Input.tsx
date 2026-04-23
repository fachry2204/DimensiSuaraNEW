import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const TextInput: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="mb-4 group">
    <label className="block text-xs font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-blue-600">
      {label}
    </label>
    <input 
      className={`w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white shadow-sm 
      focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 
      placeholder-gray-400 transition-all duration-200 hover:border-blue-400 ${className}`}
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: React.ReactNode;
  options: string[];
}

export const SelectInput: React.FC<SelectProps> = ({ label, options, ...props }) => (
  <div className="mb-4 group">
    <label className="block text-xs font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-blue-600">
      {label}
    </label>
    <div className="relative">
      <select 
        className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white shadow-sm appearance-none
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 
        transition-all duration-200 hover:border-blue-400 cursor-pointer"
        {...props}
      >
        <option value="">Select an option...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
      </div>
    </div>
  </div>
);