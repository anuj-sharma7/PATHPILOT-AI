from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

OpportunityCategory = Literal[
    "internship",
    "job",
    "scholarship",
    "fellowship",
    "hackathon",
    "research",
    "competition",
]

WorkMode = Literal["remote", "hybrid", "on-site", "flexible", "unspecified"]
DeadlineStatus = Literal["confirmed", "estimated", "rolling", "unknown", "passed"]
EvidenceStatus = Literal["supported", "needs_verification", "conflicting"]

class StudentProfileInput(BaseModel):
    id: Optional[str] = "student-1"
    name: Optional[str] = "Student"
    educationLevel: Optional[str] = "undergraduate"
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science"
    field_of_study: Optional[str] = "Computer Science"
    year_of_study: Optional[int] = 3
    graduationYear: Optional[int] = 2026
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferredCategories: List[str] = Field(default_factory=list)
    preferredLocations: List[str] = Field(default_factory=list)
    location_preference: Optional[str] = "India"
    workMode: Optional[WorkMode] = "unspecified"
    experienceLevel: Optional[str] = "student"
    fundingPreference: Optional[str] = "any"

StudentProfile = StudentProfileInput

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Target search query")
    categories: List[OpportunityCategory] = Field(default_factory=list)
    location: Optional[str] = "India"
    workMode: Optional[WorkMode] = "unspecified"
    includeNews: bool = False
    profile: Optional[StudentProfileInput] = None
    limit: int = Field(default=15, ge=1, le=30)
    mode: Literal["live", "demo"] = "live"

class OpportunityEvidence(BaseModel):
    match_reasons: List[str] = Field(default_factory=list)
    verified_requirements: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    potential_disqualifiers: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    deadline_confirmed: bool = False
    sources: List[str] = Field(default_factory=list)

class EvidenceItem(BaseModel):
    id: str = "ev-1"
    claim: str = ""
    status: EvidenceStatus = "supported"
    sourceUrl: Optional[str] = None
    sourceDomain: Optional[str] = None
    sourceSnippet: Optional[str] = None
    sourceEngine: Optional[str] = None
    publishedAt: Optional[str] = None
    retrievedAt: str = ""
    limitations: Optional[str] = None
    confidenceNote: str = "Verified from live SerpApi results"

class MatchBreakdown(BaseModel):
    skillsScore: int = 20
    eligibilityScore: int = 20
    interestScore: int = 15
    locationScore: int = 10
    experienceScore: int = 10
    totalScore: int = 75
    isProvisional: bool = False
    provisionalReason: Optional[str] = None
    matchedSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    matchedInterests: List[str] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)

class ApplyOption(BaseModel):
    title: str
    link: str

class Opportunity(BaseModel):
    id: str
    title: str
    organization: str
    category: OpportunityCategory
    description: str = ""
    originalUrl: str = ""
    sourceDomain: str = "web"
    location: str = "India"
    workMode: WorkMode = "unspecified"
    stipendOrSalary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    deadline: Optional[str] = None
    deadlineStatus: DeadlineStatus = "unknown"
    deadlineNotes: Optional[str] = None
    publishedAt: Optional[str] = None
    retrievedAt: str = ""
    sourceEngine: str = "google"
    matchScore: int = 70
    match_score: int = 70
    matchBreakdown: MatchBreakdown = Field(default_factory=MatchBreakdown)
    matchExplanation: str = ""
    missingRequirements: List[str] = Field(default_factory=list)
    evidenceItems: List[EvidenceItem] = Field(default_factory=list)
    sourceQualityNotes: str = "Extracted from live web source"
    dataMode: Literal["live", "demo"] = "live"
    applyLinks: List[ApplyOption] = Field(default_factory=list)
    # Convenience fields for SerpApi Search Tools integration
    source_url: Optional[str] = None
    snippet: Optional[str] = None
    is_remote: bool = False
    evidence: Optional[Dict[str, Any]] = None

    model_config = {"extra": "allow"}

class SearchPlanItem(BaseModel):
    query: str
    engine: str
    purpose: str

class SearchPlan(BaseModel):
    objective: str
    plannedQueries: List[SearchPlanItem]
    rationale: str

class SearchResponse(BaseModel):
    sessionId: str = "session-1"
    status: str = "success"
    searchPlan: Optional[SearchPlan] = None
    executedQueries: List[str] = Field(default_factory=list)
    enginesUsed: List[str] = Field(default_factory=list)
    resultCount: int = 0
    results: List[Opportunity] = Field(default_factory=list)
    errors: Optional[List[Dict[str, str]]] = None
    retrievedAt: str = ""
    dataMode: Literal["live", "demo"] = "live"
    # Unified response fields
    opportunities: List[Opportunity] = Field(default_factory=list)
    total_found: int = 0
    is_live: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class HealthStatus(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    serpapiConfigured: bool
    geminiConfigured: bool
    supportedEngines: List[str]
