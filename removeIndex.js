
const mongoose = require("mongoose");
require("dotenv").config();

async function removeIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const collection = mongoose.connection.collection("users");

    await collection.dropIndex("firebaseUid_1");

    console.log("✅ firebaseUid_1 index dropped successfully.");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

removeIndex();