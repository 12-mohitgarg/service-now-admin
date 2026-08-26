import { useRef, useState } from 'react';
import { uploadImageToCloudinary } from '../lib/cloudinary';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      onChange(url);
    } catch {
      setError('Upload failed, try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {value ? (
        <img src={value} alt="" className="image-upload-preview" />
      ) : (
        <div className="image-upload-preview" />
      )}
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        {uploading && <p className="error-text" style={{ color: 'var(--color-text-dim)' }}>Uploading…</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
