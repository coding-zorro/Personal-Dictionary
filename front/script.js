// script.js for Dictionary app
const API = "https://personal-dictionary-x499.onrender.com";

// Show notification to user
function showNotification(message, type = "info") {
    // Remove existing notification if any
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.add("fade-out");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load all words on page load
async function loadWords() {
    try {
        const res = await fetch(`${API}/words`);

        if (!res.ok) {
            throw new Error(`Failed to load words: ${res.status} ${res.statusText}`);
        }

        const items = await res.json();
        const tbody = document.getElementById("table-body");
        tbody.innerHTML = "";

        if (items.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 4;
            td.textContent = "No words yet. Add your first word above!";
            td.style.textAlign = "center";
            td.style.fontStyle = "italic";
            td.style.color = "#666";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        items.forEach(item => {
            const tr = document.createElement("tr");
            // Word cell as link to detail page
            const tdWord = document.createElement("td");
            const link = document.createElement("a");
            link.href = `word.html?word=${encodeURIComponent(item.word)}`;
            link.textContent = item.word;
            link.style.textDecoration = "none";
            link.style.color = "inherit";
            tdWord.appendChild(link);
            tr.appendChild(tdWord);
            // Meaning cell (editable)
            const tdMeaning = document.createElement("td");
            tdMeaning.textContent = item.meaning;
            tr.appendChild(tdMeaning);
            // No edit/delete columns in this view
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading words:", error);
        showNotification("Failed to load words. Please check if the server is running.", "error");
    }
}

// Enable editing for meaning
function enableEdit(item, meaningCell, editBtn) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = item.meaning;
    // Responsive width: 100% on mobile, 250px on desktop
    input.style.width = window.innerWidth <= 768 ? "100%" : "250px";
    input.style.boxSizing = "border-box";
    // Replace text with an input box
    meaningCell.innerHTML = "";
    meaningCell.appendChild(input);
    // Change Edit button to Submit
    editBtn.textContent = "Submit";

    const revertButton = (newValue) => {
        // Restore text in the cell
        meaningCell.textContent = newValue || item.meaning;
        // Reset button to Edit
        editBtn.textContent = "Edit";
        editBtn.onclick = () => enableEdit(item, meaningCell, editBtn);
    };

    editBtn.onclick = async () => {
        const newValue = input.value.trim();
        if (!newValue) {
            showNotification("Meaning cannot be empty", "error");
            return;
        }
        const success = await updateWord(item.id, item.word, newValue);
        if (success) {
            item.meaning = newValue; // Update the item object
            revertButton(newValue);
        } else {
            revertButton(item.meaning); // Revert to original
        }
    };

    // Save on Enter
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const newValue = input.value.trim();
            if (!newValue) {
                showNotification("Meaning cannot be empty", "error");
                return;
            }
            const success = await updateWord(item.id, item.word, newValue);
            if (success) {
                item.meaning = newValue; // Update the item object
                revertButton(newValue);
            } else {
                revertButton(item.meaning); // Revert to original
            }
        }
    });
    input.focus();
}

// Search for word (doesn't save to DB)
async function addWord() {
    const wordInput = document.getElementById("word");
    const word = wordInput.value.trim();

    // Validate input
    if (!word) {
        showNotification("Please enter a word", "error");
        wordInput.focus();
        return;
    }

    try {
        // First, check if word already exists
        const checkRes = await fetch(`${API}/words`);
        if (!checkRes.ok) {
            throw new Error('Failed to check existing words');
        }
        const existingWords = await checkRes.json();
        const existingWord = existingWords.find(w => w.word.toLowerCase() === word.toLowerCase());

        if (existingWord) {
            // Word exists - navigate to word detail page
            window.location.href = `word.html?word=${encodeURIComponent(existingWord.word)}`;
            return;
        }

        // Word doesn't exist - lookup meaning WITHOUT saving to DB
        const res = await fetch(`${API}/lookup/${encodeURIComponent(word)}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to lookup word: ${res.status}`);
        }

        const lookupResult = await res.json();
        // Navigate to new-word page with the word and meaning (NOT saved yet)
        window.location.href = `new-word.html?word=${encodeURIComponent(lookupResult.word)}&meaning=${encodeURIComponent(lookupResult.meaning || '')}`;
    } catch (error) {
        console.error("Error searching word:", error);
        showNotification(error.message || "Failed to search word. Please try again.", "error");
    }
}

// Update word meaning
async function updateWord(id, word, newMeaning) {
    try {
        const res = await fetch(`${API}/words/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, meaning: newMeaning })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to update word: ${res.status}`);
        }

        await loadWords();
        showNotification("Word updated successfully!", "success");
        return true;
    } catch (error) {
        console.error("Error updating word:", error);
        showNotification(error.message || "Failed to update word. Please try again.", "error");
        return false;
    }
}

// Delete word
async function deleteWord(id, word) {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${word}"?`)) {
        return;
    }

    try {
        const res = await fetch(`${API}/words/${id}`, { method: "DELETE" });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to delete word: ${res.status}`);
        }

        await loadWords();
        showNotification(`"${word}" deleted successfully!`, "success");
    } catch (error) {
        console.error("Error deleting word:", error);
        showNotification(error.message || "Failed to delete word. Please try again.", "error");
    }
}

// ===== Word Detail Page Functions =====

// Helper to read query parameters
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

async function loadWordDetail() {
    const word = getQueryParam('word');
    if (!word) {
        document.getElementById('word-title').textContent = 'Word not specified';
        return;
    }
    try {
        const res = await fetch(`${API}/words`);
        if (!res.ok) throw new Error('Failed to load words');
        const items = await res.json();
        const item = items.find(i => i.word === word);
        if (!item) {
            document.getElementById('word-title').textContent = 'Word not found';
            return;
        }
        // Populate UI
        document.getElementById('word-title').textContent = item.word;
        const meaningDiv = document.getElementById('meaning-container');
        const p = document.createElement('p');
        p.textContent = item.meaning || '(no meaning)';
        meaningDiv.appendChild(p);

        // Back button functionality
        const backBtn = document.getElementById('back-btn');
        backBtn.onclick = () => {
            window.location.href = 'index.html';
        };

        // Edit functionality
        const editBtn = document.getElementById('edit-btn');
        editBtn.onclick = () => startEdit(item);

        // Delete functionality
        const deleteBtn = document.getElementById('delete-btn');
        deleteBtn.onclick = async () => {
            await deleteWord(item.id, item.word);
            // After deletion, go back to main page
            window.location.href = 'index.html';
        };
    } catch (error) {
        console.error('Error loading word detail:', error);
        showNotification(error.message || 'Failed to load word.', 'error');
    }
}

function startEdit(item) {
    const meaningDiv = document.getElementById('meaning-container');
    const originalText = meaningDiv.querySelector('p').textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.style.width = '100%';
    meaningDiv.innerHTML = '';
    meaningDiv.appendChild(input);

    const editBtn = document.getElementById('edit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const backBtn = document.getElementById('back-btn');

    // Switch UI to editing state
    editBtn.textContent = 'Save';
    editBtn.classList.remove('btn-add');
    editBtn.classList.add('btn-add'); // keep styling
    resetBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'none';
    backBtn.style.display = 'none';

    // Save handler
    editBtn.onclick = async () => {
        const newMeaning = input.value.trim();
        if (!newMeaning) {
            showNotification('Meaning cannot be empty', 'error');
            return;
        }
        const success = await updateWord(item.id, item.word, newMeaning);
        if (success) {
            item.meaning = newMeaning;
            const p = document.createElement('p');
            p.textContent = newMeaning;
            meaningDiv.innerHTML = '';
            meaningDiv.appendChild(p);
            // Restore UI
            editBtn.textContent = 'Edit';
            resetBtn.style.display = 'none';
            deleteBtn.style.display = 'inline-block';
            backBtn.style.display = 'inline-block';
            editBtn.onclick = () => startEdit(item);
        }
    };

    // Reset handler
    resetBtn.onclick = () => {
        const p = document.createElement('p');
        p.textContent = originalText;
        meaningDiv.innerHTML = '';
        meaningDiv.appendChild(p);
        // Restore UI
        editBtn.textContent = 'Edit';
        resetBtn.style.display = 'none';
        deleteBtn.style.display = 'inline-block';
        backBtn.style.display = 'inline-block';
        editBtn.onclick = () => startEdit(item);
    };
}

// ===== New Word Page Functions =====

async function loadNewWord() {
    const word = getQueryParam('word');
    const meaning = getQueryParam('meaning');

    if (!word) {
        document.getElementById('new-word-title').textContent = 'Word not specified';
        return;
    }

    // Display word and meaning
    document.getElementById('new-word-title').textContent = word;
    const meaningDiv = document.getElementById('new-meaning-container');
    const p = document.createElement('p');
    p.textContent = meaning || '(no meaning found)';
    meaningDiv.appendChild(p);

    // Save button - NOW actually saves to database
    const saveBtn = document.getElementById('save-btn');
    saveBtn.onclick = async () => {
        try {
            const res = await fetch(`${API}/words`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word, meaning })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save word');
            }

            showNotification(`"${word}" saved successfully!`, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Error saving word:', error);
            showNotification(error.message || 'Failed to save word. Please try again.', 'error');
        }
    };

    // All Words button
    const allWordsBtn = document.getElementById('all-words-btn');
    allWordsBtn.onclick = () => {
        window.location.href = 'index.html';
    };
}

// ===== Page Initialization =====

// Check which page we're on and initialize accordingly
if (document.getElementById('table-body')) {
    // We're on index.html
    loadWords();
} else if (document.getElementById('word-title')) {
    // We're on word.html
    loadWordDetail();
} else if (document.getElementById('new-word-title')) {
    // We're on new-word.html
    loadNewWord();
}
