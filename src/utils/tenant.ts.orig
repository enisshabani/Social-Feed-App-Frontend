const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getTenantFromToken = () => {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.tenant_id === 'string' && payload.tenant_id.trim()
      ? payload.tenant_id.trim()
      : null;
  } catch {
    return null;
  }
};

export const getCurrentTenantId = (): string => {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const tokenTenant = getTenantFromToken();
  if (tokenTenant) {
    return tokenTenant;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) {
    return 'default';
  }

  if (hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) {
    return 'default';
  }

  const [subdomain] = hostname.split('.');
  if (!subdomain || subdomain === 'www' || LOCAL_HOSTS.has(subdomain)) {
    return 'default';
  }

  return subdomain.replace(/[^a-z0-9_-]/g, '') || 'default';
};
