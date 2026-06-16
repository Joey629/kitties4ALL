import { cats as baseCats } from '@/data/cats';
import type { AdoptionApplication } from '@/admin/types';
import type { Cat } from '@/types/cat';
import { loadAdoptionApplications } from '@/shared/adoptionApplications';
import { ACTIVE_ADOPTION_STAGES, applicantsMatch } from '@/shared/adoptionStatus';
import { formatHealthStatus, getCatShelterProfile } from '@/shared/catShelterRecords';

export type HousingType = 'apartment' | 'house';
export type HomeTime = 'often' | 'part_time' | 'away';
export type CatExperience = 'first_time' | 'some' | 'experienced';

export interface LifestyleAnswers {
  housing: HousingType;
  hasChildren: boolean;
  hasOtherPets: boolean;
  homeTime: HomeTime;
  experience: CatExperience;
}

export interface CatMatchResult {
  cat: Cat;
  score: number;
  reasons: string[];
}

interface CatTraits {
  energy: number;
  confidence: number;
  kidFriendly: number;
  petFriendly: number;
  apartmentOk: number;
  attentionNeed: number;
  beginnerFriendly: number;
  quietHome: number;
}

const CAT_TRAITS: Record<string, CatTraits> = {
  luna: { energy: 2, confidence: 3, kidFriendly: 3, petFriendly: 3, apartmentOk: 5, attentionNeed: 3, beginnerFriendly: 4, quietHome: 4 },
  mochi: { energy: 5, confidence: 4, kidFriendly: 4, petFriendly: 3, apartmentOk: 3, attentionNeed: 5, beginnerFriendly: 3, quietHome: 2 },
  shadow: { energy: 2, confidence: 1, kidFriendly: 1, petFriendly: 2, apartmentOk: 4, attentionNeed: 2, beginnerFriendly: 2, quietHome: 5 },
  pearl: { energy: 2, confidence: 1, kidFriendly: 2, petFriendly: 2, apartmentOk: 5, attentionNeed: 3, beginnerFriendly: 2, quietHome: 5 },
  ginger: { energy: 3, confidence: 4, kidFriendly: 4, petFriendly: 4, apartmentOk: 4, attentionNeed: 2, beginnerFriendly: 5, quietHome: 3 },
  willow: { energy: 1, confidence: 2, kidFriendly: 2, petFriendly: 2, apartmentOk: 5, attentionNeed: 2, beginnerFriendly: 3, quietHome: 5 },
  dumpling: { energy: 5, confidence: 4, kidFriendly: 4, petFriendly: 3, apartmentOk: 4, attentionNeed: 5, beginnerFriendly: 4, quietHome: 2 },
  sesame: { energy: 2, confidence: 2, kidFriendly: 3, petFriendly: 3, apartmentOk: 5, attentionNeed: 2, beginnerFriendly: 3, quietHome: 5 },
};

function scoreCat(catId: string, answers: LifestyleAnswers): { score: number; reasons: string[] } {
  const traits = CAT_TRAITS[catId];
  if (!traits) return { score: 50, reasons: ['A gentle companion worth meeting in person.'] };

  let score = 72;
  const reasons: string[] = [];

  if (answers.housing === 'apartment') {
    score += traits.apartmentOk * 2;
    if (traits.apartmentOk >= 4) reasons.push('Settles well in smaller living spaces');
    if (traits.energy >= 4) score -= 8;
  } else {
    score += traits.energy;
    if (traits.energy >= 4) reasons.push('Has room to play and explore');
  }

  if (answers.hasChildren) {
    score += traits.kidFriendly * 3;
    if (traits.kidFriendly >= 4) reasons.push('Patient around a busy family home');
    else if (traits.kidFriendly <= 2) score -= 18;
  } else {
    score += traits.quietHome;
    if (traits.quietHome >= 4) reasons.push('Thrives in a calm, predictable home');
  }

  if (answers.hasOtherPets) {
    score += traits.petFriendly * 2;
    if (traits.petFriendly >= 3) reasons.push('Can adjust to other pets with slow introductions');
    else score -= 10;
  }

  if (answers.homeTime === 'often') {
    score += traits.attentionNeed * 2;
    if (traits.attentionNeed >= 4) reasons.push('Loves having someone around during the day');
  } else if (answers.homeTime === 'away') {
    score += (5 - traits.attentionNeed) * 2;
    if (traits.attentionNeed <= 2) reasons.push('Comfortable with quieter days alone');
    else score -= 12;
  } else {
    score += 4;
  }

  if (answers.experience === 'first_time') {
    score += traits.beginnerFriendly * 3;
    if (traits.beginnerFriendly >= 4) reasons.push('Forgiving for first-time cat parents');
    if (traits.confidence <= 2) score -= 8;
  } else if (answers.experience === 'experienced') {
    score += traits.confidence <= 2 ? 6 : 2;
    if (traits.confidence <= 2) reasons.push('Benefits from a patient, experienced adopter');
  } else {
    score += traits.beginnerFriendly * 2;
  }

  if (traits.confidence <= 2 && !answers.hasChildren && answers.homeTime !== 'away') {
    reasons.push('Needs a gentle, unhurried introduction');
  }

  const normalized = Math.max(58, Math.min(98, Math.round(score)));
  return {
    score: normalized,
    reasons: reasons.slice(0, 2).length > 0 ? reasons.slice(0, 2) : ['A thoughtful match based on your lifestyle'],
  };
}

export function evaluateApplicationMatch(catId: string, answers: LifestyleAnswers) {
  return scoreCat(catId, answers);
}

export function formatLifestyleProfile(answers: LifestyleAnswers) {
  const homeTimeLabels: Record<LifestyleAnswers['homeTime'], string> = {
    often: 'Most of the day — someone is usually home',
    part_time: 'Part of the day — regular routine',
    away: 'Mostly out — home mornings and evenings',
  };
  const experienceLabels: Record<LifestyleAnswers['experience'], string> = {
    first_time: 'First-time cat parent',
    some: 'Some experience with cats',
    experienced: 'Very experienced with cats',
  };

  return [
    {
      label: 'Home',
      value: answers.housing === 'apartment' ? 'Apartment or condo' : 'House or townhouse',
    },
    { label: 'Children at home', value: answers.hasChildren ? 'Yes' : 'No' },
    { label: 'Other pets', value: answers.hasOtherPets ? 'Yes' : 'No' },
    { label: 'Time at home', value: homeTimeLabels[answers.homeTime] },
    { label: 'Cat experience', value: experienceLabels[answers.experience] },
  ];
}

export function rankCatsForLifestyle(cats: Cat[], answers: LifestyleAnswers): CatMatchResult[] {
  return cats
    .map((cat) => {
      const { score, reasons } = scoreCat(cat.id, answers);
      return { cat, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function getAdoptionCatSnapshot(cat: Cat) {
  const shelter = getCatShelterProfile(cat.id);

  return {
    health: shelter ? formatHealthStatus(shelter.health) : 'Healthy',
    personality: cat.personality,
    tagline: cat.tagline,
  };
}

export function getCatTraitsForDisplay(catId: string) {
  return CAT_TRAITS[catId] ?? null;
}

export function isCatInBaseRoster(catId: string) {
  return baseCats.some((cat) => cat.id === catId);
}

export type MatchLevel = 'high' | 'medium-high' | 'medium' | 'low';

export interface AdoptionAiAssessment {
  score: number;
  matchLevel: MatchLevel;
  matchSummary: string;
  riskPoints: string[];
  suggestedNextSteps: string[];
}

function matchLevelFromScore(score: number): MatchLevel {
  if (score >= 88) return 'high';
  if (score >= 74) return 'medium-high';
  if (score >= 62) return 'medium';
  return 'low';
}

function matchLevelLabel(level: MatchLevel) {
  if (level === 'high') return 'High match';
  if (level === 'medium-high') return 'Medium-high match';
  if (level === 'medium') return 'Medium match';
  return 'Low match';
}

function getHomeDescriptor(app: AdoptionApplication): string {
  if (app.lifestyleProfile) {
    const { housing, hasChildren, homeTime } = app.lifestyleProfile;
    if (hasChildren) return 'Family home';
    if (homeTime === 'away') return 'Busy household';
    if (housing === 'apartment') return 'Apartment home';
    return 'Quiet home';
  }
  if (app.hasChildren) return 'Family home';
  if (app.housingType === 'rent') return 'Rental home';
  if (app.housingType === 'own') return 'Homeowner household';
  return 'Applicant household';
}

function getCatPersonalityDescriptor(catId: string, catName: string): string {
  const traits = CAT_TRAITS[catId];
  if (!traits) return `${catName}'s temperament`;
  if (traits.confidence <= 2) return `${catName}'s shy personality`;
  if (traits.energy >= 4) return `${catName}'s playful energy`;
  if (traits.quietHome >= 4) return `${catName}'s calm temperament`;
  if (traits.beginnerFriendly >= 4) return `${catName}'s easygoing nature`;
  return `${catName}'s personality`;
}

function getMatchScoreForApplication(app: AdoptionApplication): number {
  if (app.matchScore !== undefined) return app.matchScore;
  if (app.lifestyleProfile) return scoreCat(app.catId, app.lifestyleProfile).score;
  return 68;
}

function countOtherActiveApplications(app: AdoptionApplication) {
  return loadAdoptionApplications().filter(
    (item) =>
      item.id !== app.id &&
      applicantsMatch(item.applicantName, item.email, app.applicantName, app.email) &&
      ACTIVE_ADOPTION_STAGES.includes(item.stage),
  );
}

export function generateAdoptionAiAssessment(app: AdoptionApplication): AdoptionAiAssessment {
  const score = getMatchScoreForApplication(app);
  const level = matchLevelFromScore(score);
  const traits = CAT_TRAITS[app.catId];
  const homeDescriptor = getHomeDescriptor(app);
  const catDescriptor = getCatPersonalityDescriptor(app.catId, app.catName);
  const riskPoints: string[] = [];

  const rentsHome =
    app.housingType === 'rent' || app.lifestyleProfile?.housing === 'apartment';
  if (rentsHome && app.landlordAllowsPets === undefined) {
    riskPoints.push('Renting — landlord pet permission not confirmed');
  }
  if (app.housingType === 'rent' && app.landlordAllowsPets === false) {
    riskPoints.push('Landlord does not allow pets');
  }

  const hasOtherPets = app.lifestyleProfile?.hasOtherPets ?? app.hasOtherPets;
  if (hasOtherPets && traits && traits.petFriendly <= 2) {
    riskPoints.push('Has other pets — slow introductions required for this cat');
  } else if (hasOtherPets && app.catExperience?.toLowerCase().includes('dog')) {
    riskPoints.push('Has other pets — applicant notes dogs at home');
  } else if (hasOtherPets) {
    riskPoints.push('Has other pets at home');
  }

  const otherActiveApps = countOtherActiveApplications(app);
  if (otherActiveApps.length > 0) {
    const catNames = otherActiveApps.map((item) => item.catName).join(', ');
    riskPoints.push(`Multiple cat adoptions in progress (${catNames})`);
  }

  const hasChildren = app.lifestyleProfile?.hasChildren ?? app.hasChildren;
  if (hasChildren && traits && traits.kidFriendly <= 2) {
    riskPoints.push('Children at home — this cat needs a quieter environment');
  }

  const experience = app.lifestyleProfile?.experience;
  if (experience === 'first_time' && traits && traits.confidence <= 2) {
    riskPoints.push('First-time cat parent applying for a shy, slow-to-trust cat');
  }

  const homeTime = app.lifestyleProfile?.homeTime;
  if (homeTime === 'away' && traits && traits.attentionNeed >= 4) {
    riskPoints.push('Away most of the day — cat needs more daily companionship');
  }

  if (!app.lifestyleProfile && !app.housingType && !app.phone) {
    riskPoints.push('Limited adoption details — lifestyle quiz not completed');
  }

  if (!app.phone) {
    riskPoints.push('No phone number provided for follow-up');
  }

  const matchSummary = `${homeDescriptor} + ${catDescriptor} = ${matchLevelLabel(level)}`;

  const suggestedNextSteps: string[] = [];
  const seriousRisks =
    riskPoints.some((point) =>
      point.includes('Landlord does not allow') ||
      point.includes('Multiple cat adoptions') ||
      point.includes('Limited adoption details'),
    ) || level === 'low';

  if (seriousRisks || score < 65) {
    suggestedNextSteps.push('Suggest declining with a clear, kind explanation');
  }

  if (
    riskPoints.some((point) => point.includes('landlord') || point.includes('Multiple cat')) ||
    !app.phone
  ) {
    suggestedNextSteps.push('Suggest an initial contact call before moving forward');
  } else if (level === 'high' && riskPoints.length <= 1) {
    suggestedNextSteps.push('Schedule initial contact, then a shelter visit to meet the cat');
  } else if (level === 'medium-high' && riskPoints.length <= 2) {
    suggestedNextSteps.push('Suggest an initial contact call, then schedule a shelter visit');
  } else if (!suggestedNextSteps.length) {
    suggestedNextSteps.push('Suggest an initial contact call to clarify open questions');
  }

  if (
    app.stage === 'reviewing' &&
    level !== 'low' &&
    !seriousRisks &&
    !suggestedNextSteps.some((step) => step.includes('shelter visit'))
  ) {
    suggestedNextSteps.push('If initial contact goes well, invite the applicant to visit the shelter');
  }

  return {
    score,
    matchLevel: level,
    matchSummary,
    riskPoints: riskPoints.length > 0 ? riskPoints : ['No major risk flags identified'],
    suggestedNextSteps: [...new Set(suggestedNextSteps)],
  };
}
