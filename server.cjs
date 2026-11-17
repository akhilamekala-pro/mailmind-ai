const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to MailMind AI Backend!");
});

app.post("/api/ai", async (req, res) => {
  try {
    const { task, emailText } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is missing in .env"
      });
    }

    if (!emailText || !emailText.trim()) {
      return res.status(400).json({
        error: "Email text is required"
      });
    }

    let prompt;

    if (task === "summary") {
      prompt = "Summarize this email in 3 simple bullet points:\n" + emailText;
    } else if (task === "reply") {
      prompt = "Write a polite professional reply to this email:\n" + emailText;
    } else {
      return res.status(400).json({
        error: "Invalid task"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API failed"
      });
    }

    const result = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "No response generated";

    res.json({ success: true, result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("MailMind Backend running");
});