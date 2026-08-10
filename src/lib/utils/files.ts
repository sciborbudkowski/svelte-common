// src/lib/utils/files.ts

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
const VIDEO_EXTS = ['.mp4', '.mov', '.webm'];

const getFileExt = (name: string) => {
    const dotIndex = name.lastIndexOf('.');
    return dotIndex === -1 ? '' : name.slice(dotIndex).toLowerCase();
}

export const isImageFile = (file: File) => {
    const ext = getFileExt(file.name);
    return IMAGE_TYPES.includes(file.type) || IMAGE_EXTS.includes(ext);
};

export const isVideoFile = (file: File) => {
    const ext = getFileExt(file.name);
    return VIDEO_TYPES.includes(file.type) || VIDEO_EXTS.includes(ext);
};