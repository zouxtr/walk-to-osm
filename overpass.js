/**
 * Overpass API — Check for existing OSM entries near a location
 */

const OverpassAPI = (() => {
  const ENDPOINT = 'https://overpass-api.de/api/interpreter';

  /**
   * Find existing OSM nodes/ways/relations near a point
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius - meters (default 50)
   * @returns {Promise<Array<{osmId, type, name, tags, lat, lng, distance}>>}
   */
  async function checkNearby(lat, lng, radius = 50) {
    const query = `
      [out:json][timeout:10];
      (
        node(around:${radius},${lat},${lng});
        way(around:${radius},${lat},${lng});
        relation(around:${radius},${lat},${lng});
      );
      out body;
    `.trim();

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      throw new Error(`Overpass API error: ${res.status}`);
    }

    const data = await res.json();
    const elements = data.elements || [];

    return elements
      .filter((el) => el.tags && (el.tags.name || Object.keys(el.tags).length > 1))
      .map((el) => {
        const elLat = el.lat || (el.center && el.center.lat) || lat;
        const elLng = el.lon || (el.center && el.center.lon) || lng;
        return {
          osmId: el.id,
          type: el.type, // node, way, relation
          name: el.tags.name || '(unnamed)',
          tags: el.tags,
          lat: elLat,
          lng: elLng,
          distance: haversineDistance(lat, lng, elLat, elLng),
          osmURL: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Haversine distance between two points in meters
   */
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return { checkNearby };
})();
