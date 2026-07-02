/**
 * Google Places types → OSM tag mapping
 * Maps Google's type strings to OSM key=value pairs
 */
const GOOGLE_TO_OSM = {
  // Food & Drink
  restaurant:               { key: 'amenity', value: 'restaurant' },
  cafe:                     { key: 'amenity', value: 'cafe' },
  bar:                      { key: 'amenity', value: 'bar' },
  pub:                      { key: 'amenity', value: 'pub' },
  bakery:                   { key: 'shop', value: 'bakery' },
  ice_cream:                { key: 'amenity', value: 'ice_cream' },
  meal_takeaway:            { key: 'amenity', value: 'fast_food' },
  meal_delivery:            { key: 'amenity', value: 'fast_food' },

  // Shopping
  supermarket:              { key: 'shop', value: 'supermarket' },
  grocery_or_supermarket:   { key: 'shop', value: 'supermarket' },
  convenience_store:        { key: 'shop', value: 'convenience' },
  department_store:         { key: 'shop', value: 'department_store' },
  clothing_store:           { key: 'shop', value: 'clothes' },
  shoe_store:               { key: 'shop', value: 'shoes' },
  electronics_store:        { key: 'shop', value: 'electronics' },
  furniture_store:          { key: 'shop', value: 'furniture' },
  hardware_store:           { key: 'shop', value: 'hardware' },
  home_improvement_store:   { key: 'shop', value: 'doityourself' },
  pharmacy:                 { key: 'amenity', value: 'pharmacy' },
  drugstore:                { key: 'shop', value: 'chemist' },
  book_store:               { key: 'shop', value: 'books' },
  jewelry_store:            { key: 'shop', value: 'jewelry' },
  gift_shop:                { key: 'shop', value: 'gift' },
  pet_store:                { key: 'shop', value: 'pet' },
  florist:                  { key: 'shop', value: 'florist' },
  liquor_store:             { key: 'shop', value: 'alcohol' },

  // Health
  hospital:                 { key: 'amenity', value: 'hospital' },
  clinic:                   { key: 'amenity', value: 'clinic' },
  dentist:                  { key: 'amenity', value: 'dentist' },
  doctor:                   { key: 'amenity', value: 'doctors' },
  veterinarian:             { key: 'amenity', value: 'veterinary' },

  // Education
  school:                   { key: 'amenity', value: 'school' },
  university:               { key: 'amenity', value: 'university' },
  college:                  { key: 'amenity', value: 'college' },
  library:                  { key: 'amenity', value: 'library' },

  // Finance
  bank:                     { key: 'amenity', value: 'bank' },
  atm:                      { key: 'amenity', value: 'atm' },

  // Transport
  gas_station:              { key: 'amenity', value: 'fuel' },
  parking:                  { key: 'amenity', value: 'parking' },
  bus_station:              { key: 'amenity', value: 'bus_station' },
  train_station:            { key: 'railway', value: 'station' },
  subway_station:           { key: 'railway', value: 'subway_entrance' },
  taxi_stand:               { key: 'amenity', value: 'taxi' },
  car_repair:               { key: 'shop', value: 'car_repair' },
  car_dealer:               { key: 'shop', value: 'car' },

  // Leisure & Entertainment
  park:                     { key: 'leisure', value: 'park' },
  playground:               { key: 'leisure', value: 'playground' },
  gym:                      { key: 'leisure', value: 'fitness_centre' },
  movie_theater:            { key: 'amenity', value: 'cinema' },
  stadium:                  { key: 'leisure', value: 'stadium' },
  bowling_alley:            { key: 'leisure', value: 'bowling_alley' },
  amusement_park:           { key: 'tourism', value: 'theme_park' },
  casino:                   { key: 'amenity', value: 'casino' },

  // Lodging
  hotel:                    { key: 'tourism', value: 'hotel' },
  motel:                    { key: 'tourism', value: 'motel' },
  lodging:                  { key: 'tourism', value: 'hostel' },

  // Places of Worship
  place_of_worship:         { key: 'amenity', value: 'place_of_worship' },

  // Public Services
  police:                   { key: 'amenity', value: 'police' },
  fire_station:             { key: 'amenity', value: 'fire_station' },
  post_office:              { key: 'amenity', value: 'post_office' },
  courthouse:               { key: 'amenity', value: 'courthouse' },
  town_hall:                { key: 'amenity', value: 'townhall' },

  // Nature
  cemetery:                 { key: 'landuse', value: 'cemetery' },
  natural_feature:          { key: 'natural', value: 'yes' },

  // Points of Interest
  tourist_attraction:       { key: 'tourism', value: 'attraction' },
  museum:                   { key: 'tourism', value: 'museum' },
  art_gallery:              { key: 'tourism', value: 'gallery' },
  spa:                      { key: 'amenity', value: 'spa' },

  // Other
  storage:                  { key: 'man_made', value: 'storage_tank' },
  point_of_interest:        { key: 'note', value: 'POI' },
};

/**
 * Convert a Google type string to an OSM tag object
 * @param {string} googleType - Google Places type (e.g., "restaurant")
 * @returns {{ key: string, value: string, display: string } | null}
 */
function googleTypeToOSM(googleType) {
  const mapping = GOOGLE_TO_OSM[googleType];
  if (mapping) {
    return { ...mapping, display: `${mapping.key}=${mapping.value}` };
  }
  return null;
}

/**
 * Try to find the best OSM mapping for a list of Google types
 * @param {string[]} types - Array of Google Places types
 * @returns {{ key: string, value: string, display: string } | null}
 */
function bestOSMMapping(types) {
  if (!types || !types.length) return null;
  for (const t of types) {
    const mapping = googleTypeToOSM(t);
    if (mapping) return mapping;
  }
  return null;
}
