/**
 * ConcertStatsAI Test Suite
 */

import { ConcertStatsAI } from "./concertStatsAI";
import { GeminiLLM, Config } from "./gemini-llm";

/**
 * Load configuration
 */
function loadConfig(): Config {
  try {
    return require("../config.json");
  } catch (err) {
    console.error("Error loading config.json:", (err as Error).message);
    process.exit(1);
  }
}

export async function testGenerateSummary(): Promise<void> {
  console.log("\n🧪 TEST CASE 1: Generate AI Concert Summary");
  console.log("==================================");
  const config = loadConfig();
  const llm = new GeminiLLM(config);
  const stats = new ConcertStatsAI();

  stats.logConcert(
    "user1",
    "Coldplay",
    "Madison Square Garden",
    "2024-10-01",
    9
  );
  stats.logConcert(
    "user1",
    "Taylor Swift",
    "MetLife Stadium",
    "2025-06-22",
    10
  );
  stats.logConcert(
    "user1",
    "The 1975",
    "Radio City Music Hall",
    "2025-03-15",
    8
  );

  const summary = await stats.generateSummaryAI("user1", llm);
  stats.displaySummary(summary);
}

/**
 * Fake LLM for testing
 */
class FakeLLM {
  mode: "missingSummary" | "jsonNoise" | "structured";
  constructor(mode: "missingSummary" | "jsonNoise" | "structured") {
    this.mode = mode;
  }

  async executeLLM(): Promise<string> {
    if (this.mode === "jsonNoise")
      return `Here is a JSON summary:\n{"summary": "You attend large pop concerts often.", "recommendations": ["Ed Sheeran", "Adele"]}`;
    if (this.mode === "structured")
      return `Summary: You often attend stadium pop concerts.\nRecommendations: Ed Sheeran, Harry Styles`;
    return `Recommendations: Arctic Monkeys, Hozier`; // missing summary
  }
}

/**
 * TEST CASE 2: Missing summary → validation failure
 */
export async function testMissingSummary(): Promise<void> {
  console.log("\n🧪 TEST CASE 2: Missing summary validation");
  console.log("==================================");

  const stats = new ConcertStatsAI();
  stats.logConcert(
    "user2",
    "Phoebe Bridgers",
    "Greek Theatre",
    "2025-05-20",
    9
  );
  const llm = new FakeLLM("missingSummary");

  try {
    await stats.generateSummaryAI("user2", llm as any);
  } catch (err) {
    console.log("✅ Expected failure:", (err as Error).message);
  }
}

/**
 * TEST CASE 3: JSON noise → should parse correctly
 */
export async function testJsonNoise(): Promise<void> {
  console.log("\n🧪 TEST CASE 3: JSON noise mitigation");
  console.log("==================================");
  const stats = new ConcertStatsAI();
  stats.logConcert("user3", "Paramore", "Hollywood Bowl", "2025-02-10", 9);
  const llm = new FakeLLM("jsonNoise");
  const summary = await stats.generateSummaryAI("user3", llm as any);
  stats.displaySummary(summary);
}

/**
 * TEST CASE 4: Structured format
 */
export async function testStructuredPrompt(): Promise<void> {
  console.log("\n🧪 TEST CASE 4: Structured prompt variant");
  console.log("==================================");
  const stats = new ConcertStatsAI();
  stats.logConcert(
    "user4",
    "Fleetwood Mac",
    "Wembley Stadium",
    "2024-09-15",
    10
  );
  const llm = new FakeLLM("structured");
  const summary = await stats.generateSummaryAI("user4", llm as any, {
    promptVariant: "structured",
  });
  stats.displaySummary(summary);
}

/**
 * Run all tests
 */
async function main(): Promise<void> {
  console.log("🎵 ConcertStatsAI Test Suite");
  console.log("===========================\n");

  try {
    await testGenerateSummary();
    await testMissingSummary();
    await testJsonNoise();
    await testStructuredPrompt();
    console.log("\n🎉 All test cases completed successfully!");
  } catch (err) {
    console.error("❌ Test error:", (err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
