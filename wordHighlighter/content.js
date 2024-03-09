console.log("Hello world from contentjs")
highlightAllWords();
function highlightAllWords() {
  chrome.storage.sync.get({words: {}, checkedWords: {}}, function(data) {
    const words = data.words;
    const checkedWords = data.checkedWords;

    // Get all currently highlighted words
    const highlightedWords = [];
    document.querySelectorAll('.highlight mark').forEach(el => {
      highlightedWords.push(el.textContent);
    });

    for (let word in words) {
      if (checkedWords[word] && !highlightedWords.includes(word)) {
        highlightWord(word, words[word]);
      }
    }
  });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.highlightingEnabled !== undefined) {
            console.log("Toggling Highlight!");
            toggleHighlighting(request.highlightingEnabled);
        } else if (request.refreshAll === 1) {
            console.log("Refresh All!");
            highlightAllWords();
        } else if (request.toggleWord !== undefined) {
            console.log(`Toggling highlight for word: ${request.toggleWord}`);
			console.log(`1 or 0 highlight?: ${request.highlighted}`);
            toggleWordHighlight(request.toggleWord, request.highlighted);
        }
    }
);
function toggleWordHighlight(word, highlighted) {
    const regex = new RegExp(`(${word})`, 'g');
    const highlightedElements = document.querySelectorAll('.highlight');

    highlightedElements.forEach((element) => {
        const markElement = element.querySelector('mark');
        if (markElement && markElement.textContent.trim() === word) {
            const currentColor = element.style.backgroundColor;

            if (highlighted) {
                // Highlight the word
                const rgbColor = getRGBFromColor(currentColor);
                if (rgbColor && rgbColor.a === 0) {
                    rgbColor.a = 1;
                    element.style.backgroundColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${rgbColor.a})`;
                }
            } else {
                // Unhighlight the word
                const rgbColor = getRGBFromColor(currentColor);
                if (rgbColor && rgbColor.a === 1) {
                    rgbColor.a = 0;
                    element.style.backgroundColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${rgbColor.a})`;
                }
            }
        }
    });
}

function getRGBFromColor(color) {
    if (color.startsWith('rgba')) {
        const [_, r, g, b, a] = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        return { r: parseInt(r), g: parseInt(g), b: parseInt(b), a: parseFloat(a || '1') };
    } else if (color.startsWith('rgb')) {
        const [_, r, g, b] = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return { r: parseInt(r), g: parseInt(g), b: parseInt(b), a: 1 };
    } else if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return { r, g, b, a: 1 };
    }
    return null;
}
function toggleHighlighting(enable) {
	const highlightedElements = document.querySelectorAll('.highlight');
	highlightedElements.forEach((element) => {
	if (enable) {
            // If enabling, make sure the element is visible
            console.log("Enabling Highlight");
			var style = window.getComputedStyle(element);
			var currentBackgroundColor = style.backgroundColor;
			var rgbaColor;
			var transparency = 1;
			if (currentBackgroundColor.startsWith('rgba')) { // For RGBA colors
				rgbaColor = currentBackgroundColor.replace("0)", "1)");
			} else if (currentBackgroundColor.startsWith('#')) { // For Hex colors
				// Assuming the color is in #RRGGBB format
				var r = parseInt(currentBackgroundColor.slice(1, 3), 16),
					g = parseInt(currentBackgroundColor.slice(3, 5), 16),
					b = parseInt(currentBackgroundColor.slice(5, 7), 16);
				rgbaColor = `rgba(${r}, ${g}, ${b}, ${transparency})`;
			} else if (currentBackgroundColor.startsWith('rgb')) {// For RGB colors
				rgbaColor = currentBackgroundColor.replace('rgb', 'rgba').replace(')', `, ${transparency})`);// Already in RGBA or other formats
			}
			// Set the new background color with transparency
			element.style.backgroundColor = rgbaColor;
			console.log("Changing " + currentBackgroundColor + " to " + rgbaColor);
        } else {
            // If disabling, hide the highlighting
            console.log("Disabling Highlight");
			var style = window.getComputedStyle(element);
			var currentBackgroundColor = style.backgroundColor;
			var rgbaColor;
			var transparency = 0;
			if (currentBackgroundColor.startsWith('rgba')) { // For RGBA colors
				rgbaColor = currentBackgroundColor.replace("1)", "0)");
			} else if (currentBackgroundColor.startsWith('#')) { // For Hex colors
				// Assuming the color is in #RRGGBB format
				var r = parseInt(currentBackgroundColor.slice(1, 3), 16),
					g = parseInt(currentBackgroundColor.slice(3, 5), 16),
					b = parseInt(currentBackgroundColor.slice(5, 7), 16);
				rgbaColor = `rgba(${r}, ${g}, ${b}, ${transparency})`;
			} else if (currentBackgroundColor.startsWith('rgb')) {// For RGB colors
				rgbaColor = currentBackgroundColor.replace('rgb', 'rgba').replace(')', `, ${transparency})`);// Already in RGBA or other formats
			}
			// Set the new background color with transparency
			element.style.backgroundColor = rgbaColor;
			console.log("Changing " + currentBackgroundColor + " to " + rgbaColor);
        }
    });
}

function highlightWord(word, color) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let textNodes = [];
    let node;

    // Collect all text nodes
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
	console.log("highlightWord")
    // Define the regex outside the loop to avoid recompilation
    const regex = new RegExp(`(${word})`, 'g');

    textNodes.forEach((textNode) => {
        const matches = textNode.nodeValue.match(regex);
        if (matches) {
            let newHTML = textNode.nodeValue;

            // Convert the color value to RGB
            const rgbColor = hexToRGB(color);

            // Check if the text node already contains the span and mark structure
            const existingStructure = `<span class="highlight" style="background-color: rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b});"><mark style="background-color: inherit;">$1</mark></span>`;
            if (!newHTML.includes(existingStructure)) {
                const highlightedText = newHTML.replace(regex, `<span class = "highlight" style="background-color: rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b});"><mark style="background-color: inherit;">$1</mark></span>`);
                const fragment = document.createRange().createContextualFragment(highlightedText);

                // Replace the original text node with the new fragment
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        }
    });
}

// Helper function to convert hex color to RGB
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

