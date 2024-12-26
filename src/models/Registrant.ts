import mongoose from 'mongoose';

const registrantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Rotarian', 'Rotaractor', 'Interactor', 'Guardian'],
  },
  clubName: {
    type: String,
    required: true,
  },
  dailyCheckIns: {
    day1: {
      checkedIn: { type: Boolean, default: false },
      checkInTime: { type: Date },
    },
    day2: {
      checkedIn: { type: Boolean, default: false },
      checkInTime: { type: Date },
    },
    day3: {
      checkedIn: { type: Boolean, default: false },
      checkInTime: { type: Date },
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Registrant || mongoose.model('Registrant', registrantSchema); 