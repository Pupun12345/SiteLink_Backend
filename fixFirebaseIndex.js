require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');

async function fixFirebaseIndex() {
  // Force connect to the correct database
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();

  // Explicitly use 'test' database (where your users collection lives)
  const db = client.db('test');
  const collection = db.collection('users');

  // Show current indexes
  const indexes = await collection.indexes();
  console.log('Current indexes:', JSON.stringify(indexes, null, 2));

  // Drop the bad non-sparse unique index
  try {
    await collection.dropIndex('firebaseUid_1');
    console.log('Dropped old firebaseUid_1 index');
  } catch (e) {
    console.log('Drop failed:', e.message);
  }

  // Recreate firebaseUid as sparse unique index
  await collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true, name: 'firebaseUid_1' });
  console.log('Created new sparse unique index on firebaseUid');

  // Fix phone_1 index - also needs sparse: true for Google users with null phone
  try {
    await collection.dropIndex('phone_1');
    console.log('Dropped old phone_1 index');
  } catch (e) {
    console.log('phone_1 drop failed:', e.message);
  }
  await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_1' });
  console.log('Created new sparse unique index on phone');

  // Verify
  const newIndexes = await collection.indexes();
  console.log('Final indexes:', JSON.stringify(newIndexes, null, 2));

  await client.close();
  console.log('Done.');
}

fixFirebaseIndex().catch(console.error);
