import mongoose from 'mongoose';

const RegistrantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  type: { type: String, enum: ['Rotarian', 'Rotaractor', 'Interactor', 'Guardian'], required: true },
  clubName: { type: String, required: true },
  clubDesignation: { type: String, required: false },
  registrationDate: { type: Date, default: Date.now },
  checkedIn: { type: Boolean, default: false },
  checkInTime: { type: Date }
});

export default mongoose.models.Registrant || mongoose.model('Registrant', RegistrantSchema); 