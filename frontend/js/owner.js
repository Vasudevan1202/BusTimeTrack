import { api } from './api.js';
import { showToast } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  const isOwnerPage = window.location.pathname.includes('owner.html');
  if (!isOwnerPage) return;

  const addBusForm = document.getElementById('add-bus-form');
  const busesList = document.getElementById('buses-list');
  let simulationIntervals = {};

  const loadBuses = async () => {
    try {
      const buses = await api.getBuses();
      const user = api.getUser();
      const myBuses = buses.filter(b => b.owner_id === user._id);
      
      if (myBuses.length === 0) {
        busesList.innerHTML = '<p style="color: var(--text-light)">No buses added yet.</p>';
        return;
      }

      busesList.innerHTML = myBuses.map(bus => `
        <div style="border: 1px solid var(--glass-border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong>${bus.bus_number}</strong>
            <span style="font-size: 0.8rem; background: var(--primary); color: white; padding: 2px 8px; border-radius: 999px;">
              ${bus.route.start} ➔ ${bus.route.end}
            </span>
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="window.startSimulation('${bus._id}')" id="start-${bus._id}" style="padding: 0.5rem; font-size: 0.8rem;">Start Trip</button>
            <button class="btn btn-secondary btn-sm" onclick="window.stopSimulation('${bus._id}')" id="stop-${bus._id}" style="padding: 0.5rem; font-size: 0.8rem; display:none;">Stop Trip</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      showToast('Failed to load buses', true);
    }
  };

  addBusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bus_number = document.getElementById('bus-number').value;
    const route_start = document.getElementById('route-start').value;
    const route_end = document.getElementById('route-end').value;
    const stopsRaw = document.getElementById('bus-stops').value;

    try {
      const stops = stopsRaw.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(',');
          if (parts.length < 3) throw new Error('Each stop must have a Name, Latitude, and Longitude separated by commas.');
          const [name, lat, lng] = parts;
          return { name: name.trim(), latitude: parseFloat(lat.trim()), longitude: parseFloat(lng.trim()) };
        });

      await api.addBus({
        bus_number,
        route: { start: route_start, end: route_end },
        stops
      });

      showToast('Bus added successfully!');
      addBusForm.reset();
      loadBuses();
    } catch (error) {
      showToast(error.message || 'Error adding bus', true);
    }
  });

  // Global functions for inline handlers
  window.startSimulation = async (busId) => {
    document.getElementById(`start-${busId}`).style.display = 'none';
    document.getElementById(`stop-${busId}`).style.display = 'inline-block';
    
    // Fake movement starting near NY
    let lat = 40.7128;
    let lng = -74.0060;
    
    showToast('Trip started. Sending live location...');

    // Initial update
    await api.updateLocation(busId, lat, lng);

    simulationIntervals[busId] = setInterval(async () => {
      lat += 0.001; // Move slightly North
      lng += 0.001; // Move slightly East
      try {
        await api.updateLocation(busId, lat, lng);
      } catch (e) {
        console.error('Update failed', e);
      }
    }, 5000); // Update every 5 seconds for demo
  };

  window.stopSimulation = (busId) => {
    clearInterval(simulationIntervals[busId]);
    document.getElementById(`start-${busId}`).style.display = 'inline-block';
    document.getElementById(`stop-${busId}`).style.display = 'none';
    showToast('Trip ended.');
  };

  loadBuses();
});
