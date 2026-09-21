const kentta = document.getElementById("kentta");
const pelaaja = document.getElementById("pelaaja");
const luukku = document.getElementById("luukku");
const pimeys = document.getElementById("pimeys");
const valo = document.getElementById("valo");
const maalilippu = document.getElementById("maalilippu");
const kerrosnimi = document.getElementById("kerrosnimi");
const kerrosnimiValo = document.getElementById("kerrosnimi-valo");
const aaniNappi = document.getElementById("aani");

const NOPEUS = 0.4;
const PUTOAMISNOPEUS = 2.5;
const RUUTUVALI = 180;
const LUUKKU_LEVEYS = 12;
const HAHMO_LEVEYS = 9.4;
const SADE_OSUUS = 0.26;
const SYTTYMINEN = 900;
const LYHTY_X = 0.855;
const LYHTY_Y = 0.533;
const MAALI_OSOITE = "../index.html";

const KENTAT = [
    { kuva: "kentta-0.png", luukku: 80, lattia: 10.6 },
    { kuva: "kentta-1.png", luukku: 12, lattia: 18.8, nimi: "Limbo" },
    { kuva: "kentta-2.png", luukku: 88, lattia: 14.4, nimi: "Lussuria" },
    { kuva: "kentta-3.png", luukku: 12, lattia: 11.9, nimi: "Gola" },
    { kuva: "kentta-4.png", luukku: 88, lattia: 22.5, nimi: "Avarizia" },
    { kuva: "kentta-5.png", luukku: 12, lattia: 13.1, nimi: "Ira" },
    { kuva: "kentta-6.png", luukku: 88, lattia: 11.9, nimi: "Eresia" },
    { kuva: "kentta-7.png", luukku: 12, lattia: 11.9, nimi: "Violenza" },
    { kuva: "kentta-8.png", luukku: 88, lattia: 9.4, karkaa: 12, nimi: "Malebolge" },
    { kuva: "kentta-9.png", luukku: null, lattia: 11.9, valoLevenee: true, lippu: true, nimi: "Cocito" }
];

let kerros = 0;
let x = 50;
let y = 0;
let suunta = 0;
let katse = 1;
let putoaa = false;
let vaihdettu = false;
let pelialkanut = false;
let ruutu = 0;
let viimeVaihto = 0;
let luukunPaikka = 0;
let karannut = false;
let alkuAika = 0;
let maalissa = false;
let kirjaimet = [];

function vaihdaKuva(nimi) {
    pelaaja.style.backgroundImage = 'url("../images/' + nimi + '.png")';
}

const AANENVOIMAKKUUS = 0.25;

let aaniKonteksti = null;
let aaniVoimakkuus = null;
let musiikkiAlkanut = false;
let vaimennettu = false;

async function lataaAani(osoite) {
    const vastaus = await fetch(osoite);
    const data = await vastaus.arrayBuffer();
    return await aaniKonteksti.decodeAudioData(data);
}

async function aloitaMusiikki() {
    if (musiikkiAlkanut) return;
    musiikkiAlkanut = true;

    try {
        aaniKonteksti = new AudioContext();

        let puskuri;

        try {
            puskuri = await lataaAani("../audio/peli.ogg");
        } catch (virhe) {
            puskuri = await lataaAani("../audio/peli.mp3");
        }

        aaniVoimakkuus = aaniKonteksti.createGain();
        aaniVoimakkuus.gain.value = vaimennettu ? 0 : AANENVOIMAKKUUS;
        aaniVoimakkuus.connect(aaniKonteksti.destination);

        const lahde = aaniKonteksti.createBufferSource();
        lahde.buffer = puskuri;
        lahde.loop = true;
        lahde.connect(aaniVoimakkuus);
        lahde.start();
    } catch (virhe) {
        musiikkiAlkanut = false;
    }
}

function lataaKerros(numero) {
    const tiedot = KENTAT[numero];

    kentta.style.backgroundImage = 'url("../images/' + tiedot.kuva + '")';
    kentta.style.setProperty("--lattia", tiedot.lattia + "%");

    karannut = false;
    luukunPaikka = tiedot.luukku;

    luukku.style.transition = "none";

    if (tiedot.luukku === null) {
        luukku.style.display = "none";
    } else {
        luukku.style.display = "block";
        luukku.style.left = luukunPaikka + "%";
    }
    maalilippu.style.display = tiedot.lippu ? "block" : "none";
    kerrosnimi.textContent = tiedot.nimi || "";
    kerrosnimiValo.textContent = "";
    kirjaimet = [];

    if (tiedot.nimi) {
        for (const merkki of tiedot.nimi) {
            const palanen = document.createElement("span");
            palanen.textContent = merkki;
            kerrosnimiValo.appendChild(palanen);
            kirjaimet.push({ elementti: palanen, paikka: 0 });
        }

        const kentanReunat = kentta.getBoundingClientRect();

        for (const kirjain of kirjaimet) {
            const omat = kirjain.elementti.getBoundingClientRect();
            kirjain.paikka = (omat.left + omat.width / 2 - kentanReunat.left)
                / kentanReunat.width * 100;
        }
    }
}

function esilataa() {
    const kuvat = ["dante", "dante-lyhty-a", "dante-lyhty-b", "dante-lyhty-putoaa"];

    for (const nimi of kuvat) {
        const kuva = new Image();
        kuva.src = "../images/" + nimi + ".png";
    }

    for (const tiedot of KENTAT) {
        const kuva = new Image();
        kuva.src = "../images/" + tiedot.kuva;
    }
}

document.addEventListener("keydown", (tapahtuma) => {
    if (tapahtuma.key === "ArrowLeft" || tapahtuma.key === "ArrowRight") {
        tapahtuma.preventDefault();
    }

    if (tapahtuma.key === "ArrowLeft") suunta = -1;
    if (tapahtuma.key === "ArrowRight") suunta = 1;

    if (suunta !== 0) aloitaMusiikki();
});

document.addEventListener("keyup", () => {
    suunta = 0;
});

kentta.addEventListener("pointerdown", (tapahtuma) => {
    tapahtuma.preventDefault();

    const reunat = kentta.getBoundingClientRect();
    const kohta = (tapahtuma.clientX - reunat.left) / reunat.width * 100;
    suunta = kohta < x ? -1 : 1;
    aloitaMusiikki();
});

kentta.addEventListener("contextmenu", (tapahtuma) => {
    tapahtuma.preventDefault();
});

window.addEventListener("pointerup", () => {
    suunta = 0;
});

function paivita(aika) {
    if (putoaa) {
        y = y - PUTOAMISNOPEUS;

        if (!vaihdettu && y < -120) {
            vaihdettu = true;
            kerros = kerros + 1;
            lataaKerros(kerros);
            y = 120;
        }

        if (vaihdettu && y <= 0) {
            y = 0;
            putoaa = false;
            vaihdettu = false;
            vaihdaKuva("dante-lyhty-a");
        }
    } else {
        if (suunta !== 0) {
            if (!pelialkanut) {
                pelialkanut = true;
                alkuAika = aika;
                document.body.classList.add("peli-kaynnissa");
                vaihdaKuva("dante-lyhty-a");
            }

            katse = suunta;

            if (aika - viimeVaihto > RUUTUVALI) {
                viimeVaihto = aika;
                ruutu = 1 - ruutu;
                vaihdaKuva(ruutu === 0 ? "dante-lyhty-a" : "dante-lyhty-b");
            }
        } else if (pelialkanut && ruutu !== 0) {
            ruutu = 0;
            vaihdaKuva("dante-lyhty-a");
        }

        x = x + suunta * NOPEUS;

        if (x < 4.7) x = 4.7;
        if (x > 95.3) x = 95.3;

        const tiedot = KENTAT[kerros];
        const luukulla = tiedot.luukku !== null
            && Math.abs(x - luukunPaikka) < (LUUKKU_LEVEYS - HAHMO_LEVEYS) / 2;

        if (luukulla && pelialkanut) {
            if (tiedot.karkaa !== undefined && !karannut) {
                karannut = true;
                luukunPaikka = tiedot.karkaa;
                luukku.style.transition = "left 0.35s";
                luukku.style.left = luukunPaikka + "%";
            } else {
                putoaa = true;
                suunta = 0;
                vaihdaKuva("dante-lyhty-putoaa");
            }
        }

        if (tiedot.lippu && !maalissa && pelialkanut && Math.abs(x - 50) < 0.4) {
            maalissa = true;
            suunta = 0;
            window.location.href = MAALI_OSOITE;
        }
    }

    pelaaja.style.left = x + "%";
    pelaaja.style.bottom = "calc(var(--lattia) + " + y + "%)";
    pelaaja.style.transform = "translateX(-50%) scaleX(" + katse + ")";
    const nyt = KENTAT[kerros];
    const leveys = kentta.clientWidth;
    const lyhtyX = katse === 1 ? LYHTY_X : 1 - LYHTY_X;

    const valoX = x + (lyhtyX - 0.5) * 9.4;
    const valoY = 100 - (nyt.lattia + y + 75 - 75 * LYHTY_Y);

    let sade = leveys * SADE_OSUUS;

    if (nyt.valoLevenee) {
        const etaisyys = Math.abs(x - 50);
        const lahella = Math.max(0, 1 - etaisyys / 45);
        sade = sade + lahella * lahella * leveys * 2.5;
    }

    if (pelialkanut) {
        sade = sade * Math.min(1, (aika - alkuAika) / SYTTYMINEN);
    }

    const kynnys = sade / leveys * 60;

    for (const kirjain of kirjaimet) {
        if (Math.abs(valoX - kirjain.paikka) < kynnys) {
            kirjain.elementti.classList.add("nimi-loytyi");
        }
    }

    pimeys.style.setProperty("--lx", valoX + "%");
    pimeys.style.setProperty("--ly", valoY + "%");
    pimeys.style.setProperty("--sade", sade + "px");
    valo.style.setProperty("--lx", valoX + "%");
    valo.style.setProperty("--ly", valoY + "%");
    valo.style.setProperty("--sade", sade + "px");
    requestAnimationFrame(paivita);
}

aaniNappi.addEventListener("click", () => {
    vaimennettu = !vaimennettu;

    if (aaniVoimakkuus) {
        aaniVoimakkuus.gain.value = vaimennettu ? 0 : AANENVOIMAKKUUS;
    }

    aaniNappi.classList.toggle("vaimennettu", vaimennettu);
    aaniNappi.setAttribute("aria-label",
        vaimennettu ? "Palauta musiikki" : "Vaimenna musiikki");
    aaniNappi.blur();
});

esilataa();
lataaKerros(0);
requestAnimationFrame(paivita);