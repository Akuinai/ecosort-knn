# EcoSort – Afval Sorteren met Handgebaren (AI)

EcoSort is een educatief spel waarmee kinderen leren afval sorteren via handgebaren. Het gebruikt **AI-beeldherkenning** (MediaPipe HandLandmarker + KNN-classifier) om gebaren te herkennen.

## Inhoud

- Spel: Sorteer afval met handgebaren
- AI: Train handgebaren voor plastic, papier en restafval
- Gebruikt webcam + handherkenning via MediaPipe

## Installatie & voorbereiding

1. **Download of clone** deze repo:
   ```bash
   git clone https://github.com/jouwgebruikersnaam/ecosort.git
   cd ecosort
   ```
   
2. **Start** de **(live)server** via (of gebruik de live server functie in PhPStorm)
```
   npm run dev
   ```

## Trainen (dit kan alleen lokaal, niet via de link naar de Github pages)

1. Open train.htl in je browser (via de lokale server)
2. Start de webcam via "**Start Webcam"**
3. Hou een specifiek handgebaar voor de camera en klik op

"Train Plastic" voor plastic
"Train Paper" voor papier
"Train Restafval" voor restafval

4. Herhaal dit meerdere keren per afvalsoort. Bij voorkeur gemiddeld 20-40 keer

De trainingsdata die je vervolgens voor je zelf bescikbaar hebt gesteld, kan je downloaden via de volgende code

   ```
   const data = {
  plastic: JSON.parse(localStorage.getItem("plastic") || "[]"),
  paper: JSON.parse(localStorage.getItem("paper") || "[]"),
  restafval: JSON.parse(localStorage.getItem("restafval") || "[]")
};
const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "training-data.json";
a.click();
   ```
## Spelen (zowel lokaal als via Github Pages)
1. Open index.html in je browser (via lokale server of via de Github pages link).
2. De AI laadt automatisch training-data.json bij het opstarten
3. Klik op "Start spel" om te beginnen
4. Houd het juiste handgebaar voor de camera bij elk afval item

### Advies voor handgebaren
1. Plastic - Twee vingers omhoog ✌️
2. Papier - Open hand, vingers gespreid ✋
3. Restafval - Vuist ✊




