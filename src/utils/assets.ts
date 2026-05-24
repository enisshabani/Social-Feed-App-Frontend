export const resolveAssetUrl = (value?: string | null) => {
  if (!value) return '';
  if (!value.startsWith('/')) return value;

  const apiRoot = (import.meta.env?.VITE_API_URL || 'http://localhost:8000')
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');

  return `${apiRoot}${value}`;
};
