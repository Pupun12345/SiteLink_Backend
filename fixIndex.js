const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('users');

  try {
    await collection.dropIndex('firebaseUid_1');
    console.log('Dropped old firebaseUid index');
  } catch (e) {
    console.log('Index may not exist:', e.message);
  }

  await collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true });
  console.log('Created new sparse unique firebaseUid index');

  await mongoose.disconnect();
}

fixIndex().catch(console.error);
