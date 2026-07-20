/**
 * Helper utility to safely resolve public asset URLs with Vite BASE_URL.
 * Prevents broken images when deployed with relative base paths or subfolders.
 */
export function resolveAssetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  
  // If already absolute HTTP(S) or data URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Remove leading slash to make it relative to BASE_URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Use Vite's BASE_URL (defaults to './' in vite.config.ts)
  const baseUrl = import.meta.env.BASE_URL || './';
  
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/${cleanPath}`;
}
