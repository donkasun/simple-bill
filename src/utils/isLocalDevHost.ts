/** True only during Vite dev on localhost (not LAN IP or production). */
export function isLocalDevHost(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
