const User = require('../models/User');
const Skill = require('../models/Skill');
const { generateOTP, getOTPExpiry } = require('../utils/otpUtils');
const { sendOtpSms } = require('../utils/sendOtpSms');
const notifyUser = require('../utils/notifyUser');
const { hasActiveSubscription } = require('../utils/subscription');

const STATES = [
  { id: 1, name: 'Andhra Pradesh' },
  { id: 2, name: 'Arunachal Pradesh' },
  { id: 3, name: 'Assam' },
  { id: 4, name: 'Bihar' },
  { id: 5, name: 'Chhattisgarh' },
  { id: 6, name: 'Goa' },
  { id: 7, name: 'Gujarat' },
  { id: 8, name: 'Haryana' },
  { id: 9, name: 'Himachal Pradesh' },
  { id: 10, name: 'Jharkhand' },
  { id: 11, name: 'Karnataka' },
  { id: 12, name: 'Kerala' },
  { id: 13, name: 'Madhya Pradesh' },
  { id: 14, name: 'Maharashtra' },
  { id: 15, name: 'Manipur' },
  { id: 16, name: 'Meghalaya' },
  { id: 17, name: 'Mizoram' },
  { id: 18, name: 'Nagaland' },
  { id: 19, name: 'Odisha' },
  { id: 20, name: 'Punjab' },
  { id: 21, name: 'Rajasthan' },
  { id: 22, name: 'Sikkim' },
  { id: 23, name: 'Tamil Nadu' },
  { id: 24, name: 'Telangana' },
  { id: 25, name: 'Tripura' },
  { id: 26, name: 'Uttar Pradesh' },
  { id: 27, name: 'Uttarakhand' },
  { id: 28, name: 'West Bengal' },
  { id: 29, name: 'Delhi' },
  { id: 30, name: 'Jammu & Kashmir' },
];

const CITIES = {

  // 1. ANDHRA PRADESH - 26 DISTRICTS
  1: [
    'Alluri Sitharama Raju',
    'Anakapalli',
    'Ananthapuramu',
    'Annamayya',
    'Bapatla',
    'Chittoor',
    'Dr. B. R. Ambedkar Konaseema',
    'East Godavari',
    'Eluru',
    'Guntur',
    'Kakinada',
    'Krishna',
    'Kurnool',
    'Nandyal',
    'NTR',
    'Palnadu',
    'Parvathipuram Manyam',
    'Prakasam',
    'Srikakulam',
    'Sri Potti Sriramulu Nellore',
    'Sri Sathya Sai',
    'Tirupati',
    'Visakhapatnam',
    'Vizianagaram',
    'West Godavari',
    'YSR Kadapa'
  ],

  // 2. ARUNACHAL PRADESH - 28 DISTRICTS
  2: [
    'Anjaw',
    'Bichom',
    'Changlang',
    'Dibang Valley',
    'East Kameng',
    'East Siang',
    'Itanagar Capital Complex',
    'Kamle',
    'Keyi Panyor',
    'Kra Daadi',
    'Kurung Kumey',
    'Lepa Rada',
    'Lohit',
    'Longding',
    'Lower Dibang Valley',
    'Lower Siang',
    'Lower Subansiri',
    'Namsai',
    'Pakke-Kessang',
    'Papum Pare',
    'Shi-Yomi',
    'Siang',
    'Tawang',
    'Tirap',
    'Upper Siang',
    'Upper Subansiri',
    'West Kameng',
    'West Siang'
  ],

  // 3. ASSAM - 35 DISTRICTS
  3: [
    'Baksa',
    'Bajali',
    'Barpeta',
    'Biswanath',
    'Bongaigaon',
    'Cachar',
    'Charaideo',
    'Chirang',
    'Darrang',
    'Dhemaji',
    'Dhubri',
    'Dibrugarh',
    'Dima Hasao',
    'Goalpara',
    'Golaghat',
    'Hailakandi',
    'Hojai',
    'Jorhat',
    'Kamrup',
    'Kamrup Metropolitan',
    'Karbi Anglong',
    'Karimganj',
    'Kokrajhar',
    'Lakhimpur',
    'Majuli',
    'Morigaon',
    'Nagaon',
    'Nalbari',
    'Sivasagar',
    'Sonitpur',
    'South Salmara-Mankachar',
    'Tamulpur',
    'Tinsukia',
    'Udalguri',
    'West Karbi Anglong'
  ],

  // 4. BIHAR - 38 DISTRICTS
  4: [
    'Araria',
    'Arwal',
    'Aurangabad',
    'Banka',
    'Begusarai',
    'Bhagalpur',
    'Bhojpur',
    'Buxar',
    'Darbhanga',
    'East Champaran',
    'Gaya',
    'Gopalganj',
    'Jamui',
    'Jehanabad',
    'Kaimur',
    'Katihar',
    'Khagaria',
    'Kishanganj',
    'Lakhisarai',
    'Madhepura',
    'Madhubani',
    'Munger',
    'Muzaffarpur',
    'Nalanda',
    'Nawada',
    'Patna',
    'Purnia',
    'Rohtas',
    'Saharsa',
    'Samastipur',
    'Saran',
    'Sheikhpura',
    'Sheohar',
    'Sitamarhi',
    'Siwan',
    'Supaul',
    'Vaishali',
    'West Champaran'
  ],

  // 5. CHHATTISGARH - 33 DISTRICTS
  5: [
    'Balod',
    'Baloda Bazar',
    'Balrampur-Ramanujganj',
    'Bastar',
    'Bemetara',
    'Bijapur',
    'Bilaspur',
    'Dantewada',
    'Dhamtari',
    'Durg',
    'Gariaband',
    'Gaurela-Pendra-Marwahi',
    'Janjgir-Champa',
    'Jashpur',
    'Kanker',
    'Kawardha',
    'Khairagarh-Chhuikhadan-Gandai',
    'Kondagaon',
    'Korba',
    'Koriya',
    'Mahasamund',
    'Manendragarh-Chirmiri-Bharatpur',
    'Mohla-Manpur-Ambagarh Chowki',
    'Mungeli',
    'Narayanpur',
    'Raigarh',
    'Raipur',
    'Rajnandgaon',
    'Sarangarh-Bilaigarh',
    'Sukma',
    'Surajpur',
    'Surguja',
    'Balodabazar'
  ],

  // 6. GOA - 2 DISTRICTS
  6: [
    'North Goa',
    'South Goa'
  ],

  // 7. GUJARAT - 34 DISTRICTS
  7: [
    'Ahmedabad',
    'Amreli',
    'Anand',
    'Aravalli',
    'Banaskantha',
    'Bharuch',
    'Bhavnagar',
    'Botad',
    'Chhota Udaipur',
    'Dahod',
    'Dang',
    'Devbhoomi Dwarka',
    'Gandhinagar',
    'Gir Somnath',
    'Jamnagar',
    'Junagadh',
    'Kheda',
    'Kutch',
    'Mahisagar',
    'Mehsana',
    'Morbi',
    'Narmada',
    'Navsari',
    'Panchmahal',
    'Patan',
    'Porbandar',
    'Rajkot',
    'Sabarkantha',
    'Surat',
    'Surendranagar',
    'Tapi',
    'Vadodara',
    'Valsad',
    'Vav-Tharad'
  ],

  // 8. HARYANA - 22 DISTRICTS
  8: [
    'Ambala',
    'Bhiwani',
    'Charkhi Dadri',
    'Faridabad',
    'Fatehabad',
    'Gurugram',
    'Hisar',
    'Jhajjar',
    'Jind',
    'Kaithal',
    'Karnal',
    'Kurukshetra',
    'Mahendragarh',
    'Nuh',
    'Palwal',
    'Panchkula',
    'Panipat',
    'Rewari',
    'Rohtak',
    'Sirsa',
    'Sonipat',
    'Yamunanagar'
  ],

  // 9. HIMACHAL PRADESH - 12 DISTRICTS
  9: [
    'Bilaspur',
    'Chamba',
    'Hamirpur',
    'Kangra',
    'Kinnaur',
    'Kullu',
    'Lahaul and Spiti',
    'Mandi',
    'Shimla',
    'Sirmaur',
    'Solan',
    'Una'
  ],

  // 10. JHARKHAND - 24 DISTRICTS
  10: [
    'Bokaro',
    'Chatra',
    'Deoghar',
    'Dhanbad',
    'Dumka',
    'East Singhbhum',
    'Garhwa',
    'Giridih',
    'Godda',
    'Gumla',
    'Hazaribagh',
    'Jamtara',
    'Khunti',
    'Koderma',
    'Latehar',
    'Lohardaga',
    'Pakur',
    'Palamu',
    'Ramgarh',
    'Ranchi',
    'Sahibganj',
    'Seraikela Kharsawan',
    'Simdega',
    'West Singhbhum'
  ],

  // 11. KARNATAKA - 31 DISTRICTS
  11: [
    'Bagalkot',
    'Ballari',
    'Belagavi',
    'Bengaluru Rural',
    'Bengaluru Urban',
    'Bidar',
    'Chamarajanagar',
    'Chikkaballapur',
    'Chikkamagaluru',
    'Chitradurga',
    'Dakshina Kannada',
    'Davanagere',
    'Dharwad',
    'Gadag',
    'Hassan',
    'Haveri',
    'Kalaburagi',
    'Kodagu',
    'Kolar',
    'Koppal',
    'Mandya',
    'Mysuru',
    'Raichur',
    'Ramanagara',
    'Shivamogga',
    'Tumakuru',
    'Udupi',
    'Uttara Kannada',
    'Vijayapura',
    'Vijayanagara',
    'Yadgir'
  ],

  // 12. KERALA - 14 DISTRICTS
  12: [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad'
  ],

  // 13. MADHYA PRADESH - 55 DISTRICTS
  13: [
    'Agar Malwa',
    'Alirajpur',
    'Anuppur',
    'Ashoknagar',
    'Balaghat',
    'Barwani',
    'Betul',
    'Bhind',
    'Bhopal',
    'Burhanpur',
    'Chhatarpur',
    'Chhindwara',
    'Damoh',
    'Datia',
    'Dewas',
    'Dhar',
    'Dindori',
    'Guna',
    'Gwalior',
    'Harda',
    'Indore',
    'Jabalpur',
    'Jhabua',
    'Katni',
    'Khandwa',
    'Khargone',
    'Maihar',
    'Mandla',
    'Mandsaur',
    'Mauganj',
    'Morena',
    'Narmadapuram',
    'Narsinghpur',
    'Neemuch',
    'Niwas',
    'Panna',
    'Pandhurna',
    'Raisen',
    'Rajgarh',
    'Ratlam',
    'Rewa',
    'Sagar',
    'Satna',
    'Sehore',
    'Seoni',
    'Shahdol',
    'Shajapur',
    'Sheopur',
    'Shivpuri',
    'Sidhi',
    'Singrauli',
    'Tikamgarh',
    'Ujjain',
    'Umaria',
    'Vidisha'
  ],

  // 14. MAHARASHTRA - 36 DISTRICTS
  14: [
    'Ahmednagar',
    'Akola',
    'Amravati',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Chhatrapati Sambhajinagar',
    'Dharashiv',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal'
  ],

  // 15. MANIPUR - 16 DISTRICTS
  15: [
    'Bishnupur',
    'Chandel',
    'Churachandpur',
    'Imphal East',
    'Imphal West',
    'Jiribam',
    'Kakching',
    'Kamjong',
    'Kangpokpi',
    'Noney',
    'Pherzawl',
    'Senapati',
    'Tamenglong',
    'Tengnoupal',
    'Thoubal',
    'Ukhrul'
  ],


  // 16. MEGHALAYA - 12 DISTRICTS
  16: [
    'East Garo Hills',
    'East Jaintia Hills',
    'East Khasi Hills',
    'Eastern West Khasi Hills',
    'North Garo Hills',
    'Ri-Bhoi',
    'South Garo Hills',
    'South West Garo Hills',
    'South West Khasi Hills',
    'West Garo Hills',
    'West Jaintia Hills',
    'West Khasi Hills'
  ],

  // 17. MIZORAM - 11 DISTRICTS
  17: [
    'Aizawl',
    'Champhai',
    'Hnahthial',
    'Khawzawl',
    'Kolasib',
    'Lawngtlai',
    'Lunglei',
    'Mamit',
    'Saiha',
    'Saitual',
    'Serchhip'
  ],

  // 18. NAGALAND - 17 DISTRICTS
  18: [
    'Chumoukedima',
    'Dimapur',
    'Kiphire',
    'Kohima',
    'Longleng',
    'Mokokchung',
    'Mon',
    'Niuland',
    'Noklak',
    'Peren',
    'Phek',
    'Shamator',
    'Tseminyu',
    'Tuensang',
    'Wokha',
    'Zunheboto',
    'Meluri'
  ],

  // 19. ODISHA - 30 DISTRICTS
  19: [
    'Angul',
    'Balangir',
    'Balasore',
    'Bargarh',
    'Bhadrak',
    'Boudh',
    'Cuttack',
    'Deogarh',
    'Dhenkanal',
    'Gajapati',
    'Ganjam',
    'Jagatsinghpur',
    'Jajpur',
    'Jharsuguda',
    'Kalahandi',
    'Kandhamal',
    'Kendrapara',
    'Kendujhar',
    'Khordha',
    'Koraput',
    'Malkangiri',
    'Mayurbhanj',
    'Nabarangpur',
    'Nayagarh',
    'Nuapada',
    'Puri',
    'Rayagada',
    'Sambalpur',
    'Subarnapur',
    'Sundargarh'
  ],

  // 20. PUNJAB - 23 DISTRICTS
  20: [
    'Amritsar',
    'Barnala',
    'Bathinda',
    'Faridkot',
    'Fatehgarh Sahib',
    'Fazilka',
    'Ferozepur',
    'Gurdaspur',
    'Hoshiarpur',
    'Jalandhar',
    'Kapurthala',
    'Ludhiana',
    'Malerkotla',
    'Mansa',
    'Moga',
    'Pathankot',
    'Patiala',
    'Rupnagar',
    'Sahibzada Ajit Singh Nagar',
    'Sangrur',
    'Shaheed Bhagat Singh Nagar',
    'Sri Muktsar Sahib',
    'Tarn Taran'
  ],

  // 21. RAJASTHAN - 41 DISTRICTS
  21: [
    'Ajmer',
    'Alwar',
    'Balotra',
    'Banswara',
    'Baran',
    'Barmer',
    'Beawar',
    'Bharatpur',
    'Bhilwara',
    'Bikaner',
    'Bundi',
    'Chittorgarh',
    'Churu',
    'Dausa',
    'Deeg',
    'Dholpur',
    'Didwana-Kuchamana',
    'Dudu',
    'Dungarpur',
    'Ganganagar',
    'Hanumangarh',
    'Jaipur',
    'Jaisalmer',
    'Jalore',
    'Jhalawar',
    'Jhunjhunu',
    'Jodhpur',
    'Karauli',
    'Khairthal-Tijara',
    'Kota',
    'Kotputli-Behror',
    'Nagaur',
    'Neem Ka Thana',
    'Pali',
    'Phalodi',
    'Pratapgarh',
    'Rajsamand',
    'Salumbar',
    'Sawai Madhopur',
    'Sikar',
    'Sirohi',
    'Tonk',
    'Udaipur'
  ],

  // 22. SIKKIM - 6 DISTRICTS
  22: [
    'Gangtok',
    'Mangan',
    'Namchi',
    'Pakyong',
    'Soreng',
    'Gyalshing'
  ],

  // 23. TAMIL NADU - 38 DISTRICTS
  23: [
    'Ariyalur',
    'Chengalpattu',
    'Chennai',
    'Coimbatore',
    'Cuddalore',
    'Dharmapuri',
    'Dindigul',
    'Erode',
    'Kallakurichi',
    'Kancheepuram',
    'Karur',
    'Krishnagiri',
    'Madurai',
    'Mayiladuthurai',
    'Nagapattinam',
    'Namakkal',
    'The Nilgiris',
    'Perambalur',
    'Pudukkottai',
    'Ramanathapuram',
    'Ranipet',
    'Salem',
    'Sivaganga',
    'Tenkasi',
    'Thanjavur',
    'Theni',
    'Thoothukudi',
    'Tiruchirappalli',
    'Tirunelveli',
    'Tirupathur',
    'Tiruppur',
    'Tiruvallur',
    'Tiruvannamalai',
    'Tiruvarur',
    'Vellore',
    'Viluppuram',
    'Virudhunagar'
  ],

  // 24. TELANGANA - 33 DISTRICTS
  24: [
    'Adilabad',
    'Bhadradri Kothagudem',
    'Hanamkonda',
    'Hyderabad',
    'Jagtial',
    'Jangaon',
    'Jayashankar Bhupalpally',
    'Jogulamba Gadwal',
    'Kamareddy',
    'Karimnagar',
    'Khammam',
    'Komaram Bheem Asifabad',
    'Mahabubabad',
    'Mahabubnagar',
    'Mancherial',
    'Medak',
    'Medchal-Malkajgiri',
    'Mulugu',
    'Nagarkurnool',
    'Nalgonda',
    'Narayanpet',
    'Nirmal',
    'Nizamabad',
    'Peddapalli',
    'Rajanna Sircilla',
    'Rangareddy',
    'Sangareddy',
    'Siddipet',
    'Suryapet',
    'Vikarabad',
    'Wanaparthy',
    'Warangal',
    'Yadadri Bhuvanagiri'
  ],

  // 25. TRIPURA - 8 DISTRICTS
  25: [
    'Dhalai',
    'Gomati',
    'Khowai',
    'North Tripura',
    'Sepahijala',
    'South Tripura',
    'Unakoti',
    'West Tripura'
  ],

  // 26. UTTAR PRADESH - 75 DISTRICTS
  26: [
    'Agra',
    'Aligarh',
    'Ambedkar Nagar',
    'Amethi',
    'Amroha',
    'Auraiya',
    'Ayodhya',
    'Azamgarh',
    'Baghpat',
    'Bahraich',
    'Ballia',
    'Balrampur',
    'Banda',
    'Barabanki',
    'Bareilly',
    'Basti',
    'Bhadohi',
    'Bijnor',
    'Budaun',
    'Bulandshahr',
    'Chandauli',
    'Chitrakoot',
    'Deoria',
    'Etah',
    'Etawah',
    'Farrukhabad',
    'Fatehpur',
    'Firozabad',
    'Gautam Buddha Nagar',
    'Ghaziabad',
    'Ghazipur',
    'Gonda',
    'Gorakhpur',
    'Hamirpur',
    'Hapur',
    'Hardoi',
    'Hathras',
    'Jalaun',
    'Jaunpur',
    'Jhansi',
    'Kannauj',
    'Kanpur Dehat',
    'Kanpur Nagar',
    'Kasganj',
    'Kaushambi',
    'Kushinagar',
    'Lakhimpur Kheri',
    'Lalitpur',
    'Lucknow',
    'Maharajganj',
    'Mahoba',
    'Mainpuri',
    'Mathura',
    'Mau',
    'Meerut',
    'Mirzapur',
    'Moradabad',
    'Muzaffarnagar',
    'Pilibhit',
    'Pratapgarh',
    'Prayagraj',
    'Raebareli',
    'Rampur',
    'Saharanpur',
    'Sambhal',
    'Sant Kabir Nagar',
    'Shahjahanpur',
    'Shamli',
    'Shravasti',
    'Siddharthnagar',
    'Sitapur',
    'Sonbhadra',
    'Sultanpur',
    'Unnao',
    'Varanasi'
  ],

  // 27. UTTARAKHAND - 13 DISTRICTS
  27: [
    'Almora',
    'Bageshwar',
    'Chamoli',
    'Champawat',
    'Dehradun',
    'Haridwar',
    'Nainital',
    'Pauri Garhwal',
    'Pithoragarh',
    'Rudraprayag',
    'Tehri Garhwal',
    'Udham Singh Nagar',
    'Uttarkashi'
  ],

  // 28. WEST BENGAL - 23 DISTRICTS
  28: [
    'Alipurduar',
    'Bankura',
    'Paschim Bardhaman',
    'Purba Bardhaman',
    'Birbhum',
    'Cooch Behar',
    'Darjeeling',
    'Hooghly',
    'Howrah',
    'Jalpaiguri',
    'Jhargram',
    'Kalimpong',
    'Kolkata',
    'Maldah',
    'Murshidabad',
    'Nadia',
    'North 24 Parganas',
    'South 24 Parganas',
    'Paschim Medinipur',
    'Purba Medinipur',
    'Uttar Dinajpur',
    'Dakshin Dinajpur',
    'Siliguri'
  ],

  // 29. DELHI - 11 DISTRICTS
  29: [
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'Shahdara',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi'
  ],

  // 30. JAMMU & KASHMIR - 20 DISTRICTS
  30: [
    'Anantnag',
    'Bandipora',
    'Baramulla',
    'Budgam',
    'Doda',
    'Ganderbal',
    'Jammu',
    'Kathua',
    'Kishtwar',
    'Kulgam',
    'Kupwara',
    'Poonch',
    'Pulwama',
    'Rajouri',
    'Ramban',
    'Reasi',
    'Samba',
    'Shopian',
    'Srinagar',
    'Udhampur'
  ]
};


// @desc  Get all states
// @route GET /api/profile/states
exports.getStates = (req, res) => {
  res.status(200).json({ success: true, data: STATES });
};

// @desc  Get cities by state id
// @route GET /api/profile/cities/:stateId
exports.getCitiesByState = (req, res) => {
  const stateId = parseInt(req.params.stateId);
  if (isNaN(stateId)) return res.status(400).json({ success: false, message: 'Invalid state ID' });
  const state = STATES.find(s => s.id === stateId);

  if (!state) {
    return res.status(404).json({ success: false, message: 'State not found' });
  }

  const cities = (CITIES[stateId] || []).map((name, index) => ({ id: index + 1, name }));
  res.status(200).json({ success: true, state: state.name, data: cities });
};

function getLocationByIds(workStateID, workCityID) {
  const stateId = parseInt(workStateID);
  const cityId = parseInt(workCityID);

  const state = STATES.find(s => s.id === stateId);
  if (!state) return { workState: null, workCity: null };

  const cityName = (CITIES[stateId] || [])[cityId - 1];
  if (!cityName) return { workState: state.name, workCity: null };

  return { workState: state.name, workCity: cityName };
};

//Get Skills with number
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

exports.languages = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Language is required",
      });
    }

    const allowed = ['hindi', 'english'];
    const normalized = String(language).toLowerCase();
    if (!allowed.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Language must be one of: hindi, english",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language: normalized },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
      data: { language: user.language },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const regularUser = await User.findById(req.user.id);

    if (!regularUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Own posts have their own dedicated, paginated endpoint now
    // (GET /api/community/posts/mine) — not embedded here anymore.
    const user = regularUser.userType === 'worker'
      ? {
        id: regularUser._id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        profileImage: regularUser.profileImage,
        primarySkill: regularUser.primarySkill,
        skills: regularUser.skills,
        workCity: regularUser.city,
        workState: regularUser.workState,
        userType: regularUser.userType,
        createdAt: regularUser.createdAt,
        location: regularUser.location,
        dateOfBirth: regularUser.dateOfBirth,
        phone: regularUser.phone,
        // DB me field `experience` hai, par app (create/edit dono me) ise
        // `totalExperience` naam se bhejti/padhti hai — wahi naam wapas do.
        totalExperience: regularUser.experience,
        experienceDescription: regularUser.experienceDescription,
        gender: regularUser.gender,
        // Rating SIRF admin deta hai (admin panel se). Automatic wali
        // rating (job outcomes se) poori hata di gayi hai.
        // null = abhi admin ne rating nahi di.
        rating: regularUser.adminRating ?? null,
        ratingComment: regularUser.adminRatingComment || null,
        willingtoRelocate: regularUser.willingtoRelocate,
        salaryType: regularUser.salaryType,
        salary: regularUser.salary,
        experienceCertificate: regularUser.experienceCertificate,
        governmentID: regularUser.governmentID,
        workSamplesPhoto: regularUser.workSamplesPhoto,
        isPhoneVerified: regularUser.isPhoneVerified,
        isVerified: regularUser.isVerified,
        language: regularUser.language,
        verificationStatus: regularUser.verificationStatus,
        subscription: regularUser.subscription,
        // Live plan status. `subscription` boolean stale ho jaata hai (expiry
        // par koi cron use false nahi karta), isliye app paid features
        // (Contact Support waghairah) ka lock isi se decide karti hai.
        hasActivePlan: hasActiveSubscription(regularUser)
      }
      : {
        id: regularUser._id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        profileImage: regularUser.profileImage,
        userType: regularUser.userType,
        createdAt: regularUser.createdAt,
        workCity: regularUser.city,
        workState: regularUser.workState,
        phone: regularUser.phone,
        gstNumber: regularUser.gstNumber,
        companyName: regularUser.companyName,
        companyLogo: regularUser.companyLogo,
        designation: regularUser.role,
        workArea: regularUser.workArea,
        whatsappNumber: regularUser.whatsappNumber,
        website: regularUser.website,
        panNumber: regularUser.panNumber,
        panCardImage: regularUser.panCardImage,
        gstCertificate: regularUser.gstCertificate,
        isPhoneVerified: regularUser.isPhoneVerified,
        isVerified: regularUser.isVerified,
        language: regularUser.language,
        verificationStatus: regularUser.verificationStatus,
        subscription: regularUser.subscription,
        // Live plan status. `subscription` boolean stale ho jaata hai (expiry
        // par koi cron use false nahi karta), isliye app paid features
        // (Contact Support waghairah) ka lock isi se decide karti hai.
        hasActivePlan: hasActiveSubscription(regularUser)
      };

    return res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Create Profile - Worker
exports.createWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.userType && user.userType !== 'worker') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { primarySkillId, secondarySkillId, otherSkill } = req.body;

    if (!primarySkillId) return res.status(400).json({ success: false, message: 'Primary skill is required' });

    const parsedPrimarySkillId = parseInt(primarySkillId);
    if (isNaN(parsedPrimarySkillId)) return res.status(400).json({ success: false, message: 'Invalid primary skill ID' });

    const primarySkillDoc = await Skill.findOne({ id: parsedPrimarySkillId });

    if (!primarySkillDoc) return res.status(404).json({ success: false, message: 'Primary skill not found' });

    const newSkills = [];

    let parsedSecondarySkillId = secondarySkillId;
    if (typeof secondarySkillId === 'string' && secondarySkillId.startsWith('[')) {
      try { parsedSecondarySkillId = JSON.parse(secondarySkillId); } catch { parsedSecondarySkillId = [secondarySkillId]; }
    }
    const secondaryIds = Array.isArray(parsedSecondarySkillId) ? parsedSecondarySkillId : (parsedSecondarySkillId != null ? [parsedSecondarySkillId] : []);
    const filteredSecondaryIds = secondaryIds.filter(id => id != null && id !== '' && id !== '0' && id !== 'none' && id !== 0);

    const uniqueSecondaryIds = [...new Set(
      filteredSecondaryIds.filter(
        id => parseInt(id) !== parsedPrimarySkillId
      )
    )];
    for (const secondary of uniqueSecondaryIds) {
      const parsedSecondaryId = parseInt(secondary);
      if (isNaN(parsedSecondaryId)) return res.status(400).json({ success: false, message: 'Invalid secondary skill ID' });
      const secondarySkillDoc = await Skill.findOne({ id: parsedSecondaryId });
      if (!secondarySkillDoc) return res.status(404).json({ success: false, message: 'Secondary skill not found' });
      newSkills.push({ skillId: secondarySkillDoc.id, skillName: secondarySkillDoc.name });
    }

    if (otherSkill && otherSkill.trim()) {
      newSkills.push({ skillId: 0, skillName: otherSkill.trim() });
    }

    user.skills = newSkills;


    const { workStateID, workCityID } = req.body;

    const { workState, workCity } = getLocationByIds(workStateID, workCityID);

    if ((workStateID && !workState) || (workCityID && !workCity)) {
      return res.status(404).json({ success: false, message: 'Invalid work state or city' });
    }

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workState && workCity) {
      user.workState = workState;
      user.city = workCity;
    }

    const { name, dateOfBirth, gender, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, location } = req.body;

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({ success: false, message: 'Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)' });
      }
      if (isNaN(new Date(dateOfBirth).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth' });
      }

      // Additional check to ensure DOB is not in the future
      const dob = new Date(dateOfBirth);
      if (
        isNaN(dob.getTime()) ||
        dob > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid DOB"
        });
      }

      const age = new Date().getFullYear() - dob.getFullYear();

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "Minimum age is 18"
        });
      }

      user.dateOfBirth = dob;
    }


    if (name) user.name = name.trim();

    if (gender) {
      const allowedGenders = ['male', 'female', 'other'];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender"
        });
      }

      // Schema enum capitalized hai ('Male'/'Female'/'Other') par app
      // lowercase bhejti hai — normalize karo warna save validation fail.
      user.gender =
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }

    if (totalExperience !== undefined) {
      const exp = Number(totalExperience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return res.status(400).json({
          success: false,
          message: "Invalid experience"
        });
      }
      user.experience = exp;
    }

    if (experienceDescription) {
      if (experienceDescription.length > 1000) {
        return res.status(400).json({ success: false, message: "Experience description must be less than 1000 characters" });
      }
      user.experienceDescription = experienceDescription.trim();
    }
    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType.toLowerCase();

    if (salary !== undefined) {
      const parsedSalary = Number(salary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary"
        });
      }
      user.salary = parsedSalary;
    }

    if (location) user.location = location.trim();

    user.primarySkill = primarySkillDoc.name;
    user.role = primarySkillDoc.name;
    user.userType = 'worker';
    user.isProfileCreated = true;

    if (!req.files || !req.files.governmentID) {
      return res.status(400).json({
        success: false,
        message: "Government ID is required."
      });
    }

    if (req.files.profileImage) {
      user.profileImage = req.files.profileImage[0].path;
    }

    if (req.files.workSamplesPhoto) {
      user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
    }

    if (req.files.experienceCertificate) {
      user.experienceCertificate =
        req.files.experienceCertificate.map((f) => f.path);
    }

    // Mandatory field
    user.governmentID = req.files.governmentID[0].path;
    await user.save();

    res.json({
      success: true,
      message: 'Worker profile created successfully',
      user: { id: user._id, name: user.name, phone: user.phone, userType: user.userType, role: user.role, profileImage: user.profileImage, workCity: user.city, primarySkill: user.primarySkill, additionalSkills: user.skills, totalExperience: user.experience, workState: user.workState, willingtoRelocate: user.willingtoRelocate, salaryType: user.salaryType, salary: user.salary, governmentID: user.governmentID, workSamplesPhoto: user.workSamplesPhoto, experienceCertificate: user.experienceCertificate, language: user.language, isVerified: user.isVerified, verificationStatus: user.verificationStatus, isProfileCreated: user.isProfileCreated, subscription: user.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Profile - Worker
exports.editWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'worker') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { primarySkillId, secondarySkillId, otherSkill, name, dateOfBirth, gender, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, location, workStateID, workCityID } = req.body;

    if (primarySkillId) {
      const parsedPrimaryId = parseInt(primarySkillId);
      if (isNaN(parsedPrimaryId)) return res.status(400).json({ success: false, message: 'Invalid primary skill ID' });
      const primarySkillDoc = await Skill.findOne({ id: parsedPrimaryId });
      if (!primarySkillDoc) return res.status(404).json({ success: false, message: 'Primary skill not found' });

      let parsedSecondarySkillId = secondarySkillId;
      if (typeof secondarySkillId === 'string' && secondarySkillId.startsWith('[')) {
        try { parsedSecondarySkillId = JSON.parse(secondarySkillId); } catch { parsedSecondarySkillId = [secondarySkillId]; }
      }
      const secondaryIds = Array.isArray(parsedSecondarySkillId) ? parsedSecondarySkillId : (parsedSecondarySkillId != null ? [parsedSecondarySkillId] : []);
      const filteredSecondaryIds = secondaryIds.filter(id => id != null && id !== '' && id !== '0' && id !== 'none' && id !== 0);

      const uniqueSecondaryIds = [...new Set(
        filteredSecondaryIds.filter(
          id => parseInt(id) !== parsedPrimaryId
        )
      )];

      const newSkills = [];

      for (const secondary of uniqueSecondaryIds) {
        const parsedSecondaryId = parseInt(secondary);
        if (isNaN(parsedSecondaryId)) return res.status(400).json({ success: false, message: 'Invalid secondary skill ID' });
        const secondarySkillDoc = await Skill.findOne({ id: parsedSecondaryId });
        if (!secondarySkillDoc) return res.status(404).json({ success: false, message: 'Secondary skill not found' });
        newSkills.push({ skillId: secondarySkillDoc.id, skillName: secondarySkillDoc.name });
      }
      if (otherSkill && otherSkill.trim()) newSkills.push({ skillId: 0, skillName: otherSkill.trim() });

      user.skills = newSkills;
      user.markModified('skills');
      user.primarySkill = primarySkillDoc.name;
      user.role = primarySkillDoc.name;
    }

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (name) user.name = name.trim();
    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) return res.status(400).json({ success: false, message: 'Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)' });
      if (isNaN(new Date(dateOfBirth).getTime())) return res.status(400).json({ success: false, message: 'Invalid date of birth' });

      // Additional check to ensure DOB is not in the future
      const dob = new Date(dateOfBirth);
      if (
        isNaN(dob.getTime()) ||
        dob > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid DOB"
        });
      }

      const age = new Date().getFullYear() - dob.getFullYear();

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "Minimum age is 18"
        });
      }

      user.dateOfBirth = dob;
    }

    if (gender) {
      const allowedGenders = ['male', 'female', 'other'];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender"
        });
      }

      // Schema enum capitalized hai ('Male'/'Female'/'Other') par app
      // lowercase bhejti hai — normalize karo warna save validation fail.
      user.gender =
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }

    if (totalExperience !== undefined) {
      const exp = Number(totalExperience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return res.status(400).json({
          success: false,
          message: "Invalid experience"
        });
      }
      user.experience = exp;
    }

    if (experienceDescription) {
      if (experienceDescription.length > 1000) {
        return res.status(400).json({ success: false, message: "Experience description must be less than 1000 characters" });
      }
      user.experienceDescription = experienceDescription.trim();
    }

    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType.toLowerCase();

    if (salary !== undefined) {
      const parsedSalary = Number(salary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary"
        });
      }
      user.salary = parsedSalary;
    }

    if (location) user.location = location.trim();

    if (req.files) {
      if (req.files.profileImage) {
        user.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.workSamplesPhoto) user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
      if (req.files.governmentID) user.governmentID = req.files.governmentID[0].path;
    }

    // ── Experience certificates (multiple) ────────────────────────────
    // Edit me sirf naye files bhejna kaafi nahi: aisa karne par purane
    // certificates chup-chaap gayab ho jaate. Isliye app poori "final
    // list" batati hai — `keepExperienceCertificate` me wo purane paths
    // jo user ne rakhe, aur naye files upload karke.
    //
    // Final = rakhe hue + naye. `keepExperienceCertificate` bheja hi na
    // ho aur naye files bhi na hon, to field chhui hi nahi jaati.
    {
      const added = (req.files?.experienceCertificate || []).map((f) => f.path);
      const keepRaw = req.body.keepExperienceCertificate;

      if (keepRaw !== undefined || added.length) {
        let kept = [];
        if (keepRaw !== undefined) {
          try {
            const parsed = typeof keepRaw === 'string' ? JSON.parse(keepRaw) : keepRaw;
            kept = Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string' && p) : [];
          } catch {
            return res.status(400).json({
              success: false,
              message: 'keepExperienceCertificate must be a JSON array of paths',
            });
          }
        } else {
          // Sirf naye files aaye — purane jaise the waise rakho.
          kept = user.experienceCertificate || [];
        }
        user.experienceCertificate = [...kept, ...added];
      }
    }

    if (!user.governmentID) {
      return res.status(400).json({
        success: false,
        message: "Government ID is required."
      });
    }

    await user.save();
    const savedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Worker profile updated successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, workCity: savedUser.city, primarySkill: savedUser.primarySkill, additionalSkills: savedUser.skills, totalExperience: savedUser.experience, workState: savedUser.workState, willingtoRelocate: savedUser.willingtoRelocate, salaryType: savedUser.salaryType, salary: savedUser.salary, governmentID: savedUser.governmentID, workSamplesPhoto: savedUser.workSamplesPhoto, experienceCertificate: savedUser.experienceCertificate,language: user.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Create Profile - Vendor
exports.createVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.userType && user.userType !== 'vendor') return res.status(403).json({ success: false, message: 'Access denied' });

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website, workStateID, workCityID, panNumber, phone } = req.body;

    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!designation) return res.status(400).json({ success: false, message: 'Designation is required' });
    if (!panNumber) return res.status(400).json({ success: false, message: 'PanNumber is required' });

    // ── Contact number ────────────────────────────────────────────────
    // WhatsApp number ke alawa ek normal number bhi lete hain. Ye
    // `user.phone` hai — yani wahi number jise baad me OTP se badla jaa
    // sakta hai (POST /profile/phone/send-otp). Google se login karne
    // wale vendor ke paas ye hota hi nahi, isliye registration me maangna
    // zaroori hai.
    //
    // Google-login vendor ke paas phone nahi hota, par OTP-login wale ke
    // paas pehle se hota hai — tab dobara na maango to bhi chalega, par
    // aaye to validate + duplicate check karte hain.
    let parsedPhone = null;
    if (phone !== undefined && `${phone}`.trim() !== '') {
      parsedPhone = `${phone}`.trim();
      if (!/^[6-9]\d{9}$/.test(parsedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit phone number',
        });
      }
      // Kisi doosre account par ye number pehle se ho to saaf batao —
      // warna Mongo ka unique index E11000 phenkta hai jo user ko
      // "Internal server error" jaisa dikhta hai.
      if (parsedPhone !== user.phone) {
        const taken = await User.findOne({ phone: parsedPhone, _id: { $ne: user._id } }).select('_id');
        if (taken) {
          return res.status(409).json({
            success: false,
            message: 'This phone number is already registered with another account',
          });
        }
      }
    }
    if (!parsedPhone && !user.phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }


    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (companyName) user.companyName = companyName.trim();
    if (name) user.name = name.trim();
    if (email) user.email = email;
    if (designation) user.role = designation.trim();
    if (workArea) user.workArea = workArea.trim();
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (parsedPhone) user.phone = parsedPhone;
    if (website) user.website = website.trim();
    if (panNumber) user.panNumber = panNumber;
    user.userType = 'vendor';
    user.isProfileCreated = true;

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.companyLogo) user.companyLogo = req.files.companyLogo[0].path;
      if (req.files.panCardImage) user.panCardImage = req.files.panCardImage[0].path;
      if (req.files.gstCertificate) user.gstCertificate = req.files.gstCertificate[0].path;
    }

    if (!user.panCardImage) return res.status(400).json({ success: false, message: 'PanCard image is required' });
    if (!user.gstCertificate) return res.status(400).json({ success: false, message: 'GST Certificate image is required' });

    await user.save();
    const savedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Vendor profile created successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, email: savedUser.email, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, companyName: savedUser.companyName, companyLogo: savedUser.companyLogo, gstCertificate: savedUser.gstCertificate, panCardImage: savedUser.panCardImage, designation: savedUser.role, workCity: savedUser.city, workState: savedUser.workState, workArea: savedUser.workArea, gstNumber: savedUser.gstNumber, whatsappNumber: savedUser.whatsappNumber, website: savedUser.website, panNumber: savedUser.panNumber, language: savedUser.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Profile - Vendor
exports.editVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.userType !== 'vendor') return res.status(403).json({ success: false, message: 'Access denied' });

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website, workStateID, workCityID, panNumber } = req.body;

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (companyName) user.companyName = companyName.trim();
    if (name) user.name = name.trim();
    if (email) user.email = email;
    if (designation) { user.role = designation.trim(); }
    if (workArea) user.workArea = workArea.trim();
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (website) user.website = website.trim();
    if (panNumber) user.panNumber = panNumber;

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.companyLogo) user.companyLogo = req.files.companyLogo[0].path;
      if (req.files.panCardImage) user.panCardImage = req.files.panCardImage[0].path;
      if (req.files.gstCertificate) user.gstCertificate = req.files.gstCertificate[0].path;
    }

    // Note: PAN/GST images are required at profile CREATION (createVendorProfile),
    // not on every edit — a vendor editing e.g. just their name shouldn't be
    // blocked because those docs aren't being re-uploaded in this request.

    await user.save();
    const savedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, email: savedUser.email, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, companyName: savedUser.companyName, companyLogo: savedUser.companyLogo, gstCertificate: savedUser.gstCertificate, panCardImage: savedUser.panCardImage, designation: savedUser.role, workCity: savedUser.city, workState: savedUser.workState, workArea: savedUser.workArea, gstNumber: savedUser.gstNumber, whatsappNumber: savedUser.whatsappNumber, panNumber: savedUser.panNumber, website: savedUser.website, language: savedUser.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  CHANGE PHONE NUMBER — OTP-gated (any authenticated user/role)
// ═══════════════════════════════════════════════════════════════════
// `phone` is only overwritten once the OTP sent to the NEW number is
// verified — the new number is staged in `pendingPhone` until then.

// @desc    Send OTP to a new phone number to start a phone-change
// @route   POST /api/profile/phone/send-otp
// @access  Private
exports.sendPhoneChangeOtp = async (req, res) => {
  try {
    const { newPhone } = req.body;

    if (!newPhone || !/^[6-9]\d{9}$/.test(newPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.phone === newPhone) {
      return res.status(400).json({
        success: false,
        message: 'This is already your current phone number',
      });
    }

    const existing = await User.findOne({ phone: newPhone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? generateOTP() : '123456';

    // OTP NAYE number par jaata hai — wahi to prove karna hai ki number
    // user ka hai. SMS pehle, DB baad me: fail hone par pendingPhone
    // set nahi hona chahiye.
    const sms = await sendOtpSms(newPhone, otp);
    if (!sms.sent) {
      return res.status(502).json({ success: false, message: sms.message });
    }

    user.pendingPhone = newPhone;
    user.otp = otp;
    user.otpExpire = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent to +91' + newPhone,
      data: { newPhone, expiresIn: '10 minutes', ...(isProduction ? {} : { otp }) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and apply the pending phone-number change
// @route   POST /api/profile/phone/verify-otp
// @access  Private
exports.verifyPhoneChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide the OTP' });
    }

    const user = await User.findById(req.user.id)
      .select('+otp +otpExpire +otpAttempts +pendingPhone');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.pendingPhone) {
      return res.status(400).json({
        success: false,
        message: 'No phone number change in progress. Please request an OTP first.',
      });
    }

    if (user.otp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      if (user.otpAttempts >= 3) {
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        user.pendingPhone = undefined;
        await user.save();

        return res.status(400).json({
          success: false,
          message: 'Maximum OTP attempts reached. Please request a new OTP.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`,
      });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Re-check uniqueness right before committing — guards against a race
    // where someone else claimed the number during the OTP round-trip.
    const clash = await User.findOne({
      phone: user.pendingPhone,
      _id: { $ne: user._id },
    });
    if (clash) {
      user.pendingPhone = undefined;
      user.otp = undefined;
      user.otpExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    user.phone = user.pendingPhone;
    user.isPhoneVerified = true;
    user.pendingPhone = undefined;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Security-style heads-up — user ko pata chale agar unka number kisi
    // aur ne (ya khud unhone) change kiya.
    notifyUser(user._id, {
      type: 'phone_changed',
      title: 'Phone Number Updated',
      body: `Your account phone number was changed to ${user.phone}.`,
      data: {},
    }).catch((e) => console.error('[verifyPhoneChangeOtp] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully',
      data: { phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};