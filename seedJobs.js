require('dotenv').config();
const connectDB = require('./config/database');
const Job = require('./models/job');
const User = require('./models/User');

const jobs = [
  {
    title: 'Mason',
    company: 'BuildRight Constructions',
    location: 'Mumbai, Maharashtra',
    quantity: '5',
    salary: 800,
    salaryType: 'daily',
    isUrgent: true,
    duration: '3 months',
    description: 'Experienced mason needed for a residential building project. Must be able to lay bricks, plaster walls, and finish surfaces.',
    experience: '2+ years',
  },
  {
    title: 'Electrician',
    company: 'PowerTech Solutions',
    location: 'Pune, Maharashtra',
    quantity: '3',
    salary: 900,
    salaryType: 'daily',
    isUrgent: false,
    duration: '2 months',
    description: 'Certified electrician for commercial wiring, panel installation, and electrical fittings in a new office complex.',
    experience: '3+ years',
  },
  {
    title: 'Plumber',
    company: 'AquaFix Services',
    location: 'Delhi, NCR',
    quantity: '2',
    salary: 750,
    salaryType: 'daily',
    isUrgent: true,
    duration: '1 month',
    description: 'Plumber required for pipe fitting, drainage work, and bathroom installations in a residential society.',
    experience: '1+ years',
  },
  {
    title: 'Carpenter',
    company: 'WoodCraft Interiors',
    location: 'Bangalore, Karnataka',
    quantity: '4',
    salary: 850,
    salaryType: 'daily',
    isUrgent: false,
    duration: '45 days',
    description: 'Skilled carpenter for furniture making, door/window fitting, and interior woodwork for a luxury apartment project.',
    experience: '2+ years',
  },
  {
    title: 'Painter',
    company: 'ColorPro Painters',
    location: 'Hyderabad, Telangana',
    quantity: '6',
    salary: 650,
    salaryType: 'daily',
    isUrgent: false,
    duration: '3 weeks',
    description: 'Painters needed for interior and exterior painting of a commercial building. Experience with texture and waterproof paints preferred.',
    experience: '1+ years',
  },
  {
    title: 'Welder',
    company: 'SteelFrame Industries',
    location: 'Surat, Gujarat',
    quantity: '3',
    salary: 950,
    salaryType: 'daily',
    isUrgent: true,
    duration: '2 months',
    description: 'Certified welder for structural steel fabrication and installation at an industrial warehouse site.',
    experience: '3+ years',
  },
  {
    title: 'Tile Fitter',
    company: 'FloorMaster Pvt Ltd',
    location: 'Chennai, Tamil Nadu',
    quantity: '4',
    salary: 700,
    salaryType: 'daily',
    isUrgent: false,
    duration: '1 month',
    description: 'Tile fitter required for floor and wall tiling in a hotel renovation project. Must have experience with large-format tiles.',
    experience: '2+ years',
  },
  {
    title: 'Civil Supervisor',
    company: 'Apex Builders',
    location: 'Ahmedabad, Gujarat',
    quantity: '1',
    salary: 35000,
    salaryType: 'monthly',
    isUrgent: false,
    duration: '6 months',
    description: 'Civil supervisor to oversee day-to-day construction activities, manage labour, and ensure quality standards on a residential project.',
    experience: '5+ years',
  },
  {
    title: 'Helper / Labour',
    company: 'QuickBuild Contractors',
    location: 'Jaipur, Rajasthan',
    quantity: '10',
    salary: 500,
    salaryType: 'daily',
    isUrgent: true,
    duration: '2 months',
    description: 'General construction helpers needed for material handling, site cleaning, and assisting skilled workers on a large housing project.',
    experience: 'Fresher',
  },
  {
    title: 'AC Technician',
    company: 'CoolAir Services',
    location: 'Noida, Uttar Pradesh',
    quantity: '2',
    salary: 28000,
    salaryType: 'monthly',
    isUrgent: false,
    duration: 'Permanent',
    description: 'AC technician for installation, servicing, and repair of split and central AC units in residential and commercial properties.',
    experience: '2+ years',
  },
];

const seed = async () => {
  await connectDB();

  let vendor = await User.findOne({ userType: 'vendor' });

  if (!vendor) {
    vendor = await User.create({
      name: 'Seed Vendor',
      phone: '9000000001',
      userType: 'vendor',
      companyName: 'Seed Company',
      verificationStatus: 'verified',
      isPhoneVerified: true,
    });
    console.log('Created seed vendor user');
  }

  await Job.deleteMany({});
  console.log('Cleared existing jobs');

  await Job.insertMany(jobs.map((job) => ({ ...job, postedBy: vendor._id })));
  console.log(`✅ Seeded ${jobs.length} jobs successfully`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
