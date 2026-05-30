const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const imageFileToDataUrl = async (file: File, maxSize = 1600): Promise<string> => {
  const rawDataUrl = await readFileAsDataUrl(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read image.'));
    img.src = rawDataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return rawDataUrl;

  context.drawImage(image, 0, 0, width, height);
  const outputType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
  return canvas.toDataURL(outputType, outputType === 'image/jpeg' ? 0.86 : undefined);
};
