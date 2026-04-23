import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { api } from '../utils/api';
import { COUNTRIES_WITH_DIAL_CODES } from '../constants';
import { getShadowColor } from '../utils/colorUtils';

type Props = {
  onLogin: (user: any, token: string) => void;
};

export const RegisterScreen: React.FC<Props> = () => {
  const navigate = useNavigate();
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  // Branding State (Copied from LoginScreen)
  const [branding, setBranding] = useState<{
      logo: string | null, 
      login_background: string | null,
      login_title: string,
      login_footer: string,
      login_button_color: string,
      login_form_bg_color: string,
      enable_registration: string,
      login_title_color: string,
      login_footer_color: string,
      login_form_bg_opacity: number,
      login_bg_opacity: number,
      login_glass_effect: string,
      login_form_text_color: string
  }>({
      logo: null,
      login_background: null,
      login_title: 'Agregator & Publishing Musik',
      login_footer: 'Protected CMS Area. Authorized personnel only.',
      login_button_color: 'linear-gradient(to right, #2563eb, #0891b2)',
      login_form_bg_color: '#ffffff',
      enable_registration: 'true',
      login_title_color: '#1e293b',
      login_footer_color: '#94a3b8',
      login_form_bg_opacity: 90,
      login_bg_opacity: 100,
      login_glass_effect: 'false',
      login_form_text_color: '#334155'
  });

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setCheckingRegistration(false);
    }, 3000);

    // Check if registration is enabled & fetch branding
    fetch('/api/settings/branding')
      .then(res => {
        return res.json();
      })
      .then(data => {
        clearTimeout(safetyTimeout);
        if (data) {
             setBranding(prev => ({ ...prev, ...data }));
        }
        if (data && data.enable_registration === 'false') {
          alert('Pendaftaran pengguna baru sedang dinonaktifkan.');
          navigate('/login');
        } else {
            setCheckingRegistration(false);
        }
      })
      .catch(err => {
        clearTimeout(safetyTimeout);
        setCheckingRegistration(false);
      });
      
    return () => clearTimeout(safetyTimeout);
  }, [navigate]);

  const [accountType, setAccountType] = useState<'PERSONAL' | 'COMPANY' | null>(null);
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState('');
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPhoneLocal, setRegPhoneLocal] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picPhoneLocal, setPicPhoneLocal] = useState('');

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [kemenkumhamFile, setKemenkumhamFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [docPaths, setDocPaths] = useState({
    ktpDocPath: '',
    npwpDocPath: '',
    nibDocPath: '',
    kemenkumhamDocPath: '',
    signatureDocPath: ''
  });

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const [docPreviews, setDocPreviews] = useState<{ ktp?: string; npwp?: string; nib?: string; kemenkumham?: string; signature?: string }>({});
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);

  const [cropField, setCropField] = useState<'ktp' | 'npwp' | 'nib' | 'kemenkumham' | 'signature' | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropAngle, setCropAngle] = useState(0);
  const [cropTranslate, setCropTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({ x: 128, y: 64, w: 256, h: 192 });
  const [cropDragMode, setCropDragMode] = useState<null | 'moveRect' | 'moveImage' | 'resize'>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number; rect?: { x: number; y: number; w: number; h: number }; translate?: { x: number; y: number } } | null>(null);
  const [cropResizeHandle, setCropResizeHandle] = useState<null | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'>(null);

  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regErrorModalOpen, setRegErrorModalOpen] = useState(false);
  const [dupNik, setDupNik] = useState(false);
  const [dupCompany, setDupCompany] = useState(false);
  const [dupEmail, setDupEmail] = useState(false);
  const [dupPhone, setDupPhone] = useState(false);
  const [isCheckingDup, setIsCheckingDup] = useState(false);

  const [countries] = useState(COUNTRIES_WITH_DIAL_CODES || []);
  const selectedCountryDialCode = (countries || []).find((c) => c?.name === country)?.dialCode || '';

  type WilayahItem = { code: string; name: string };
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [regencyCode, setRegencyCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [villageCode, setVillageCode] = useState('');
  const [wilayahError, setWilayahError] = useState('');
  const [isWilayahLoading, setIsWilayahLoading] = useState(false);
  const [isPostalLoading, setIsPostalLoading] = useState(false);

  console.log('RegisterScreen rendering... checkingRegistration:', checkingRegistration, 'step:', step);

  useEffect(() => {
    if (country !== 'Indonesia') {
      setProvinces([]);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setProvinceCode('');
      setRegencyCode('');
      setDistrictCode('');
      setVillageCode('');
      setWilayahError('');
      setIsWilayahLoading(false);
      return;
    }
    if (provinces.length > 0 || isWilayahLoading) return;
    const loadProvinces = async () => {
      try {
        setIsWilayahLoading(true);
        setWilayahError('');
        const res = await fetch('/api/wilayah/provinces');
        if (!res.ok) throw new Error('Failed to load provinces');
        const json = await res.json();
        const data = (json && json.data) || [];
        setProvinces(data);
      } catch (e: any) {
        setWilayahError('Gagal memuat data provinsi, silakan isi manual jika perlu.');
      } finally {
        setIsWilayahLoading(false);
      }
    };
    loadProvinces();
  }, [country, provinces.length, isWilayahLoading]);

  useEffect(() => {
    if (!nik || !/^\d{16}$/.test(nik)) {
      setDupNik(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setIsCheckingDup(true);
        const res = await api.checkRegisterDuplicatesGet({ nik });
        const dup = res?.duplicate || [];
        const found = Array.isArray(dup) && dup.includes('NIK');
        setDupNik(found);
        if (found) {
          setRegError('NIK sudah terdaftar. Gunakan NIK lain.');
          setRegErrorModalOpen(true);
        }
      } catch {
      } finally {
        if (!cancelled) setIsCheckingDup(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nik]);

  useEffect(() => {
    if (accountType !== 'COMPANY' || !companyName?.trim()) {
      setDupCompany(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setIsCheckingDup(true);
        const res = await api.checkRegisterDuplicatesGet({ companyName: companyName.trim() });
        const dup = res?.duplicate || [];
        const found = Array.isArray(dup) && dup.includes('COMPANY');
        setDupCompany(found);
        if (found) {
          setRegError('Nama Perusahaan sudah terdaftar. Gunakan nama lain.');
          setRegErrorModalOpen(true);
        }
      } catch {
      } finally {
        if (!cancelled) setIsCheckingDup(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [accountType, companyName]);

  useEffect(() => {
    const email = (regEmail || '').trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !valid) {
      setDupEmail(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setIsCheckingDup(true);
        const res = await api.checkRegisterDuplicatesGet({ email });
        const dup = res?.duplicate || [];
        const found = Array.isArray(dup) && dup.includes('EMAIL');
        setDupEmail(found);
        if (found) {
          setRegError('Email sudah terdaftar. Gunakan email lain.');
          setRegErrorModalOpen(true);
        }
      } catch {
      } finally {
        if (!cancelled) setIsCheckingDup(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [regEmail]);

  useEffect(() => {
    const local = regPhoneLocal.replace(/[^0-9]/g, '').replace(/^0+/, '').trim();
    const phone = local ? `${selectedCountryDialCode || ''}${local}` : '';
    if (!phone) {
      setDupPhone(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setIsCheckingDup(true);
        const res = await api.checkRegisterDuplicatesGet({ phone });
        const dup = res?.duplicate || [];
        const found = Array.isArray(dup) && dup.includes('PHONE');
        setDupPhone(found);
        if (found) {
          setRegError('No Handphone sudah terdaftar. Gunakan nomor lain.');
          setRegErrorModalOpen(true);
        }
      } catch {
      } finally {
        if (!cancelled) setIsCheckingDup(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [regPhoneLocal, selectedCountryDialCode]);

  useEffect(() => {
    if (!provinceCode) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setRegencyCode('');
      setDistrictCode('');
      setVillageCode('');
      return;
    }
    const loadRegencies = async () => {
      try {
        setIsWilayahLoading(true);
        setWilayahError('');
        const res = await fetch(`/api/wilayah/regencies/${provinceCode}`);
        if (!res.ok) throw new Error('Failed to load regencies');
        const json = await res.json();
        const data = (json && json.data) || [];
        setRegencies(data);
      } catch (e: any) {
        setWilayahError('Gagal memuat data kota/kabupaten, silakan isi manual jika perlu.');
      } finally {
        setIsWilayahLoading(false);
      }
    };
    loadRegencies();
  }, [provinceCode]);

  useEffect(() => {
    if (!regencyCode) {
      setDistricts([]);
      setVillages([]);
      setDistrictCode('');
      setVillageCode('');
      return;
    }
    const loadDistricts = async () => {
      try {
        setIsWilayahLoading(true);
        setWilayahError('');
        const res = await fetch(`/api/wilayah/districts/${regencyCode}`);
        if (!res.ok) throw new Error('Failed to load districts');
        const json = await res.json();
        const data = (json && json.data) || [];
        setDistricts(data);
      } catch (e: any) {
        setWilayahError('Gagal memuat data kecamatan, silakan isi manual jika perlu.');
      } finally {
        setIsWilayahLoading(false);
      }
    };
    loadDistricts();
  }, [regencyCode]);

  useEffect(() => {
    if (!districtCode) {
      setVillages([]);
      setVillageCode('');
      return;
    }
    const loadVillages = async () => {
      try {
        setIsWilayahLoading(true);
        setWilayahError('');
        const res = await fetch(`/api/wilayah/villages/${districtCode}`);
        if (!res.ok) throw new Error('Failed to load villages');
        const json = await res.json();
        const data = (json && json.data) || [];
        setVillages(data);
      } catch (e: any) {
        setWilayahError('Gagal memuat data kelurahan, silakan isi manual jika perlu.');
      } finally {
        setIsWilayahLoading(false);
      }
    };
    loadVillages();
  }, [districtCode]);

  // Early return is moved here to ensure all hooks are called first
  if (checkingRegistration) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Memeriksa status pendaftaran...</p>
            </div>
        </div>
    );
  }

  const handleSelectAccountType = (type: 'PERSONAL' | 'COMPANY') => {
    setAccountType(type);
    setStep(1);
    setRegError('');
  };

  const handleDocChange = async (field: 'ktp' | 'npwp' | 'nib' | 'kemenkumham' | 'signature', file: File | null) => {
    setDocError('');
    if (!file) return;
    if (field === 'ktp') setKtpFile(file);
    if (field === 'npwp') setNpwpFile(file);
    if (field === 'nib') setNibFile(file);
    if (field === 'kemenkumham') setKemenkumhamFile(file);
    if (field === 'signature') setSignatureFile(file);
    try {
      setIsUploadingDoc(true);
      const res = await api.uploadUserDoc(null, field, file);
      const path = res.path as string;
      setDocPaths((prev) => ({
        ...prev,
        ktpDocPath: field === 'ktp' ? path : prev.ktpDocPath,
        npwpDocPath: field === 'npwp' ? path : prev.npwpDocPath,
        nibDocPath: field === 'nib' ? path : prev.nibDocPath,
        kemenkumhamDocPath: field === 'kemenkumham' ? path : prev.kemenkumhamDocPath,
        signatureDocPath: field === 'signature' ? path : prev.signatureDocPath
      }));
    } catch (e: any) {
      setDocError(e.message || 'Gagal upload dokumen');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleFileSelect = (field: 'ktp' | 'npwp' | 'nib' | 'kemenkumham' | 'signature', file: File | null) => {
    setDocError('');
    if (!file) return;
    if (file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setCropField(field);
      setCropFile(file);
      setCropImageUrl(url);
      setCropScale(1);
      return;
    }
    handleDocChange(field, file);
  };

  const applyCrop = () => {
    if (!cropFile || !cropImageUrl || !cropField) return;
    const img = new Image();
    img.onload = () => {
      const CONTAINER_W = 720;
      const CONTAINER_H = 480;
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = CONTAINER_W;
      previewCanvas.height = CONTAINER_H;
      const pctx = previewCanvas.getContext('2d');
      if (!pctx) return;
      const baseScale = Math.min(CONTAINER_W / img.width, CONTAINER_H / img.height);
      const scale = baseScale * cropScale;
      pctx.clearRect(0, 0, CONTAINER_W, CONTAINER_H);
      pctx.save();
      pctx.translate(CONTAINER_W / 2 + cropTranslate.x, CONTAINER_H / 2 + cropTranslate.y);
      pctx.rotate((cropAngle * Math.PI) / 180);
      pctx.scale(scale, scale);
      pctx.drawImage(img, -img.width / 2, -img.height / 2);
      pctx.restore();
      const sx = Math.max(0, Math.min(CONTAINER_W, cropRect.x));
      const sy = Math.max(0, Math.min(CONTAINER_H, cropRect.y));
      const sw = Math.max(1, Math.min(CONTAINER_W - sx, cropRect.w));
      const sh = Math.max(1, Math.min(CONTAINER_H - sy, cropRect.h));
      const imageData = pctx.getImageData(sx, sy, sw, sh);
      const outCanvas = document.createElement('canvas');
      const maxOut = 2048;
      const scaleOut = Math.min(1, maxOut / Math.max(sw, sh));
      outCanvas.width = Math.round(sw * scaleOut);
      outCanvas.height = Math.round(sh * scaleOut);
      const octx = outCanvas.getContext('2d');
      if (!octx) return;
      const tmp = document.createElement('canvas');
      tmp.width = sw;
      tmp.height = sh;
      const tctx = tmp.getContext('2d');
      if (!tctx) return;
      tctx.putImageData(imageData, 0, 0);
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(tmp, 0, 0, outCanvas.width, outCanvas.height);
      const dataUrl = outCanvas.toDataURL('image/jpeg', 0.92);
      outCanvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], cropFile.name, { type: 'image/jpeg' });
        setDocPreviews((prev) => ({ ...prev, [cropField]: dataUrl }));
        handleDocChange(cropField, croppedFile);
        URL.revokeObjectURL(cropImageUrl);
        setCropField(null);
        setCropFile(null);
        setCropImageUrl(null);
        setCropTranslate({ x: 0, y: 0 });
        setCropAngle(0);
      }, 'image/jpeg', 0.92);
    };
    img.src = cropImageUrl;
  };

  const cancelCrop = () => {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    setCropField(null);
    setCropFile(null);
    setCropImageUrl(null);
  };

  const validateStep = (currentStep: number) => {
    if (!accountType) {
      setRegError('Silakan pilih tipe pendaftaran terlebih dahulu.');
      setRegErrorModalOpen(true);
      return false;
    }
    if (currentStep === 1) {
      if (!nik || !fullName || !address || !country || (accountType === 'COMPANY' && !companyName)) {
        setRegError(accountType === 'COMPANY' ? 'NIK, Nama Direktur, Nama Perusahaan, Alamat, dan Negara wajib diisi.' : 'NIK, Nama Lengkap, Alamat, dan Negara wajib diisi.');
        setRegErrorModalOpen(true);
        return false;
      }
      if (!/^\d{16}$/.test(nik)) {
        setRegError('NIK wajib 16 digit angka.');
        setRegErrorModalOpen(true);
        return false;
      }
      if (country === 'Indonesia') {
        if (!province || !city || !district || !subdistrict || !postalCode) {
          setRegError('Lengkapi Provinsi, Kota, Kecamatan, Kelurahan, dan Kodepos.');
          setRegErrorModalOpen(true);
          return false;
        }
      }
      return true;
    }
    if (currentStep === 2) {
      if (!regEmail || !regPassword || !regPasswordConfirm) {
        setRegError('Email dan password wajib diisi.');
        setRegErrorModalOpen(true);
        return false;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail);
      if (!emailOk) {
        setRegError('Format email tidak valid.');
        setRegErrorModalOpen(true);
        return false;
      }
      const pwd = regPassword || '';
      const strong = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
      if (!strong) {
        setRegError('Password kurang kuat. Gunakan ≥8 char, huruf besar, kecil, angka, simbol.');
        setRegErrorModalOpen(true);
        return false;
      }
      if (regPassword !== regPasswordConfirm) {
        setRegError('Password dan konfirmasi tidak sama.');
        setRegErrorModalOpen(true);
        return false;
      }
      if (accountType === 'COMPANY') {
        if (!picName || !picPosition) {
          setRegError('Data PIC (Nama & Posisi) wajib diisi untuk perusahaan.');
          setRegErrorModalOpen(true);
          return false;
        }
      }
      return true;
    }
    if (currentStep === 3) {
      if (!ktpFile || !docPaths.ktpDocPath || !npwpFile || !docPaths.npwpDocPath || !signatureFile || !docPaths.signatureDocPath) {
        setRegError('KTP, NPWP, dan Tanda Tangan wajib diupload.');
        setRegErrorModalOpen(true);
        return false;
      }
      if (accountType === 'COMPANY') {
        if (!nibFile || !docPaths.nibDocPath || !kemenkumhamFile || !docPaths.kemenkumhamDocPath) {
          setRegError('NIB dan dokumen Kemenkumham wajib diupload untuk perusahaan.');
          setRegErrorModalOpen(true);
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const goNextStep = async () => {
    setRegError('');
    if (!validateStep(step)) return;
    try {
      if (step === 1) {
        const payload: any = {};
        if (nik) payload.nik = String(nik).trim();
        if (accountType === 'COMPANY' && companyName) payload.companyName = String(companyName).trim();
        if (Object.keys(payload).length > 0) {
          try {
            const res = await api.checkRegisterDuplicates(payload);
            const dup = res?.duplicate || [];
            if (Array.isArray(dup) && dup.length > 0) {
              const mapLabel: Record<string, string> = { NIK: 'NIK', COMPANY: 'Nama Perusahaan' };
              const labels = dup.map((d: string) => mapLabel[d] || d).join(', ');
              setRegError(`Data sudah terdaftar: ${labels}. Gunakan data lain.`);
              setRegErrorModalOpen(true);
              return;
            }
          } catch (e: any) {
            if (e?.status === 404) {
              try {
                const res2 = await api.checkRegisterDuplicatesGet(payload);
                const dup2 = res2?.duplicate || [];
                if (Array.isArray(dup2) && dup2.length > 0) {
                  const mapLabel: Record<string, string> = { NIK: 'NIK', COMPANY: 'Nama Perusahaan' };
                  const labels = dup2.map((d: string) => mapLabel[d] || d).join(', ');
                  setRegError(`Data sudah terdaftar: ${labels}. Gunakan data lain.`);
                  setRegErrorModalOpen(true);
                  return;
                }
              } catch {}
            }
          }
        }
      }
      if (step === 2) {
        const phoneLocalClean = regPhoneLocal.replace(/^0+/, '').trim();
        const phone = selectedCountryDialCode ? `${selectedCountryDialCode}${phoneLocalClean}` : phoneLocalClean;
        const payload: any = {};
        if (regEmail) payload.email = regEmail.trim().toLowerCase();
        if (phone) payload.phone = phone;
        if (Object.keys(payload).length > 0) {
          try {
            const res = await api.checkRegisterDuplicates(payload);
            const dup = res?.duplicate || [];
            if (Array.isArray(dup) && dup.length > 0) {
              const mapLabel: Record<string, string> = { EMAIL: 'Email', PHONE: 'No Handphone' };
              const labels = dup.map((d: string) => mapLabel[d] || d).join(', ');
              setRegError(`Data sudah terdaftar: ${labels}. Gunakan data lain.`);
              setRegErrorModalOpen(true);
              return;
            }
          } catch (e: any) {
            if (e?.status === 404) {
              try {
                const res2 = await api.checkRegisterDuplicatesGet(payload);
                const dup2 = res2?.duplicate || [];
                if (Array.isArray(dup2) && dup2.length > 0) {
                  const mapLabel: Record<string, string> = { EMAIL: 'Email', PHONE: 'No Handphone' };
                  const labels = dup2.map((d: string) => mapLabel[d] || d).join(', ');
                  setRegError(`Data sudah terdaftar: ${labels}. Gunakan data lain.`);
                  setRegErrorModalOpen(true);
                  return;
                }
              } catch {}
            }
          }
        }
      }
      if (step < 4) setStep(step + 1);
    } catch {
      if (step < 4) setStep(step + 1);
    }
  };

  const goPrevStep = () => {
    setRegError('');
    if (step > 1) setStep(step - 1);
  };

  const handleRegisterSubmit = async () => {
    if (!validateStep(3)) return;
    try {
      setIsRegistering(true);
      setRegError('');
      const phoneLocalClean = regPhoneLocal.replace(/^0+/, '').trim();
      const picPhoneLocalClean = picPhoneLocal.replace(/^0+/, '').trim();
      const phone = selectedCountryDialCode ? `${selectedCountryDialCode}${phoneLocalClean}` : phoneLocalClean;
      const picPhone = selectedCountryDialCode ? `${selectedCountryDialCode}${picPhoneLocalClean}` : picPhoneLocalClean;
      const payload = {
        username: regEmail,
        email: regEmail,
        password: regPassword,
        accountType,
        companyName,
        nik,
        fullName,
        address,
        country,
        province,
        city,
        district,
        subdistrict,
        postalCode,
        phone,
        picName,
        picPosition,
        picPhone,
        ktpDocPath: docPaths.ktpDocPath,
        npwpDocPath: docPaths.npwpDocPath,
        nibDocPath: docPaths.nibDocPath,
        kemenkumhamDocPath: docPaths.kemenkumhamDocPath,
        signatureDocPath: docPaths.signatureDocPath
      };
      await api.register(payload);
              navigate('/user-status', { state: { username: regEmail, status: 'Pending' } });
            } catch (e: any) {
      const dup = e?.payload?.duplicate;
      if (Array.isArray(dup) && dup.length > 0) {
        const mapLabel: Record<string, string> = { EMAIL: 'Email', PHONE: 'Nomor WhatsApp', COMPANY: 'Nama Perusahaan' };
        const labels = dup.map((d: string) => mapLabel[d] || d).join(', ');
        setRegError(`Data duplikat: ${labels}. Gunakan data yang berbeda.`);
        setRegErrorModalOpen(true);
      } else {
        setRegError(e.message || 'Pendaftaran gagal');
        setRegErrorModalOpen(true);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const renderDocUploadItem = (label: string, field: 'ktp' | 'npwp' | 'nib' | 'kemenkumham' | 'signature', file: File | null, required: boolean) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {file && (
          <span className="text-[10px] text-green-600 flex items-center gap-1">
            <CheckCircle2 size={10} />
            Terupload
          </span>
        )}
      </div>
      <div className="space-y-3">
        <label className="flex-1 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-[10px] text-slate-600 cursor-pointer hover:border-blue-400 hover:bg-blue-50">
          <input
            type="file"
            accept={field === 'kemenkumham' ? 'application/pdf' : 'image/*,application/pdf'}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f) handleFileSelect(field, f);
            }}
          />
          {file ? file.name : 'Pilih file'}
        </label>
        {docPreviews[field] && (
          <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={docPreviews[field]}
              alt={label}
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => setPreviewModal({ url: docPreviews[field]!, title: label })}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSelectAccountType('PERSONAL')}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium
            ${accountType === 'PERSONAL' ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : ''}`}
        >
          Personal
        </button>
        <button
          type="button"
          onClick={() => handleSelectAccountType('COMPANY')}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium
            ${accountType === 'COMPANY' ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : ''}`}
        >
          <Building2 size={14} />
          Perusahaan
        </button>
      </div>
      {accountType === 'COMPANY' && (
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Nama Perusahaan</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Masukkan nama perusahaan"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>NIK</label>
          <input
            type="text"
            value={nik}
            onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
            maxLength={16}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Masukkan NIK"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>{accountType === 'COMPANY' ? 'Nama Direktur' : 'Nama Lengkap'}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder={accountType === 'COMPANY' ? 'Masukkan nama direktur' : 'Masukkan nama lengkap'}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Alamat Lengkap</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px] min-h-[70px]"
          placeholder="Masukkan alamat lengkap"
        />
      </div>
      {country === 'Indonesia' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Negara</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            >
              <option value="">Pilih negara</option>
              {(countries || []).map((c) => (
                <option key={c?.name || Math.random()} value={c?.name}>{c?.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Provinsi</label>
            {provinces.length > 0 ? (
              <select
                value={provinceCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setProvinceCode(code);
                  const selected = provinces.find((p) => p.code === code);
                  setProvince(selected?.name || '');
                  setCity('');
                  setDistrict('');
                  setSubdistrict('');
                  setPostalCode('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
              >
                <option value="">Pilih provinsi</option>
                {provinces.map((p) => (<option key={p.code} value={p.code}>{p.name}</option>))}
              </select>
            ) : (
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                placeholder="Provinsi"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Negara</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
          >
            <option value="">Pilih negara</option>
            {countries.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {country === 'Indonesia' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Kota / Kabupaten</label>
              {regencies.length > 0 ? (
                <select
                  value={regencyCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setRegencyCode(code);
                    const selected = regencies.find((r) => r.code === code);
                    setCity(selected?.name || '');
                    setDistrict('');
                    setSubdistrict('');
                    setPostalCode('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                >
                  <option value="">Pilih kota / kabupaten</option>
                  {regencies.map((r) => (<option key={r.code} value={r.code}>{r.name}</option>))}
                </select>
              ) : (
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                  placeholder="Kota / Kabupaten"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-[2fr_2fr_1fr] gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Kecamatan</label>
              {districts.length > 0 ? (
                <select
                  value={districtCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setDistrictCode(code);
                    const selected = districts.find((d) => d.code === code);
                    setDistrict(selected?.name || '');
                    setSubdistrict('');
                    setPostalCode('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                >
                  <option value="">Pilih kecamatan</option>
                  {districts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
                </select>
              ) : (
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                  placeholder="Kecamatan"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Kelurahan</label>
              {villages.length > 0 ? (
                <select
                  value={villageCode}
                  onChange={async (e) => {
                    const code = e.target.value;
                    setVillageCode(code);
                    const selected = villages.find((v) => v.code === code);
                    const name = selected?.name || '';
                    setSubdistrict(name);
                    if (!name || !district || !city || !province) {
                      setPostalCode('');
                      return;
                    }
                    try {
                      setIsPostalLoading(true);
                      const params = new URLSearchParams({ province, city, district, village: name });
                      const res = await fetch(`/api/wilayah/postal-code?${params.toString()}`);
                      if (!res.ok) {
                        setPostalCode('');
                        return;
                      }
                      const data = await res.json();
                      if (data && data.code) setPostalCode(String(data.code));
                      else setPostalCode('');
                    } catch {
                      setPostalCode('');
                    } finally {
                      setIsPostalLoading(false);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                >
                  <option value="">Pilih kelurahan</option>
                  {villages.map((v) => (<option key={v.code} value={v.code}>{v.name}</option>))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                  placeholder="Kelurahan"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Kodepos</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-[10px] max-w-[160px]"
                placeholder={isPostalLoading ? 'Mencari kodepos...' : 'Kodepos'}
              />
            </div>
          </div>
        </div>
      ) : country ? (
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Kota</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Masukkan kota"
          />
        </div>
      ) : null}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Email</label>
          <input
            type="email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Masukkan email"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>No Handphone</label>
           <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-700 min-w-[80px] text-center">
              {selectedCountryDialCode || '+..'}
            </div>
            <input
              type="tel"
              value={regPhoneLocal}
              onChange={(e) => setRegPhoneLocal(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
              placeholder="Nomor tanpa angka 0 di depan"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Password</label>
          <input
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Password"
          />
          <div className="mt-1">
            {(() => {
              const pwd = regPassword || '';
              const len = pwd.length >= 8;
              const upper = /[A-Z]/.test(pwd);
              const lower = /[a-z]/.test(pwd);
              const digit = /[0-9]/.test(pwd);
              const special = /[^A-Za-z0-9]/.test(pwd);
              const score = [len, upper, lower, digit, special].filter(Boolean).length;
              const levels = ['Lemah', 'Sedang', 'Kuat'];
              const level = score <= 2 ? 0 : score <= 4 ? 1 : 2;
              const colors = ['bg-red-500', 'bg-amber-500', 'bg-green-600'];
              return (
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-200 rounded">
                    <div className={`h-2 rounded ${colors[level]}`} style={{ width: `${(score / 5) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-600">Power security: {levels[level]} (≥8 char, huruf besar, kecil, angka, simbol)</p>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Retype Password</label>
          <input
            type="password"
            value={regPasswordConfirm}
            onChange={(e) => setRegPasswordConfirm(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
            placeholder="Konfirmasi password"
          />
        </div>
      </div>
      {accountType === 'COMPANY' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Nama PIC</label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                placeholder="Nama PIC"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>Posisi PIC</label>
              <input
                type="text"
                value={picPosition}
                onChange={(e) => setPicPosition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                placeholder="Posisi PIC"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold" style={{ color: branding.login_title_color }}>No Handphone PIC</label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-700 min-w-[80px] text-center">
                {selectedCountryDialCode || '+..'}
              </div>
              <input
                type="tel"
                value={picPhoneLocal}
                onChange={(e) => setPicPhoneLocal(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[10px]"
                placeholder="Nomor tanpa angka 0 di depan"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accountType === 'COMPANY' && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
            {renderDocUploadItem('Upload NIB', 'nib', nibFile, true)}
          </div>
        )}
        {accountType === 'COMPANY' && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
            {renderDocUploadItem('Upload Dokumen Kemenkumham', 'kemenkumham', kemenkumhamFile, true)}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          {renderDocUploadItem(accountType === 'COMPANY' ? 'Upload KTP Direktur' : 'Upload KTP', 'ktp', ktpFile, true)}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          {renderDocUploadItem(accountType === 'COMPANY' ? 'Upload NPWP Perusahaan' : 'Upload NPWP', 'npwp', npwpFile, true)}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          {renderDocUploadItem(accountType === 'COMPANY' ? 'Upload Tanda Tangan Direktur' : 'Upload Tanda Tangan', 'signature', signatureFile, true)}
        </div>
      </div>
      {docError && <p className="text-[10px] text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100">{docError}</p>}
      {isUploadingDoc && <p className="text-[10px] text-blue-500 font-medium animate-pulse">Sedang mengupload dokumen...</p>}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 text-[10px] text-slate-700">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-800">Data Akun</p>
        {accountType === 'COMPANY' && <p>Nama Perusahaan: {companyName}</p>}
        <p>NIK: {nik}</p>
        <p>{accountType === 'COMPANY' ? 'Nama Direktur' : 'Nama Lengkap'}: {fullName}</p>
        <p>Negara: {country}</p>
        {country === 'Indonesia' && (
          <>
            <p>Provinsi/Kota: {province} / {city}</p>
            <p>Kecamatan/Kelurahan: {district} / {subdistrict}</p>
            <p>Kodepos: {postalCode}</p>
          </>
        )}
        {country !== 'Indonesia' && city && <p>Kota: {city}</p>}
        <p>Alamat: {address}</p>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-800">Kontak & PIC</p>
        <p>Email: {regEmail}</p>
        <p>No Handphone: {regPhoneLocal && selectedCountryDialCode ? `${selectedCountryDialCode}${regPhoneLocal}` : regPhoneLocal}</p>
        {accountType === 'COMPANY' && (
          <>
            <p>Nama PIC: {picName}</p>
            <p>Posisi PIC: {picPosition}</p>
            <p>No HP PIC: {picPhoneLocal && selectedCountryDialCode ? `${selectedCountryDialCode}${picPhoneLocal}` : picPhoneLocal}</p>
          </>
        )}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-800">Dokumen</p>
        {accountType === 'COMPANY' && (
          <>
            <div className="flex items-center gap-2">
              <p className="flex-1">NIB:</p>
              {docPreviews.nib && <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-100"><img src={docPreviews.nib} alt="NIB" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setPreviewModal({ url: docPreviews.nib!, title: 'NIB' })} /></div>}
              {!docPreviews.nib && <span>{nibFile ? 'Sudah diupload' : 'Belum diupload'}</span>}
            </div>
            <div className="flex items-center gap-2">
              <p className="flex-1">Dokumen Kemenkumham:</p>
              {docPreviews.kemenkumham && <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-100"><img src={docPreviews.kemenkumham} alt="Dokumen Kemenkumham" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setPreviewModal({ url: docPreviews.kemenkumham!, title: 'Dokumen Kemenkumham' })} /></div>}
              {!docPreviews.kemenkumham && <span>{kemenkumhamFile ? 'Sudah diupload' : 'Belum diupload'}</span>}
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <p className="flex-1">{accountType === 'COMPANY' ? 'KTP Direktur:' : 'KTP:'}</p>
          {docPreviews.ktp && <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-100"><img src={docPreviews.ktp} alt="KTP" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setPreviewModal({ url: docPreviews.ktp!, title: 'KTP' })} /></div>}
          {!docPreviews.ktp && <span>{ktpFile ? 'Sudah diupload' : 'Belum diupload'}</span>}
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1">{accountType === 'COMPANY' ? 'NPWP Perusahaan:' : 'NPWP:'}</p>
          {docPreviews.npwp && <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-100"><img src={docPreviews.npwp} alt="NPWP" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setPreviewModal({ url: docPreviews.npwp!, title: 'NPWP' })} /></div>}
          {!docPreviews.npwp && <span>{npwpFile ? 'Sudah diupload' : 'Belum diupload'}</span>}
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1">{accountType === 'COMPANY' ? 'Tanda Tangan Direktur:' : 'Tanda Tangan:'}</p>
          {docPreviews.signature && <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-100"><img src={docPreviews.signature} alt="Tanda Tangan" className="w-full h-full object-contain cursor-zoom-in" onClick={() => setPreviewModal({ url: docPreviews.signature!, title: 'Tanda Tangan' })} /></div>}
          {!docPreviews.signature && <span>{signatureFile ? 'Sudah diupload' : 'Belum diupload'}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Layer with Opacity */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500 bg-gradient-to-br from-blue-50 via-white to-blue-100"
        style={{ 
            backgroundImage: branding.login_background ? `url(${branding.login_background})` : undefined,
            opacity: (branding.login_bg_opacity ?? 100) / 100
        }}
      />

      <div 
        className={`w-full max-w-3xl rounded-3xl p-6 md:p-8 animate-fade-in-up relative z-10 
            ${branding.login_glass_effect !== 'true' ? 'backdrop-blur-sm shadow-2xl shadow-blue-900/10 border border-white/50' : ''}`}
        style={branding.login_glass_effect === 'true' ? {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `0 8px 32px 0 ${getShadowColor(branding.login_button_color)}`
        } : undefined}
      >
        {/* Form Background Layer with Opacity - Only when NOT glass effect */}
        {branding.login_glass_effect !== 'true' && (
            <div 
                className="absolute inset-0 rounded-3xl -z-10 transition-opacity duration-300 bg-white"
                style={{ 
                    background: branding.login_form_bg_color || '#ffffff',
                    opacity: (branding.login_form_bg_opacity ?? 90) / 100
                }}
            />
        )}

        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700"
            style={{ color: branding.login_form_text_color }}
          >
            <ChevronLeft size={12} />
            Kembali ke Login
          </button>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold" style={{ color: branding.login_form_text_color, opacity: 0.7 }}>Pendaftaran Akun</p>
            <p className="text-[10px] font-bold text-slate-800" style={{ color: branding.login_form_text_color }}>{accountType === 'COMPANY' ? 'Perusahaan' : accountType === 'PERSONAL' ? 'Personal' : 'Pilih Tipe Akun'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {step > s ? <CheckCircle2 size={10} /> : s}
              </div>
              {s < 4 && <div className={`flex-1 h-[2px] mx-1 ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        {regError && (
          <div className="mb-4 bg-red-50 text-red-600 text-[10px] p-3 rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle size={14} />
            {regError}
          </div>
        )}
        <div className="mb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrevStep}
            disabled={step === 1}
            className={`flex-1 py-2 rounded-xl border text-[10px] font-semibold ${step === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}
          >
            Sebelumnya
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNextStep}
              disabled={(step === 1 && (dupNik || dupCompany || isCheckingDup)) || (step === 2 && (dupEmail || dupPhone || isCheckingDup))}
              className={`flex-1 py-2 rounded-xl text-[10px] font-semibold shadow-md shadow-blue-500/25 active:scale-95 ${
                (step === 1 && (dupNik || dupCompany || isCheckingDup)) || (step === 2 && (dupEmail || dupPhone || isCheckingDup))
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:brightness-110'
              }`}
            >
              Lanjut
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegisterSubmit}
              disabled={isRegistering}
              className={`flex-1 py-2 rounded-xl text-[10px] font-semibold shadow-md shadow-blue-500/25 active:scale-95 ${
                isRegistering ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:brightness-110'
              }`}
            >
              {isRegistering ? 'Memproses...' : 'Submit Pendaftaran'}
            </button>
          )}
        </div>
      </div>

      {regErrorModalOpen && regError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-500" />
              <div>
                <p className="text-[10px] font-semibold text-slate-800">Data Tidak Lengkap / Tidak Valid</p>
                <p className="text-[10px] text-slate-600 mt-1">{regError}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setRegErrorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {cropImageUrl && cropField && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 space-y-6">
            <p className="text-[10px] font-semibold text-slate-800">Crop {cropField.toUpperCase()}</p>
            <div className="w-full flex items-center justify-center">
              <div
                className="relative bg-slate-100 rounded-xl overflow-hidden"
                style={{ width: 720, height: 480 }}
                onMouseDown={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const inRect = x >= cropRect.x && x <= cropRect.x + cropRect.w && y >= cropRect.y && y <= cropRect.y + cropRect.h;
                  if (inRect) {
                    setCropDragMode('moveRect');
                    setCropDragStart({ x, y, rect: { ...cropRect } });
                  } else {
                    setCropDragMode('moveImage');
                    setCropDragStart({ x, y, translate: { ...cropTranslate } });
                  }
                }}
                onMouseMove={(e) => {
                  if (!cropDragMode || !cropDragStart) return;
                  const rectEl = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const x = e.clientX - rectEl.left;
                  const y = e.clientY - rectEl.top;
                  const minW = 48;
                  const minH = 48;
                  if (cropDragMode === 'moveRect' && cropDragStart.rect) {
                    const dx = x - cropDragStart.x;
                    const dy = y - cropDragStart.y;
                    setCropRect((prev) => ({ ...prev, x: Math.max(0, Math.min(720 - prev.w, cropDragStart.rect!.x + dx)), y: Math.max(0, Math.min(480 - prev.h, cropDragStart.rect!.y + dy)) }));
                  } else if (cropDragMode === 'moveImage' && cropDragStart.translate) {
                    const dx = x - cropDragStart.x;
                    const dy = y - cropDragStart.y;
                    setCropTranslate({ x: cropDragStart.translate.x + dx, y: cropDragStart.translate.y + dy });
                  } else if (cropDragMode === 'resize' && cropDragStart.rect && cropResizeHandle) {
                    const dx = x - cropDragStart.x;
                    const dy = y - cropDragStart.y;
                    const r = cropDragStart.rect;
                    let nx = r.x;
                    let ny = r.y;
                    let nw = r.w;
                    let nh = r.h;
                    const clampWRight = (val: number) => Math.max(minW, Math.min(720 - r.x, val));
                    const clampHBottom = (val: number) => Math.max(minH, Math.min(480 - r.y, val));
                    const clampXLeft = (val: number) => Math.max(0, Math.min(r.x + r.w - minW, val));
                    const clampYTop = (val: number) => Math.max(0, Math.min(r.y + r.h - minH, val));
                    if (cropResizeHandle === 'r') {
                      nw = clampWRight(r.w + dx);
                    } else if (cropResizeHandle === 'l') {
                      nx = clampXLeft(r.x + dx);
                      nw = r.w - (nx - r.x);
                    } else if (cropResizeHandle === 'b') {
                      nh = clampHBottom(r.h + dy);
                    } else if (cropResizeHandle === 't') {
                      ny = clampYTop(r.y + dy);
                      nh = r.h - (ny - r.y);
                    } else if (cropResizeHandle === 'tr') {
                      nw = clampWRight(r.w + dx);
                      ny = clampYTop(r.y + dy);
                      nh = r.h - (ny - r.y);
                    } else if (cropResizeHandle === 'tl') {
                      nx = clampXLeft(r.x + dx);
                      nw = r.w - (nx - r.x);
                      ny = clampYTop(r.y + dy);
                      nh = r.h - (ny - r.y);
                    } else if (cropResizeHandle === 'br') {
                      nw = clampWRight(r.w + dx);
                      nh = clampHBottom(r.h + dy);
                    } else if (cropResizeHandle === 'bl') {
                      nx = clampXLeft(r.x + dx);
                      nw = r.w - (nx - r.x);
                      nh = clampHBottom(r.h + dy);
                    }
                    setCropRect({ x: nx, y: ny, w: nw, h: nh });
                  }
                }}
                onMouseUp={() => {
                  setCropDragMode(null);
                  setCropDragStart(null);
                  setCropResizeHandle(null);
                }}
                onMouseLeave={() => {
                  setCropDragMode(null);
                  setCropDragStart(null);
                  setCropResizeHandle(null);
                }}
              >
                <img
                  src={cropImageUrl || ''}
                  alt="Crop"
                  className="absolute left-1/2 top-1/2 select-none"
                  style={{ transform: `translate(-50%, -50%) translate(${cropTranslate.x}px, ${cropTranslate.y}px) scale(${cropScale}) rotate(${cropAngle}deg)`, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  draggable={false}
                />
                <div
                  className="absolute border-2 border-white/80 shadow-inner"
                  style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h, boxShadow: '0 0 0 9999px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.3)', borderRadius: 6 }}
                >
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('tl'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, left: -5, top: -5, cursor: 'nwse-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('tr'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, right: -5, top: -5, cursor: 'nesw-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('bl'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, left: -5, bottom: -5, cursor: 'nesw-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('br'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, right: -5, bottom: -5, cursor: 'nwse-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('t'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, left: '50%', top: -5, transform: 'translateX(-50%)', cursor: 'ns-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('b'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, left: '50%', bottom: -5, transform: 'translateX(-50%)', cursor: 'ns-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('l'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, left: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', borderRadius: 2 }} />
                  <div onMouseDown={(e) => { e.stopPropagation(); const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect(); setCropDragMode('resize'); setCropResizeHandle('r'); setCropDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, rect: { ...cropRect } }); }} className="absolute bg-white border border-slate-400" style={{ width: 10, height: 10, right: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', borderRadius: 2 }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-600">Zoom</p>
                <input type="range" min={0.2} max={4} step={0.01} value={cropScale} onChange={(e) => setCropScale(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-600">Rotasi</p>
                <input type="range" min={-15} max={15} step={0.1} value={cropAngle} onChange={(e) => setCropAngle(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-600">Lebar/Tinggi Crop</p>
                <div className="flex items-center gap-2">
                  <input type="range" min={64} max={720} step={1} value={cropRect.w} onChange={(e) => setCropRect((prev) => ({ ...prev, w: Math.min(720 - prev.x, parseInt(e.target.value)) }))} className="flex-1" />
                  <input type="range" min={64} max={480} step={1} value={cropRect.h} onChange={(e) => setCropRect((prev) => ({ ...prev, h: Math.min(480 - prev.y, parseInt(e.target.value)) }))} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={cancelCrop} className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] text-slate-700">Batal</button>
              <button type="button" onClick={applyCrop} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700">Simpan Crop</button>
            </div>
          </div>
        </div>
      )}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-slate-800">{previewModal.title}</p>
              <button type="button" onClick={() => setPreviewModal(null)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] text-slate-700">Tutup</button>
            </div>
            <div className="w-full max-h-[70vh] overflow-auto">
              <img src={previewModal.url} alt={previewModal.title} className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
