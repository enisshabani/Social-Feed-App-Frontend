const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const stripApiPath = (url: string) =>
  url.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');

const getPublicBackendRoot = () => {
  const explicitPublicUrl = import.meta.env?.VITE_PUBLIC_BACKEND_URL;
  if (explicitPublicUrl) return stripApiPath(explicitPublicUrl);

  const apiUrl = import.meta.env?.VITE_API_URL;
  if (!apiUrl) return '';

  try {
    const parsed = new URL(apiUrl);
    const isBrowser = typeof window !== 'undefined';
    const pageHost = isBrowser ? window.location.hostname : '';
    if (!LOCAL_HOSTS.has(pageHost) && LOCAL_HOSTS.has(parsed.hostname)) {
      return '';
    }
  } catch {
    return stripApiPath(apiUrl);
  }

  return stripApiPath(apiUrl);
};

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) return '';
  if (value.startsWith('data:')) return value;

  // Case 1: Relative URLs like /uploads/...
  if (value.startsWith('/')) {
    const publicRoot = getPublicBackendRoot();
    if (publicRoot) {
      return `${publicRoot}${value}`;
    }
    // Fallback to local server proxy
    return value;
  }

  try {
    const parsed = new URL(value);
    
    // Case 2: Old localhost or 127.0.0.1 absolute URLs
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      const isBrowser = typeof window !== 'undefined';
      const pageHost = isBrowser ? window.location.hostname : '';
      
      // If deployed on a real domain, localhost URLs are broken to other users
      if (isBrowser && !LOCAL_HOSTS.has(pageHost)) {
        return ''; // Mark as broken
      }

      // If we are developing locally, resolve them correctly
      const publicRoot = getPublicBackendRoot();
      if (publicRoot) {
        return `${publicRoot}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return value;
    }

    // Case 3: Public HTTPS URLs (Cloudinary, S3, Firebase, etc.)
    return value;
  } catch {
    // If not a valid URL, just return it as fallback
    return value;
  }
};

export const isLikelyBrokenLocalAssetUrl = (value?: string | null) => {
  if (!value) return false;
  if (value.startsWith('/uploads/')) return !getPublicBackendRoot();
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
};
