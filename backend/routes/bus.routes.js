import express from 'express';
import Bus from '../models/Bus.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get all buses
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a bus by ID
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (bus) {
      res.json(bus);
    } else {
      res.status(404).json({ message: 'Bus not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new bus (Owner only)
router.post('/add-bus', protect, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Only owners can add buses' });
  }

  const { bus_number, route, stops } = req.body;

  try {
    const busExists = await Bus.findOne({ bus_number });
    if (busExists) {
      return res.status(400).json({ message: 'Bus with this number already exists' });
    }

    const bus = new Bus({
      bus_number,
      route,
      stops,
      owner_id: req.user._id
    });

    const createdBus = await bus.save();
    res.status(201).json(createdBus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
