import { getAccessToken } from "./auth-store";

// lib/uploadVideo.ts
export interface UploadProgressCallback {
  (percent: number): void;
}

export interface UploadResult {
  url: string;
  publicId: string;
  duration: number;
  format: string;
  bytes: number;
}

async function getSignature(folder = 'videos') {
    const token = getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cloudinary/video-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ folder }),
  });

  if (!res.ok) {
    throw new Error('Không lấy được signature upload');
  }

  return res.json();
}

export function uploadVideoToCloudinary(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const { signature, timestamp, apiKey, cloudName, folder, uploadPreset } =
        await getSignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('upload_preset', uploadPreset);

     console.log('Timestamp FE nhận:', timestamp);
console.log('Toàn bộ FormData:', [...formData.entries()]);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            duration: result.duration,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error(`Upload thất bại: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Lỗi kết nối khi upload video'));

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}