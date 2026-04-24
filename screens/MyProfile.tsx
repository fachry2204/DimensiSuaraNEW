import React, { useState } from 'react';
import { User as UserIcon, Eye, Download, XCircle } from 'lucide-react';
import { User } from '../types';

interface Props {
  currentUserData: User;
}

export const MyProfile: React.FC<Props> = ({ currentUserData }) => {
  const user = currentUserData || {} as User;
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg text-slate-800 tracking-tight">Profile</h1>
        <p className="text-slate-500 mt-0.5 text-[12px]">Data akun Anda.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserIcon size={24} />
            </div>
            <div>
            <div className="text-xs font-bold text-slate-800">{user.full_name || user.name || '-'}</div>
            <div className="text-[10px] text-slate-500">{user.email || '-'}</div>
          </div>
            </div>
            


            <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                <tbody className="[&>tr>td]:py-2 [&>tr>td]:px-3 [&>tr:nth-child(even)]:bg-slate-50">
                    <tr><td className="text-slate-600">Account Type</td><td className="font-normal text-slate-700">{user.account_type || '-'}</td></tr>
                    {(user.account_type === 'COMPANY') && (
                    <tr><td className="text-slate-600">Company</td><td className="font-normal text-slate-700">{user.company_name || '-'}</td></tr>
                    )}
                    <tr><td className="text-slate-600">Nama Lengkap</td><td className="font-normal text-slate-700">{user.full_name || '-'}</td></tr>
                    <tr><td className="text-slate-600">NIK</td><td className="font-normal text-slate-700">{user.nik || '-'}</td></tr>
                    <tr><td className="text-slate-600">Phone</td><td className="font-normal text-slate-700">{user.phone || '-'}</td></tr>
                    <tr><td className="text-slate-600">Address</td><td className="font-normal text-slate-700 whitespace-pre-line">{user.address || '-'}</td></tr>
                    <tr><td className="text-slate-600">Country</td><td className="font-normal text-slate-700">{user.country || '-'}</td></tr>
                    <tr><td className="text-slate-600">Province</td><td className="font-normal text-slate-700">{user.province || '-'}</td></tr>
                    <tr><td className="text-slate-600">City</td><td className="font-normal text-slate-700">{user.city || '-'}</td></tr>
                    <tr><td className="text-slate-600">District</td><td className="font-normal text-slate-700">{user.district || '-'}</td></tr>
                    <tr><td className="text-slate-600">Subdistrict</td><td className="font-normal text-slate-700">{user.subdistrict || '-'}</td></tr>
                    <tr><td className="text-slate-600">Postal Code</td><td className="font-normal text-slate-700">{user.postal_code || '-'}</td></tr>
                    {(user.account_type === 'COMPANY') && (
                    <>
                        <tr><td className="text-slate-600">PIC Name</td><td className="font-normal text-slate-700">{user.pic_name || '-'}</td></tr>
                        <tr><td className="text-slate-600">PIC Position</td><td className="font-normal text-slate-700">{user.pic_position || '-'}</td></tr>
                        <tr><td className="text-slate-600">PIC Phone</td><td className="font-normal text-slate-700">{user.pic_phone || '-'}</td></tr>
                    </>
                    )}
                    <tr><td className="text-slate-600">Role</td><td className="font-normal text-slate-700">{user.role || '-'}</td></tr>
                    <tr><td className="text-slate-600">Status</td><td className="font-normal text-slate-700">{user.status || '-'}</td></tr>
                    <tr><td className="text-slate-600">Joined Date</td><td className="font-normal text-slate-700">{user.joinedDate || '-'}</td></tr>
                    {user.aggregator_percentage !== undefined && (
                    <tr><td className="text-slate-600">Aggregator Percentage</td><td className="font-normal text-slate-700">{user.aggregator_percentage}%</td></tr>
                    )}
                    {user.publishing_percentage !== undefined && (
                    <tr><td className="text-slate-600">Publishing Percentage</td><td className="font-normal text-slate-700">{user.publishing_percentage}%</td></tr>
                    )}
                    {user.status === 'Blocked' && (
                    <>
                        <tr><td className="text-slate-600">Blocked Date</td><td className="font-normal text-slate-700">{user.blockedAt || '-'}</td></tr>
                        <tr><td className="text-slate-600">Block Reason</td><td className="font-normal text-slate-700">{user.block_reason || '-'}</td></tr>
                    </>
                    )}
                </tbody>
                </table>
            </div>
            </div>

            <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-800">Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {user.ktp_doc_path && (
                <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-medium mb-2">KTP</div>
                    {user.ktp_doc_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={user.ktp_doc_path} className="w-full h-40 rounded-md" />
                    ) : (
                    <img 
                        src={user.ktp_doc_path} 
                        alt="KTP" 
                        className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => { setPreviewUrl(user.ktp_doc_path!); setPreviewIsPdf(false); setShowDocPreview(true); }}
                    />
                    )}
                    <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { setPreviewUrl(user.ktp_doc_path!); setPreviewIsPdf(user.ktp_doc_path!.toLowerCase().endsWith('.pdf')); setShowDocPreview(true); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Preview"
                    >
                        <Eye size={14} /> Preview
                    </button>
                    <a
                        href={user.ktp_doc_path}
                        download
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Download"
                    >
                        <Download size={14} /> Download
                    </a>
                    </div>
                </div>
                )}
                {user.npwp_doc_path && (
                <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-medium mb-2">NPWP</div>
                    {user.npwp_doc_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={user.npwp_doc_path} className="w-full h-40 rounded-md" />
                    ) : (
                    <img 
                        src={user.npwp_doc_path} 
                        alt="NPWP" 
                        className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => { setPreviewUrl(user.npwp_doc_path!); setPreviewIsPdf(false); setShowDocPreview(true); }}
                    />
                    )}
                    <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { setPreviewUrl(user.npwp_doc_path!); setPreviewIsPdf(user.npwp_doc_path!.toLowerCase().endsWith('.pdf')); setShowDocPreview(true); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Preview"
                    >
                        <Eye size={14} /> Preview
                    </button>
                    <a
                        href={user.npwp_doc_path}
                        download
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Download"
                    >
                        <Download size={14} /> Download
                    </a>
                    </div>
                </div>
                )}
                {user.signature_doc_path && (
                <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-medium mb-2">File Tandatangan</div>
                    {user.signature_doc_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={user.signature_doc_path} className="w-full h-40 rounded-md" />
                    ) : (
                    <img 
                        src={user.signature_doc_path} 
                        alt="Tandatangan" 
                        className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => { setPreviewUrl(user.signature_doc_path!); setPreviewIsPdf(false); setShowDocPreview(true); }}
                    />
                    )}
                    <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { setPreviewUrl(user.signature_doc_path!); setPreviewIsPdf(user.signature_doc_path!.toLowerCase().endsWith('.pdf')); setShowDocPreview(true); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Preview"
                    >
                        <Eye size={14} /> Preview
                    </button>
                    <a
                        href={user.signature_doc_path}
                        download
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Download"
                    >
                        <Download size={14} /> Download
                    </a>
                    </div>
                </div>
                )}
                {(user.account_type === 'COMPANY') && user.nib_doc_path && (
                <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-medium mb-2">NIB</div>
                    {user.nib_doc_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={user.nib_doc_path} className="w-full h-40 rounded-md" />
                    ) : (
                    <img 
                        src={user.nib_doc_path} 
                        alt="NIB" 
                        className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => { setPreviewUrl(user.nib_doc_path!); setPreviewIsPdf(false); setShowDocPreview(true); }}
                    />
                    )}
                    <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { setPreviewUrl(user.nib_doc_path!); setPreviewIsPdf(user.nib_doc_path!.toLowerCase().endsWith('.pdf')); setShowDocPreview(true); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Preview"
                    >
                        <Eye size={14} /> Preview
                    </button>
                    <a
                        href={user.nib_doc_path}
                        download
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Download"
                    >
                        <Download size={14} /> Download
                    </a>
                    </div>
                </div>
                )}
                {(user.account_type === 'COMPANY') && user.kemenkumham_doc_path && (
                <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-medium mb-2">SK Kemenkumham</div>
                    {user.kemenkumham_doc_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={user.kemenkumham_doc_path} className="w-full h-40 rounded-md" />
                    ) : (
                    <img 
                        src={user.kemenkumham_doc_path} 
                        alt="SK Kemenkumham" 
                        className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => { setPreviewUrl(user.kemenkumham_doc_path!); setPreviewIsPdf(false); setShowDocPreview(true); }}
                    />
                    )}
                    <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { setPreviewUrl(user.kemenkumham_doc_path!); setPreviewIsPdf(user.kemenkumham_doc_path!.toLowerCase().endsWith('.pdf')); setShowDocPreview(true); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Preview"
                    >
                        <Eye size={14} /> Preview
                    </button>
                    <a
                        href={user.kemenkumham_doc_path}
                        download
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        title="Download"
                    >
                        <Download size={14} /> Download
                    </a>
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>

      {showDocPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-[96vw] md:w-full max-w-6xl h-[90svh] overflow-hidden animate-scale-in flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-medium text-slate-800">Preview Dokumen</h3>
              <button onClick={() => setShowDocPreview(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {previewIsPdf ? (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded-md" />
              ) : (
                <img src={previewUrl} alt="Preview Dokumen" className="w-full max-h-[70vh] object-contain rounded-md" />
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all"
              >
                Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
