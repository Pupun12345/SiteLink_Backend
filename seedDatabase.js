const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Job = require('./models/job');
const User = require('./models/User');
require('dotenv').config();

// Sample Workers Data
const sampleWorkers = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    password: "password123",
    phone: "9234567890",
    userType: "worker",
    role: "worker",
    city: "Austin",
    experience: "5+ Years",
    age: 32,
    dailyRate: 250,
    verificationStatus: "verified",
    isVerified: true,
    profileImage: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    password: "password123",
    phone: "8345678901",
    userType: "worker",
    role: "worker",
    city: "Denver",
    experience: "3-5 Years",
    age: 28,
    dailyRate: 200,
    verificationStatus: "pending",
    isVerified: false,
    profileImage: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    name: "Mike Rodriguez",
    email: "mike.rodriguez@example.com",
    password: "password123",
    phone: "7456789012",
    userType: "worker",
    role: "worker",
    city: "Houston",
    experience: "5+ Years",
    age: 35,
    dailyRate: 300,
    verificationStatus: "verified",
    isVerified: true,
    profileImage: "https://randomuser.me/api/portraits/men/2.jpg"
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    password: "password123",
    phone: "6567890123",
    userType: "worker",
    role: "worker",
    city: "Phoenix",
    experience: "3-5 Years",
    age: 30,
    dailyRate: 220,
    verificationStatus: "rejected",
    isVerified: false,
    verificationRejectedReason: "Incomplete certification documents",
    profileImage: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    name: "David Wilson",
    email: "david.wilson@example.com",
    password: "password123",
    phone: "9678901234",
    userType: "worker",
    role: "worker",
    city: "Seattle",
    experience: "5+ Years",
    age: 38,
    dailyRate: 280,
    verificationStatus: "pending",
    isVerified: false,
    profileImage: "https://randomuser.me/api/portraits/men/3.jpg"
  }
];

// Sample Vendors Data
const sampleVendors = [
  {
    name: "Apex Solutions Ltd",
    email: "contact@apexsolutions.com",
    password: "password123",
    phone: "8789012345",
    userType: "vendor",
    role: "vendor",
    city: "Austin",
    companyName: "Apex Solutions Ltd",
    ownerName: "Robert Johnson",
    gstNumber: "27ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    licenseNumber: "LIC001234",
    projectTypes: ["Residential Building", "Commercial Building", "Infrastructure"],
    verificationStatus: "verified",
    isVerified: true,
    adminRating: 4,
    adminRatingComment: "Excellent safety record and professional service",
    companyLogo: "https://via.placeholder.com/100x100?text=APEX"
  },
  {
    name: "Global Infra Corp",
    email: "info@globalinfra.com",
    password: "password123",
    phone: "7890123456",
    userType: "vendor",
    role: "vendor",
    city: "Denver",
    companyName: "Global Infra Corp",
    ownerName: "Lisa Chen",
    gstNumber: "08FGHIJ5678K1Z2",
    panNumber: "FGHIJ5678K",
    licenseNumber: "LIC005678",
    projectTypes: ["Infrastructure", "Industrial Project"],
    verificationStatus: "pending",
    isVerified: false,
    companyLogo: "https://via.placeholder.com/100x100?text=GIC"
  },
  {
    name: "TechLink Systems",
    email: "support@techlinksys.com",
    password: "password123",
    phone: "6901234567",
    userType: "vendor",
    role: "vendor",
    city: "Houston",
    companyName: "TechLink Systems",
    ownerName: "Mark Thompson",
    gstNumber: "19KLMNO9012P1Z8",
    panNumber: "KLMNO9012P",
    licenseNumber: "LIC009012",
    projectTypes: ["Industrial Project", "Infrastructure"],
    verificationStatus: "verified",
    isVerified: true,
    adminRating: 5,
    adminRatingComment: "Outstanding technical expertise and reliability",
    companyLogo: "https://via.placeholder.com/100x100?text=TLS"
  },
  {
    name: "Urban Builders",
    email: "contact@urbanbuilders.com",
    password: "password123",
    phone: "8012345678",
    userType: "vendor",
    role: "vendor",
    city: "Phoenix",
    companyName: "Urban Builders",
    ownerName: "Jennifer Martinez",
    gstNumber: "04PQRST3456U1Z1",
    panNumber: "PQRST3456U",
    licenseNumber: "LIC003456",
    projectTypes: ["Residential Building", "Commercial Building"],
    verificationStatus: "rejected",
    isVerified: false,
    verificationRejectedReason: "Invalid GST registration details",
    companyLogo: "https://via.placeholder.com/100x100?text=UB"
  },
  {
    name: "Skyline Structures",
    email: "admin@skylinestructures.com",
    password: "password123",
    phone: "9123456789",
    userType: "vendor",
    role: "vendor",
    city: "Seattle",
    companyName: "Skyline Structures",
    ownerName: "Michael Brown",
    gstNumber: "53VWXYZ7890A1Z3",
    panNumber: "VWXYZ7890A",
    licenseNumber: "LIC007890",
    projectTypes: ["Commercial Building", "Infrastructure"],
    verificationStatus: "pending",
    isVerified: false,
    companyLogo: "https://via.placeholder.com/100x100?text=SS"
  }
];

// Sample Jobs Data
const sampleJobs = [
  {
    title: "Site Safety Manager",
    company: "Apex Solutions Ltd",
    location: "Austin, TX",
    type: "Full-time Contract",
    quantity: "4",
    description: "Detailed oversight of construction site safety, ensuring compliance with all local and federal regulations. Responsible for hazard identification and mitigation strategy. You will lead the safety protocols for our new high-rise residential project in central Austin, coordinating with both site engineers and regional OSHA inspectors.",
    skills: ["OSHA 30", "First Aid", "Risk Assessment"],
    experience: "5+ Years in High-Rise Construction",
    equipment: [
      "Standard PPE (Hard hat, high-vis vest, steel-toe boots)",
      "Digital Log Tablet (provided or bring-your-own)"
    ],
    projectSite: "Austin South Congress Project",
    address: "1200 S Congress Ave, Austin, TX 78704",
    status: "Open",
    applicationsCount: 24,
    mapImage: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Civil Engineer",
    company: "Global Infra Corp",
    location: "Denver, CO",
    type: "On-site",
    quantity: "2",
    description: "Responsible for designing and overseeing civil engineering projects. This includes structural analysis, site planning, and ensuring compliance with building codes.",
    skills: ["AutoCAD", "Structural Analysis", "Project Management"],
    experience: "3+ Years in Civil Engineering",
    equipment: [
      "Engineering Software Suite",
      "Safety Gear"
    ],
    projectSite: "Denver Downtown Project",
    address: "1500 Larimer St, Denver, CO 80202",
    status: "Filled",
    applicationsCount: 8,
    mapImage: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Senior Technician",
    company: "TechLink Systems",
    location: "Houston, TX",
    type: "Offshore",
    quantity: "12",
    description: "Advanced technical support for offshore operations. Requires expertise in marine systems and remote diagnostics.",
    skills: ["Marine Systems", "Remote Diagnostics", "Technical Support"],
    experience: "5+ Years in Offshore Operations",
    equipment: [
      "Marine Safety Equipment",
      "Diagnostic Tools"
    ],
    projectSite: "Houston Offshore Platform",
    address: "Marine Operations Center, Houston, TX 77001",
    status: "Closed",
    applicationsCount: 142,
    mapImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Crane Operator",
    company: "Urban Builders",
    location: "Phoenix, AZ",
    type: "Heavy Machinery",
    quantity: "1",
    description: "Operate heavy cranes for construction projects. Requires certification and experience with various crane types.",
    skills: ["Crane Operation", "Heavy Machinery", "Safety Protocols"],
    experience: "2+ Years Crane Operating Experience",
    equipment: [
      "Crane Operator Certification",
      "Safety Harness"
    ],
    projectSite: "Phoenix Construction Site",
    address: "456 Industrial Blvd, Phoenix, AZ 85001",
    status: "Cancelled",
    applicationsCount: 3,
    mapImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Structural Inspector",
    company: "Skyline Structures",
    location: "Seattle, WA",
    type: "Contractual",
    quantity: "2",
    description: "Inspect structural integrity of buildings and infrastructure. Ensure compliance with safety standards and building codes.",
    skills: ["Structural Inspection", "Building Codes", "Safety Standards"],
    experience: "3+ Years in Structural Inspection",
    equipment: [
      "Inspection Tools",
      "Safety Equipment"
    ],
    projectSite: "Seattle High-Rise Project",
    address: "789 Construction Way, Seattle, WA 98101",
    status: "Open",
    applicationsCount: 19,
    mapImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Project Manager",
    company: "Apex Solutions Ltd",
    location: "Austin, TX",
    type: "Full-time Contract",
    quantity: "1",
    description: "Lead and coordinate construction projects from planning to completion. Manage teams, budgets, and timelines.",
    skills: ["Project Management", "Leadership", "Budget Management"],
    experience: "8+ Years in Construction Management",
    equipment: [
      "Project Management Software",
      "Communication Tools"
    ],
    projectSite: "Austin Commercial Complex",
    address: "2500 E Riverside Dr, Austin, TX 78741",
    status: "Open",
    applicationsCount: 15,
    mapImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Electrical Technician",
    company: "TechLink Systems",
    location: "Houston, TX",
    type: "On-site",
    quantity: "3",
    description: "Install, maintain, and repair electrical systems in industrial facilities. Work with high-voltage equipment.",
    skills: ["Electrical Systems", "High Voltage", "Troubleshooting"],
    experience: "4+ Years in Industrial Electrical",
    equipment: [
      "Electrical Testing Equipment",
      "Safety Gear"
    ],
    projectSite: "Houston Industrial Park",
    address: "3000 Industrial Blvd, Houston, TX 77032",
    status: "Open",
    applicationsCount: 7,
    mapImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Welding Specialist",
    company: "Urban Builders",
    location: "Phoenix, AZ",
    type: "Contractual",
    quantity: "5",
    description: "Perform specialized welding operations on structural steel and heavy machinery components.",
    skills: ["Arc Welding", "TIG Welding", "Blueprint Reading"],
    experience: "6+ Years in Structural Welding",
    equipment: [
      "Welding Equipment",
      "Safety Gear"
    ],
    projectSite: "Phoenix Steel Fabrication",
    address: "1800 Manufacturing Way, Phoenix, AZ 85034",
    status: "Filled",
    applicationsCount: 32,
    mapImage: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800"
  }
];

// Admin User
const adminUser = {
  name: "Admin User",
  email: "admin@sitelink.com",
  password: "admin123",
  phone: "9111111111",
  userType: "admin",
  role: "admin",
  city: "New York",
  isVerified: true,
  verificationStatus: "verified"
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords for all users
    const saltRounds = 10;
    
    // Hash admin password
    adminUser.password = await bcrypt.hash(adminUser.password, saltRounds);
    
    // Hash worker passwords
    for (let worker of sampleWorkers) {
      worker.password = await bcrypt.hash(worker.password, saltRounds);
    }
    
    // Hash vendor passwords
    for (let vendor of sampleVendors) {
      vendor.password = await bcrypt.hash(vendor.password, saltRounds);
    }

    // Insert admin user
    const admin = await User.create(adminUser);
    console.log('Created admin user');

    // Insert workers
    const workers = await User.insertMany(sampleWorkers);
    console.log(`Inserted ${workers.length} workers`);

    // Insert vendors
    const vendors = await User.insertMany(sampleVendors);
    console.log(`Inserted ${vendors.length} vendors`);

    // Get a verified vendor to assign as job poster
    const verifiedVendor = vendors.find(v => v.verificationStatus === 'verified');
    
    // Add postedBy field to jobs
    const jobsWithPoster = sampleJobs.map(job => ({
      ...job,
      postedBy: verifiedVendor ? verifiedVendor._id : vendors[0]._id
    }));

    // Insert jobs
    const jobs = await Job.insertMany(jobsWithPoster);
    console.log(`Inserted ${jobs.length} jobs`);

    console.log('\n=== SEEDING COMPLETED SUCCESSFULLY ===');
    console.log('\nTest Credentials:');
    console.log('Admin Login:');
    console.log('  Email: admin@sitelink.com');
    console.log('  Password: admin123');
    console.log('\nSample Worker Login:');
    console.log('  Email: john.smith@example.com');
    console.log('  Password: password123');
    console.log('\nSample Vendor Login:');
    console.log('  Email: contact@apexsolutions.com');
    console.log('  Password: password123');
    console.log('\nDatabase Summary:');
    console.log(`- Admin Users: 1`);
    console.log(`- Workers: ${workers.length} (2 verified, 2 pending, 1 rejected)`);
    console.log(`- Vendors: ${vendors.length} (2 verified, 2 pending, 1 rejected)`);
    console.log(`- Jobs: ${jobs.length} (4 open, 2 filled, 1 closed, 1 cancelled)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();