// src/utils/geo.ts
import geoip from "geoip-lite";

export function resolveIpCoords(ip: string) {
  if (!ip) return null;

  // Se for IP interno (rede privada), geoip não resolve
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return null;
  }

  const geo = geoip.lookup(ip);
  if (!geo) return null;

  return {
    lat: geo.ll[0],
    lng: geo.ll[1],
    country: geo.country,
  };
}
