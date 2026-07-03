const mongoose = require('mongoose');

const fixIndexes = async () => {
  const collection = mongoose.connection.collection('users');
  try {
    await collection.dropIndex('firebaseUid_1');
  } catch (_) {}
  try {
    await collection.dropIndex('phone_1');
  } catch (_) {}
  await collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await fixIndexes();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;