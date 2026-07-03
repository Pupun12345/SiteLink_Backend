require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');

async function cleanAndFix() {
  const client = new MongoClient("mongodb+srv://wwwsitelink_db_user:pVaYQjJJB7JQBtyr@sitelink-backend.ugobhtu.mongodb.net/");
  await client.connect();
  const db = client.db('test');
  const collection = db.collection('users');

  // Show all users with firebaseUid: null
  const nullUsers = await collection.find({ firebaseUid: null }).toArray();
  console.log(`Found ${nullUsers.length} users with firebaseUid: null`);
  nullUsers.forEach(u => console.log(` - _id: ${u._id}, phone: ${u.phone}, email: ${u.email}`));

  // Delete all users that have no phone AND no email (pure junk/test docs)
  const deleted = await collection.deleteMany({ firebaseUid: null, phone: null, email: null });
  console.log(`Deleted ${deleted.deletedCount} junk documents`);

  // Drop ALL existing indexes except _id
  const indexes = await collection.indexes();
  for (const idx of indexes) {
    if (idx.name === '_id_') continue;
    try {
      await collection.dropIndex(idx.name);
      console.log(`Dropped index: ${idx.name}`);
    } catch (e) {
      console.log(`Could not drop ${idx.name}:`, e.message);
    }
  }

  // Recreate all indexes correctly with sparse: true
  await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true });
  console.log('All indexes recreated with sparse: true');

  // Show final indexes
  const final = await collection.indexes();
  console.log('Final indexes:');
  final.forEach(i => console.log(` - ${i.name}`, i.unique ? 'unique' : '', i.sparse ? 'sparse' : ''));

  await client.close();
  console.log('\nDone! You can delete this file now.');
}

cleanAndFix().catch(console.error);


