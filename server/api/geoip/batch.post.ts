import { open, GeoIpDbName } from 'geolite2-redist';
import maxmind, { CityResponse } from 'maxmind';
import { HttpStatusCode } from 'axios';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const ips: string[] = body?.ips || [];

  if (!ips || !Array.isArray(ips) || ips.length === 0) {
    throw new StatusError(
      HttpStatusCode.BadRequest,
      'IP address list is required'
    );
  }

  const validIps = ips.filter((ip) => maxmind.validate(ip));
  if (validIps.length === 0) {
    throw new StatusError(
      HttpStatusCode.BadRequest,
      'No valid IP addresses provided'
    );
  }

  try {
    const reader = await open(GeoIpDbName.City, (path) =>
      maxmind.open<CityResponse>(path)
    );

    const results = validIps.map((ip) => {
      const lookup = reader.get(ip);
      if (!lookup) {
        return {
          ip,
          country: 'Unknown Country',
          city: 'Unknown City',
          state: 'Unknown State',
          postal: 'Unknown Zip',
          latitude: null,
          longitude: null,
        } as GeoIpResponse;
      }
      return {
        ip,
        country: lookup.country?.iso_code || 'Unknown Country',
        state: lookup.subdivisions?.[0]?.names?.en || 'Unknown State',
        city: lookup.city?.names?.en || 'Unknown City',
        postal: lookup.postal?.code || 'Unknown Zip',
        latitude: lookup.location?.latitude || null,
        longitude: lookup.location?.longitude || null,
      } as GeoIpResponse;
    });

    reader.close();
    return results;
  } catch (error) {
    return sendErrorResponse(event, error);
  }
});
