"""
PathPilot AI - Gemini AI Integration
Uses official `google-genai` SDK to generate research plans and evaluate opportunity fit.
Provides deterministic fallbacks if GEMINI_API_KEY is not configured.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

from app.models import StudentProfile, Opportunity

logger = logging.getLogger("pathpilot.ai.gemini_planner")


class GeminiResearchPlanner:
    """Orchestrates LLM-based query planning and opportunity fit evaluation."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.model_name = model or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Gemini Client with model %s", self.model_name)
            except Exception as e:
                logger.warning("Could not initialize google-genai Client: %s", e)

    def is_configured(self) -> bool:
        return self._client is not None

    async def plan_search_queries(
        self, query: str, profile: Optional[StudentProfile] = None
    ) -> Dict[str, List[str]]:
        """
        Generate optimized queries across web, news, and jobs.
        Falls back to intelligent heuristic query generation if Gemini is unconfigured.
        """
        if self._client:
            try:
                profile_context = ""
                if profile:
                    profile_context = (
                        f"Student Profile: Degree={profile.degree}, Field={profile.field_of_study}, "
                        f"Year={profile.year_of_study}, Skills={', '.join(profile.skills)}, "
                        f"Interests={', '.join(profile.interests)}, Location={profile.location_preference}"
                    )

                prompt = f"""
You are the query planning agent for PathPilot AI, an opportunity discovery engine for students.
Given the user's primary search: "{query}" and student context: {profile_context}

Produce a JSON object with 3 targeted query lists:
- "web_queries": 2-3 queries for general programs, scholarships, hackathons, or fellowships
- "news_queries": 1-2 queries for recent opportunity announcements or deadlines (e.g. 2026/2025)
- "job_queries": 2-3 queries for internships or job listings

Output strictly valid JSON with no markdown formatting.
JSON format:
{{
  "web_queries": ["query 1", "query 2"],
  "news_queries": ["query 1"],
  "job_queries": ["query 1", "query 2"]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                data = json.loads(text.strip())
                return {
                    "web_queries": data.get("web_queries", [query]),
                    "news_queries": data.get("news_queries", [f"{query} announcement 2026"]),
                    "job_queries": data.get("job_queries", [f"{query} internship"]),
                }
            except Exception as e:
                logger.warning("Gemini query planning failed, falling back to heuristics: %s", e)

        # Deterministic fallback
        field = profile.field_of_study if profile and profile.field_of_study else "technology"
        loc = profile.location_preference if profile and profile.location_preference else "India"

        return {
            "web_queries": [
                f"{query} student program {loc}",
                f"{query} fellowship scholarship {field} 2026",
            ],
            "news_queries": [
                f"{query} application open deadline 2026",
            ],
            "job_queries": [
                f"{query} intern {loc}",
                f"{query} entry level {field}",
            ],
        }

    async def analyze_opportunity_fit(
        self, opportunity: Opportunity, profile: Optional[StudentProfile] = None
    ) -> Dict[str, Any]:
        """
        Assess match score, explain rationale, and verify eligibility evidence.
        """
        if self._client and profile:
            try:
                prompt = f"""
Analyze how well this opportunity fits the student's profile.

Student Profile:
- Degree: {profile.degree} in {profile.field_of_study} (Year: {profile.year_of_study})
- Skills: {', '.join(profile.skills)}
- Interests: {', '.join(profile.interests)}
- Location Preference: {profile.location_preference}

Opportunity:
- Title: {opportunity.title}
- Organization: {opportunity.organization}
- Description: {opportunity.description}
- Snippet: {opportunity.snippet}

Evaluate objectively:
1. match_score (integer between 40 and 98)
2. match_reasons (list of 2-3 specific reasons why it matches the student)
3. verified_requirements (list of 2-3 requirements supported by context)
4. missing_information (list of 1-2 details still unverified)
5. potential_disqualifiers (list of 1-2 potential risks, or empty)
6. next_steps (list of 2 concrete application steps)

Return strictly valid JSON with no markdown formatting.
JSON structure:
{{
  "match_score": 85,
  "match_reasons": ["..."],
  "verified_requirements": ["..."],
  "missing_information": ["..."],
  "potential_disqualifiers": ["..."],
  "next_steps": ["..."]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                return json.loads(text.strip())
            except Exception as e:
                logger.warning("Gemini fit analysis failed, falling back to deterministic heuristics: %s", e)

        # Deterministic evidence calculation
        return self._heuristic_fit_analysis(opportunity, profile)

    def _heuristic_fit_analysis(
        self, opportunity: Opportunity, profile: Optional[StudentProfile]
    ) -> Dict[str, Any]:
        """Rule-based explainable fit calculation."""
        text = f"{opportunity.title} {opportunity.description or ''} {opportunity.snippet or ''}".lower()
        score = 65
        match_reasons = []
        verified_reqs = []
        missing_info = ["Specific GPA/grade cutoff not confirmed", "Exact final submission time zone"]
        disqualifiers = []

        if profile:
            matched_skills = [s for s in profile.skills if s.lower() in text]
            if matched_skills:
                score += min(len(matched_skills) * 8, 20)
                match_reasons.append(f"Direct match for student skills: {', '.join(matched_skills)}")
                verified_reqs.append(f"Requires familiarity with {', '.join(matched_skills[:2])}")

            if profile.field_of_study and profile.field_of_study.lower() in text:
                score += 8
                match_reasons.append(f"Directly targets {profile.field_of_study} academic backgrounds")
                verified_reqs.append(f"Open to students enrolled in {profile.field_of_study}")

            if profile.location_preference and profile.location_preference.lower() in (opportunity.location or "").lower():
                score += 5
                match_reasons.append(f"Matches preferred location: {opportunity.location}")
            elif opportunity.is_remote:
                score += 5
                match_reasons.append("Remote/Virtual opportunity matches flexible preferences")

        if not match_reasons:
            match_reasons.append(f"Relevant to {opportunity.category} discovery in current career cycle")
            match_reasons.append(f"Organized by verified organization: {opportunity.organization}")

        if not verified_reqs:
            verified_reqs.append(f"Active application window in {opportunity.category} domain")

        score = max(50, min(95, score))

        next_steps = [
            f"Review official guidelines on {opportunity.organization}'s portal",
            "Tailor resume highlights to match stated prerequisites before applying",
        ]

        return {
            "match_score": score,
            "match_reasons": match_reasons,
            "verified_requirements": verified_reqs,
            "missing_information": missing_info,
            "potential_disqualifiers": disqualifiers,
            "next_steps": next_steps,
        }
