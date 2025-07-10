// Import WhatsApp client
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

// Other imports
import fetch from "node-fetch";
import fs from "fs";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import ora from "ora";
import winston from "winston";

// Google Gemini API configuration
const GEMINI_API_KEY = "AIzaSyB8sqS88Z5sDwDpSOGLm78w_dZy6k5zNEw";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
    new winston.transports.File({ filename: "app.log", maxsize: 10485760 }),
  ],
});

// Query logger for self-improvement
const queryLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Store as JSON for easy parsing later
  ),
  transports: [new winston.transports.File({ filename: "queries.log" })],
});

// Load local data
let companyData;
try {
  companyData = fs.readFileSync("techcorp_data.txt", "utf8");
  console.log(chalk.green.bold("[Success] Data Loaded Successfully!"));
} catch (err) {
  logger.error(`Failed to load techcorp_data.txt: ${err.message}`);
  console.error(chalk.red.bold("[Error] Couldn't load data! Shutting down..."));
  process.exit(1);
}

// Store user histories
const userHistories = new Map();
const processedMessages = new Set(); // Track processed messages
const userLastMessageTime = new Map(); // Track last message time per user
const processingUsers = new Set(); // Track users currently being processed
const MAX_HISTORY_SIZE = 10;
const MAX_USERS = 1000;
const MAX_PROCESSED_MESSAGES = 1000; // Limit memory usage
const MIN_MESSAGE_INTERVAL = 1000; // Minimum 1 second between messages from same user

// Create WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 60000,
  },
});

// Show QR code
client.on("qr", (qr) => {
  console.log(chalk.cyan.bold("[QR] Scan this to Connect:"));
  qrcode.generate(qr, { small: true });
});

// Authenticated
client.on("authenticated", () => {
  console.log(chalk.green.bold("[Connected] WhatsApp Session Saved!"));
});

// Ready
client.on("ready", () => {
  console.log(chalk.blue.bold("[Ready] Bot is Online and Ready!"));
});

// Respond to messages
client.on("message", async (msg) => {
  try {
    // Skip messages from the bot itself
    if (msg.fromMe) {
      return;
    }

    // Skip empty messages
    const userInput = msg.body?.trim() || "";
    if (!userInput) {
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
        temperature: 0.7,
        maxOutputTokens: 2000, // Reduced for faster response
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

// Handle disconnects
client.on("disconnected", (reason) => {
  console.log(chalk.red.bold(`[Disconnected] Reason: ${reason}`));
  setTimeout(() => initializeClient(), 5000);
});

// Utility functions
async function safeReply(msg, text) {
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
      return false; // Both failed
    }
  }
}

async function fetchWithRetry(url, options, retries = 2, delay = 500) {
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

// Init
let isInitializing = false;
async function initializeClient() {
  if (isInitializing) {
    console.log(chalk.yellow("[Skip] Client already initializing..."));
    return;
  }

  isInitializing = true;
  try {
    await client.initialize();
    isInitializing = false;
  } catch (err) {
    isInitializing = false;
    logger.error(`Error initializing client: ${err.message}`);
    console.error(chalk.red.bold(`[Init Error] ${err.message}`));
    setTimeout(initializeClient, 5000);
  }
}

console.log(chalk.yellow.bold("[Start] Launching EnegiX Global Bot..."));
initializeClient();
