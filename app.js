// ==========================================
// GLOBAL VARIABLES
// ==========================================
let pdfDoc = null;
let pageNum = 1;
let pageCount = 0;
let currentPageText = '';
let isReading = false;
let utterance = null;
let availableVoices = [];
let startTime = 0;

// Get DOM elements
const pdfUpload = document.getElementById('pdf-upload');
const fileName = document.getElementById('file-name');
const pdfCanvas = document.getElementById('pdf-canvas');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const voiceSelect = document.getElementById('voice-select');
const autoContinue = document.getElementById('auto-continue');
const statusText = document.getElementById('status-text');
const currentTextDisplay = document.getElementById('current-text');
const wordCount = document.getElementById('word-count');
const currentPageDisplay = document.getElementById('current-page-display');
const explanationPopup = document.getElementById('explanation-popup');
const explanationText = document.getElementById('explanation-text');
const selectedTermEl = document.getElementById('selected-term');
const closePopup = document.getElementById('close-popup');

// ==========================================
// LOAD VOICES
// ==========================================
function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    
    if (availableVoices.length > 0) {
        voiceSelect.innerHTML = '';
        
        // Group voices by language
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        const hindiVoices = availableVoices.filter(v => v.lang.startsWith('hi'));
        const otherVoices = availableVoices.filter(v => !v.lang.startsWith('en') && !v.lang.startsWith('hi'));
        
        // Add English voices
        if (englishVoices.length > 0) {
            const engGroup = document.createElement('optgroup');
            engGroup.label = '🇬🇧 English Voices';
            englishVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice.default) option.selected = true;
                engGroup.appendChild(option);
            });
            voiceSelect.appendChild(engGroup);
        }
        
        // Add Hindi voices
        if (hindiVoices.length > 0) {
            const hinGroup = document.createElement('optgroup');
            hinGroup.label = '🇮🇳 Hindi Voices';
            hindiVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = availableVoices.indexOf(voice);
                option.textContent = `${voice.name} (${voice.lang})`;
                hinGroup.appendChild(option);
            });
            voiceSelect.appendChild(engGroup);
        }
        
        // Add all voices as fallback
        availableVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.default && voiceSelect.value === '') {
                option.selected = true;
            }
            voiceSelect.appendChild(option);
        });
    }
}

// Load voices on page load and when voices change
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ==========================================
// SPEED SLIDER
// ==========================================
speedSlider.addEventListener('input', function() {
    speedValue.textContent = this.value + 'x';
    
    // If currently reading, update speed
    if (isReading && utterance) {
        const currentText = currentPageText;
        window.speechSynthesis.cancel();
        speakText(currentText);
    }
});

// ==========================================
// LOAD PDF
// ==========================================
pdfUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file && file.type === 'application/pdf') {
        fileName.textContent = file.name;
        statusText.textContent = '📂 Loading PDF...';
        
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
            const typedArray = new Uint8Array(this.result);
            
            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                pdfDoc = pdf;
                pageCount = pdf.numPages;
                pageNum = 1;
                pageInfo.textContent = `Page ${pageNum} of ${pageCount}`;
                statusText.textContent = '✅ PDF loaded! Click Play to start.';
                
                // Check saved position
                const savedPos = resumeFromLastPosition();
                if (savedPos) {
                    pageNum = savedPos;
                }
                
                renderPage(pageNum);
            }).catch(function(error) {
                statusText.textContent = '❌ Error loading PDF!';
                console.error('Error:', error);
            });
        };
        
        fileReader.readAsArrayBuffer(file);
    } else {
        alert('Please select a valid PDF file!');
    }
});

// ==========================================
// RENDER PAGE
// ==========================================
function renderPage(num) {
    statusText.textContent = '🔄 Rendering page ' + num + '...';
    
    pdfDoc.getPage(num).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        const canvas = pdfCanvas;
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
            statusText.textContent = '✨ Page ' + num + ' ready!';
            extractText(page);
        });
    }).catch(function(error) {
        statusText.textContent = '❌ Error rendering page!';
        console.error('Render error:', error);
    });
    
    pageInfo.textContent = `Page ${num} of ${pageCount}`;
    currentPageDisplay.textContent = num;
    saveCurrentPosition();
}

// ==========================================
// EXTRACT TEXT
// ==========================================
function extractText(page) {
    page.getTextContent().then(function(textContent) {
        let rawText = textContent.items.map(item => item.str).join(' ');
        let cleanText = filterLayoutNoise(textContent.items);
        
        currentPageText = cleanText;
        
        // Update stats
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);
        wordCount.textContent = words.length;
        
        // Show preview of text
        const preview = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
        currentTextDisplay.textContent = preview;
        
        statusText.textContent = `📄 Extracted ${words.length} words from page ${pageNum}`;
    }).catch(function(error) {
        console.error('Text extraction error:', error);
        statusText.textContent = '❌ Error extracting text';
    });
}

// ==========================================
// SEMANTIC HEALING
// ==========================================
function healLineBreaks(text) {
    text = text.replace(/(\w+)-\s+(\w+)/g, '$1$2');
    text = text.replace(/([a-z]{2,})\s+([a-z]{2,})/g, function(match, word1, word2) {
        if (word2.length <= 4 && word2[0] === word2[0].toLowerCase()) {
            return word1 + word2;
        }
        return match;
    });
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

// ==========================================
// NOISE FILTERING
// ==========================================
function filterLayoutNoise(textItems) {
    let filteredItems = textItems.filter(item => {
        const text = item.str.trim();
        if (text.length === 0) return false;
        if (/^(page\s+)?\d+(\s+of\s+\d+)?$/i.test(text)) return false;
        if (/^(fig|figure|table|tbl)\.?\s*\d/i.test(text)) return false;
        if (/^©|^copyright|^all rights reserved/i.test(text)) return false;
        return true;
    });
    
    let cleanText = filteredItems.map(item => item.str).join(' ');
    cleanText = healLineBreaks(cleanText);
    return cleanText;
}

// ==========================================
// TEXT-TO-SPEECH
// ==========================================
playBtn.addEventListener('click', function() {
    if (!currentPageText || currentPageText.trim().length === 0) {
        alert('⚠️ Please load a PDF first!');
        return;
    }
    
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        statusText.textContent = '▶️ Resumed reading...';
    } else {
        speakText(currentPageText);
        statusText.textContent = `🔊 Reading page ${pageNum}...`;
    }
    
    isReading = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
});

pauseBtn.addEventListener('click', function() {
    window.speechSynthesis.pause();
    pauseBtn.disabled = true;
    playBtn.disabled = false;
    statusText.textContent = '⏸️ Paused';
});

stopBtn.addEventListener('click', function() {
    window.speechSynthesis.cancel();
    isReading = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    statusText.textContent = '⏹️ Stopped';
    currentTextDisplay.textContent = 'Click Play to start reading...';
});

function speakText(text) {
    window.speechSynthesis.cancel();
    
    utterance = new SpeechSynthesisUtterance(text);
    
    // Set speed (0.5x to 2.0x)
    utterance.rate = parseFloat(speedSlider.value);
    
    // Set selected voice
    const voiceIndex = voiceSelect.value;
    if (voiceIndex !== '' && availableVoices[voiceIndex]) {
        utterance.voice = availableVoices[voiceIndex];
    }
    
    // Update current text display
    currentTextDisplay.textContent = text.substring(0, 300) + (text.length > 300 ? '...' : '');
    
    // When speech ends
    utterance.onend = function() {
        isReading = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        
        // AUTO-CONTINUE TO NEXT PAGE
        if (autoContinue.checked && pageNum < pageCount) {
            statusText.textContent = '📖 Auto-continuing to next page...';
            setTimeout(() => {
                pageNum++;
                renderPage(pageNum);
                setTimeout(() => {
                    playBtn.click(); // Auto-play next page
                }, 1000);
            }, 1500);
        } else {
            statusText.textContent = `✅ Finished reading page ${pageNum}`;
            currentTextDisplay.textContent = 'Page finished! Click Play to read again or navigate to next page.';
        }
    };
    
    utterance.onerror = function(event) {
        console.error('Speech error:', event);
        statusText.textContent = '❌ Error during reading';
        isReading = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
    };
    
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// PAGE NAVIGATION
// ==========================================
prevBtn.addEventListener('click', function() {
    if (pageNum <= 1) {
        alert('Already on first page!');
        return;
    }
    
    window.speechSynthesis.cancel();
    isReading = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    pageNum--;
    renderPage(pageNum);
});

nextBtn.addEventListener('click', function() {
    if (pageNum >= pageCount) {
        alert('Already on last page!');
        return;
    }
    
    window.speechSynthesis.cancel();
    isReading = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    pageNum++;
    renderPage(pageNum);
});

// ==========================================
// SESSION RESUME
// ==========================================
function saveCurrentPosition() {
    if (!pdfDoc || !fileName.textContent || fileName.textContent === 'No file selected') return;
    
    const position = {
        page: pageNum,
        timestamp: Date.now(),
        fileName: fileName.textContent
    };
    
    localStorage.setItem('pdfPosition', JSON.stringify(position));
}

function resumeFromLastPosition() {
    const savedPosition = localStorage.getItem('pdfPosition');
    
    if (savedPosition) {
        try {
            const position = JSON.parse(savedPosition);
            if (position.fileName === fileName.textContent) {
                statusText.textContent = `↩️ Resumed from page ${position.page}`;
                return position.page;
            }
        } catch (e) {
            console.error('Error reading saved position:', e);
        }
    }
    return null;
}

// ==========================================
// INTERACTIVE EXPLAINER
// ==========================================
document.addEventListener('mouseup', function() {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 3) {
        showExplanation(selectedText);
    }
});

function showExplanation(term) {
    explanationPopup.classList.remove('hidden');
    selectedTermEl.textContent = term;
    explanationText.textContent = '⏳ Generating explanation...';
    
    setTimeout(() => {
        const explanation = generateExplanation(term);
        explanationText.textContent = explanation;
    }, 300);
}

function generateExplanation(term) {
    const techTerms = {
        'backpropagation': 'Backpropagation ek algorithm hai jo neural network ko train karta hai. Jab network koi galat prediction karta hai, toh yeh error ko backward pass karke har layer ke weights ko adjust karta hai. Matlab, network apni galtiyon se seekhta hai aur improve hota hai.',
        'neural network': 'Neural network ek computational model hai jo human brain jaisa kaam karta hai. Ismein bahut saare interconnected nodes (neurons) hote hain jo layers mein arrange hote hain. Data input layer se enter hota hai, hidden layers mein process hota hai, aur output layer se result milta hai.',
        'machine learning': 'Machine Learning matlab computer ko examples se seekhana. Traditional programming mein hum rules likhte hain, lekin ML mein computer khud data se patterns seekhta hai. Jaise bachha examples dekh ke seekhta hai, waise hi ML model bhi data se seekhta hai.',
        'algorithm': 'Algorithm ek step-by-step procedure hai problem solve karne ke liye. Yeh computer ko specific instructions deta hai ki task kaise complete karna hai. Jaise cooking recipe hoti hai, waise hi algorithm bhi steps ka sequence hai.',
        'gradient': 'Gradient ek slope hai jo batata hai ki function kis direction mein aur kitni tezi se change ho raha hai. Machine learning mein gradient descent algorithm gradient ka use karke weights ko optimize karta hai taaki error minimum ho.',
        'overfitting': 'Overfitting tab hota hai jab model training data ko itna achhe se yaad kar leta hai ki woh naye data pe achha perform nahi karta. Yeh rote learning jaisa hai - student answers yaad kar leta hai lekin concept samajh nahi aata, toh naye questions solve nahi kar pata.',
        'dataset': 'Dataset ek collection hai data ka jisse machine learning model train hota hai. Ismein examples aur unke corresponding labels hote hain. Jaise students textbook se padhte hain, waise hi ML model dataset se seekhta hai.',
        'api': 'API (Application Programming Interface) ek way hai jisse different software applications ek dusre se communicate kar sakte hain. Yeh waiter jaisa hai - aap restaurant mein waiter ko order dete ho, woh kitchen ko batata hai, aur khana laata hai. Waise hi API requests aur responses handle karta hai.',
        'deep learning': 'Deep Learning neural networks ka advanced form hai jismein bahut saari hidden layers hoti hain. Yeh complex patterns seekh sakta hai jaise images mein objects recognize karna, speech understand karna, ya language translate karna. "Deep" matlab bahut saari layers.',
        'training': 'Training woh process hai jismein machine learning model ko data dikhakar seekhaya jaata hai. Model repeatedly data dekhta hai, predictions karta hai, errors calculate karta hai, aur apne weights adjust karta hai taaki better predictions kar sake.',
        'epoch': 'Epoch matlab ek complete pass through entire training dataset. Agar dataset mein 1000 examples hain aur model ne sabko ek baar dekh liya, toh yeh 1 epoch complete hua. Training mein multiple epochs hote hain.',
        'loss function': 'Loss function ek measure hai jo batata hai ki model ki predictions actual values se kitni door hain. Kam loss means model achha perform kar raha hai. Training ka goal loss ko minimize karna hota hai.',
        'optimization': 'Optimization woh process hai jismein model ke parameters (weights) ko adjust kiya jaata hai taaki best performance mile. Gradient descent ek popular optimization technique hai.',
        'hyperparameter': 'Hyperparameters wo settings hain jo training start hone se pehle set ki jaati hain, jaise learning rate, number of layers, etc. Yeh model ki architecture aur training process ko control karte hain.'
    };
    
    const lowerTerm = term.toLowerCase();
    
    for (let key in techTerms) {
        if (lowerTerm.includes(key)) {
            return techTerms[key];
        }
    }
    
    return `"${term}" - Yeh term important hai ismein context ke liye. PDF mein aage padhne se iska matlab aur clear ho jayega. Agar specific definition chahiye toh highlight karke Google search kar sakte ho.`;
}

closePopup.addEventListener('click', function() {
    explanationPopup.classList.add('hidden');
});

explanationPopup.addEventListener('click', function(e) {
    if (e.target === explanationPopup) {
        explanationPopup.classList.add('hidden');
    }
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' && !e.target.matches('input, select')) {
        prevBtn.click();
    } else if (e.key === 'ArrowRight' && !e.target.matches('input, select')) {
        nextBtn.click();
    } else if (e.code === 'Space' && !e.target.matches('input, select')) {
        e.preventDefault();
        if (isReading) {
            pauseBtn.click();
        } else {
            playBtn.click();
        }
    } else if (e.key === 'Escape') {
        explanationPopup.classList.add('hidden');
    }
});

// ==========================================
// INITIALIZATION
// ==========================================
console.log('🚀 SmoothFlow AI - Advanced Version Loaded!');
console.log('✅ Features: Auto-continue | Voice Selection | 2x Speed | Hinglish Explainer');
statusText.textContent = '🎉 Welcome! Upload a PDF to begin your smart reading journey.';