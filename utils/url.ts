export const assetUrl = (p?: string | null): string => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const normalized = p.startsWith('/') ? p : `/${p}`;
  // Serve uploads from site origin rather than API base
  if (/^\/uploads\//.test(normalized)) {
    try {
      const origin = (globalThis as any)?.location?.origin || '';
      if (origin) return `${origin}${normalized}`;
    } catch {}
  }
  const base = (import.meta.env.VITE_API_URL || (globalThis as any)?.location?.origin || '/api').replace(/\/api$/, '');
  return `${base}${normalized}`;
};

export const publicAssetUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, '');
  // Prefer runtime base from document for subpath deployments
  try {
    const baseUri = (globalThis as any)?.document?.baseURI;
    if (baseUri) {
      return new URL(normalized, baseUri).toString();
    }
  } catch {}
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${base}/${normalized}`;
};
