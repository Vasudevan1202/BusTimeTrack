import express from 'express';
import Location from '../models/Location.js';
import Bus from '../models/Bus.js';
import { protect } from '../middlewares/auth.middleware.js';
import { calculateDistance, calculateETA } from '../utils/geo.js';

const router = express.Router();

// Owner updates location
router.post('/update-location', protect, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Only owners can update location' });
  }

  const { bus_id, latitude, longitude } = req.body;

  try {
    const bus = await Bus.findOne({ _id: bus_id, owner_id: req.user._id });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found or you do not own it' });
    }

    // Upsert the latest location for this bus
    let location = await Location.findOne({ bus_id });
    if (location) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.timestamp = Date.now();
      await location.save();
    } else {
      location = await Location.create({ bus_id, latitude, longitude });
    }

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Passenger gets live location and ETA
router.get('/live-location/:bus_id', async (req, res) => {
  try {
    const location = await Location.findOne({ bus_id: req.params.bus_id });
    const bus = await Bus.findById(req.params.bus_id);

    if (!location || !bus) {
      return res.status(404).json({ message: 'Location or Bus not found' });
    }

    // Calculate ETA for next stops (simple approach)
    const etas = bus.stops.map(stop => {
      const distance = calculateDistance(location.latitude, location.longitude, stop.latitude, stop.longitude);
      const etaMinutes = calculateETA(distance);
      return {
        stop_name: stop.name,
        distance_km: distance.toFixed(2),
        eta_minutes: etaMinutes
      };
    });

    res.json({
      current_location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp
      },
      etas
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
