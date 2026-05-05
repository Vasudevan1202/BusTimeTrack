import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  bus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Location', locationSchema);
