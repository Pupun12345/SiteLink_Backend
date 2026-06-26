require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const demoJobs = [
  {
    title: 'Construction Worker',
    company: 'ABC Builders Pvt Ltd',
    location: 'Mumbai, Maharashtra',
    latitude: '19.0760',
    longitude: '72.8777',
    quantity: '10',
    salary: 600,
    salaryType: 'daily',
    isUrgent: true,
    duration: '3 months',
    description: 'Need experienced construction workers for residential building project. Must have experience in masonry, plastering, and general construction work.',
    experience: '2',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Plumber',
    company: 'Green Home Solutions',
    location: 'Bangalore, Karnataka',
    latitude: '12.9716',
    longitude: '77.5946',
    quantity: '3',
    salary: 800,
    salaryType: 'daily',
    isUrgent: false,
    duration: '1 month',
    description: 'Looking for skilled plumbers for apartment complex plumbing installation and maintenance. Should know pipe fitting, drainage work, and fixture installation.',
    experience: '3',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Electrician',
    company: 'PowerTech Services',
    location: 'Delhi NCR',
    latitude: '28.7041',
    longitude: '77.1025',
    quantity: '5',
    salary: 25000,
    salaryType: 'monthly',
    isUrgent: true,
    duration: '6 months',
    description: 'Experienced electricians needed for commercial building electrical wiring and maintenance. Must have valid electrician license and knowledge of industrial electrical systems.',
    experience: '4',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Carpenter',
    company: 'Woodcraft Interiors',
    location: 'Pune, Maharashtra',
    latitude: '18.5204',
    longitude: '73.8567',
    quantity: '4',
    salary: 700,
    salaryType: 'daily',
    isUrgent: false,
    duration: '2 months',
    description: 'Need skilled carpenters for furniture making and interior woodwork. Should be proficient in measuring, cutting, and assembling wooden structures.',
    experience: '3',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Painter',
    company: 'ColorWorks Painting',
    location: 'Hyderabad, Telangana',
    latitude: '17.3850',
    longitude: '78.4867',
    quantity: '6',
    salary: 3000,
    salaryType: 'weekly',
    isUrgent: false,
    duration: '1 month',
    description: 'Experienced painters required for residential painting project. Must know wall preparation, primer application, and finish painting techniques.',
    experience: '1',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Mason',
    company: 'Solid Structures Ltd',
    location: 'Chennai, Tamil Nadu',
    latitude: '13.0827',
    longitude: '80.2707',
    quantity: '8',
    salary: 650,
    salaryType: 'daily',
    isUrgent: true,
    duration: '4 months',
    description: 'Looking for experienced masons for building construction. Must have skills in bricklaying, stone masonry, and concrete work.',
    experience: '5',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Welder',
    company: 'Metal Masters Industries',
    location: 'Ahmedabad, Gujarat',
    latitude: '23.0225',
    longitude: '72.5714',
    quantity: '3',
    salary: 28000,
    salaryType: 'monthly',
    isUrgent: true,
    duration: '6 months',
    description: 'Skilled welders needed for industrial fabrication work. Must be proficient in arc welding, gas welding, and metal cutting.',
    experience: '4',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Helper/Labour',
    company: 'QuickBuild Contractors',
    location: 'Jaipur, Rajasthan',
    latitude: '26.9124',
    longitude: '75.7873',
    quantity: '15',
    salary: 450,
    salaryType: 'daily',
    isUrgent: false,
    duration: '2 months',
    description: 'General construction helpers needed for various tasks including material handling, site cleaning, and assisting skilled workers.',
    experience: '0',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'AC Technician',
    company: 'Cool Comfort Services',
    location: 'Kolkata, West Bengal',
    latitude: '22.5726',
    longitude: '88.3639',
    quantity: '4',
    salary: 4000,
    salaryType: 'weekly',
    isUrgent: false,
    duration: '3 months',
    description: 'AC installation and repair technicians required. Must have experience with split AC, window AC, and central air conditioning systems.',
    experience: '2',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
  {
    title: 'Tiles Fitter',
    company: 'Premium Tiles & Marbles',
    location: 'Surat, Gujarat',
    latitude: '21.1702',
    longitude: '72.8311',
    quantity: '5',
    salary: 750,
    salaryType: 'daily',
    isUrgent: true,
    duration: '2 months',
    description: 'Experienced tile fitters needed for residential and commercial projects. Should be skilled in floor tiling, wall tiling, and marble fitting.',
    experience: '3',
    status: 'Open',
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
];

const seedJobs = async () => {
  try {
    await connectDB();

    // Find a vendor user to assign as postedBy (or create one if needed)
    let vendor = await User.findOne({ userType: 'vendor' });

    if (!vendor) {
      console.log('No vendor found. Creating a demo vendor...');
      vendor = await User.create({
        name: 'Demo Vendor',
        phone: '9876543210',
        email: 'vendor@demo.com',
        password: 'password123',
        userType: 'vendor',
        companyName: 'Demo Construction Co.',
        designation: 'Manager',
        isVerified: true,
        verificationStatus: 'verified',
        isProfileCreated: true,
      });
      console.log('Demo vendor created');
    }

    // Clear existing demo jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Add postedBy field to all jobs
    const jobsWithVendor = demoJobs.map(job => ({
      ...job,
      postedBy: vendor._id,
    }));

    // Insert demo jobs
    const createdJobs = await Job.insertMany(jobsWithVendor);
    console.log(`${createdJobs.length} demo jobs added successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

seedJobs();
