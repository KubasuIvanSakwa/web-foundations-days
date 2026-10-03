let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const lowerCaseWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerCaseWord));
}

function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) => 
    current.text.length > longest.text.length ? current : longest
  , notes[0]);
}

function countByCategory() {
  return notes.reduce((counts, note) => {
    counts[note.category] = (counts[note.category] || 0) + 1;
    return counts;
  }, {});
}

function getSummary() {
  const counts = countByCategory();
  const countStrings = Object.entries(counts).map(([category, count]) => `${count} ${category}`);
  return `${notes.length} notes: ${countStrings.join(", ")}.`;
}

function isDuplicate(text) {
  const formatText = (str) => str.trim().replace(/\s+/g, ' ').toLowerCase();
  const cleanedInput = formatText(text);
  return notes.some(note => formatText(note.text) === cleanedInput);
}

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  
  if (text.length < 1 || text.length > 200) {
    console.log("Failed to add: Note must be between 1 and 200 characters.");
    return false;
  }
  
  if (!validCategories.includes(category)) {
    console.log("Failed to add: Category must be 'personal', 'work', or 'study'.");
    return false;
  }
  
  if (isDuplicate(text)) {
    console.log("Failed to add: Duplicate note already exists.");
    return false;
  }
  
  const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: text, category: category });
  return true;
}

// Tests 

console.log("--- searchNotes ---");
console.log("Search for 'javascript':", searchNotes("javascript"));

console.log("\n--- longestNote ---");
console.log("Longest note in array:", longestNote());

console.log("\n--- countByCategory ---");
console.log("Notes by category:", countByCategory());

console.log("\n--- getSummary ---");
console.log("Summary of all notes:", getSummary());

console.log("\n--- isDuplicate ---");
console.log("Checking duplicate '  call   mum  ':", isDuplicate("  call   mum  "));
console.log("Checking duplicate 'Walk the dog':", isDuplicate("Walk the dog"));

console.log("\n--- addNote ---");
console.log("Adding valid note:", addNote("Read documentation", "study"));
console.log("Adding duplicate:", addNote("Buy milk and bread", "personal"));
console.log("Adding invalid category:", addNote("Clean the kitchen", "home"));
console.log("Adding empty string:", addNote("", "work"));

console.log("\n--- Final Array Status ---");
console.log(notes);
console.log("Final Summary:", getSummary());