import { Opportunity } from "@/types";

/**
 * Generates a Google Calendar event URL for an opportunity deadline
 */
export function generateGoogleCalendarUrl(opp: Opportunity): string | null {
  if (!opp.deadline) return null;

  try {
    // Attempt to parse deadline into a Date, or fallback to current month/year
    const parsedDate = new Date(opp.deadline);
    const eventDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    
    // Format as YYYYMMDD
    const dateStr = eventDate.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 8);
    
    const title = encodeURIComponent(`Application Deadline: ${opp.title} (${opp.organization})`);
    const details = encodeURIComponent(
      `Opportunity: ${opp.title}\n` +
      `Organization: ${opp.organization}\n` +
      `Category: ${opp.category}\n` +
      `Match Score: ${opp.matchScore}%\n` +
      `Official Source Link: ${opp.originalUrl}\n\n` +
      `Grounded via PathPilot AI (SerpApi Opportunity Intelligence)`
    );
    const location = encodeURIComponent(opp.location || "Online");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${location}`;
  } catch {
    return null;
  }
}

/**
 * Generates an iCalendar (.ics) file content string
 */
export function generateIcsContent(opp: Opportunity): string {
  const parsedDate = opp.deadline ? new Date(opp.deadline) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const dateStr = validDate.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 8);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PathPilot AI//Opportunity Intelligence//EN",
    "BEGIN:VEVENT",
    `SUMMARY:Application Deadline: ${opp.title} (${opp.organization})`,
    `DESCRIPTION:Opportunity: ${opp.title}\\nOrganization: ${opp.organization}\\nURL: ${opp.originalUrl}`,
    `LOCATION:${opp.location || "Online"}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Generates a comprehensive markdown dossier of an opportunity for mentors/advisors
 */
export function generateOpportunityDossierMarkdown(opp: Opportunity): string {
  return [
    `# PathPilot AI Opportunity Dossier: ${opp.title}`,
    `**Organization:** ${opp.organization}`,
    `**Category:** ${opp.category.toUpperCase()}`,
    `**Location:** ${opp.location} (${opp.workMode})`,
    `**Primary Source:** [${opp.sourceDomain}](${opp.originalUrl})`,
    `**Retrieved At:** ${new Date(opp.retrievedAt).toLocaleDateString()}`,
    `**Profile Match Score:** ${opp.matchScore}%`,
    "",
    "## 1. Overview & Summary",
    opp.description,
    "",
    opp.stipendOrSalary ? `**Compensation / Stipend:** ${opp.stipendOrSalary}\n` : "",
    "## 2. Deadline Intelligence",
    `- **Published Deadline:** ${opp.deadline || "Unconfirmed date"}`,
    `- **Status:** ${opp.deadlineStatus}`,
    `- **Notes:** ${opp.deadlineNotes || "Verify official countdown on portal."}`,
    "",
    "## 3. Evidence Audit",
    "### Supported Claims",
    ...opp.evidenceItems
      .filter((e) => e.status === "supported")
      .map((e) => `- **${e.claim}**\n  *Evidence:* "${e.sourceSnippet || "Indexed by " + e.sourceEngine}"\n  *Verification:* ${e.confidenceNote}`),
    "",
    "### Items Needing Verification",
    ...opp.evidenceItems
      .filter((e) => e.status === "needs_verification")
      .map((e) => `- **${e.claim}**\n  *Limitation:* ${e.limitations || "Snippet may omit fine-grained rules"}\n  *Action:* ${e.confidenceNote}`),
    "",
    "## 4. Skills & Requirements",
    `**Key Skills Detected:** ${opp.skills.join(", ")}`,
    "",
    "**Known Requirements:**",
    ...opp.requirements.map((r) => `- ${r}`),
    "",
    "---",
    "*Generated via PathPilot AI — SerpApi India Hackathon 2026*",
  ].join("\n");
}

