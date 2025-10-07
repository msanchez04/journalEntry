/**
 * ConcertStatsAI Concept - AI Augmented Version
 * Purpose: allow users to log concerts and generate AI summaries and recommendations.
 */

import { GeminiLLM } from "./gemini-llm";

export interface ConcertRecord {
  userId: string;
  artist: string;
  venue: string;
  date: string;
  rating?: number;
}

export interface ConcertSummary {
  userId: string;
  summary: string;
  recommendations?: string[];
}

export class ConcertStatsAI {
  private records: ConcertRecord[] = [];

  /**
   * Log a concert into memory
   */
  logConcert(
    userId: string,
    artist: string,
    venue: string,
    date: string,
    rating?: number
  ): ConcertRecord {
    if (
      this.records.some(
        (r) => r.userId === userId && r.artist === artist && r.date === date
      )
    ) {
      throw new Error(
        "Concert already logged for this user, artist, and date."
      );
    }

    const record: ConcertRecord = { userId, artist, venue, date, rating };
    this.records.push(record);
    return record;
  }

  /**
   * Aggregate concert statistics manually (non-AI)
   */
  getUserStats(userId: string): Record<string, any> {
    const userRecords = this.records.filter((r) => r.userId === userId);
    if (userRecords.length === 0) throw new Error("No records found for user.");

    const totalConcerts = userRecords.length;
    const uniqueArtists = new Set(userRecords.map((r) => r.artist)).size;
    const avgRating =
      userRecords
        .filter((r) => r.rating !== undefined)
        .reduce((a, b) => a + (b.rating || 0), 0) /
      (userRecords.filter((r) => r.rating !== undefined).length || 1);

    return { totalConcerts, uniqueArtists, avgRating };
  }

  /**
   * AI augmentation: Generate a textual summary of user’s concert trends.
   */
  async generateSummaryAI(
    userId: string,
    llm: GeminiLLM,
    options?: { promptVariant?: "baseline" | "json" | "structured" }
  ): Promise<ConcertSummary> {
    const records = this.records.filter((r) => r.userId === userId);
    if (records.length === 0) throw new Error("No concert records for user.");

    const variant = options?.promptVariant ?? "baseline";
    const userText = records
      .map(
        (r) =>
          `${r.artist} at ${r.venue} (${r.date}) rated ${r.rating ?? "N/A"}`
      )
      .join("\n");

    const prompt =
      variant === "json"
        ? `Analyze this user's concert history and return JSON like {"summary": string, "recommendations": string[]}:
${userText}
Return only valid JSON.`
        : variant === "structured"
        ? `Summarize the user's concert history in one paragraph and suggest 2-3 artists they might enjoy next. Use the format:
Summary: <your paragraph here, may span multiple lines>
Recommendations: <comma-separated list of artists>`
        : `Summarize the user's concert history and suggest artists to see next, returning exactly in this format:
Summary: <your paragraph here, may span multiple lines>
Recommendations: <comma-separated list of artists>
\n\n${userText}`;

    const response = await llm.executeLLM(prompt);
    return this.parseSummaryResponse(response, userId);
  }

  /**
   * Validator and parser for AI responses
   */
  private parseSummaryResponse(raw: string, userId: string): ConcertSummary {
    const trimmed = raw.trim();

    // Try JSON parsing even if wrapped in extra text
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[0]);
        this.validateSummaryOutput(json);
        return {
          userId,
          summary: json.summary,
          recommendations: json.recommendations,
        };
      } catch (err) {
        console.warn(
          "JSON parse failed, falling back to structured parsing:",
          err
        );
      }
    }

    const summaryLine = trimmed
      .split("\n")
      .find((l) => l.startsWith("Summary:"));
    const recLine = trimmed
      .split("\n")
      .find((l) => l.startsWith("Recommendations:"));

    if (!summaryLine) throw new Error("Missing summary in LLM output.");

    const summary = summaryLine.replace("Summary:", "").trim();
    const recs = recLine
      ? recLine
          .replace("Recommendations:", "")
          .split(",")
          .map((r) => r.trim())
      : [];

    this.validateSummaryOutput({ summary, recommendations: recs });

    return { userId, summary, recommendations: recs };
  }

  private validateSummaryOutput(output: any): void {
    if (!output.summary || output.summary.length < 5)
      throw new Error("Summary is too short or missing.");
    if (output.recommendations && !Array.isArray(output.recommendations))
      throw new Error("Recommendations must be an array of strings.");
  }

  displaySummary(summary: ConcertSummary): void {
    console.log("\n🎶 Concert Summary:");
    console.log(`User: ${summary.userId}`);
    console.log(`Summary: ${summary.summary}`);
    if (summary.recommendations && summary.recommendations.length > 0)
      console.log(`Recommendations: ${summary.recommendations.join(", ")}`);
  }
}
