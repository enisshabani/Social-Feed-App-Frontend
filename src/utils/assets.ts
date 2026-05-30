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

  if (!value.startsWith('/')) {
    try {
      const parsed = new URL(value);
      if (LOCAL_HOSTS.has(parsed.hostname)) {
        const publicRoot = getPublicBackendRoot();
        if (publicRoot) {
          return `${publicRoot}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }

        const isBrowser = typeof window !== 'undefined';
        const pageHost = isBrowser ? window.location.hostname : '';
        return LOCAL_HOSTS.has(pageHost) ? value : '';
      }
      return value;
    } catch {
      return value;
    }
  }

  const publicRoot = getPublicBackendRoot();
  if (!publicRoot) return value;

  return `${publicRoot}${value}`;
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
