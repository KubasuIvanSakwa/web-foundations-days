const textarea = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

window.addEventListener('DOMContentLoaded', () => {
    const savedDraft = localStorage.getItem('draft');
    if (savedDraft) {
        textarea.value = savedDraft;
    }
    updateCounters();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        themeToggle.textContent = 'Dark mode';
    }
});

function updateCounters() {
    const text = textarea.value;
    const length = text.length;
    
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    charCount.textContent = `${length} / 200 characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove('warning', 'over');
    if (length > 200) {
        charCount.classList.add('over');
    } else if (length > 180) {
        charCount.classList.add('warning');
    }

    localStorage.setItem('draft', text);
}

function clearNote() {
    textarea.value = '';
    updateCounters();
    localStorage.removeItem('draft');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

textarea.addEventListener('input', updateCounters);
clearBtn.addEventListener('click', clearNote);
themeToggle.addEventListener('click', toggleTheme);

textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        clearNote();
    }
});