import { api } from './api.js';
import { showToast } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  const isPassengerPage = window.location.pathname.includes('passenger.html');
  if (!isPassengerPage) return;

  // Initialize Map
  const map = L.map('map').setView([40.7128, -74.0060], 13); // Default to NY
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  let busMarker = null;
  let trackingInterval = null;
  let currentBusId = null;

  const busIcon = L.divIcon({
    html: '<div style="font-size: 24px; animation: bounce 1s infinite;">🚌</div>',
    className: 'custom-bus-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const searchBtn = document.getElementById('search-action');
  const searchInput = document.getElementById('bus-search');
  const infoCard = document.getElementById('bus-info-card');
  const infoBusNumber = document.getElementById('info-bus-number');
  const infoEta = document.getElementById('info-eta');
  const infoNextStop = document.getElementById('info-next-stop');

  searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    try {
      const buses = await api.getBuses();
      const bus = buses.find(b => b.bus_number.toLowerCase() === query || b.route.start.toLowerCase().includes(query) || b.route.end.toLowerCase().includes(query));

      if (bus) {
        startTracking(bus);
      } else {
        showToast('Bus not found', true);
      }
    } catch (error) {
      showToast('Error searching buses', true);
    }
  });

  const startTracking = (bus) => {
    currentBusId = bus._id;
    infoCard.style.display = 'block';
    infoBusNumber.textContent = `Bus ${bus.bus_number} (${bus.route.start} ➔ ${bus.route.end})`;
    
    if (trackingInterval) clearInterval(trackingInterval);
    
    fetchLiveLocation(); // Fetch immediately
    trackingInterval = setInterval(fetchLiveLocation, 5000); // Poll every 5s
  };

  const fetchLiveLocation = async () => {
    if (!currentBusId) return;

    try {
      const data = await api.getLiveLocation(currentBusId);
      const loc = data.current_location;
      
      // Update Marker
      if (busMarker) {
        busMarker.setLatLng([loc.latitude, loc.longitude]);
      } else {
        busMarker = L.marker([loc.latitude, loc.longitude], { icon: busIcon }).addTo(map);
      }
      
      map.panTo([loc.latitude, loc.longitude]);

      // Update ETA
      if (data.etas && data.etas.length > 0) {
        const nextStop = data.etas[0]; // Simplification: just pick first stop for demo
        infoNextStop.textContent = `Next Stop: ${nextStop.stop_name} (${nextStop.distance_km} km away)`;
        infoEta.textContent = `ETA: ${nextStop.eta_minutes} mins`;
      }

    } catch (error) {
      console.log('Waiting for bus to start trip...');
      infoEta.textContent = 'Bus offline / waiting to start';
    }
  };
});

// Add a quick keyframe style for bouncing icon
const style = document.createElement('style');
style.innerHTML = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`;
document.head.appendChild(style);
