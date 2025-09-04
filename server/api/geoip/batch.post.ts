import { open, GeoIpDbName } from 'geolite2-redist';
import maxmind, { CityResponse } from 'maxmind';
import { StatusError } from '~~/server/utils/errors';
import { HttpStatusCode } from 'axios';
import { GeoIpResponse } from '~~/shared/types/geoip';

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
          country: 'Unknown',
          city: 'Unknown',
          state: 'Unknown',
          postal: 'Unknown',
          latitude: null,
          longitude: null,
        } as GeoIpResponse;
      }
      return {
        ip,
        country: lookup.country?.iso_code || 'Unknown',
        state: lookup.subdivisions?.[0]?.names?.en || 'Unknown',
        city: lookup.city?.names?.en || 'Unknown',
        postal: lookup.postal?.code || 'Unknown',
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
