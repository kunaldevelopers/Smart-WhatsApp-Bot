// Import WhatsApp client
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Other imports
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import ora from "ora";
import winston from "winston";

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app setup
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Bot status for web interface
let botStatus = {
  status: "initializing",
  qr: null,
  authenticated: false,
  ready: false,
  logs: [],
};

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/status", (req, res) => {
  res.json(botStatus);
});

app.get("/api/auth-status", (req, res) => {
  res.json({ authenticated: botStatus.authenticated });
});

// Helper function to add logs
function addWebLog(level, message) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  botStatus.logs.push(logEntry);

  // Keep only last 50 logs
  if (botStatus.logs.length > 50) {
    botStatus.logs = botStatus.logs.slice(-50);
  }
}

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;

// Validate required environment variables
if (!GEMINI_API_KEY) {
  console.error(
    chalk.red.bold(
      "[Error] GEMINI_API_KEY is required! Please set it in your .env file."
    )
  );
  process.exit(1);
}

// Ensure UTF-8 encoding
process.stdout.setEncoding("utf8");

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [
    new winston.transports.File({
      filename: process.env.APP_LOG_FILE || "app.log",
      maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760,
    }),
  ],
});

// Query logger for self-improvement
const queryLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Store as JSON for easy parsing later
  ),
  transports: [
    new winston.transports.File({
      filename: process.env.QUERIES_LOG_FILE || "queries.log",
    }),
  ],
});

// Load local data
let companyData;
const dataFileName = process.env.COMPANY_DATA_FILE || "techcorp_data.txt";
try {
  companyData = fs.readFileSync(dataFileName, "utf8");
  console.log(chalk.green.bold("[Success] Data Loaded Successfully!"));
} catch (err) {
  logger.error(`Failed to load ${dataFileName}: ${err.message}`);
  console.error(chalk.red.bold("[Error] Couldn't load data! Shutting down..."));
  process.exit(1);
}

// Store user histories
const userHistories = new Map();
const processedMessages = new Set(); // Track processed messages
const userLastMessageTime = new Map(); // Track last message time per user
const processingUsers = new Set(); // Track users currently being processed
const MAX_HISTORY_SIZE = parseInt(process.env.MAX_HISTORY_SIZE) || 10;
const MAX_USERS = parseInt(process.env.MAX_USERS) || 1000;
const MAX_PROCESSED_MESSAGES =
  parseInt(process.env.MAX_PROCESSED_MESSAGES) || 1000; // Limit memory usage
const MIN_MESSAGE_INTERVAL = parseInt(process.env.MIN_MESSAGE_INTERVAL) || 1000; // Minimum 1 second between messages from same user

// Create WhatsApp client with enhanced session handling
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--no-first-run",
      "--disable-default-apps",
    ],
    timeout: 60000,
  },
});

// Show QR code
client.on("qr", (qr) => {
  console.log(chalk.cyan.bold("[QR] Scan this to Connect:"));

  // Show the correct URL based on environment
  const webUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  console.log(chalk.yellow(`[Info] QR Code available at: ${webUrl}`));
  console.log(chalk.magenta.bold(`🌐 SCAN HERE: ${webUrl}`));

  qrcode.generate(qr, { small: true });

  // Update bot status for web interface
  botStatus.status = "qr_ready";
  botStatus.qr = qr;
  addWebLog("info", "QR code generated successfully");
  addWebLog("info", `Web interface available at: ${webUrl}`);
});

// Loading session
client.on("loading_screen", (percent, message) => {
  console.log(chalk.blue(`[Loading] ${percent}% - ${message}`));
  addWebLog("info", `Loading: ${percent}% - ${message}`);
});

// Authentication failure - regenerate QR
client.on("auth_failure", (msg) => {
  console.error(chalk.red.bold("[Auth Failed] Session expired or invalid"));
  logger.error(`Authentication failed: ${msg}`);
  console.log(
    chalk.yellow("[Action] Clearing session and regenerating QR code...")
  );

  // Update bot status
  botStatus.status = "auth_failure";
  botStatus.authenticated = false;
  addWebLog("error", "Authentication failed - clearing session");

  // Clear the session and restart
  setTimeout(async () => {
    try {
      await clearSessionAndRestart();
    } catch (error) {
      logger.error(`Failed to clear session: ${error.message}`);
      console.error(
        chalk.red.bold("[Error] Failed to clear session, restarting...")
      );
      addWebLog("error", "Failed to clear session");
      process.exit(1);
    }
  }, 2000);
});

// Authenticated
client.on("authenticated", () => {
  console.log(chalk.green.bold("[Connected] WhatsApp Session Saved!"));
  botStatus.status = "authenticated";
  botStatus.authenticated = true;
  addWebLog("success", "WhatsApp authentication successful");
});

// Ready
client.on("ready", () => {
  console.log(chalk.blue.bold("[Ready] Bot is Online and Ready!"));
  console.log(chalk.green("✅ WhatsApp connection established successfully"));

  // Show the correct URL based on environment
  const webUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  console.log(chalk.cyan(`🌐 Web interface: ${webUrl}`));

  botStatus.status = "ready";
  botStatus.ready = true;
  addWebLog("success", "Bot is online and ready to receive messages");
});

// Handle disconnects with better error handling
client.on("disconnected", (reason) => {
  console.log(chalk.red.bold(`[Disconnected] Reason: ${reason}`));
  logger.warn(`Client disconnected: ${reason}`);

  // Different handling based on disconnect reason
  if (reason === "NAVIGATION" || reason === "LOGOUT") {
    console.log(
      chalk.yellow("[Action] Session ended by user or navigation issue")
    );
    console.log(
      chalk.cyan("[Info] Clearing session and restarting with new QR...")
    );
    setTimeout(async () => {
      await clearSessionAndRestart();
    }, 3000);
  } else {
    console.log(chalk.yellow("[Action] Attempting to reconnect..."));
    setTimeout(() => initializeClient(), 5000);
  }
});

// Handle client destruction
client.on("remote_session_saved", () => {
  console.log(chalk.green("[Session] Remote session saved successfully"));
});

// Connection lost handler
process.on("SIGINT", async () => {
  console.log(
    chalk.yellow("\n[Shutdown] Gracefully closing WhatsApp connection...")
  );
  try {
    await client.destroy();
    console.log(chalk.green("[Shutdown] WhatsApp client closed successfully"));
  } catch (error) {
    console.error(chalk.red("[Shutdown Error]"), error.message);
  }
  process.exit(0);
});

// Respond to messages
client.on("message", async (msg) => {
  try {
    // Skip messages from the bot itself
    if (msg.fromMe) {
      return;
    }

    // Skip empty messages or invalid message objects
    if (!msg || !msg.body) {
      return;
    }

    const userInput = msg.body?.trim() || "";
    if (!userInput) {
      return;
    }

    // Ensure we have a valid user ID
    if (!msg.from) {
      console.log(chalk.red("[Error] Invalid message: missing sender ID"));
      return;
    }

    // Create unique message ID to prevent duplicate processing
    // Using multiple identifiers to ensure uniqueness
    const messageId = `${msg.from}_${
      msg.id._serialized || msg.id
    }_${userInput.substring(0, 50)}`;

    console.log(
      chalk.gray(`[Debug] Message ID: ${messageId.substring(0, 80)}...`)
    );
    console.log(
      chalk.gray(`[Debug] Processed messages count: ${processedMessages.size}`)
    );

    if (processedMessages.has(messageId)) {
      console.log(
        chalk.yellow(
          `[Skip] Duplicate message detected: ${messageId.substring(0, 50)}...`
        )
      );
      return; // Already processed this message
    }

    // Add to processed messages
    processedMessages.add(messageId);

    const lowerInput = userInput.toLowerCase();
    const userId = msg.from;

    // Rate limiting: Check if user is sending messages too quickly
    const currentTime = Date.now();
    const lastMessageTime = userLastMessageTime.get(userId) || 0;
    if (currentTime - lastMessageTime < MIN_MESSAGE_INTERVAL) {
      console.log(
        chalk.yellow(`[Skip] Rate limit: User ${userId} sending too quickly`)
      );
      return;
    }
    userLastMessageTime.set(userId, currentTime);

    // Clean up processed messages set if it gets too large
    if (processedMessages.size > MAX_PROCESSED_MESSAGES) {
      const messagesToRemove = Array.from(processedMessages).slice(0, 100);
      messagesToRemove.forEach((id) => processedMessages.delete(id));
    }

    // Check if this user is already being processed
    if (processingUsers.has(userId)) {
      console.log(
        chalk.yellow(`[Skip] Already processing message for user: ${userId}`)
      );
      return;
    }

    // Mark user as being processed
    processingUsers.add(userId);

    // Beautified console output
    console.log(
      chalk.yellow.bold("\n[New Message] ✨ Alert ✨") +
        `\n[User] ${chalk.cyan(userId)}\n[Query] ${chalk.white.bold(userInput)}`
    );

    // Log query for future improvement
    queryLogger.info({ userId, query: userInput });

    // Prevent memory overload
    if (userHistories.size >= MAX_USERS) {
      logger.warn("Max user limit reached. Clearing oldest history.");
      const oldestUser = userHistories.keys().next().value;
      userHistories.delete(oldestUser);
    }

    // Initialize user history
    if (!userHistories.has(userId)) {
      userHistories.set(userId, []);
    }

    const userMessages = userHistories.get(userId);

    // Greeting logic
    const greetingKeywords = ["hi", "hello", "hey", "hii", "hlo"];
    if (greetingKeywords.includes(lowerInput)) {
      const greetingResponse =
        `*Hey there!😊*\n\n Welcome to *EnegiX Global!* 🌟\n` +
        `I'm your _smart assistant_ 🤖 here to help you!\n\n` +
        `Curious about our *services* 🔧, *pricing* 💰, or how we boost your business? 📈\n` +
        `Ask me anything! 😎`;

      const greetingSuccess = await safeReply(msg, greetingResponse);
      if (greetingSuccess) {
        console.log(chalk.green(`[Sent] Greeting to ${userId}`));
      } else {
        logger.error(`Failed to send greeting to ${userId}`);
      }

      // Remove from processing
      processingUsers.delete(userId);
      return;
    }

    // Add user question to history
    userMessages.push({ role: "user", text: userInput });

    // Simulate AI thinking (removed artificial delay)
    const spinner = ora(chalk.magenta("[AI] Thinking...")).start();
    const startTime = Date.now();

    // Step 1: Analyzing (removed unnecessary delay)
    spinner.text = chalk.magenta("[AI] Analyzing Request...");

    // Create optimized prompt with system instructions
    const recentConversation = userMessages.slice(-4); // Only last 2 exchanges
    const systemPrompt = `You are an AI assistant for EnegiX Global. Use ONLY the provided company data to answer questions.

COMPANY DATA: ${companyData}

RULES:
1. Only answer EnegiX Global questions using above data
2. If unrelated, say: "I can only assist with EnegiX Global-related questions."
3. WhatsApp formatting: Use *bold*, _italic_, \\n for newlines, add emojis 🚀
4. Be conversational and include contact info when relevant

Recent conversation: ${recentConversation
      .map((msg) => `${msg.role}: ${msg.text}`)
      .join("\\n")}

Respond to the latest question using EnegiX Global data only.`;

    const requestBody = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS) || 2000, // Reduced for faster response
        candidateCount: 1,
      },
    };

    const aiResponse = await fetchWithRetry(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );
    const analyzeTime = Date.now();

    // Step 3: Formatting
    spinner.text = chalk.magenta("[AI] Crafting Response...");
    let responseText = aiResponse.candidates[0].content.parts[0].text.trim();

    // Apply formatting
    responseText = formatResponse(responseText);

    const formatTime = Date.now();

    // Stop spinner
    spinner.succeed(chalk.green("[AI] Response Ready!"));

    // Send reply
    const replySuccess = await safeReply(msg, responseText);
    if (!replySuccess) {
      logger.error(`Failed to send response to ${userId}`);
      processingUsers.delete(userId); // Remove from processing
      return; // Exit if message couldn't be sent
    }

    const sendTime = Date.now();

    // Beautified console output with timings
    console.log(
      chalk.blue.bold("\n[Stats] Response Breakdown:") +
        `\n[Time] Total: ${chalk.cyan((sendTime - startTime) / 1000 + "s")}` +
        `\n[Time] API Call: ${chalk.cyan(
          (analyzeTime - startTime) / 1000 + "s"
        )}` +
        `\n[Time] Formatted: ${chalk.cyan(
          (formatTime - analyzeTime) / 1000 + "s"
        )}` +
        `\n[Time] Sent: ${chalk.cyan((sendTime - formatTime) / 1000 + "s")}` +
        `\n[Reply] ${chalk.white(
          responseText.slice(0, 50) + (responseText.length > 50 ? "..." : "")
        )}`
    );

    // Add AI reply to history
    userMessages.push({ role: "assistant", text: responseText });
    if (userMessages.length > MAX_HISTORY_SIZE) {
      userHistories.set(userId, userMessages.slice(-MAX_HISTORY_SIZE));
    }

    // Remove from processing
    processingUsers.delete(userId);
  } catch (err) {
    // Make sure to remove from processing even if there's an error
    const userId = msg.from;
    processingUsers.delete(userId);

    logger.error(`Error processing message from ${msg.from}: ${err.message}`);
    console.error(chalk.red.bold(`[Error] Gemini API Error: ${err.message}`));
    await safeReply(
      msg,
      "😓 *Oops!* Something went wrong with our AI service. Try again later! 🙏"
    );
  }
});

// Utility functions
async function clearSessionAndRestart() {
  try {
    console.log(chalk.yellow("[Cleanup] Destroying current client..."));
    await client.destroy();

    console.log(chalk.yellow("[Cleanup] Clearing session data..."));
    // Clear session files
    const sessionPath = "./.wwebjs_auth";
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(chalk.green("[Cleanup] Session data cleared"));
    }

    // Wait a bit then restart
    console.log(chalk.cyan("[Restart] Restarting bot with fresh session..."));
    setTimeout(() => {
      process.exit(0); // Let the process manager restart the app
    }, 2000);
  } catch (error) {
    logger.error(`Error clearing session: ${error.message}`);
    console.error(chalk.red.bold(`[Cleanup Error] ${error.message}`));
    process.exit(1);
  }
}

async function safeReply(msg, text) {
  if (!msg || !text) {
    logger.error("Invalid parameters for safeReply");
    return false;
  }

  try {
    await msg.reply(text);
    return true; // Success
  } catch (err) {
    logger.error(`Failed to reply: ${err.message}`);
    try {
      // Only try fallback if reply failed
      await client.sendMessage(msg.from, text);
      return true; // Fallback success
    } catch (fallbackErr) {
      logger.error(`Fallback send failed: ${fallbackErr.message}`);

      // If both methods fail, it might be a connection issue
      if (
        fallbackErr.message.includes("Session closed") ||
        fallbackErr.message.includes("not connected") ||
        fallbackErr.message.includes("Protocol error")
      ) {
        console.log(
          chalk.red("[Connection Error] WhatsApp session might be disconnected")
        );
        // Don't restart immediately, let the disconnect handler deal with it
      }

      return false; // Both failed
    }
  }
}

async function fetchWithRetry(
  url,
  options,
  retries = parseInt(process.env.FETCH_RETRIES) || 2,
  delay = parseInt(process.env.FETCH_RETRY_DELAY) || 500
) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `HTTP ${res.status}: ${errorData.error?.message || "Unknown error"}`
        );
      }
      const data = await res.json();

      // Check if Gemini API returned an error
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      logger.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function formatResponse(text) {
  return (
    text
      // Convert double asterisks to single asterisks for WhatsApp bold
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      // Convert double underscores to single underscores for WhatsApp italic
      .replace(/__(.*?)__/g, "_$1_")
      // Keep strikethrough format for WhatsApp
      .replace(/~(.*?)~/g, "~$1~")
      .replace(/~~(.*?)~~/g, "~$1~")
      // Fix newline formatting - convert literal \n to actual newlines
      .replace(/\\n/g, "\n")
      .replace(/\/n/g, "\n")
      // Remove excessive newlines (more than 2 consecutive)
      .replace(/\n{3,}/g, "\n\n")
      // Clean up multiple spaces but preserve single spaces
      .replace(/[ \t]+/g, " ")
      // Remove spaces at the beginning and end of lines
      .replace(/^ +| +$/gm, "")
      .trim()
  );
}

// Init with enhanced error handling
let isInitializing = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

async function initializeClient() {
  if (isInitializing) {
    console.log(chalk.yellow("[Skip] Client already initializing..."));
    return;
  }

  initializationAttempts++;
  isInitializing = true;

  try {
    console.log(
      chalk.blue(
        `[Init] Attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS} - Initializing WhatsApp client...`
      )
    );

    // Add timeout for initialization
    const initPromise = client.initialize();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Initialization timeout after 30 seconds")),
        30000
      );
    });

    await Promise.race([initPromise, timeoutPromise]);

    initializationAttempts = 0; // Reset on success
    isInitializing = false;
  } catch (err) {
    isInitializing = false;
    logger.error(
      `Error initializing client (attempt ${initializationAttempts}): ${err.message}`
    );
    console.error(
      chalk.red.bold(
        `[Init Error] Attempt ${initializationAttempts}: ${err.message}`
      )
    );

    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
      console.error(
        chalk.red.bold(
          `[Fatal] Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached`
        )
      );
      console.log(
        chalk.yellow("[Action] Clearing session and trying fresh start...")
      );

      try {
        // Clear session and restart fresh
        const sessionPath = "./.wwebjs_auth";
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(chalk.green("[Cleanup] Session cleared for fresh start"));
        }
        initializationAttempts = 0;
        setTimeout(initializeClient, 10000); // Wait 10 seconds before retry
      } catch (cleanupError) {
        logger.error(`Failed to cleanup session: ${cleanupError.message}`);
        console.error(chalk.red.bold("[Fatal] Could not recover. Exiting..."));
        process.exit(1);
      }
    } else {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, initializationAttempts) * 5000; // 5s, 10s, 20s
      console.log(
        chalk.yellow(`[Retry] Retrying in ${retryDelay / 1000} seconds...`)
      );
      setTimeout(initializeClient, retryDelay);
    }
  }
}

// Startup validation and initialization
console.log(chalk.yellow.bold("🚀 [Start] Launching EnegiX Global Bot..."));
console.log(chalk.cyan("📋 [Config] Validating configuration..."));

// Validate environment
const requiredVars = ["GEMINI_API_KEY"];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    chalk.red.bold(
      `❌ [Config Error] Missing required environment variables: ${missingVars.join(
        ", "
      )}`
    )
  );
  console.log(
    chalk.yellow("💡 [Tip] Copy .env.example to .env and add your API keys")
  );
  process.exit(1);
}

// Check if data file exists
if (!fs.existsSync(dataFileName)) {
  console.error(
    chalk.red.bold(
      `❌ [Data Error] Company data file not found: ${dataFileName}`
    )
  );
  process.exit(1);
}

console.log(chalk.green("✅ [Config] Configuration validated successfully"));
console.log(chalk.blue("🔌 [WhatsApp] Connecting to WhatsApp Web..."));

// Start web server
server.listen(PORT, () => {
  const webUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;

  console.log(chalk.magenta(`🌐 [Web] Server running at ${webUrl}`));
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(chalk.yellow.bold(`🎯 RAILWAY URL: ${webUrl}`));
    console.log(
      chalk.green.bold(`📱 Open this URL to scan QR code: ${webUrl}`)
    );
  }

  addWebLog("info", `Web server started on port ${PORT}`);
  addWebLog("info", "Initializing WhatsApp client...");
});

initializeClient();
