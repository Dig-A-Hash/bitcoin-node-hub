export interface GeoIpResponse {
  ip: string;
  country: string;
  city: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
}
