/**
 * Walk Logger — Main Application
 */

const App = (() => {
  let map;
  let userMarker;
  let locationMarkers = [];
  let reviewQueue = [];
  let currentReviewIndex = 0;

  // ── localStorage helpers ──────────────────────────────────────

  function getLocations() {
    try {
      return JSON.parse(localStorage.getItem('locations') || '[]');
    } catch {
      return [];
    }
  }

  function saveLocations(locs) {
    localStorage.setItem('locations', JSON.stringify(locs));
  }

  function getLoggingMode() {
    return localStorage.getItem('loggingMode') || 'quick';
  }

  function setLoggingMode(mode) {
    localStorage.setItem('loggingMode', mode);
  }

  // ── UUID ──────────────────────────────────────────────────────

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ── Toast ─────────────────────────────────────────────────────

  function showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  // ── View switching ────────────────────────────────────────────

  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
    document.getElementById(`view-${name}`).classList.remove('hidden');
  }

  // ── Map ───────────────────────────────────────────────────────

  function showGeoStatus(msg) {
    let el = document.getElementById('geo-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'geo-status';
      document.getElementById('map').appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hideGeoStatus() {
    const el = document.getElementById('geo-status');
    if (el) el.classList.add('hidden');
  }

  function initMap() {
    try {
      map = L.map('map').setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    } catch (err) {
      console.error('Map init failed:', err);
      showGeoStatus('Map failed to load — check your connection');
      return;
    }

    if (navigator.geolocation) {
      showGeoStatus('Requesting location access...');

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 16);
          userMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#4CAF50',
            fillColor: '#4CAF50',
            fillOpacity: 0.8,
          })
            .bindPopup('You are here')
            .addTo(map);
          hideGeoStatus();
        },
        (err) => {
          console.warn('Geolocation error:', err.code, err.message);
          if (err.code === 1) {
            showGeoStatus('Location access denied — click to enable');
            document.getElementById('geo-status').onclick = () => {
              if (navigator.permissions) {
                navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                  if (result.state === 'denied') {
                    showToast('Enable location in browser settings');
                  }
                });
              } else {
                showToast('Enable location in browser settings');
              }
            };
          } else if (err.code === 2) {
            showGeoStatus('Location unavailable — try again');
          } else {
            showGeoStatus('Location request timed out — try again');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      showGeoStatus('Geolocation not supported by this browser');
    }

    renderLocationMarkers();
  }

  function renderLocationMarkers() {
    locationMarkers.forEach((m) => map.removeLayer(m));
    locationMarkers = [];
    const locs = getLocations();
    locs.forEach((loc) => {
      const m = L.circleMarker([loc.lat, loc.lng], {
        radius: 6,
        color: '#FF9800',
        fillColor: '#FF9800',
        fillOpacity: 0.7,
      })
        .bindPopup(loc.name || new Date(loc.timestamp).toLocaleString())
        .addTo(map);
      locationMarkers.push(m);
    });
  }

  function recenterMap() {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 16);
        if (userMarker) {
          userMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      (err) => {
        if (err.code === 1) {
          showToast('Location access denied — check browser settings');
        } else {
          showToast('Could not get location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Location logging ──────────────────────────────────────────

  function logLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const entry = {
          id: uuid(),
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString(),
          name: null,
        };

        const locs = getLocations();
        locs.push(entry);
        saveLocations(locs);
        renderLocationMarkers();

        showToast('Location saved!');

        if (getLoggingMode() === 'withName') {
          renderLocationList();
          showView('list');
          setTimeout(() => {
            const input = document.querySelector(`[data-loc-id="${entry.id}"] .name-input`);
            if (input) input.focus();
          }, 100);
        }
      },
      () => showToast('Could not get location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Location List ─────────────────────────────────────────────

  function renderLocationList() {
    const container = document.getElementById('location-list');
    const locs = getLocations();

    if (!locs.length) {
      container.innerHTML = '<p class="empty-msg">No locations saved yet.</p>';
      return;
    }

    container.innerHTML = locs
      .map(
        (loc) => `
      <div class="location-item" data-loc-id="${loc.id}">
        <div class="location-info">
          <span class="coords">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span>
          <span class="time">${new Date(loc.timestamp).toLocaleString()}</span>
        </div>
        <div class="name-field">
          <input type="text" class="name-input" placeholder="Name (optional)"
                 value="${loc.name || ''}"
                 data-id="${loc.id}">
        </div>
      </div>`
      )
      .join('');

    container.querySelectorAll('.name-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const locs = getLocations();
        const loc = locs.find((l) => l.id === id);
        if (loc) {
          loc.name = e.target.value.trim() || null;
          saveLocations(locs);
        }
      });
    });
  }

  function clearAllLocations() {
    if (!confirm('Delete all saved locations?')) return;
    saveLocations([]);
    renderLocationList();
    renderLocationMarkers();
    showToast('All locations cleared');
  }

  // ── Match with Google Maps ────────────────────────────────────

  async function matchLocations() {
    const locs = getLocations();
    if (!locs.length) {
      showToast('No locations to match');
      return;
    }

    if (!PlacesAPI.getKey()) {
      const key = prompt('Enter your Google Maps API key:');
      if (!key) return;
      PlacesAPI.setKey(key);
    }

    showView('review');
    reviewQueue = [];
    currentReviewIndex = 0;

    for (let i = 0; i < locs.length; i++) {
      const loc = locs[i];
      const card = {
        loggedLocation: loc,
        googleMatch: null,
        osmDuplicates: [],
        editedName: loc.name || '',
        editedType: '',
        editedLat: loc.lat,
        editedLng: loc.lng,
        status: 'pending',
      };

      // Google Places match
      try {
        const results = await PlacesAPI.searchNearby(loc.lat, loc.lng, 50);
        if (results.length > 0) {
          const best = results[0];
          card.googleMatch = best;
          card.editedName = card.editedName || best.name;
          const mapping = bestOSMMapping(best.types);
          card.editedType = mapping ? mapping.display : '';
        }
      } catch (err) {
        console.warn('Google match failed:', err.message);
      }

      // Overpass duplicate check
      try {
        card.osmDuplicates = await OverpassAPI.checkNearby(loc.lat, loc.lng, 50);
      } catch (err) {
        console.warn('Overpass check failed:', err.message);
      }

      reviewQueue.push(card);
    }

    renderReviewCard();
  }

  // ── Review Card ───────────────────────────────────────────────

  function renderReviewCard() {
    if (currentReviewIndex >= reviewQueue.length) {
      showView('list');
      renderLocationList();
      showToast('Review complete!');
      return;
    }

    const card = reviewQueue[currentReviewIndex];
    const counter = document.getElementById('review-counter');
    counter.textContent = `${currentReviewIndex + 1} of ${reviewQueue.length}`;

    const hasDuplicates = card.osmDuplicates.length > 0;
    const duplicateHTML = hasDuplicates
      ? card.osmDuplicates
          .slice(0, 3)
          .map(
            (d) => `
        <div class="dup-item">
          <span class="dup-name">${d.name}</span>
          <span class="dup-type">${Object.entries(d.tags).map(([k, v]) => `${k}=${v}`).join(', ')}</span>
          <span class="dup-dist">${Math.round(d.distance)}m away</span>
          <a href="${d.osmURL}" target="_blank" rel="noopener" class="dup-link">View on OSM</a>
        </div>`
          )
          .join('')
      : '';

    document.getElementById('review-card').innerHTML = `
      <div class="review-section">
        <h3>Google Maps Match</h3>
        ${
          card.googleMatch
            ? `<a href="${card.googleMatch.googleMapsURI}" target="_blank" rel="noopener" class="google-link">
                View on Google Maps
              </a>`
            : '<p class="no-match">No Google match found</p>'
          }
      </div>

      <div class="review-section">
        <h3>Edit Details</h3>
        <div class="form-row">
          <label>Name</label>
          <input type="text" id="review-name" value="${escapeHTML(card.editedName)}" placeholder="Place name">
        </div>
        <div class="form-row">
          <label>Type (OSM tag)</label>
          <input type="text" id="review-type" value="${escapeHTML(card.editedType)}" placeholder="e.g. amenity=restaurant">
        </div>
        <div class="form-row row-half">
          <div>
            <label>Latitude</label>
            <input type="text" id="review-lat" value="${card.editedLat.toFixed(6)}">
          </div>
          <div>
            <label>Longitude</label>
            <input type="text" id="review-lng" value="${card.editedLng.toFixed(6)}">
          </div>
        </div>
      </div>

      <div class="review-section">
        <h3>OSM Duplicate Check</h3>
        ${
          hasDuplicates
            ? `<div class="dup-warning">Possible duplicate found:</div>
               <div class="dup-list">${duplicateHTML}</div>`
            : '<p class="no-dup">No existing OSM entry nearby</p>'
        }
      </div>
    `;

    // Sync edits back to card on input
    document.getElementById('review-name').addEventListener('input', (e) => {
      card.editedName = e.target.value;
    });
    document.getElementById('review-type').addEventListener('input', (e) => {
      card.editedType = e.target.value;
    });
    document.getElementById('review-lat').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) card.editedLat = v;
    });
    document.getElementById('review-lng').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) card.editedLng = v;
    });
  }

  function pushToOSM() {
    const card = reviewQueue[currentReviewIndex];
    const tags = OSM.buildTags({
      name: card.editedName,
      typeString: card.editedType,
    });

    const url = OSM.generateIDUrl(card.editedLat, card.editedLng, tags);
    window.open(url, '_blank');

    card.status = 'pushed';
    currentReviewIndex++;
    renderReviewCard();
  }

  function skipReview() {
    reviewQueue[currentReviewIndex].status = 'skipped';
    currentReviewIndex++;
    renderReviewCard();
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>"']/g, (c) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[c];
    });
  }

  // ── Settings ──────────────────────────────────────────────────

  function initSettings() {
    const panel = document.getElementById('settings-panel');
    const btn = document.getElementById('settings-btn');
    const close = document.getElementById('settings-close');
    const radios = document.querySelectorAll('input[name="loggingMode"]');

    if (!panel || !btn || !close) {
      console.warn('Settings elements not found');
      return;
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('hidden');
    });

    close.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.add('hidden');
    });

    // Click outside settings content to close
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        panel.classList.add('hidden');
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
      }
    });

    // Load saved mode
    const saved = getLoggingMode();
    radios.forEach((r) => {
      r.checked = r.value === saved;
      r.addEventListener('change', (e) => {
        setLoggingMode(e.target.value);
      });
    });
  }

  // ── Service Worker ────────────────────────────────────────────

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(console.warn);
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  function init() {
    registerSW();

    // initMap must not block other init — wrap in try-catch
    try {
      initMap();
    } catch (err) {
      console.error('initMap failed:', err);
      showGeoStatus('Map failed to initialize');
    }

    // initSettings must always run, even if map failed
    initSettings();

    document.getElementById('log-btn').addEventListener('click', logLocation);
    document.getElementById('locate-btn').addEventListener('click', recenterMap);
    document.getElementById('match-btn').addEventListener('click', matchLocations);
    document.getElementById('clear-btn').addEventListener('click', clearAllLocations);
    document.getElementById('push-btn').addEventListener('click', pushToOSM);
    document.getElementById('skip-btn').addEventListener('click', skipReview);

    document.getElementById('view-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) {
        showView(btn.dataset.view);
        if (btn.dataset.view === 'map') renderLocationMarkers();
      }
    });

    document.getElementById('view-review').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) showView(btn.dataset.view);
    });

    // Bottom nav: tap map area to go to list
    document.getElementById('map').addEventListener('dblclick', () => {
      renderLocationList();
      showView('list');
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getLocations, showView, renderLocationList };
})();
