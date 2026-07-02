/**
 * Google Places API (New) — Nearby Search from browser
 *
 * Requires a Google Maps API key with Places API (New) enabled.
 * Restrict the key to your GitHub Pages domain in Google Cloud Console.
 */

const PlacesAPI = (() => {
  // Set your Google API key here or in localStorage
  function getKey() {
    return localStorage.getItem('googleApiKey') || '';
  }

  function setKey(key) {
    localStorage.setItem('googleApiKey', key);
  }

  /**
   * Search for nearby places around a lat/lng
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius - meters (default 50)
   * @returns {Promise<Array<{name, type, types, address, googleMapsURI, lat, lng}>>}
   */
  async function searchNearby(lat, lng, radius = 50) {
    const apiKey = getKey();
    if (!apiKey) {
      throw new Error('Google API key not set. Open Settings to configure.');
    }

    const body = {
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        },
      },
    };

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.primaryType,places.types,places.formattedAddress,places.googleMapsURI,places.location',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Places API error: ${res.status}`);
    }

    const data = await res.json();
    return (data.places || []).map((p) => ({
      name: p.displayName?.text || '',
      type: p.primaryType || '',
      types: p.types || [],
      address: p.formattedAddress || '',
      googleMapsURI: p.googleMapsURI || '',
      lat: p.location?.latitude || lat,
      lng: p.location?.longitude || lng,
    }));
  }

  return { getKey, setKey, searchNearby };
})();
