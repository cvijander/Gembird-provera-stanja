// ---------- BOJE I PRAGOVI ZA KOLIČINU ----------
// Preko PRAG_PUNO              -> zeleno
// Preko PRAG_MALO do PRAG_PUNO -> svetlozeleno (limeta)
// Od 1 do PRAG_MALO            -> žuto (upozorenje)
// 0                            -> crveno
// Greška / nije pronađeno      -> sivo (javiGresku)
const PRAG_PUNO = 10;
const PRAG_MALO = 5;

const BOJE_STANJA = {
    puno:    { pozadina: "#28a745", tekst: "white"   },
    srednje: { pozadina: "#a4c639", tekst: "#212529" },
    malo:    { pozadina: "#ffc107", tekst: "#212529" },
    nema:    { pozadina: "#dc3545", tekst: "white"   },
    greska:  { pozadina: "#adb5bd", tekst: "#212529" }
};

function postaviBoju(box, boja) {
    box.style.backgroundColor = boja.pozadina;
    box.style.color = boja.tekst;
}

function pokreniProveruStanja() {
    if (document.getElementById('gembird-status-box')) return;

    let ceoTekst = document.body.innerText;
    let eanMatch = ceoTekst.match(/EAN:\s*(\d{12,14})/i);
    
    if (eanMatch) {
        let eanBroj = eanMatch[1];
        
        let statusBox = document.createElement('div');
        statusBox.id = 'gembird-status-box';
        statusBox.innerText = "⏳ Proveravam Gembird za EAN: " + eanBroj + "...";
        
        statusBox.style.position = "fixed";
        statusBox.style.top = "10px";
        statusBox.style.left = "50%";
        statusBox.style.transform = "translateX(-50%)";
        statusBox.style.zIndex = "999999";
        statusBox.style.padding = "15px 30px";
        statusBox.style.backgroundColor = "#343a40";
        statusBox.style.color = "white";
        statusBox.style.borderRadius = "30px";
        statusBox.style.fontWeight = "bold";
        statusBox.style.fontSize = "18px";
        statusBox.style.boxShadow = "0px 10px 30px rgba(0,0,0,0.5)";
        statusBox.style.border = "2px solid white";
        document.body.appendChild(statusBox);

        let searchUrl = "https://www.gembird.rs/search/" + eanBroj + "/0/0/false/0";

        chrome.runtime.sendMessage({ action: "proveriGembird", url: searchUrl }, (response) => {
            if (response && response.success) {
                obradiHtml(response.data, statusBox);
            } else {
                javiGresku(statusBox, "Mrežna greška u pozadini");
            }
        });
    }
}

function obradiHtml(htmlTekst, statusBox) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlTekst, 'text/html');
    
    let kolicinaElement = doc.querySelector('.product-available-amount span');
    let cenaElement = doc.querySelector('.product-preview-price-new') || doc.querySelector('.product-preview-price'); 

    if (kolicinaElement) {
        let kolicina = kolicinaElement.innerText.trim();
        let cena = cenaElement ? cenaElement.innerText.replace('Cena:', '').replace(/"/g, '').trim() : "Nema cene";
        osveziBoks(statusBox, kolicina, cena);
    } else {
        let artikli = doc.querySelectorAll('a');
        let artikalUrl = null;

        for (let a of artikli) {
            let href = a.getAttribute('href');
            if (href && (href.includes('/artikal/') || href.includes('/proizvod/') || href.includes('/product/'))) {
                artikalUrl = href.startsWith('http') ? href : "https://www.gembird.rs" + href;
                break;
            }
        }

        if (artikalUrl) {
            statusBox.innerText = "⏳ Otvaram stranicu artikla...";
            chrome.runtime.sendMessage({ action: "proveriGembird", url: artikalUrl }, (responseStrane) => {
                if (responseStrane && responseStrane.success) {
                    let artikalDoc = parser.parseFromString(responseStrane.data, 'text/html');
                    let kolicinaNaStranici = artikalDoc.querySelector('.product-available-amount span');
                    let cenaNaStranici = artikalDoc.querySelector('.product-preview-price-new') || artikalDoc.querySelector('.product-preview-price');
                    
                    if (kolicinaNaStranici) {
                        let kolicina = kolicinaNaStranici.innerText.trim();
                        let cena = cenaNaStranici ? cenaNaStranici.innerText.replace('Cena:', '').replace(/"/g, '').trim() : "Nema cene";
                        osveziBoks(statusBox, kolicina, cena);
                    } else {
                        javiGresku(statusBox, "Nema info o količini na artiklu");
                    }
                } else {
                    javiGresku(statusBox, "Greška pri otvaranju strane artikla");
                }
            });
        } else {
            javiGresku(statusBox, "Artikal nije pronađen na Gembirdu");
        }
    }
}

function osveziBoks(box, kolicinaTekst, cenaTekst) {
    let tekst = kolicinaTekst.replace(/\s+/g, ''); 
    let cenaCista = cenaTekst.replace(/\s+/g, ' ').trim();
    
    // Sajt piše npr. ">10" ili "vise" kad ima mnogo komada
    if (tekst.includes('>') || tekst.toLowerCase().includes('vise')) {
        box.innerText = "✅ STANJE: " + kolicinaTekst + " | 💰 CENA: " + cenaCista;
        postaviBoju(box, BOJE_STANJA.puno);
        return;
    }

    let broj = parseInt(tekst.replace(/[^0-9]/g, '')) || 0;
    
    if (broj > PRAG_PUNO) {
        box.innerText = "✅ STANJE: " + broj + " kom. | 💰 CENA: " + cenaCista;
        postaviBoju(box, BOJE_STANJA.puno);
    } else if (broj > PRAG_MALO) {
        box.innerText = "✅ STANJE: " + broj + " kom. | 💰 CENA: " + cenaCista;
        postaviBoju(box, BOJE_STANJA.srednje);
    } else if (broj > 0) {
        box.innerText = "🟡 MALO NA STANJU: " + broj + " kom. | 💰 CENA: " + cenaCista;
        postaviBoju(box, BOJE_STANJA.malo);
    } else {
        box.innerText = "❌ NEMA NA STANJU (0 kom.) | 💰 CENA: " + cenaCista;
        postaviBoju(box, BOJE_STANJA.nema);
    }
}

function javiGresku(box, tekst) {
    box.innerText = "⚠️ " + tekst;
    postaviBoju(box, BOJE_STANJA.greska);
}

const observer = new MutationObserver((mutations, obs) => {
    let ceoTekst = document.body.innerText;
    if (/EAN:\s*\d{12,14}/i.test(ceoTekst)) {
        pokreniProveruStanja();
        obs.disconnect();
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', pokreniProveruStanja);
