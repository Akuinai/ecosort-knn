// Importeer Mediapipe (voor handherkenning) en je eigen KNN-classifier
import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
import kNear from "./knear.js";

// Initialiseer classifier en benodigde variabelen
const classifier = new kNear(3);
let handLandmarker;
let results;

// DOM-elementen en canvasinstellingen
const video = document.getElementById("webcam");
const canvas = document.getElementById("output_canvas");
const ctx = canvas.getContext("2d");
const drawUtils = new DrawingUtils(ctx);

// Initialiseer Mediapipe handdetector en koppel knoppen
async function createHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    // Koppel knoppen voor camerastart en training
    document.getElementById("webcamButton").addEventListener("click", enableCam);
    document.getElementById("plasticButton").addEventListener("click", () => collect("plastic"));
    document.getElementById("paperButton").addEventListener("click", () => collect("paper"));
    document.getElementById("restafvalButton").addEventListener("click", () => collect("restafval"));
    document.getElementById("resetButton").addEventListener("click", reset);
}

// Zet webcam aan en start voorspellingsloop
async function enableCam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.addEventListener("loadeddata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        predict(); // Start detectielus zodra video beschikbaar is
    });
}

// Continu handherkenning uitvoeren via Mediapipe
async function predict() {
    if (!handLandmarker) return;
    results = await handLandmarker.detectForVideo(video, performance.now());

    // Als hand wordt herkend, teken handlandmarks
    if (results.landmarks.length > 0) {
        drawHand(results.landmarks[0]);
    }

    requestAnimationFrame(predict); // Herhaal detectie
}

// Tekent handlandmarks en connecties op het canvas
function drawHand(landmarks) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 4 });
    drawUtils.drawLandmarks(landmarks, { radius: 5, color: "#FF0000" });
}

// Sla een handpose op als trainingsdata voor een bepaald label
function collect(label) {
    if (!results || results.landmarks.length === 0) return;

    // Zet handlandmarks om in vlakke array met x/y/z-coördinaten
    const vector = results.landmarks[0].flatMap(p => [p.x, p.y, p.z]);

    // Train KNN-model met deze vector
    classifier.learn(vector, label);

    // Voeg vector toe aan localStorage voor later hergebruik
    const stored = JSON.parse(localStorage.getItem(label)) || [];
    stored.push(vector);
    localStorage.setItem(label, JSON.stringify(stored));

    console.log(`${label} opgeslagen`);
}

// Verwijder opgeslagen trainingsdata en reset model
function reset() {
    ["plastic", "paper", "restafval"].forEach(label => localStorage.removeItem(label));
    classifier.clearTraining();
    console.log("Training gewist");
}

// Start de app
createHandLandmarker();

// Koppel knop om accuracy te berekenen met leave-one-out testing
document.getElementById("accuracyButton").addEventListener("click", calculateAccuracy);

// Test hoe goed het model presteert op bekende data, zonder te 'cheaten'
function calculateAccuracy() {
    const testClassifier = new kNear(3);
    const labels = ["plastic", "paper", "restafval"];
    let correct = 0;
    let total = 0;

    labels.forEach(label => {
        const data = JSON.parse(localStorage.getItem(label) || "[]");

        data.forEach((vector, i) => {
            // Leave-one-out: haal huidige vector tijdelijk uit training
            const others = data.filter((_, j) => j !== i).map(v => ({ v, lab: label }));

            // Verzamel alle vectoren van de andere labels
            const otherLabels = labels.filter(l => l !== label);
            const negatives = otherLabels.flatMap(l =>
                (JSON.parse(localStorage.getItem(l) || "[]")).map(v => ({ v, lab: l }))
            );

            // Bouw tijdelijk model zonder deze vector
            const trainingSet = [...others, ...negatives];
            const tempModel = new kNear(3);
            trainingSet.forEach(sample => tempModel.learn(sample.v, sample.lab));

            // Test of model de vector goed herkent
            const prediction = tempModel.classify(vector);
            if (prediction === label) correct++;
            total++;
        });
    });

    // Toon de accuracy in het scherm
    const percent = ((correct / total) * 100).toFixed(2);
    const output = document.getElementById("accuracyResult");
    output.innerText = `Accuracy: ${percent}% (${correct} van ${total} goed)`;
    console.log(`Accuracy: ${percent}% (${correct}/${total})`);
}