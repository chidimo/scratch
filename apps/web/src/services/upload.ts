import { useCallback, useState } from 'react';

type UploadResult = {
  url: string;
  mime: string;
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async ({ file }: { file: File }): Promise<UploadResult> => {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(reader.error ?? new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      return {
        url: dataUrl,
        mime: file.type,
      };
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading };
};
