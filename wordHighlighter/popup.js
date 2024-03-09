console.log("Hello world from popupjs")
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addWord').onclick = function() {
        const word = document.getElementById('wordInput').value.trim();
        const color = document.getElementById('colorPicker').value;
        if (word) {
            chrome.storage.sync.get({words: {}, checkedWords: {}}, function(data) {
                const words = data.words;
                const checkedWords = data.checkedWords;
                if (!words.hasOwnProperty(word)) {
                    words[word] = color;
                    checkedWords[word] = true;
                    chrome.storage.sync.set({words: words, checkedWords: checkedWords}, function() {
                        addWordToList(word, color, true);
                    });
                }
            });
            document.getElementById('wordInput').value = ''; // Clear input box after adding
        }
    };

    document.getElementById('highlightToggle').addEventListener('change', function() {
        const highlightingEnabled = this.checked;
        
        // Send a message to the content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {highlightingEnabled: highlightingEnabled});
        });
    });

    // Load existing words from storage
    chrome.storage.sync.get({words: {}, checkedWords: {}}, function(data) {
        const words = data.words;
        const checkedWords = data.checkedWords;
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = ''; // Clear the word list before populating
        Object.keys(words).forEach(word => {
            addWordToList(word, words[word], checkedWords[word]);
        });
    });
});

function addWordToList(word, color, isChecked) {
    const wordList = document.getElementById('wordList');
    const entry = document.createElement('div');
    entry.classList.add('word-entry');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isChecked;
    checkbox.addEventListener('change', function() {
        toggleWordHighlight(word, checkbox.checked);
        updateWordEntry(word, color, checkbox.checked);
    });
    entry.appendChild(checkbox);

    const textSpan = document.createElement('span');
    textSpan.textContent = word + ' ';
    entry.appendChild(textSpan);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = color;
    colorInput.addEventListener('input', function() {
        updateWordEntry(word, colorInput.value, isChecked);
    });
    entry.appendChild(colorInput);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.addEventListener('click', function() {
        deleteWord(word);
    });
    entry.appendChild(deleteButton);

    wordList.appendChild(entry);
    // Send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {refreshAll: 1});
        console.log("Refreshing All");
    });
}

function toggleWordHighlight(word, highlighted) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            toggleWord: word,
            highlighted: highlighted,
            action: 'toggle'
        });
    });
}

function updateWordEntry(word, color, isChecked) {
    chrome.storage.sync.get({words: {}, checkedWords: {}}, function(data) {
        const words = data.words;
        const checkedWords = data.checkedWords;
        if (words.hasOwnProperty(word)) {
            words[word] = color;
            checkedWords[word] = isChecked;
            chrome.storage.sync.set({words: words, checkedWords: checkedWords});
        }
    });
}

function deleteWord(word) {
    chrome.storage.sync.get({words: {}, checkedWords: {}}, function(data) {
        const words = data.words;
        const checkedWords = data.checkedWords;
        if (words.hasOwnProperty(word)) {
            delete words[word];
            delete checkedWords[word];
            chrome.storage.sync.set({words: words, checkedWords: checkedWords}, function() {
                const wordList = document.getElementById('wordList');
                wordList.innerHTML = ''; // Clear the word list before repopulating
                Object.keys(words).forEach(word => {
                    addWordToList(word, words[word], checkedWords[word]);
                });
            });
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {refreshAll: 1});
            console.log("Refreshing All");
        });
    });
}