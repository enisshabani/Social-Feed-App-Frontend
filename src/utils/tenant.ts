const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export const getCurrentTenantId = (): string => {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const hostname = window.location.hostname.toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) {
    return 'default';
  }

  const [subdomain] = hostname.split('.');
  if (!subdomain || subdomain === 'www' || LOCAL_HOSTS.has(subdomain)) {
    return 'default';
  }

  return subdomain.replace(/[^a-z0-9_-]/g, '') || 'default';
};
