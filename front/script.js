// script.js for Dictionary app
const API = "http://localhost:3000";

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
            // Word cell
            const tdWord = document.createElement("td");
            tdWord.textContent = item.word;
            tr.appendChild(tdWord);
            // Meaning cell (editable)
            const tdMeaning = document.createElement("td");
            tdMeaning.textContent = item.meaning;
            tr.appendChild(tdMeaning);
            // Edit button
            const tdEdit = document.createElement("td");
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.onclick = () => enableEdit(item, tdMeaning, editBtn);
            tdEdit.appendChild(editBtn);
            tr.appendChild(tdEdit);
            // Delete button
            const tdDelete = document.createElement("td");
            const delBtn = document.createElement("button");
            delBtn.className = "btn-delete";
            delBtn.textContent = "Delete";
            delBtn.onclick = () => deleteWord(item.id, item.word);
            tdDelete.appendChild(delBtn);
            tr.appendChild(tdDelete);
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
    input.style.width = "250px";
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

// Add new word
async function addWord() {
    const wordInput = document.getElementById("word");
    const meaningInput = document.getElementById("meaning");
    const word = wordInput.value.trim();
    const meaning = meaningInput.value.trim();

    // Validate input
    if (!word) {
        showNotification("Please enter a word", "error");
        wordInput.focus();
        return;
    }

    try {
        const res = await fetch(`${API}/words`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, meaning: meaning || null })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to add word: ${res.status}`);
        }

        const newWord = await res.json();
        wordInput.value = "";
        meaningInput.value = "";
        await loadWords();
        showNotification(`"${newWord.word}" added successfully!`, "success");
    } catch (error) {
        console.error("Error adding word:", error);
        showNotification(error.message || "Failed to add word. Please try again.", "error");
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

loadWords();
