import api from '../axios';
import { unwrapRaw } from './http';

export interface StorageImage {
    key: string;
    url: string;
    size: number;
    lastModified: string | null;
}

/** Lists images already uploaded to MinIO under `folder` (default "uploads"), most recent first. */
export async function listImages(folder?: string): Promise<StorageImage[]> {
    const response = await api.get('/api/admin/storage/images', { params: { folder } });
    return unwrapRaw<StorageImage[]>(response);
}

/** Uploads a file to MinIO under `folder` and returns its public URL. */
export async function uploadImage(file: File, folder?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
        formData.append('folder', folder);
    }
    const response = await api.post('/api/admin/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapRaw<{ url: string }>(response).url;
}
