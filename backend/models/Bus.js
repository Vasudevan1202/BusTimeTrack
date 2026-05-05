import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  bus_number: { type: String, required: true, unique: true },
  route: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  stops: [{
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }],
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Bus', busSchema);
