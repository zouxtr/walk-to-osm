# Walk Logger

Log GPS locations on walks and contribute them to OpenStreetMap — all from your browser.

**[Live Demo](https://zouxtr.github.io/walk-to-osm/)**
* i made the app and most of thies readme.md file with AI, sorry for the slop
## Features

- **GPS Location Logging** — Tap to save your current location with high accuracy (multiple readings averaged)
- **OpenStreetMap Contribution** — Opens the iD editor pre-centered on your location with suggested tags
- **PWA** — Installable on mobile and desktop, works offline (app shell cached via Service Worker)
- **No Build Step** — Pure vanilla JavaScript, deploys directly to GitHub Pages

## How It Works

1. **Log** — Walk around and tap "Log Location" to save GPS coordinates
2. **Edit** — Add a name to each location, adjust coordinates by dragging the map pin
3. **Contribute** — Open the iD editor centered on the location with suggested tags, then save directly to OSM

### OpenStreetMap Account

No setup needed — just log in to [openstreetmap.org](https://www.openstreetmap.org) in your browser before contributing. The app opens the iD editor which handles authentication.

## Project Structure

```
walk-to-osm/
├── index.html          # Main HTML (3 views: map, list, edit)
├── app.js              # Core application logic
├── style.css           # All styles (light + dark themes)
├── osm.js              # iD editor URL generation, tag building
├── overpass.js         # Overpass API duplicate checking
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
- **Overpass API** — OpenStreetMap duplicate checking
- **iD Editor** — OpenStreetMap contribution via URL scheme

## Caching Strategy

| Resource | Strategy |
|----------|----------|
| `index.html` | Network-first |
| JS/CSS files | Stale-while-revalidate |
| API requests | Network-first |
| Static assets (icons, Leaflet) | Cache-first |

New deployments automatically invalidate old caches and trigger a page reload.

## Privacy

- All location data stays in your browser (localStorage)
- No analytics, no tracking, no cookies
- Overpass API requests are anonymous

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

