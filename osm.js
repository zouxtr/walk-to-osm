/**
 * OSM iD Editor — Generate pre-filled edit URLs
 *
 * Uses the iD editor URL scheme to open a place with pre-filled tags.
 * No CORS issues, no OAuth needed — user saves manually in iD.
 */

const OSM = (() => {
  /**
   * Generate an iD editor URL with pre-filled tags
   * @param {number} lat
   * @param {number} lng
   * @param {Object} tags - OSM tags (e.g., { name: "Cafe", amenity: "cafe" })
   * @returns {string} iD editor URL
   */
  function generateIDUrl(lat, lng, tags) {
    const cleanTags = {};
    for (const [k, v] of Object.entries(tags)) {
      if (k && v) cleanTags[k] = v;
    }

    const params = new URLSearchParams({
      editor: 'id',
      lat: lat.toFixed(6),
      lon: lng.toFixed(6),
      zoom: '18',
    });

    if (Object.keys(cleanTags).length > 0) {
      params.set('tags', JSON.stringify(cleanTags));
    }

    return `https://www.openstreetmap.org/edit?${params.toString()}`;
  }

  /**
   * Parse a type string like "amenity=restaurant" into { key, value }
   * @param {string} typeStr - e.g., "amenity=restaurant"
   * @returns {{ key: string, value: string }}
   */
  function parseTypeString(typeStr) {
    if (!typeStr) return { key: '', value: '' };
    const parts = typeStr.split('=');
    if (parts.length === 2) {
      return { key: parts[0].trim(), value: parts[1].trim() };
    }
    return { key: 'note', value: typeStr.trim() };
  }

  /**
   * Build OSM tags from review data
   * @param {{ name: string, typeString: string, lat: number, lng: number }} data
   * @returns {Object} OSM tags
   */
  function buildTags({ name, typeString }) {
    const tags = {};
    if (name) tags.name = name;
    const { key, value } = parseTypeString(typeString);
    if (key && value) tags[key] = value;
    tags.source = 'walk-log';
    return tags;
  }

  return { generateIDUrl, parseTypeString, buildTags };
})();
