const { haversineKm } = require('./osmLookup');

const DISEASE_RULES = [
  {
    keys: ['heart', 'cardiac', 'chest pain', 'hypertension', 'angioplasty', 'arrhythmia'],
    specializations: ['Cardiologist', 'Cardiac Surgeon'],
    treatments: ['Cardiology Consultation', 'Angiography', 'Bypass Surgery', 'Heart Surgery', 'ECG'],
    facilities: ['ICU', 'Cardiac Care Unit', 'Emergency Ward'],
    emergency: true
  },
  {
    keys: ['brain', 'stroke', 'migraine', 'neurology', 'seizure', 'head injury'],
    specializations: ['Neurologist', 'Neurosurgeon'],
    treatments: ['Neurology Consultation', 'MRI Scan', 'CT Scan'],
    facilities: ['ICU', 'Radiology Center'],
    emergency: true
  },
  {
    keys: ['bone', 'fracture', 'joint', 'knee', 'orthopedic', 'spine'],
    specializations: ['Orthopedic Surgeon', 'Orthopedic'],
    treatments: ['Orthopedic Consultation', 'X-Ray', 'CT Scan', 'Physiotherapy'],
    facilities: ['Operation Theater', 'Physiotherapy Unit'],
    emergency: false
  },
  {
    keys: ['cancer', 'tumor', 'oncology', 'chemotherapy'],
    specializations: ['Oncologist'],
    treatments: ['Oncology Consultation', 'Chemotherapy', 'MRI Scan', 'CT Scan'],
    facilities: ['ICU', 'Advanced Diagnostics Lab'],
    emergency: false
  },
  {
    keys: ['pregnancy', 'delivery', 'gyne', 'maternity', 'fertility'],
    specializations: ['Gynecologist'],
    treatments: ['Gynecology Consultation', 'Ultrasound'],
    facilities: ['Emergency Ward', 'Neonatal ICU'],
    emergency: false
  },
  {
    keys: ['child', 'fever', 'pediatric', 'vaccination'],
    specializations: ['Pediatrician'],
    treatments: ['Pediatrics', 'General Checkup', 'Blood Test'],
    facilities: ['Emergency Ward', 'Neonatal ICU'],
    emergency: false
  }
];

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function inferCareFocus(context = {}) {
  const disease = normalizeText(context.disease);
  const treatment = normalizeText(context.treatment);
  const combined = `${disease} ${treatment}`.trim();

  const matchedRules = DISEASE_RULES.filter((rule) =>
    rule.keys.some((key) => combined.includes(key))
  );

  return {
    disease,
    treatment,
    keywords: uniqueStrings([
      ...matchedRules.flatMap((rule) => rule.keys),
      ...matchedRules.flatMap((rule) => rule.specializations.map((item) => item.toLowerCase())),
      ...matchedRules.flatMap((rule) => rule.treatments.map((item) => item.toLowerCase())),
      ...combined.split(/\s+/).filter((token) => token.length > 2)
    ]),
    specializations: uniqueStrings(matchedRules.flatMap((rule) => rule.specializations)),
    treatments: uniqueStrings(
      [
        ...matchedRules.flatMap((rule) => rule.treatments),
        context.treatment
      ].filter(Boolean)
    ),
    facilities: uniqueStrings(matchedRules.flatMap((rule) => rule.facilities)),
    emergency: matchedRules.some((rule) => rule.emergency)
  };
}

function calculateHospitalScore(hospital) {
  const rating = Number(hospital.rating || 0);
  const effectiveCost = Number(hospital.min_treatment_cost || hospital.cost || 0);
  const facilities = hospital.facilities?.length || hospital.facility_preview?.length || 0;
  const treatmentCount = Number(hospital.treatment_count || hospital.treatments?.length || 0);
  const totalDoctors = Number(hospital.total_doctors || hospital.doctors?.length || 0);
  const availableDoctors = Number(
    hospital.available_doctors ||
    hospital.doctors?.filter((doctor) => doctor.is_available).length ||
    0
  );
  const reviewCount = Number(hospital.review_count || hospital.review_summary?.total_reviews || 0);

  const ratingComponent = clamp((rating / 5) * 4, 0, 4);
  const affordabilityComponent = effectiveCost <= 0
    ? 1
    : effectiveCost <= 1500
      ? 2
      : effectiveCost <= 5000
        ? 1.7
        : effectiveCost <= 25000
          ? 1.25
          : effectiveCost <= 100000
            ? 0.85
            : 0.45;
  const facilityComponent = clamp((facilities / 6) * 1.2, 0, 1.2);
  const doctorComponent = totalDoctors > 0
    ? clamp(((availableDoctors / totalDoctors) * 0.8) + ((Math.min(totalDoctors, 6) / 6) * 0.2), 0, 1)
    : 0.2;
  const reviewComponent = clamp((Math.min(reviewCount, 40) / 40) * 0.8, 0, 0.8);
  const emergencyComponent = hospital.emergency_available ? 0.5 : 0;
  const treatmentComponent = clamp((Math.min(treatmentCount, 8) / 8) * 0.5, 0, 0.5);

  return Number(
    clamp(
      ratingComponent +
      affordabilityComponent +
      facilityComponent +
      doctorComponent +
      reviewComponent +
      emergencyComponent +
      treatmentComponent,
      0,
      10
    ).toFixed(1)
  );
}

function pickTreatmentMatch(hospital, focus) {
  const treatments = hospital.treatments || [];
  if (treatments.length === 0) {
    return null;
  }

  const keywords = uniqueStrings([
    ...focus.treatments.map((item) => normalizeText(item)),
    ...focus.keywords
  ]);

  const exactMatch = treatments.find((item) =>
    keywords.some((keyword) => normalizeText(item.name).includes(keyword))
  );

  if (exactMatch) {
    return exactMatch;
  }

  return [...treatments].sort((left, right) => Number(left.cost) - Number(right.cost))[0] || null;
}

function pickDoctorFee(hospital, focus) {
  const doctors = hospital.doctors || [];
  const specializationKeywords = focus.specializations.map((item) => normalizeText(item));

  const matchingDoctors = doctors.filter((doctor) =>
    specializationKeywords.some((keyword) => normalizeText(doctor.specialization).includes(keyword))
  );

  const sourceDoctors = matchingDoctors.length > 0 ? matchingDoctors : doctors;
  if (sourceDoctors.length > 0) {
    const fees = sourceDoctors
      .map((doctor) => Number(doctor.consultation_fee || 0))
      .filter((fee) => Number.isFinite(fee) && fee > 0);

    if (fees.length > 0) {
      return Math.round(fees.reduce((sum, fee) => sum + fee, 0) / fees.length);
    }
  }

  const fallback = Number(hospital.avg_consultation_fee || hospital.min_consultation_fee || 0);
  return fallback > 0 ? Math.round(fallback) : 0;
}

function calculateDistanceKm(hospital, searchCenter) {
  if (
    !searchCenter ||
    !Number.isFinite(Number(hospital.latitude)) ||
    !Number.isFinite(Number(hospital.longitude))
  ) {
    return hospital.distance_km === null || hospital.distance_km === undefined
      ? null
      : Number(hospital.distance_km);
  }

  return Number(
    haversineKm(
      Number(searchCenter.latitude),
      Number(searchCenter.longitude),
      Number(hospital.latitude),
      Number(hospital.longitude)
    ).toFixed(2)
  );
}

function calculateRecommendationForHospital(hospital, context = {}) {
  const focus = context.focus || inferCareFocus(context);
  const treatmentMatch = pickTreatmentMatch(hospital, focus);
  const estimatedTreatmentCost = Number(
    treatmentMatch?.cost ||
    hospital.matched_treatment_cost ||
    hospital.min_treatment_cost ||
    hospital.cost ||
    0
  );
  const estimatedConsultationFee = pickDoctorFee(hospital, focus);
  const estimatedTotalCost = estimatedTreatmentCost + estimatedConsultationFee;
  const baseScore = Number(hospital.hospital_score ?? calculateHospitalScore(hospital));
  const distanceKm = calculateDistanceKm(hospital, context.search_center);
  const maxBudget = Number(context.max_budget || context.budget || 0);
  const maxDistanceKm = Number(context.max_distance_km || context.radius || 0);

  const budgetFit = maxBudget > 0
    ? clamp(1.8 - ((estimatedTotalCost / maxBudget) * 1.8), 0, 1.8)
    : 1.0;

  let distanceFit = 0.7;
  if (distanceKm !== null) {
    if (maxDistanceKm > 0) {
      distanceFit = clamp(1.5 - ((distanceKm / maxDistanceKm) * 1.5), 0, 1.5);
    } else if (distanceKm <= 5) {
      distanceFit = 1.5;
    } else if (distanceKm <= 12) {
      distanceFit = 1.1;
    } else if (distanceKm <= 25) {
      distanceFit = 0.8;
    } else {
      distanceFit = 0.3;
    }
  }

  const treatmentFit = treatmentMatch
    ? 1.2
    : focus.treatments.length === 0
      ? 0.8
      : 0.25;

  const specializationFit = focus.specializations.length === 0
    ? 0.4
    : hospital.doctors?.some((doctor) =>
      focus.specializations.some((specialization) =>
        normalizeText(doctor.specialization).includes(normalizeText(specialization))
      )
    )
      ? 0.6
      : 0.15;

  const emergencyFit = context.emergency_mode || focus.emergency
    ? (hospital.emergency_available ? 0.4 : 0)
    : 0.2;

  const finalScore = clamp(
    (baseScore * 0.45) +
    budgetFit +
    distanceFit +
    treatmentFit +
    specializationFit +
    emergencyFit,
    0,
    10
  );

  const reasons = [];
  if (treatmentMatch) {
    reasons.push(`Matches ${treatmentMatch.name}`);
  }
  if (maxBudget > 0 && estimatedTotalCost > 0 && estimatedTotalCost <= maxBudget) {
    reasons.push('Within budget');
  }
  if (distanceKm !== null) {
    reasons.push(`${distanceKm} km away`);
  }
  if (hospital.emergency_available && (context.emergency_mode || focus.emergency)) {
    reasons.push('Emergency-ready');
  }
  reasons.push(`Hospital score ${baseScore}/10`);

  return {
    ...hospital,
    hospital_score: baseScore,
    distance_km: distanceKm,
    matched_treatment_name: treatmentMatch?.name || null,
    matched_treatment_cost: treatmentMatch?.cost ? Number(treatmentMatch.cost) : null,
    estimated_treatment_cost: estimatedTreatmentCost > 0 ? estimatedTreatmentCost : null,
    estimated_consultation_fee: estimatedConsultationFee > 0 ? estimatedConsultationFee : null,
    estimated_total_cost: estimatedTotalCost > 0 ? estimatedTotalCost : null,
    recommendation_score: Number(finalScore.toFixed(1)),
    score_breakdown: {
      base: Number((baseScore * 0.45).toFixed(2)),
      budget: Number(budgetFit.toFixed(2)),
      distance: Number(distanceFit.toFixed(2)),
      treatment: Number(treatmentFit.toFixed(2)),
      specialization: Number(specializationFit.toFixed(2)),
      emergency: Number(emergencyFit.toFixed(2))
    },
    recommendation_reasons: reasons
  };
}

function buildRecommendationBundle(hospitals, context = {}) {
  const focus = inferCareFocus(context);

  const scored = hospitals
    .map((hospital) => calculateRecommendationForHospital(hospital, { ...context, focus }))
    .sort((left, right) => (
      right.recommendation_score - left.recommendation_score ||
      left.estimated_total_cost - right.estimated_total_cost ||
      right.rating - left.rating
    ));

  return scored.map((hospital, index) => ({
    ...hospital,
    top_recommended: index === 0
  }));
}

module.exports = {
  buildRecommendationBundle,
  calculateHospitalScore,
  inferCareFocus
};
