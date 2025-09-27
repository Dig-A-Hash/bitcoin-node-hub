import { open, GeoIpDbName } from 'geolite2-redist';
import maxmind, { CityResponse } from 'maxmind';
import { HttpStatusCode } from 'axios';

export default defineEventHandler(async (event) => {
  // Get the IP address from the route parameter
  const ip = getRouterParam(event, 'ip');

  if (!ip) {
    throw new StatusError(HttpStatusCode.BadRequest, 'IP address is required');
  }

  // Validate IP address
  if (!maxmind.validate(ip)) {
    ('IP address is required');
    throw new StatusError(HttpStatusCode.BadRequest, 'Invalid IP address');
  }

  try {
    // Open the GeoLite2-City database
    const reader = await open(GeoIpDbName.City, (path) =>
      maxmind.open<CityResponse>(path)
    );

    // Perform the IP lookup
    const lookup = reader.get(ip);

    // Close the reader to free resources
    reader.close();

    if (!lookup) {
      throw new StatusError(
        HttpStatusCode.NotFound,
        'No geolocation data found for this IP'
      );
    }

    // Return relevant data
    return {
      country: lookup.country?.iso_code || 'Unknown',
      city: lookup.city?.names?.en || 'Unknown',
      postal: lookup.postal?.code || 'Unknown',
      latitude: lookup.location?.latitude || null,
      longitude: lookup.location?.longitude || null,
    };
  } catch (error) {
    return sendErrorResponse(event, error);
  }
});
