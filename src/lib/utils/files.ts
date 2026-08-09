// src/lib/utils/files.ts
import path from 'node:path';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/quictime', 'video/webm'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
const VIDEO_EXTS = ['.mp4', '.mov', '.webm'];

export const isImageFile = (file: File) => {
    const ext = path.extname(file.name).toLowerCase();
    return IMAGE_TYPES.includes(file.type) || IMAGE_EXTS.includes(ext);
};

export const isVideoFile = (file: File) => {
    const ext = path.extname(file.name).toLowerCase();
    return VIDEO_TYPES.includes(file.type) || VIDEO_EXTS.includes(ext);
};