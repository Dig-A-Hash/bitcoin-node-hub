export interface GeoIpResponse {
  ip: string;
  country: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
}
