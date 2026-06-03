require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');
const Application = require('./models/Application');
const Comment = require('./models/Comment');

const MONGO_URI = process.env.MONGODB_URI;

const sampleJobs = [
  {
    title: 'Senior Backend Developer',
    company: 'Acme Solutions',
    location: 'Remote',
    quantity: '2',
    salary: 80000,
    salaryType: 'monthly',
    isUrgent: false,
    duration: '6 months',
    description: 'Build and maintain RESTful APIs using Node.js and MongoDB.',
    experience: '3',
    status: 'Open',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    title: 'Junior Frontend Developer',
    company: 'BrightApps',
    location: 'New York, NY',
    quantity: '1',
    salary: 3000,
    salaryType: 'monthly',
    isUrgent: true,
    duration: 'Full-time',
    description: 'Work on React components and UI features.',
    experience: '1',
    status: 'Open',
    approvalStatus: 'pending',
    isActive: true,
  },
  {
    title: 'Site Cleaner',
    company: 'Local Services Co',
    location: 'Los Angeles, CA',
    quantity: '5',
    salary: 120,
    salaryType: 'daily',
    isUrgent: false,
    duration: 'Ongoing',
    description: 'General cleaning work for residential sites.',
    experience: '0',
    status: 'Open',
    approvalStatus: 'rejected',
    isActive: false,
  }
];

async function seed() {
  try {
    // Mongoose v7 no longer requires/accepts `useNewUrlParser` or `useUnifiedTopology` options
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove jobs, related applications and job comments
    const removedJobs = await Job.deleteMany({});
    console.log(`Deleted ${removedJobs.deletedCount} jobs`);

    const removedApps = await Application.deleteMany({});
    console.log(`Deleted ${removedApps.deletedCount} applications`);

    const removedComments = await Comment.deleteMany({ jobId: { $exists: true } });
    console.log(`Deleted ${removedComments.deletedCount} job comments`);

    // Insert sample jobs
    const created = await Job.insertMany(sampleJobs);
    console.log(`Inserted ${created.length} sample jobs`);

    created.forEach((j) => console.log(`- ${j.title} (${j.approvalStatus})`));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
