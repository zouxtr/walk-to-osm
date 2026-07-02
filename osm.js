/**
 * OSM iD Editor — Generate edit URLs with officially supported parameters
 *
 * iD does NOT support a tags parameter for pre-filling tags on new features.
 * We use only officially supported parameters: lat, lon, zoom (query) and
 * map, comment, hashtags, source, presets (hash).
 *
 * Reference: https://github.com/openstreetmap/iD/blob/develop/API.md
 */

const OSM = (() => {
  /**
   * Generate an iD editor URL centered on the location
   * @param {number} lat
   * @param {number} lng
   * @param {Object} options
   * @param {string} options.comment - Changeset comment
   * @param {string} options.hashtags - Comma-separated hashtags
   * @param {string} options.source - Changeset source
   * @param {string} options.preset - Preset ID to filter (e.g., "amenity/cafe")
   * @returns {string} iD editor URL
   */
  function generateIDUrl(lat, lng, options = {}) {
    // Query parameters for positioning (officially supported)
    const queryParams = new URLSearchParams({
      editor: 'id',
      lat: lat.toFixed(6),
      lon: lng.toFixed(6),
      zoom: '18',
    });

    // Hash parameters for editor state (officially supported)
    const hashParams = new URLSearchParams();
    hashParams.set('map', `18/${lat.toFixed(6)}/${lng.toFixed(6)}`);

    if (options.comment) {
      hashParams.set('comment', options.comment);
    }
    if (options.hashtags) {
      hashParams.set('hashtags', options.hashtags);
    }
    if (options.source) {
      hashParams.set('source', options.source);
    }
    if (options.preset) {
      hashParams.set('presets', options.preset);
    }

    const hash = hashParams.toString();
    return `https://www.openstreetmap.org/edit?${queryParams.toString()}#${hash}`;
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
   * @param {{ name: string, typeString: string }} data
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

  /**
   * Format tags as readable text for user instructions
   * @param {Object} tags
   * @returns {string}
   */
  function formatTagsForDisplay(tags) {
    return Object.entries(tags)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  }

  /**
   * Generate preset ID from type string for iD's presets parameter
   * @param {string} typeString - e.g., "amenity=restaurant"
   * @returns {string} e.g., "amenity/restaurant"
   */
  function typeToPresetId(typeString) {
    const { key, value } = parseTypeString(typeString);
    if (key && value) {
      return `${key}/${value}`;
    }
    return '';
  }

  return { generateIDUrl, parseTypeString, buildTags, formatTagsForDisplay, typeToPresetId };
})();
