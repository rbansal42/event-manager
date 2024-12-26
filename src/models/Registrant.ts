import mongoose from 'mongoose';

const RegistrantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: [String], enum: ['Rotarian', 'Rotaractor', 'Interactor', 'Guardian'], required: true },
  clubName: { type: String, required: true },
  clubDesignation: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  checkedIn: { type: Boolean, default: false },
  checkInTime: { type: Date }
});

export default mongoose.models.Registrant || mongoose.model('Registrant', RegistrantSchema); 