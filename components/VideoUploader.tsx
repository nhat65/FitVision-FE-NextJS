// components/VideoUploader.tsx
'use client';

import { useState, useRef } from 'react';
import { uploadVideoToCloudinary, UploadResult } from '@/lib/uploadVideo';

const ALLOWED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/mpeg',
  'video/3gpp',
  'video/x-flv',
];

const MAX_SIZE = 500 * 1024 * 1024; // 500MB, khớp với giới hạn ở Cloudinary preset

export default function VideoUploader() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    // validate phía client trước khi upload (UX tốt hơn, đỡ tốn băng thông)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Định dạng video không hợp lệ');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Video vượt quá dung lượng cho phép (500MB)');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const uploadResult = await uploadVideoToCloudinary(file, (percent) => {
        setProgress(percent);
      });

      setResult(uploadResult);

      // gửi metadata về backend để lưu DB
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          duration: uploadResult.duration,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && (
        <div>
          <div style={{ background: '#eee', width: '100%', height: 8, borderRadius: 4 }}>
            <div
              style={{
                background: '#4f46e5',
                width: `${progress}%`,
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.2s',
              }}
            />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div>
          <p>Upload thành công!</p>
          <video src={result.url} controls width={320} />
        </div>
      )}
    </div>
  );
}