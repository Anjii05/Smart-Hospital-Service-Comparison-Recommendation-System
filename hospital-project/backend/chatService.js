/**
 * AI Chat Service
 * Maps user symptoms to hospital departments and urgency levels.
 */

const DEPARTMENT_SEARCH_TERMS = {
  Emergency: ['emergency', 'icu', 'trauma', 'critical'],
  Cardiology: ['cardio', 'heart', 'cardiac'],
  Neurology: ['neuro', 'brain', 'stroke', 'nerve'],
  Gastroenterology: ['gastro', 'stomach', 'digestive'],
  Orthopedics: ['ortho', 'bone', 'joint', 'spine', 'fracture'],
  Dermatology: ['derma', 'skin', 'rash', 'eczema'],
  Ophthalmology: ['eye', 'vision', 'ophthal', 'cataract'],
  ENT: ['ent', 'ear', 'nose', 'throat', 'sinus'],
  Pediatrics: ['pediatric', 'child', 'baby', 'infant'],
  Gynecology: ['gyne', 'women', 'pregnancy', 'maternity'],
  Psychiatry: ['psych', 'mental', 'anxiety', 'depression'],
  General: ['general', 'medicine', 'checkup', 'fever', 'cold', 'cough']
};

const SYMPTOM_MAP = [
  {
    department: 'Emergency',
    keywords: ['accident', 'emergency', 'trauma', 'unconscious', 'bleeding heavily', 'critical', 'not breathing', 'seizure severe', 'stroke', 'heart attack'],
    urgency: 'CRITICAL',
    message: 'This sounds like a medical emergency. Please call emergency services immediately or go to the nearest Emergency department.',
  },
  {
    department: 'Cardiology',
    keywords: ['chest pain', 'heart pain', 'cardiac', 'palpitation', 'heart racing', 'shortness of breath', 'heart beat', 'irregular heartbeat', 'breathless'],
    urgency: 'HIGH',
    message: 'Your symptoms suggest a potential cardiac issue. You should consult a Cardiologist promptly.',
  },
  {
    department: 'Neurology',
    keywords: ['headache', 'migraine', 'dizziness', 'nerve pain', 'brain', 'memory loss', 'confusion', 'tingling', 'numbness', 'vertigo', 'tremor'],
    urgency: 'MEDIUM',
    message: 'Your symptoms may be related to the nervous system. Consulting a Neurologist is recommended.',
  },
  {
    department: 'Gastroenterology',
    keywords: ['stomach pain', 'stomach ache', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'indigestion', 'bloating', 'acidity', 'heartburn', 'gas'],
    urgency: 'LOW',
    message: 'Your symptoms appear to be digestive. A Gastroenterologist can help diagnose and treat these issues.',
  },
  {
    department: 'Orthopedics',
    keywords: ['bone', 'fracture', 'joint pain', 'knee pain', 'back pain', 'spine', 'muscle pain', 'sprain', 'shoulder pain', 'hip pain', 'arthritis', 'swollen joint'],
    urgency: 'MEDIUM',
    message: 'Your symptoms suggest a musculoskeletal issue. An Orthopedic specialist would be most helpful.',
  },
  {
    department: 'Dermatology',
    keywords: ['skin rash', 'rash', 'acne', 'skin allergy', 'itching', 'eczema', 'psoriasis', 'skin problem', 'pimple', 'hives', 'skin infection', 'dandruff'],
    urgency: 'LOW',
    message: 'Your symptoms appear skin-related. A Dermatologist can help diagnose and treat this.',
  },
  {
    department: 'Ophthalmology',
    keywords: ['eye pain', 'blurry vision', 'vision problem', 'cataract', 'red eye', 'eye infection', 'glasses', 'eye strain', 'cannot see', 'double vision'],
    urgency: 'MEDIUM',
    message: 'Your symptoms are related to vision or eye health. An Ophthalmologist should evaluate you.',
  },
  {
    department: 'ENT',
    keywords: ['ear pain', 'hearing loss', 'nose bleed', 'throat pain', 'tonsil', 'sinus', 'snoring', 'cold', 'runny nose', 'blocked nose', 'ear infection'],
    urgency: 'LOW',
    message: 'Your symptoms relate to Ear, Nose, or Throat. An ENT specialist would be ideal.',
  },
  {
    department: 'Pediatrics',
    keywords: ['child', 'baby', 'infant', 'kids health', 'vaccination', 'toddler', 'growth', 'my son', 'my daughter', 'my child', 'newborn'],
    urgency: 'MEDIUM',
    message: "For children's health concerns, a Pediatrician is the right specialist to consult.",
  },
  {
    department: 'Gynecology',
    keywords: ['pregnancy', 'pregnant', 'uterus', 'menstrual', 'period', 'fertility', 'delivery', 'ovary', 'vaginal', 'pcos', 'women health'],
    urgency: 'MEDIUM',
    message: 'Your symptoms relate to women\'s health. A Gynecologist would be the right specialist.',
  },
  {
    department: 'Psychiatry',
    keywords: ['depression', 'anxiety', 'stress', 'insomnia', 'mental health', 'panic attack', 'phobia', 'mood swings', 'bipolar', 'not sleeping', 'sad', 'hopeless'],
    urgency: 'MEDIUM',
    message: 'Mental health is important. A Psychiatrist or Counselor can provide the right support.',
  },
  {
    department: 'General',
    keywords: ['fever', 'cold', 'cough', 'flu', 'fatigue', 'weakness', 'tired', 'body ache', 'general checkup', 'not feeling well', 'unwell', 'sick', 'feeling sick'],
    urgency: 'LOW',
    message: 'Based on your symptoms, a General Physician can help you with an initial consultation and diagnosis.',
  },
];

function analyzeSymptomsAI(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return {
      reply: 'Please describe your symptoms so I can recommend the right doctor.',
      department: 'General',
      urgency: 'LOW',
    };
  }

  const input = userInput.toLowerCase().trim();
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of SYMPTOM_MAP) {
    let score = 0;

    for (const keyword of entry.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (!bestMatch || highestScore === 0) {
    return {
      reply: 'I could not match specific symptoms, but I recommend starting with a General Physician for a full evaluation.',
      department: 'General',
      urgency: 'LOW',
      confidence: 'low',
    };
  }

  return {
    reply: bestMatch.message,
    department: bestMatch.department,
    urgency: bestMatch.urgency,
    confidence: highestScore >= 3 ? 'high' : 'medium',
    disclaimer: 'This is an AI-assisted suggestion and not a medical diagnosis. Please consult a qualified doctor for professional advice.',
  };
}

module.exports = {
  analyzeSymptomsAI,
  DEPARTMENT_SEARCH_TERMS
};
