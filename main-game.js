// Importeer de benodigde Mediapipe tools en eigen modules
import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
import kNear from "./knear.js"; // Zelfgeschreven KNN classifier
import { startGame, handlePrediction } from "./game.js"; // Spel-logica

// Webcam en canvas elementen
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawUtils = new DrawingUtils(canvasCtx);
const predictionOutput = document.getElementById("prediction");

// Initialiseer KNN classifier
const classifier = new kNear(3);
let handLandmarker;
let results;
let webcamRunning = false;

// Flags voor voorspellingen (om fouten te vermijden bij ruis)
let predictionMade = false;
let lastPrediction = "";
let samePredictionCount = 0;
let attempts = 0;
const maxAttempts = 30;

// Maak flags toegankelijk via window voor andere modules (zoals game.js)
window.predictionMade = predictionMade;
Object.defineProperty(window, "predictionMade", {
    get: () => predictionMade,
    set: (val) => predictionMade = val
});
window.lastPrediction = lastPrediction;
window.samePredictionCount = samePredictionCount;
window.attempts = attempts;
Object.defineProperty(window, "attempts", {
    get: () => attempts,
    set: (val) => attempts = val
});

// Laad trainingsdata in vanuit lokaal JSON-bestand (handgebaren als vectoren)
async function loadTrainingDataFromFile() {
    try {
        const response = await fetch("training-data.json");
        const data = await response.json();
        const labels = ["plastic", "paper", "restafval"];

        labels.forEach(label => {
            if (data[label]) {
                data[label].forEach(vector => classifier.learn(vector, label));
                console.log(`${data[label].length} voorbeelden geladen voor "${label}"`);
            }
        });

        console.log("Totale trainingsdata:", classifier.training.length);
    } catch (error) {
        console.error("Fout bij laden van training-data.json:", error);
    }
}

// Initialiseer Mediapipe handlandmarker + activeer camera
async function createHandLandmarker() {
    await loadTrainingDataFromFile();

    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    console.log("HandLandmarker klaar");
    enableCam();
}

// Start de webcam en begin met voorspellen
async function enableCam() {
    if (!handLandmarker) return;
    webcamRunning = true;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.addEventListener("loadeddata", () => {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        predictWebcam(); // Start met detectie zodra beeld geladen is
    });
}

// Stop de webcam
function stopCam() {
    if (!webcamRunning) return;
    webcamRunning = false;
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    console.log("Webcam gestopt");
}

// Spel eindigt en herstart automatisch
function endGame() {
    stopCam();
    document.getElementById("afvalItem").innerText = "Spel afgelopen!";
    document.getElementById("feedback").innerText =
        `Je eindscore is ${document.getElementById("score").innerText} van 6`;

    setTimeout(() => {
        startGame(); // Herstart spel en webcam
        enableCam();
    }, 3000);
}
window.endGame = endGame;

// Detecteer hand via Mediapipe en laat classifier voorspellen
async function predictWebcam() {
    if (!handLandmarker) return;

    results = await handLandmarker.detectForVideo(video, performance.now());

    // Controleer of er een hand is gevonden
    if (results && results.landmarks?.[0]?.length > 0) {
        const landmarks = results.landmarks[0];
        const vector = landmarks.flatMap(p => [p.x, p.y, p.z]); // Zet om naar array

        // Alleen voorspellen als we trainingdata hebben en nog geen prediction heb gedaan
        if (classifier.training.length > 0 && !predictionMade) {
            const label = classifier.classify(vector);
            predictionOutput.innerText = label;

            // Zorg dat we twee keer dezelfde voorspelling krijgen voor betrouwbaarheid
            attempts++;
            if (label === lastPrediction) {
                samePredictionCount++;
            } else {
                samePredictionCount = 1;
                lastPrediction = label;
            }

            // Als twee keer dezelfde of max pogingen bereikt: verwerk voorspelling
            if (samePredictionCount >= 2 || attempts >= maxAttempts) {
                predictionMade = true;
                handlePrediction(label);
                samePredictionCount = 0;
                attempts = 0;
            }
        }

        drawHand(landmarks);
    }

    // Herhaal herkenning / detectie zolang de webcam aanstaat
    if (webcamRunning) window.requestAnimationFrame(predictWebcam);
}

// Teken de handlandmarks op het canvas
function drawHand(landmarks) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    drawUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 4
    });
    drawUtils.drawLandmarks(landmarks, {
        radius: 5,
        color: "#FF0000"
    });
}

// Start de applicatie
createHandLandmarker();
document.getElementById("startGameButton").addEventListener("click", startGame);