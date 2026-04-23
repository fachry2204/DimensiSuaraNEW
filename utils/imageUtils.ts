
import { API_BASE_URL } from './api';

/**
 * Generates the full URL for a profile picture based on the stored path.
 * @param path - The path stored in the database (e.g., /uploads/profiles/...)
 * @returns The full URL to the image or null if path is invalid
 */
export const getProfileImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;

    // If path is already a full URL (starts with http/https), return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Get the base URL without the /api suffix
    // Example: /api -> "" (empty string, relies on proxy or relative path)
    // Example: http://localhost:3000/api -> http://localhost:3000
    // Example: https://cms.dimensisuara.id/api -> https://cms.dimensisuara.id
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    const fullUrl = `${baseUrl}${cleanPath}`;
    // console.log("Generated Profile URL:", fullUrl); // Debugging
    return fullUrl;
};
