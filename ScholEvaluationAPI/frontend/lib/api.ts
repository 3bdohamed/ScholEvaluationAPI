export function apiUrl(path: string): string {
  const apiPath = `/api${path.startsWith("/") ? path : `/${path}`}`;

  if (typeof window === "undefined") {
    return `http://localhost:5100${apiPath}`;
  }

  if (window.location.port === "3000") {
    return `${window.location.protocol}//${window.location.hostname}:5100${apiPath}`;
  }

  return apiPath;
}
