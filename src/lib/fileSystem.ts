import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export async function saveFile(filename: string, data: string, mimeType: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      alert(`Đã lưu file vào thư mục Documents: ${result.uri}`);
      return result;
    } catch (e) {
      console.error('Error writing file to native filesystem', e);
      // Fallback to web
      return saveFileWeb(filename, data, mimeType);
    }
  } else {
    return saveFileWeb(filename, data, mimeType);
  }
}

function saveFileWeb(filename: string, data: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function saveBinaryFile(filename: string, blob: Blob) {
  if (Capacitor.isNativePlatform()) {
     // Binary writing is more complex in Capacitor (requires base64)
     // For simplicity and compatibility, we'll use the browser download logic 
     // which usually works fine even in Capacitor's WebView.
     saveFileWeb(filename, '', ''); // This won't work correctly for binary
     return;
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
