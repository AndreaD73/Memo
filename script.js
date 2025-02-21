let temi = {
    animali: ['🐶', '🐱', '🐭', '🐹', '🦊', '🐻', '🐼', '🐯'],
    fiori: ['🌹', '🌻', '🌸', '🌼', '💐', '🌺', '🌷', '🥀'],
    piante: ['🌳', '🌴', '🌱', '🌿', '🌵', '🎍', '🍀', '🪴']
};

let immagini = [];
let griglia = document.getElementById('griglia');
let turno = 1;
let punti = { 1: 0, 2: 0 };
let primaCarta = null;
let bloccaClick = false;
let modalità = "";
let timer;
let secondi = 0;
let jingleInterval; // Variabile per gestire il loop del jingle

// 1. Scegliere il tema prima di iniziare
function selezionaTema(tema) {
    immagini = [...temi[tema], ...temi[tema]]; // Duplico le emoji per il memory
    document.getElementById('selezionaTema').style.display = "none";
    document.getElementById('menu').style.display = "block";
}

function selezionaModalità(tipo) {
    modalità = tipo;
    document.getElementById('menu').style.display = "none";
    document.getElementById('turno').style.display = "block";
    document.getElementById('restart').style.display = "block";
    document.getElementById('griglia').style.display = "grid";
    document.getElementById('griglia').innerHTML = ""; // Pulisce la griglia

    if (modalità === "tempo") {
        document.getElementById('timer').style.display = "block";
        document.getElementById('punteggio1').style.display = "none";
        document.getElementById('punteggio2').style.display = "none";
    } else {
        document.getElementById('punteggio1').style.display = "block";
        document.getElementById('punteggio2').style.display = "block";
        document.getElementById('timer').style.display = "none";
    }

    startJingleLoop(); // Avvia il loop del jingle
    inizializzaGioco();
}

// Avvia il loop del jingle: lo suona subito e poi ogni 5 secondi
function startJingleLoop() {
    riproduciJingle(); // Suona immediatamente
    jingleInterval = setInterval(riproduciJingle, 5000);
}

// 2. Funzione per avviare il gioco
function inizializzaGioco() {
    griglia.innerHTML = "";
    immagini = immagini.sort(() => Math.random() - 0.5);
    primaCarta = null;
    bloccaClick = true;
    turno = 1;
    punti = { 1: 0, 2: 0 };
    aggiornaPunteggio();

    if (modalità === "tempo") {
        secondi = 0;
        document.getElementById('timer').textContent = "Tempo: 0s";
        timer = setInterval(() => {
            secondi++;
            document.getElementById('timer').textContent = `Tempo: ${secondi}s`;
        }, 1000);
    }

    immagini.forEach((emoji, i) => {
        let div = document.createElement('div');
        div.classList.add('carta');
        div.dataset.emoji = emoji;
        div.dataset.indice = i;
        div.textContent = emoji;
        div.addEventListener('click', giraCarta);
        griglia.appendChild(div);
    });

    setTimeout(() => {
        document.querySelectorAll('.carta').forEach(carta => {
            carta.textContent = "?";
            carta.classList.remove('rivelata');
        });
        bloccaClick = false;
    }, 3000);
}

// 3. Logica per girare una carta
function giraCarta() {
    if (bloccaClick || this.classList.contains('rivelata')) return;

    riproduciSuono('flip');
    this.textContent = this.dataset.emoji;

    if (!primaCarta) {
        primaCarta = this;
    } else {
        if (primaCarta.dataset.emoji === this.dataset.emoji && primaCarta !== this) {
            primaCarta.classList.add('rivelata');
            this.classList.add('rivelata');
            punti[turno]++;
            riproduciSuono('success');
            primaCarta = null;
        } else {
            bloccaClick = true;
            riproduciSuono('error');
            let secondaCarta = this;
            setTimeout(() => {
                if (!primaCarta.classList.contains('rivelata')) primaCarta.textContent = "?";
                if (!secondaCarta.classList.contains('rivelata')) secondaCarta.textContent = "?";
                primaCarta = null;
                bloccaClick = false;
            }, 1000);

            if (modalità === "2giocatori") {
                turno = turno === 1 ? 2 : 1;
            }
        }
    }

    aggiornaPunteggio();

    if (document.querySelectorAll('.rivelata').length === 16) {
        finePartita();
    }
}

// 4. Funzione per aggiornare il punteggio
function aggiornaPunteggio() {
    if (modalità === "2giocatori") {
        document.getElementById('turno').textContent = `Giocatore ${turno}, tocca a te!`;
        document.getElementById('punteggio1').textContent = `Giocatore 1: ${punti[1]} punti`;
        document.getElementById('punteggio2').textContent = `Giocatore 2: ${punti[2]} punti`;
    }
}

// 5. Funzione per la fine del gioco
function finePartita() {
    riproduciSuono('victory');
    clearInterval(jingleInterval); // Ferma il loop del jingle

    if (modalità === "tempo") {
        clearInterval(timer);
        alert(`Hai finito in ${secondi} secondi!`);
    } else {
        let vincitore = punti[1] > punti[2] ? "Giocatore 1" : "Giocatore 2";
        if (punti[1] === punti[2]) vincitore = "Pareggio!";
        alert(`${vincitore} ha vinto!`);
    }

    // Torna al menu principale
    document.getElementById('selezionaTema').style.display = "block";
    document.getElementById('griglia').style.display = "none";
    document.getElementById('turno').style.display = "none";
    document.getElementById('timer').style.display = "none";
    document.getElementById('restart').style.display = "none";
}

// 6. Suoni generati con Web Audio API per azioni di gioco
function riproduciSuono(tipo) {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function creaSuono(freq, type, startTime, duration) {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.frequency.value = freq;
        osc.type = type;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    let suoni = {
        flip: [700, "triangle", 0.1],
        success: [1200, "sine", 0.3],
        error: [150, "sawtooth", 0.2],
        victory: [1000, "square", 0.5]
    };

    let [freq, type, duration] = suoni[tipo];
    creaSuono(freq, type, audioCtx.currentTime, duration);
}

// 7. Funzione per riprodurre il jingle
function riproduciJingle() {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let now = audioCtx.currentTime;
    let noteSequence = [
        { freq: 600, duration: 0.3 },
        { freq: 800, duration: 0.3 },
        { freq: 1000, duration: 0.3 },
        { freq: 800, duration: 0.3 },
        { freq: 600, duration: 0.3 }
    ];
    
    noteSequence.forEach((nota, index) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = nota.freq;
        osc.type = "triangle";
        let startTime = now + index * 0.4;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + nota.duration);
        osc.start(startTime);
        osc.stop(startTime + nota.duration);
    });
}
