import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'ryla2024';

if (!MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI as string, {
      dbName: MONGODB_DATABASE,
      bufferCommands: false,
      autoCreate: true,
      autoIndex: true,
    });

    isConnected = !!db.connections[0].readyState;

    if (isConnected) {
      console.log('Successfully connected to MongoDB.');
      console.log(`Database: ${db.connections[0]?.db?.databaseName || MONGODB_DATABASE}`);
      console.log(`Host: ${db.connections[0].host}`);
      console.log(`Port: ${db.connections[0].port}`);
    }

  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default dbConnect; 