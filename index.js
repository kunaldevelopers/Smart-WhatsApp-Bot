import readline from "readline";
import fetch from "node-fetch";
import fs from "fs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Google Gemini API configuration
const GEMINI_API_KEY = "AIzaSyB8sqS88Z5sDwDpSOGLm78w_dZy6k5zNEw";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const companyData = fs.readFileSync("techcorp_data.txt", "utf8");
let conversationHistory = [];

console.log(
  "Your EnegiX Global AI is ready! Ask anything about the company..."
);

function askQuestion() {
  rl.question("You: ", async (input) => {
    // Add user input to conversation history
    conversationHistory.push({ role: "user", text: input });

    let dots = "";
    const typingInterval = setInterval(() => {
      dots = dots.length < 3 ? dots + "." : "";
      process.stdout.write(`\rAI is typing${dots}   `);
    }, 500);

    try {
      // Create the prompt with system instructions and conversation context
      const systemPrompt = `You are an AI assistant for EnegiX Global. Use ONLY the following company data to answer questions: ${companyData}

IMPORTANT RULES:
1. Only answer questions related to EnegiX Global using the provided data
2. If a question is unrelated to EnegiX Global, respond: "I can only assist with EnegiX Global-related questions."
3. Format responses as follows:
   - Use single stars (*text*) only for headlines
   - Use \\n for new lines
   - Use _text_ for italics
   - Use ~text~ or ~~text~~ for strikethrough
   - Do NOT use double stars (**), bullets, or other Markdown formatting

Current conversation:
${conversationHistory.map((msg) => `${msg.role}: ${msg.text}`).join("\\n")}

Please respond to the latest user question based only on the EnegiX Global data provided.`;

      const requestBody = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 5000,
          candidateCount: 1,
        },
      };

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          `Gemini API error: ${data.error?.message || "Unknown error"}`
        );
      }

      let aiResponse = data.candidates[0].content.parts[0].text.trim();

      // Post-process to enforce formatting rules
      aiResponse = aiResponse
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove double stars (bold)
        .replace(/(?<!\*)(\*[^ ].*?[^ ]\*)/g, (match) => {
          // Allow single stars only for headlines
          if (match.includes(" ")) return match.replace(/\*/g, ""); // Remove stars in non-headline text
          return match;
        })
        .replace(/^(?![\*\n_~]).*$/gm, (match) => match.replace(/\*/g, "")) // Remove stray stars in paragraphs
        .replace(/(\n|\r\n)/g, "\n"); // Normalize new lines

      clearInterval(typingInterval);
      process.stdout.write("\r");
      console.log(`AI: ${aiResponse}`);

      // Add AI response to conversation history
      conversationHistory.push({ role: "assistant", text: aiResponse });

      // Keep conversation history manageable (last 10 exchanges)
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
    } catch (err) {
      clearInterval(typingInterval);
      console.error("\n❌ Error talking to Gemini API:", err.message);
    }

    askQuestion();
  });
}

askQuestion();
