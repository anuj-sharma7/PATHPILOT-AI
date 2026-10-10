import { StudentProfile, Opportunity, MatchBreakdown } from "@/types";

/**
 * Deterministic Explainable Match Engine
 * 
 * Follows hackathon specification:
 * - Skills alignment: 35%
 * - Eligibility fit (degree/branch/graduation): 30%
 * - Interest and category fit: 20%
 * - Location and work mode: 10%
 * - Experience fit: 5%
 * 
 * Explicit rules:
 * - Never treats missing data as positive evidence.
 * - Labels incomplete profiles as provisional.
 * - Explains every deduction.
 * - NEVER claims to represent acceptance probability.
 */
export function calculateMatchScore(
  opp: Opportunity,
  profile?: StudentProfile
): {
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  matchExplanation: string;
  missingRequirements: string[];
} {
  if (!profile) {
    return {
      matchScore: 65,
      matchBreakdown: {
        skillsScore: 65,
        eligibilityScore: 70,
        interestScore: 65,
        locationScore: 65,
        experienceScore: 65,
        totalScore: 65,
        isProvisional: true,
        provisionalReason: "No student profile configured. Showing generalized relevance baseline.",
        matchedSkills: [],
        missingSkills: [],
        matchedInterests: [],
        notes: ["Configure your student profile to view personalized evidence matching."],
      },
      matchExplanation: "General opportunity matching search keywords. Complete your profile for personalized scoring.",
      missingRequirements: ["Student profile required to verify degree and graduation eligibility."],
    };
  }

  const notes: string[] = [];
  const missingRequirements: string[] = [];
  const fullText = `${opp.title} ${opp.organization} ${opp.description} ${opp.requirements.join(" ")}`.toLowerCase();

  // 1. Skills alignment (35%)
  const userSkills = (profile.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const matchedSkills: string[] = [];
  const oppSkills = (opp.skills || []).map((s) => s.toLowerCase());

  for (const skill of userSkills) {
    if (fullText.includes(skill) || oppSkills.some((os) => os.includes(skill) || skill.includes(os))) {
      matchedSkills.push(skill);
    }
  }

  let skillsScore = 50; // baseline
  if (userSkills.length > 0) {
    const matchRatio = matchedSkills.length / Math.min(Math.max(userSkills.length, 3), 8);
    skillsScore = Math.min(100, Math.round(40 + matchRatio * 60));
  } else {
    skillsScore = 55;
    notes.push("No skills listed on profile; skills match is provisional.");
  }

  // 2. Eligibility Fit (Degree, Major, Graduation year) (30%)
  let eligibilityScore = 75;
  const degreeLower = (profile.degree || "").toLowerCase();
  const branchLower = (profile.branch || "").toLowerCase();

  const mentionsUndergrad = fullText.includes("undergraduate") || fullText.includes("bachelor") || fullText.includes("b.tech") || fullText.includes("bs") || fullText.includes("b.e");
  const mentionsGrad = fullText.includes("graduate") || fullText.includes("master") || fullText.includes("m.tech") || fullText.includes("phd");

  if (profile.educationLevel === "undergraduate") {
    if (mentionsUndergrad) {
      eligibilityScore += 20;
      notes.push("Directly matches undergraduate education level.");
    } else if (mentionsGrad && !mentionsUndergrad) {
      eligibilityScore -= 30;
      notes.push("Opportunity states graduate/advanced degree focus.");
      missingRequirements.push("Verify if undergraduate seniors are eligible.");
    }
  }

  if (branchLower && fullText.includes(branchLower)) {
    eligibilityScore += 10;
    notes.push(`Discipline "${profile.branch}" explicitly mentioned.`);
  }

  // Check graduation year relevance
  const gradYearStr = String(profile.graduationYear);
  if (fullText.includes(gradYearStr) || fullText.includes(`batch of ${gradYearStr}`) || fullText.includes(`class of ${gradYearStr}`)) {
    eligibilityScore += 10;
    notes.push(`Explicitly welcomes class of ${profile.graduationYear}.`);
  } else {
    missingRequirements.push(`Confirm whether batch of ${profile.graduationYear} is accepted.`);
  }
  eligibilityScore = Math.min(100, Math.max(30, eligibilityScore));

  // 3. Interest and Category Fit (20%)
  let interestScore = 60;
  const matchedInterests: string[] = [];
  const userInterests = (profile.interests || []).map((i) => i.toLowerCase().trim()).filter(Boolean);

  for (const interest of userInterests) {
    if (fullText.includes(interest)) {
      matchedInterests.push(interest);
    }
  }

  if (profile.preferredCategories.includes(opp.category)) {
    interestScore += 25;
    notes.push(`Category "${opp.category}" matches your preferred opportunities.`);
  }

  if (matchedInterests.length > 0) {
    interestScore += Math.min(25, matchedInterests.length * 10);
    notes.push(`Aligns with interests: ${matchedInterests.slice(0, 3).join(", ")}.`);
  }
  interestScore = Math.min(100, Math.max(40, interestScore));

  // 4. Location and Work Mode (10%)
  let locationScore = 70;
  const userLocations = (profile.preferredLocations || []).map((l) => l.toLowerCase());
  const oppLocLower = opp.location.toLowerCase();

  if (opp.workMode === "remote" && (profile.workMode === "remote" || profile.workMode === "flexible" || profile.workMode === "unspecified")) {
    locationScore = 95;
    notes.push("Remote opportunity matches work mode preference.");
  } else if (userLocations.some((loc) => oppLocLower.includes(loc))) {
    locationScore = 90;
    notes.push(`Location "${opp.location}" matches your preferred regions.`);
  } else if (opp.workMode === "on-site" && profile.workMode === "remote") {
    locationScore = 40;
    notes.push("On-site requirement conflicts with your preference for remote work.");
    missingRequirements.push("Confirm relocation or on-site attendance feasibility.");
  }

  // 5. Experience Fit (5%)
  let experienceScore = 75;
  if (profile.experienceLevel === "student" || profile.experienceLevel === "entry") {
    if (fullText.includes("senior") || fullText.includes("5+ years") || fullText.includes("lead engineer")) {
      experienceScore = 35;
      notes.push("Listing may require senior-level industry experience.");
      missingRequirements.push("Verify minimum years of professional experience.");
    } else {
      experienceScore = 85;
    }
  }

  // Total weighted score
  const totalScore = Math.round(
    skillsScore * 0.35 +
    eligibilityScore * 0.30 +
    interestScore * 0.20 +
    locationScore * 0.10 +
    experienceScore * 0.05
  );

  const isProvisional = userSkills.length < 2 || !profile.degree || !profile.graduationYear;
  const provisionalReason = isProvisional
    ? "Match score is provisional due to missing profile fields (degree, skills, or grad year)."
    : undefined;

  let explanation = `Match score ${totalScore}%: `;
  if (matchedSkills.length > 0) {
    explanation += `Matches ${matchedSkills.length} key skill(s) (${matchedSkills.slice(0, 3).join(", ")}). `;
  }
  if (profile.preferredCategories.includes(opp.category)) {
    explanation += `Aligned with ${opp.category} target. `;
  }
  if (missingRequirements.length > 0) {
    explanation += `Note: ${missingRequirements[0]}`;
  }

  return {
    matchScore: totalScore,
    matchBreakdown: {
      skillsScore,
      eligibilityScore,
      interestScore,
      locationScore,
      experienceScore,
      totalScore,
      isProvisional,
      provisionalReason,
      matchedSkills,
      missingSkills: userSkills.filter((s) => !matchedSkills.includes(s)),
      matchedInterests,
      notes,
    },
    matchExplanation: explanation,
    missingRequirements,
  };
}

