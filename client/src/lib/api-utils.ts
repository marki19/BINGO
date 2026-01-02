export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, ""); // Ensure no trailing slash
  }

  if (typeof window !== 'undefined') {
    // Standard for Replit/Vercel single-repo deployments
    return window.location.origin;
  }

  return "http://localhost:5000";
}