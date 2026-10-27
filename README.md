# PathPilot AI
> **Tagline:** Find Your Next Opportunity. Know Why It Fits. Take the Next Step.  
> **Hackathon Track:** Track 01: AI Agents — SerpApi India Hackathon 2026  
> **Repository:** `pathpilot-ai`

---

## 1. Product Strategy & Differentiation

Students often struggle to discover suitable internships, jobs, scholarships, fellowships, and hackathons because opportunity announcements are fragmented across company portals, government circulars, university notice boards, and search engines.

Standard search engines return links without understanding the student's background. Chatbots hallucinate deadlines, eligibility cutoffs, and stipends.

**PathPilot AI** is an **evidence-driven student opportunity intelligence agent**. Rather than competing on raw volume, PathPilot AI differentiates on **traceable, grounded evidence**.

### The Core Differentiator: The Opportunity Evidence Panel
For every discovered opportunity, PathPilot AI provides:
1. **Traceable Source Evidence**: Audited claims grouped into **Supported** (with source snippets), **Needs Verification** (unknown GPAs or batch restrictions), and **Conflicting** criteria.
2. **Deterministic, Explainable Match Breakdown**: Weighted scoring (Skills: 35%, Eligibility: 30%, Interests: 20%, Location: 10%, Experience: 5%) distinguishing candidate fit from admission probability.
3. **Deadline Intelligence & Calendar Sync**: Clear distinction between verified dates, rolling reviews, and unknown deadlines with 1-click **Google Calendar** and **iCal (.ics)** sync.
4. **Actionable Application Planner**: Automatically generated preparation checklists tailored to explicit requirements.
5. **Tailored Application Pitch & Resume Generator**: Custom 3-paragraph cover letter pitches, targeted resume bullets, and interview talking points grounded in the retrieved posting.
6. **Side-by-Side Opportunity Comparison Matrix**: Compare 2–3 shortlisted opportunities head-to-head across match score, compensation, requirements, and deadlines.
7. **Opportunity Dossier Export**: Generate and copy comprehensive Markdown dossiers to share with academic mentors or placement coordinators.
8. **AI Query Assistant**: Dynamic query expansion suggestions tailored to graduation batch and academic discipline.
9. **Direct Source Verification**: Clickable links to primary employer and program pages.

---

## 2. Mandatory Submission Deliverable: Ready-to-Copy Section

### "List the APIs, SDKs, tools, or search engines used and explain why the data matters."

> **PathPilot AI utilizes the following implemented and verified integrations:**
>
> 1. **SerpApi Google Search API (`engine=google`)**  
>    - *Documentation:* https://serpapi.com/search-api  
>    - *Why the data matters:* Discovers live scholarships, fellowships, hackathons (e.g. Smart India Hackathon), and open-source programs (e.g. GSoC). Returns organic titles, snippets, publication dates, and official domains that serve as the primary source evidence for our Evidence Audit Panel.
>
> 2. **SerpApi Google Jobs API (`engine=google_jobs`)**  
>    - *Documentation:* https://serpapi.com/google-jobs-api  
>    - *Why the data matters:* Fetches verified role titles, hiring companies, job highlights (qualifications & responsibilities), detected extensions (posted dates, work-from-home flags, salary/stipends), and direct application options. Grounded listings prevent students from applying to stale or fabricated postings.
>
> 3. **SerpApi Google News API (`engine=google_news`)**  
>    - *Documentation:* https://serpapi.com/google-news-api  
>    - *Why the data matters:* Identifies fresh press releases and program launch announcements for nationwide grants and hackathon cycles, exposing recent deadlines before standard portals index them.
>
> 4. **SerpApi Google Scholar API (`engine=google_scholar`)**  
>    - *Documentation:* https://serpapi.com/google-scholar-api  
>    - *Why the data matters:* Powers the isolated **Research Support** workspace, allowing students applying to research fellowships (e.g. Microsoft Research India) to explore seminal papers, authors, and citation counts for proposal writing.
>
> 5. **Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash**  
>    - *Why the data matters:* Synthesizes retrieved search snippets and student credentials into grounded JSON assessments. Explicit grounding instructions prohibit the model from inventing unverified requirements, categorizing missing details as items the student must verify on the official application page.
>
> 6. **Next.js 14 App Router, TypeScript, Tailwind CSS, & Zod**  
>    - *Why the data matters:* Delivers a robust full-stack architecture with strict schema validation, deterministic client-side matching algorithms, and typed browser persistence (`localStorage`) without security exposure.

---

## 3. APIs, Tools, Search Engines, and Data Relevance

| Technology / Search Engine | Endpoint / Engine | Implemented & Tested? | Consuming Feature | Relevant Returned Fields | Why the Data Matters to Students |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Official `serpapi-search-tools`** | `web_search()`, `news_search()` | **Yes — Implemented & Tested** | Python FastAPI Research Agent (`backend/agent_service`) | `title`, `link`, `snippet`, `source`, `date` | Provides official tool calling primitives with compact JSON output for program, scholarship, and news search. |
| **SerpApi Google Search** | `engine=google` | **Yes — Implemented & Tested** | Discover & Opportunity Evidence Panel | `title`, `link`, `snippet`, `date`, `source`, `rich_snippet` | Uncovers non-job opportunities (scholarships, fellowships, hackathons) with direct evidence snippets. |
| **SerpApi Google Jobs** | `engine=google_jobs` | **Yes — Implemented & Tested** | Discover (Jobs & Internships) | `title`, `company_name`, `location`, `description`, `job_highlights`, `apply_options`, `detected_extensions` | Provides authentic employer postings, work mode (remote/on-site), stipends, and apply URLs. |
| **SerpApi Google News** | `engine=google_news` | **Yes — Implemented & Tested** | Discover (Recent announcements) | `title`, `link`, `snippet`, `date`, `source` | Catches timely notifications and government initiative launches. |
| **SerpApi Google Scholar** | `engine=google_scholar` | **Yes — Implemented & Tested** | Research Support Page | `title`, `link`, `snippet`, `authors`, `publication_info`, `cited_by` | Provides academic literature citations for research fellowship proposals. |
| **Google GenAI SDK** | `models.generateContent` (`gemini-2.5-flash`) | **Yes — Implemented & Tested** | Gemini Grounding in Evidence Panel & Research Planner | Structured JSON schema (`supportedClaims`, `unknownRequirements`, `actionChecklist`) | Cross-references student profile against retrieved snippets to identify hidden gaps and create actionable checklists. |
| **Browser LocalStorage** | Typed storage wrapper | **Yes — Implemented & Tested** | Profile, Saved Applications, Application Planner | Student credentials, application status (`Interested`, `Preparing`, `Applied`), checklists | Maintains private applicant data across refreshes without requiring external cloud databases or storing API secrets. |

---

## 4. Architecture & Data Flow

```
                      +-----------------------------+
                      |   Student Profile Context   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Next.js App Router (UI)   |
                      +--------------+--------------+
                                     | (Internal Proxy)
                                     v
                      +-----------------------------+
                      | Python FastAPI Agent Service|
                      |   (backend/agent_service)   |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
    [web_search()]            [news_search()]         [Google Jobs API]
  (serpapi-search-tools)   (serpapi-search-tools)    (Direct SerpApi Client)
             |                       |                       |
             +-----------------------+-----------------------+
                                     |
                                     v
                      +-----------------------------+
                      | Normalizer & Deduplicator   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Gemini Evidence Grounding   |
                      | & Profile Fit Evaluator     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Opportunity Evidence Panel  |
                      |  & Application Planner      |
                      +-----------------------------+
```

---

## 5. Security & Secret Protection

- **Server-Side Exclusivity:** All SerpApi requests and Gemini SDK calls execute in Next.js Server Route Handlers (`/api/opportunities/search`, `/api/opportunities/analyze`, `/api/research/scholar`).
- **No Secret Leakage:** The `/api/health` endpoint verifies key presence without exposing raw keys. No API keys are bundled into client-side JavaScript.
- **Untrusted Source Text Protection:** All retrieved text is sanitized. Gemini prompts enforce strict JSON output with system guardrails against prompt injection in search snippets.
- **Search Budget Conservation:** Engine calls are targeted based on category, cached for 60 seconds, and user-initiated counters track requests.

---

## 6. Setup & Installation Guide

### Prerequisites
- Node.js 18+ (tested on Node.js v24)
- Python 3.10+ (tested on Python 3.14)
- npm 9+

### 1. Frontend Setup (Next.js)
```bash
git clone https://github.com/anuj-sharma7/PATHPILOT-AI
cd PATHPILOT-AI
npm install
```

### 2. Backend Research Agent Setup (`serpapi-search-tools`)
```bash
cd backend/agent_service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` in both root and `backend/agent_service`:
```bash
# Root directory (.env.local):
SERPAPI_API_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
RESEARCH_AGENT_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_MODE=live

# Backend directory (.env):
SERPAPI_API_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Run Automated Tests
```bash
# Frontend test suite:
npm test
# Output: 17/17 tests passing!

# Python backend test suite:
cd backend/agent_service
python -m pytest tests -v
# Output: 7/7 tests passing!
```

### 5. Start the Services
```bash
# Terminal 1 - Start Python Research Service (port 8000):
cd backend/agent_service
python run.py

# Terminal 2 - Start Next.js App (port 3000):
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Demo Mode vs. Live Mode

PathPilot AI features a strict separation between **Live Mode** and **Verified Demo Mode**:
- **Live Mode:** Dispatches genuine queries to SerpApi and normalizes real-time Google Search, Google Jobs, Google News, and Google Scholar results.
- **Verified Demo Mode:** Provides high-fidelity, verified examples (Google Summer of Code, Microsoft Research India Fellow, Smart India Hackathon, Razorpay SDE Intern) for testing when API keys are unconfigured or during offline judging.
- **Graceful Degradation:** If live search fails or an API key is missing, the application clearly explains the issue, preserves the user's query, and offers an explicit one-click option to switch to Demo Mode.

---


---

## 8. Final Acceptance Verification Matrix

| Requirement | Implementation Status | Evidence / Verification |
| :--- | :---: | :--- |
| **App Launches Successfully** | **Passed** | Next.js 14 App Router running on port 3000 |
| **Profile Data Saved Locally** | **Passed** | `localStorage` persistence with immediate match score recalculation |
| **Live SerpApi Integration** | **Passed** | Real server-side HTTP client querying Google Search & Google Jobs |
| **Authentic Source Links** | **Passed** | Clickable links to employer and program URLs |
| **Deduplication & Normalization** | **Passed** | Normalized URL/title deduplication across engines |
| **Explainable Scoring Engine** | **Passed** | 5-factor weighted algorithm with explicit rationale notes |
| **Opportunity Evidence Panel** | **Passed** | 3-group audit (Supported, Needs Verification, Conflicting) |
| **Saved Opportunities Tracker** | **Passed** | Statuses: Interested, Preparing, Applied, Archived + notes + checklists |
| **Application Planner** | **Passed** | Tailored checklists generated from requirements |
| **Research Support (Scholar)** | **Passed** | Dedicated `google_scholar` workflow with citation counts |
| **Security & Key Handling** | **Passed** | Zero secrets in client-side code; `/api/health` safe diagnostics |
| **Separate Demo Mode** | **Passed** | Clearly labeled and toggleable |
| **Automated Tests Passing** | **Passed** | 17/17 unit tests executed and passed via `npm test` |
| **Production Build Passing** | **Passed** | `npm run build` completed with 0 errors |

---

## License
MIT License. Built for the SerpApi India Hackathon 2026.

