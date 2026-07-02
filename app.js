/**
 * Walk Logger — Main Application
 */

const App = (() => {
  let map;
  let userMarker;
  let locationMarkers = [];

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
        .bindPopup(document.createTextNode(loc.name || new Date(loc.timestamp).toLocaleString()))
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

    showGeoStatus('Getting accurate location...');

    // Take multiple readings and average for better accuracy
    const readings = [];
    const NEEDED = 3;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    function takeReading() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          readings.push({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
          attempts++;

          if (readings.length >= NEEDED) {
            saveFromReadings(readings);
          } else if (attempts < MAX_ATTEMPTS) {
            showGeoStatus(`Getting location... (${readings.length}/${NEEDED})`);
            takeReading();
          } else {
            saveFromReadings(readings);
          }
        },
        (err) => {
          attempts++;
          if (attempts < MAX_ATTEMPTS && readings.length < NEEDED) {
            takeReading();
          } else if (readings.length > 0) {
            saveFromReadings(readings);
          } else {
            hideGeoStatus();
            if (err.code === 1) {
              showToast('Location access denied');
            } else {
              showToast('Could not get location');
            }
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    takeReading();
  }

  function saveFromReadings(readings) {
    // Weight by accuracy (lower accuracy number = better)
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    readings.forEach((r) => {
      const weight = 1 / (r.acc || 1);
      totalWeight += weight;
      weightedLat += r.lat * weight;
      weightedLng += r.lng * weight;
    });

    const latitude = weightedLat / totalWeight;
    const longitude = weightedLng / totalWeight;

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

    hideGeoStatus();
    showToast('Location saved!');

    if (getLoggingMode() === 'withName') {
      renderLocationList();
      showView('list');
      setTimeout(() => {
        const input = document.querySelector(`[data-loc-id="${entry.id}"] .name-input`);
        if (input) input.focus();
      }, 100);
    }
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
                 value="${escapeHTML(loc.name || '')}"
                 data-id="${loc.id}">
        </div>
        <div class="location-actions">
          <button class="edit-loc-btn" data-edit-id="${loc.id}" title="Edit location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="delete-loc-btn" data-delete-id="${loc.id}" title="Delete location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
          <button class="contribute-loc-btn" data-contribute-id="${loc.id}" title="Contribute to OpenStreetMap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Contribute
          </button>
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

    container.querySelectorAll('.edit-loc-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditLocation(btn.dataset.editId);
      });
    });

    container.querySelectorAll('.delete-loc-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLocation(btn.dataset.deleteId);
      });
    });

    container.querySelectorAll('.contribute-loc-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        contributeToOSM(btn.dataset.contributeId);
      });
    });
  }

  function deleteLocation(id) {
    if (!confirm('Delete this location?')) return;
    const locs = getLocations().filter((l) => l.id !== id);
    saveLocations(locs);
    renderLocationList();
    renderLocationMarkers();
    showToast('Location deleted');
  }

  function clearAllLocations() {
    if (!confirm('Delete all saved locations?')) return;
    saveLocations([]);
    renderLocationList();
    renderLocationMarkers();
    showToast('All locations cleared');
  }

  function contributeToOSM(id) {
    const locs = getLocations();
    const loc = locs.find((l) => l.id === id);
    if (!loc) return;

    const tags = OSM.buildTags({
      name: loc.name || '',
      typeString: loc.type || '',
    });

    const tagsText = OSM.formatTagsForDisplay(tags);
    const presetId = OSM.typeToPresetId(loc.type || '');

    const url = OSM.generateIDUrl(loc.lat, loc.lng, {
      comment: 'Adding POI from walk log',
      hashtags: 'walklog',
      source: 'walk-log',
      preset: presetId || undefined,
    });

    const message = `iD editor will open centered on this location.\n\n` +
      `Click the "Point" tool (or press P) to add a new feature.\n\n` +
      `Apply these tags:\n${tagsText}\n\n` +
      `Click Save when done.`;

    if (confirm(message)) {
      window.open(url, '_blank');
    }
  }

  // ── Edit Location ────────────────────────────────────────────

  let editMap;
  let editMarker;
  let editingLocId = null;

  function openEditLocation(id) {
    const locs = getLocations();
    const loc = locs.find((l) => l.id === id);
    if (!loc) return;

    editingLocId = id;
    showView('edit');

    document.getElementById('edit-name').value = loc.name || '';
    document.getElementById('edit-lat').value = loc.lat.toFixed(6);
    document.getElementById('edit-lng').value = loc.lng.toFixed(6);

    // Destroy previous edit map if exists
    if (editMap) {
      editMap.remove();
      editMap = null;
    }

    // Small delay so the container is visible before Leaflet measures it
    setTimeout(() => {
      editMap = L.map('edit-map').setView([loc.lat, loc.lng], 18);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(editMap);

      editMarker = L.marker([loc.lat, loc.lng], { draggable: true })
        .addTo(editMap);

      // When marker is dragged, update inputs
      editMarker.on('dragend', () => {
        const pos = editMarker.getLatLng();
        document.getElementById('edit-lat').value = pos.lat.toFixed(6);
        document.getElementById('edit-lng').value = pos.lng.toFixed(6);
      });

      // When map is clicked, move marker
      editMap.on('click', (e) => {
        editMarker.setLatLng(e.latlng);
        document.getElementById('edit-lat').value = e.latlng.lat.toFixed(6);
        document.getElementById('edit-lng').value = e.latlng.lng.toFixed(6);
      });

      // When lat/lng inputs change, move marker
      const latInput = document.getElementById('edit-lat');
      const lngInput = document.getElementById('edit-lng');

      const syncMarkerFromInputs = () => {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          editMarker.setLatLng([lat, lng]);
        }
      };

      latInput.addEventListener('input', syncMarkerFromInputs);
      lngInput.addEventListener('input', syncMarkerFromInputs);
    }, 100);
  }

  function saveEditedLocation() {
    if (!editingLocId) return;

    const lat = parseFloat(document.getElementById('edit-lat').value);
    const lng = parseFloat(document.getElementById('edit-lng').value);
    const name = document.getElementById('edit-name').value.trim() || null;

    if (isNaN(lat) || isNaN(lng)) {
      showToast('Invalid coordinates');
      return;
    }

    const locs = getLocations();
    const loc = locs.find((l) => l.id === editingLocId);
    if (loc) {
      loc.lat = lat;
      loc.lng = lng;
      loc.name = name;
      saveLocations(locs);
      renderLocationList();
      renderLocationMarkers();
      showToast('Location updated');
    }

    editingLocId = null;
    showView('list');
  }

  function deleteFromEdit() {
    if (!editingLocId) return;
    deleteLocation(editingLocId);
    editingLocId = null;
    showView('list');
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>"']/g, (c) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[c];
    });
  }

  // ── Settings ──────────────────────────────────────────────────

  function getTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const sun = document.querySelector('.icon-sun');
    const moon = document.querySelector('.icon-moon');
    if (sun && moon) {
      sun.style.display = theme === 'dark' ? 'none' : 'block';
      moon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function toggleTheme() {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

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
      navigator.serviceWorker.register('sw.js').then((reg) => {
        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — reload to activate it
              window.location.reload();
            }
          });
        });
      }).catch(console.warn);
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  function init() {
    registerSW();

    // Apply saved theme immediately
    setTheme(getTheme());

    // Theme toggle
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);

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
    document.getElementById('locations-btn').addEventListener('click', () => {
      renderLocationList();
      showView('list');
    });
    document.getElementById('clear-btn').addEventListener('click', clearAllLocations);
    document.getElementById('edit-save-btn').addEventListener('click', saveEditedLocation);
    document.getElementById('edit-delete-btn').addEventListener('click', deleteFromEdit);

    document.getElementById('view-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) {
        showView(btn.dataset.view);
        if (btn.dataset.view === 'map') renderLocationMarkers();
      }
    });

    document.getElementById('view-edit').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) {
        showView(btn.dataset.view);
        if (btn.dataset.view === 'map') renderLocationMarkers();
      }
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
