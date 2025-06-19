// Exporteer k-Nearest Neighbors (k-NN) classifier
export default class kNear {
    // Constructor: initialiseer de classifier met gekozen 'k' en optioneel bestaande trainingsdata
    constructor(k, training = []) {
        this.k = k; // Aantal buren dat gebruikt wordt voor classificatie
        this.training = training; // Opslag voor trainingsvoorbeelden
        this.array_size = training.length ? training[0].v.length : -1; // Lengte van vectoren
    }

    // Bereken de euclidische afstand tussen twee vectoren
    dist(v1, v2) {
        return Math.sqrt(
            v1.reduce((sum, val, i) => sum + (val - v2[i]) ** 2, 0)
        );
    }

    // Bepaal de meest voorkomende waarde in een array (modus)
    mode(array) {
        return array
            .sort((a, b) =>
                array.filter(v => v === a).length - array.filter(v => v === b).length
            )
            .pop(); // De waarde met de meeste voorkomens komt als laatste
    }

    // Voeg een nieuwe vector toe aan de training met bijbehorend label
    learn(vector, label) {
        // Controleer of dit het eerste voorbeeld is en bepaal dan de lengte
        if (this.array_size === -1) this.array_size = vector.length;

        // Controleer of de vectorlengte overeenkomt met eerdere voorbeelden
        if (vector.length !== this.array_size) {
            return console.error("Wrong vector length");
        }

        // Sla het voorbeeld op in het trainingsgeheugen
        this.training.push({ v: vector, lab: label });
    }

    // Classificeer een nieuwe vector op basis van de dichtstbijzijnde voorbeelden
    classify(vector) {
        // Bereken de afstand van deze vector tot alle trainingsvoorbeelden
        const sorted = this.training.map(item => ({
            label: item.lab,
            dist: this.dist(vector, item.v)
        })).sort((a, b) => a.dist - b.dist); // Sorteer van dichtbij naar ver

        // Pak de labels van de k dichtstbijzijnde voorbeelden
        const topK = sorted.slice(0, this.k);
        const labels = topK.map(item => item.label);

        // Geef de meest voorkomende label als voorspelling terug
        return this.mode(labels);
    }

    // Wis alle trainingsdata en reset het model
    clearTraining() {
        this.training = [];
        this.array_size = -1;
    }
}