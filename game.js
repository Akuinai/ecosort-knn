// Dit bepaalt welk object in het spel wordt getoond en wat het juiste antwoord is
const afvalItems = [
    { naam: "Plastic fles", type: "plastic" },
    { naam: "Papieren krant", type: "paper" },
    { naam: "Blikje cola", type: "restafval" },
    { naam: "Kartonnen doos", type: "paper" },
    { naam: "Plastic zak", type: "plastic" },
    { naam: "Chips zak", type: "restafval" }
];

// Spel-status variabelen
let currentItemIndex = 0;
let score = 0;
let gameRunning = false;

// HTML-elementen
const afvalDisplay = document.getElementById("afvalItem");
const scoreDisplay = document.getElementById("score");
const feedbackDisplay = document.getElementById("feedback");

// Start het spel, reset score, index en feedback
export function startGame() {
    currentItemIndex = 0;
    score = 0;
    gameRunning = true;
    scoreDisplay.innerText = score;
    feedbackDisplay.innerText = "";
    nextRound();
}

// Toon het volgende afval item of stop het spel als ze allemaal zijn geweest (alle items)
function nextRound() {
    if (currentItemIndex >= afvalItems.length) {
        window.endGame();
        return;
    }

    const currentItem = afvalItems[currentItemIndex];
    afvalDisplay.innerText = currentItem.naam;
    feedbackDisplay.innerText = "";

    // Reset flags
    window.predictionMade = false;
    window.lastPrediction = "";
    window.samePredictionCount = 0;
    window.attempts = 0;
}

// Verwerk de voorspelling van het model en geef feedback
export function handlePrediction(predictedLabel) {
    if (!gameRunning) return; // Hier stopt hij het spel wanneer deze niet actief is

    const expected = afvalItems[currentItemIndex].type;
    console.log(`Verwacht: ${expected} | Voorspeld: ${predictedLabel}`);

    // Als het juist is geraden door de speler, verhoog de score en ga naar het volgende item
    if (predictedLabel === expected) {
        score++;
        feedbackDisplay.innerText = "✅ Juist!";
        scoreDisplay.innerText = score;
        currentItemIndex++;
        setTimeout(nextRound, 1000); // Wacht even voordat het volgende item verschijnt
    } else {
        // Bij een verkeerde voorspelling toon feedback maar blijf bij hetzelfde item (hulp voor speler)
        feedbackDisplay.innerText = `❌ Fout! (${predictedLabel}) - Verwacht: ${expected}`;

        window.predictionMade = false;
    }
}