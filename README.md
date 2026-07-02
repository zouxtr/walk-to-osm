# Walk Logger

Log GPS locations on walks, match them against Google Maps places, check for OpenStreetMap duplicates, and contribute new places to OSM — all from your browser.

**[Live Demo](https://zouxtr.github.io/walk-to-osm/)**
* i vibecoded this app and most of this readme.md file, i am sorry for the slop
## Features

- **GPS Location Logging** — Tap to save your current location with high accuracy (multiple readings averaged)
- **Google Maps Matching** — Automatically finds nearby places using Google Places API (New - not tested)
- **OpenStreetMap Contribution** — Opens the iD editor pre-centered on your location with suggested tags
- **PWA** — Installable on mobile and desktop, works offline (app shell cached via Service Worker)
- **No Build Step** — Pure vanilla JavaScript, deploys directly to GitHub Pages

## How It Works

1. **Log** — Walk around and tap "Log Location" to save GPS coordinates
2. **Review** — Match your logged locations against Google Maps to get place names and types(NEW - not tested)
3. **Contribute** — Open the iD editor centered on the location with suggested tags, then save directly to OSM

### Google Maps API Key

Place matching requires a Google Maps API key with **Places API (New)** enabled.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Places API (New)**
3. Create an API key
4. **Restrict the key** to your GitHub Pages domain under HTTP referrers
5. Open the app → tap the gear icon → enter your API key

> Your API key is stored in the browser's localStorage and never sent to any server other than Google's.

### OpenStreetMap Account

No setup needed — just log in to [openstreetmap.org](https://www.openstreetmap.org) in your browser before contributing. The app opens the iD editor which handles authentication.

## Project Structure

```
walk-to-osm/
├── index.html          # Main HTML (4 views: map, list, review, edit)
├── app.js              # Core application logic
├── style.css           # All styles (light + dark themes)
├── osm.js              # iD editor URL generation, tag building
├── places.js           # Google Places API (New) nearby search
├── overpass.js         # Overpass API duplicate checking
├── type-mapping.js     # Google Places → OSM tag conversion
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (caching strategies)
└── icons/              # PWA icons
    ├── icon-192.png
    └── icon-512.png
```

## Tech Stack

- **Vanilla JavaScript** — No frameworks, no build step
- **Leaflet** — Interactive maps via OpenStreetMap tiles
- **Service Worker** — Offline support with stale-while-revalidate and network-first strategies
- **localStorage** — All data stored locally in the browser
- **Google Places API (New)** — Place matching and type detection
- **Overpass API** — OpenStreetMap duplicate checking
- **iD Editor** — OpenStreetMap contribution via URL scheme

## Caching Strategy

| Resource | Strategy |
|----------|----------|
| `index.html` | Network-first |
| JS/CSS files | Stale-while-revalidate |
| API requests | Network-first |
| Static assets (icons, Leaflet) | Cache-first |

New deployments automatically invalidate old caches and trigger a page reload.(may not work)

## Privacy

- All location data stays in your browser (localStorage)
- No analytics, no tracking, no cookies
- Google API key is entered by the user and stored locally
- Overpass API requests are anonymous

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
