/**
 * fix-duplicate-names.js
 * Repairs existing duplicate doctor names and review patient names in the DB.
 * Run once: node fix-duplicate-names.js
 */
require('dotenv').config();
const db = require('./config/database');

const DOCTOR_FIRST_NAMES = [
  'Arun', 'Anitha', 'Arjun', 'Asha', 'Ashok', 'Aishwarya',
  'Balaji', 'Bhavana', 'Bhaskar', 'Bharathi',
  'Chandra', 'Chitra', 'Chithra', 'Chandrakant',
  'Deepa', 'Dinesh', 'Divya', 'Dhruv',
  'Ganesh', 'Geetha', 'Girish', 'Gopal',
  'Harish', 'Hema', 'Hemant', 'Hemalatha',
  'Jagdish', 'Janaki', 'Jayanta', 'Jyoti',
  'Karthik', 'Kavitha', 'Kiran', 'Krishnappa',
  'Lakshmi', 'Latha', 'Lokesh', 'Lavanya',
  'Mahesh', 'Madhuri', 'Manoj', 'Meena',
  'Nagesh', 'Nalini', 'Narayan', 'Nandita',
  'Pavan', 'Padmavathi', 'Prasad', 'Priya',
  'Rajesh', 'Ramesh', 'Rekha', 'Rohit',
  'Santhosh', 'Savitha', 'Shivakumar', 'Shruti',
  'Sridhar', 'Sunitha', 'Suresh', 'Swathi',
  'Uday', 'Uma', 'Usha', 'Umesh',
  'Venkat', 'Vidya', 'Vijay', 'Vimala',
  'Yashoda', 'Yogesh', 'Yashas', 'Yesudas'
];

const DOCTOR_LAST_NAMES = [
  'Agarwal', 'Anand', 'Bhat', 'Bose',
  'Chakraborty', 'Chaudhary', 'Das', 'Dave',
  'Desai', 'Deshpande', 'Dixit', 'Fernandes',
  'Gandhi', 'Ghosh', 'Gowda', 'Gupta',
  'Hegde', 'Iyer', 'Jain', 'Joshi',
  'Kapoor', 'Kaur', 'Khan', 'Krishnan',
  'Kumar', 'Mehta', 'Menon', 'Mishra',
  'Mukherjee', 'Nair', 'Naik', 'Narayanan',
  'Patel', 'Pillai', 'Rao', 'Rathore',
  'Reddy', 'Roy', 'Saxena', 'Shah',
  'Sharma', 'Shukla', 'Singh', 'Sinha',
  'Srinivasan', 'Tiwari', 'Varma', 'Verma',
  'Yadav', 'Zutshi'
];

const PATIENT_FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aishwarya', 'Akash', 'Alok', 'Amrita',
  'Ananya', 'Anil', 'Anita', 'Anjali', 'Ankit', 'Ankita',
  'Arjun', 'Asha', 'Ashish', 'Ayesha',
  'Deepak', 'Deepika', 'Divya', 'Farhan',
  'Gaurav', 'Gayatri', 'Harini', 'Harsha',
  'Ishaan', 'Ishita', 'Kiran', 'Kirti',
  'Komal', 'Kunal', 'Lakshmi', 'Lavanya',
  'Manish', 'Manisha', 'Meena', 'Megha',
  'Mohit', 'Monika', 'Murugan', 'Nalini',
  'Nikhil', 'Nikita', 'Nisha', 'Pooja',
  'Pranav', 'Preethi', 'Priya', 'Rahul',
  'Raj', 'Rajani', 'Ramya', 'Ravi',
  'Rekha', 'Rohit', 'Sachin', 'Sandeep',
  'Sangeetha', 'Sanjay', 'Sarita', 'Seema',
  'Shivam', 'Shruti', 'Sneha', 'Sonia',
  'Sunil', 'Sunita', 'Tarun', 'Usha',
  'Vijay', 'Vijaya', 'Vikas', 'Vikram',
  'Vinay', 'Vineeta', 'Vishal', 'Yamini', 'Yogita', 'Zara'
];

const PATIENT_LAST_NAMES = [
  'Agarwal', 'Bhat', 'Chandra', 'Das', 'Desai', 'Gandhi',
  'Gowda', 'Gupta', 'Hegde', 'Iyer', 'Joshi', 'Kaur',
  'Krishna', 'Kumar', 'Mehta', 'Menon', 'Mishra', 'Nair',
  'Patel', 'Pillai', 'Rao', 'Reddy', 'Shah', 'Sharma',
  'Singh', 'Srinivas', 'Tiwari', 'Varma', 'Verma', 'Yadav'
];

const REVIEW_COMMENTS = [
  'The doctors were attentive and explained everything clearly.',
  'Very affordable with good quality care. Impressed with the services.',
  'Clean, well-maintained hospital with modern diagnostic equipment.',
  'Staff was very courteous and helpful throughout our visit.',
  'Highly experienced specialists. Satisfied with the treatment outcome.',
  'The emergency team responded quickly and was very professional.',
  'Good infrastructure and smooth patient management process.',
  'Reasonable waiting time and thorough consultation by the doctor.',
  'Excellent care provided throughout our hospital stay.',
  'Diagnostic facilities are modern and reports were delivered fast.',
  'The nursing staff was extremely caring and supportive.',
  'Overall a great experience — would definitely recommend to family.',
  'Doctor took time to understand the problem and gave a clear diagnosis.',
  'The pharmacy is well-stocked and operates around the clock.',
  'Specialist consultation was very insightful and helpful.',
  'Hospital is easily accessible and well-organized.',
  'Good follow-up care and post-treatment support was provided.',
  'World-class treatment at very reasonable rates.',
  'Impressed with the cleanliness and hygiene standards maintained.',
  'Friendly administration and minimal paperwork for admission.'
];

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueFullNames(firstPool, lastPool, count) {
  const firsts = shuffle(firstPool);
  const lasts = shuffle(lastPool);
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(`${firsts[i % firsts.length]} ${lasts[i % lasts.length]}`);
  }
  return names;
}

async function fixDoctors() {
  console.log('\n🔧 Fixing doctor names...');

  // Get all hospitals
  const [[...hospitals]] = await db.query('SELECT id FROM hospitals ORDER BY id');
  let fixed = 0;

  for (const { id: hospitalId } of hospitals) {
    const [doctors] = await db.query(
      'SELECT id, name FROM doctors WHERE hospital_id = ? ORDER BY id',
      [hospitalId]
    );

    if (doctors.length === 0) continue;

    // Check for duplicates within this hospital
    const names = doctors.map((d) => d.name);
    const uniqueSet = new Set(names);
    const hasDuplicates = uniqueSet.size < names.length;

    // Also fix old single-word names like "Dr. Ramesh" (no lastname)
    const hasOldFormat = names.some((n) => n.split(' ').length < 3);

    if (!hasDuplicates && !hasOldFormat) continue;

    // Generate fresh unique names
    const newNames = uniqueFullNames(DOCTOR_FIRST_NAMES, DOCTOR_LAST_NAMES, doctors.length);

    for (let i = 0; i < doctors.length; i++) {
      await db.query(
        'UPDATE doctors SET name = ? WHERE id = ?',
        [`Dr. ${newNames[i]}`, doctors[i].id]
      );
    }

    fixed++;
  }

  console.log(`✅ Fixed doctor names in ${fixed} hospitals.`);
}

async function fixReviews() {
  console.log('\n🔧 Fixing review patient names and comments...');

  const [[...hospitals]] = await db.query('SELECT id FROM hospitals ORDER BY id');
  let fixed = 0;

  for (const { id: hospitalId } of hospitals) {
    const [reviews] = await db.query(
      'SELECT id, patient_name, comment FROM reviews WHERE hospital_id = ? ORDER BY id',
      [hospitalId]
    );

    if (reviews.length === 0) continue;

    const patientNames = reviews.map((r) => r.patient_name);
    const uniqueSet = new Set(patientNames);
    const hasDuplicateNames = uniqueSet.size < patientNames.length;

    // Check for single-word names (old format)
    const hasOldFormat = patientNames.some((n) => !n.includes(' '));

    if (!hasDuplicateNames && !hasOldFormat) continue;

    const newPatientNames = uniqueFullNames(PATIENT_FIRST_NAMES, PATIENT_LAST_NAMES, reviews.length);
    const newComments = shuffle(REVIEW_COMMENTS);

    for (let i = 0; i < reviews.length; i++) {
      await db.query(
        'UPDATE reviews SET patient_name = ?, comment = ? WHERE id = ?',
        [newPatientNames[i], newComments[i % newComments.length], reviews[i].id]
      );
    }

    fixed++;
  }

  console.log(`✅ Fixed review names in ${fixed} hospitals.`);
}

async function main() {
  console.log('🏥 Hospital DB Name Fix Script');
  console.log('================================');
  try {
    await fixDoctors();
    await fixReviews();
    console.log('\n✅ All done! Existing duplicate/single-word names have been corrected.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
