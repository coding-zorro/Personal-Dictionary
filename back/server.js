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

// Create new word
app.post("/words", async (req, res) => {
    const { word, meaning } = req.body;

    if (!word || word.trim() === "") {
        return res.status(400).json({ error: "word required" });
    }

    let finalMeaning = meaning;

    // if meaning is not provided, fetch it from the API
    if (!finalMeaning) {
        finalMeaning = await fetchMeaning(word);
        if (!finalMeaning) {
            return res.status(400).json({ error: "meaning missing and lookup failed" });
        }
    }

    // create the entry in the database
    try {
        const entry = await prisma.wordEntry.create({
            data: { word, meaning: finalMeaning }
        });
        return res.json(entry);
    } catch (err) {
        return res.status(500).json({ error: "db error" });
    }
});

// List all words
app.get("/words", async (req, res) => {
    try {
        const items = await prisma.wordEntry.findMany({
            orderBy: { id: "desc" }
        });
        res.json(items);
    } catch {
        res.status(500).json({ error: "db error" });
    }
});

// Update word
app.put("/words/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { word, meaning } = req.body;

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
            where: { id },
            data: { word, meaning: finalMeaning }
        });
        res.json(entry);
    } catch {
        res.status(500).json({ error: "not found or db error" });
    }
});

// Delete word
app.delete("/words/:id", async (req, res) => {
    const id = Number(req.params.id);

    // delete the entry from the database
    try {
        await prisma.wordEntry.delete({ where: { id } });
        res.json({ status: "deleted" });
    } catch {
        res.status(500).json({ error: "not found or db error" });
    }
});

// run the server and listen on port 3000
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
