import mongoose from 'mongoose';
export async function connectDatabase(uri: string) {
  if (!uri) throw new Error('MONGODB_URI is required. Configure apps/api/.env.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
