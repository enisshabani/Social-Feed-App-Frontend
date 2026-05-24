export const resolveAssetUrl = (value?: string | null) => {
  if (!value) return '';
  if (!value.startsWith('/')) return value;

  if (!import.meta.env?.VITE_API_URL) {
    return value;
  }

  const apiRoot = import.meta.env.VITE_API_URL
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');

  return `${apiRoot}${value}`;
};
