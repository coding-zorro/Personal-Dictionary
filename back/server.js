import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

app.use(cors());

// Fetch meaning from Free Dictionary API
async function fetchMeaning(word) {
    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const res = await axios.get(url);

        const defs = res.data[0]?.meanings?.[0]?.definitions;
        if (!defs || defs.length === 0) return null;

        return defs[0].definition;
    } catch {
        return null;
    }
}

// Get random word from Gemini API
app.get("/learn", async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Error: Check your environment variables
            return res.status(500).json({ error: "Gemini API key not configured" });
        }

        const prompt = "Give me one random English word and its definition. Format your response EXACTLY as: word|definition (just the word and definition separated by a pipe character, nothing else)";


        const MODEL_NAME = "gemini-2.5-flash";

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }
        );

        // --- Response Parsing and Validation ---

        // Ensure candidates and parts exist before trying to access .text
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts || candidates[0].content.parts.length === 0) {
            console.error("Gemini API error: Unexpected response structure.", response.data);
            return res.status(500).json({ error: "Failed to get word due to unexpected API response structure." });
        }

        const text = candidates[0].content.parts[0].text.trim();
        const parts = text.split('|').map(s => s.trim());
        const word = parts[0];
        const meaning = parts[1];

        // Ensure both parts were successfully parsed
        if (!word || !meaning) {
            // Error: The model didn't follow the exact output format
            console.error("Failed to parse Gemini response:", text);
            return res.status(500).json({ error: "Failed to parse Gemini response: The model did not return the expected format (word|definition)." });
        }

        return res.json({ word: word.toLowerCase(), meaning });
    } catch (error) {
        console.error("Gemini API error:", error.response ? error.response.data : error.message);
        // Provide better error info to the client if possible
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error.message
            : "An unknown error occurred while calling the Gemini API.";

        return res.status(500).json({ error: "Failed to get random word from Gemini", details: errorMessage });
    }
});

// Lookup word meaning without saving
app.get("/lookup/:word", async (req, res) => {
    const word = req.params.word.toLowerCase(); // Convert to lowercase

    if (!word || word.trim() === "") {
        return res.status(400).json({ error: "word required" });
    }

    const meaning = await fetchMeaning(word);
    if (!meaning) {
        return res.status(404).json({ error: "meaning not found" });
    }

    return res.json({ word, meaning });
});

// Get word by name
app.get("/words/:word", async (req, res) => {
    const word = req.params.word.toLowerCase();

    try {
        const entry = await prisma.wordEntry.findUnique({
            where: { word }
        });

        if (!entry) {
            return res.status(404).json({ error: "word not found" });
        }

        return res.json(entry);
    } catch (err) {
        return res.status(500).json({ error: "db error" });
    }
});

// Create new word
app.post("/words", async (req, res) => {
    const { word, meaning } = req.body;

    if (!word || word.trim() === "") {
        return res.status(400).json({ error: "word required" });
    }

    const lowercaseWord = word.toLowerCase(); // Convert to lowercase
    let finalMeaning = meaning;

    // if meaning is not provided, fetch it from the API
    if (!finalMeaning) {
        finalMeaning = await fetchMeaning(lowercaseWord);
        if (!finalMeaning) {
            return res.status(400).json({ error: "meaning missing and lookup failed" });
        }
    }

    // create the entry in the database
    try {
        const entry = await prisma.wordEntry.create({
            data: { word: lowercaseWord, meaning: finalMeaning }
        });
        return res.json(entry);
    } catch (err) {
        // Check if it's a unique constraint violation
        if (err.code === 'P2002') {
            return res.status(409).json({ error: "word already exists" });
        }
        return res.status(500).json({ error: "db error" });
    }
});

// List all words
app.get("/words", async (req, res) => {
    try {
        const items = await prisma.wordEntry.findMany({
            orderBy: { word: "asc" }
        });
        res.json(items);
    } catch {
        res.status(500).json({ error: "db error" });
    }
});

// Update word meaning
app.put("/words/:word", async (req, res) => {
    const word = req.params.word.toLowerCase();
    const { meaning } = req.body;

    // if meaning is not provided, fetch it from the API
    let finalMeaning = meaning;
    if (!finalMeaning) {
        finalMeaning = await fetchMeaning(word);
        if (!finalMeaning)
            return res.status(400).json({ error: "meaning missing and lookup failed" });
    }

    // update the entry in the database
    try {
        const entry = await prisma.wordEntry.update({
            where: { word },
            data: { meaning: finalMeaning }
        });
        res.json(entry);
    } catch {
        res.status(500).json({ error: "not found or db error" });
    }
});

// Delete word
app.delete("/words/:word", async (req, res) => {
    const word = req.params.word.toLowerCase();

    // delete the entry from the database
    try {
        await prisma.wordEntry.delete({ where: { word } });
        res.json({ status: "deleted" });
    } catch {
        res.status(500).json({ error: "not found or db error" });
    }
});

// run the server and listen on port 3000
app.listen(3000, () => console.log("Server running now."));
