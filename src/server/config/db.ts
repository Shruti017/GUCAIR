import mongoose from 'mongoose';

export async function connectDatabase(uri: string) {
  if (!uri) throw new Error('MONGODB_URI is required. Add it to the root .env.local file or Vercel environment variables.');
  mongoose.set('strictQuery', true);
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
