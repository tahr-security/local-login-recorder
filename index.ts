import "dotenv/config";
import * as fs from "fs";
import * as readline from "readline";
import { chromium } from "playwright";

function getRequiredTargetUrl() {
  const targetUrl = process.argv[2]?.trim() || process.env.TARGET_URL?.trim();
  if (!targetUrl) {
    throw new Error(
      "A target URL is required. Example: npm start -- https://test.ca/login/",
    );
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error("TARGET_URL must be a valid http(s) URL");
  }

  return targetUrl;
}

function shouldRunHeadless() {
  return ["1", "true", "yes"].includes(
    (process.env.HEADLESS || "").trim().toLowerCase(),
  );
}

const RECORDER_SCRIPT_PATH = new URL("./recorder-script.js", import.meta.url);
const OUTPUT_PATH = new URL("./output.json", import.meta.url);

const recordedSteps: any[] = [];

async function main() {
  const targetUrl = getRequiredTargetUrl();
  const headless = shouldRunHeadless();

  console.log("=".repeat(60));
  console.log("  Login Recorder POC (Local)");
  console.log("=".repeat(60));
  console.log("");

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let rl: readline.Interface | null = null;

  try {
    console.log(
      `1. Launching local browser (${headless ? "headless" : "visible"})...`,
    );
    browser = await chromium.launch({
      headless,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log("   Browser launched!");

    await context.exposeFunction("__recordStep__", (step: any) => {
      recordedSteps.push(step);
      console.log(
        `   [RECORDER] ${step.action}: ${step.selector || step.url || "n/a"} | fieldType: ${step.fieldType || "n/a"}`,
      );
    });

    console.log("\n2. Loading recorder script...");
    const recorderScript = fs.readFileSync(RECORDER_SCRIPT_PATH, "utf-8");
    await context.addInitScript(recorderScript);
    console.log("   Recorder script ready (will inject on page load)");

    console.log(`\n3. Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    console.log("   Page loaded!");

    console.log("");
    console.log("=".repeat(60));
    console.log("  NOW PERFORM YOUR LOGIN IN THE LOCAL BROWSER");
    console.log("  Then come back here and press ENTER when done");
    console.log("=".repeat(60));
    console.log("");

    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise<void>((resolve) => {
      rl!.question("Press ENTER to finish recording...", () => {
        rl!.close();
        rl = null;
        resolve();
      });
    });

    console.log("\n4. Retrieving recorded steps...");
    const finalUrl = page.url();
    console.log(`   Found ${recordedSteps.length} steps`);
    console.log(`   Start URL: ${targetUrl}`);
    console.log(`   Final URL: ${finalUrl}`);

    const recording = {
      version: "1.0",
      recordedAt: new Date().toISOString(),
      startUrl: targetUrl,
      steps: recordedSteps,
      finalUrl,
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(recording, null, 2));
    console.log("\n5. Recording saved to output.json");

    console.log("");
    console.log("=".repeat(60));
    console.log("  RECORDING OUTPUT");
    console.log("=".repeat(60));
    console.log("");
    console.log(JSON.stringify(recording, null, 2));
  } finally {
    console.log("\n6. Cleaning up...");

    if (rl) {
      rl.close();
    }

    if (browser) {
      await browser.close();
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("  DONE!");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
