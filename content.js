function startCheckInventory() {
    if (document.getElementById('gembird-status-box')) return;

    let ceoTekst = document.body.innerText;
    let eanMatch = ceoTekst.match(/EAN:\s*(\d{12,14})/i);
    
    if (eanMatch) {
        let eanNumber = eanMatch[1];
        
        let statusBox = document.createElement('div');
        statusBox.id = 'gembird-status-box';
        statusBox.innerText = "Proveravam Gembird za EAN: " + eanNumber + "...";
        
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

        let searchUrl = "https://www.gembird.rs/search/" + eanNumber + "/0/0/false/0";

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
            statusBox.innerText = "Otvaram stranicu artikla...";
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
    // SKLONJEN SUVIŠAN "DIN" - Samo čistimo razmake iz teksta koji sajt šalje
    let cenaCista = cenaTekst.replace(/\s+/g, ' ').trim();
    
    if (tekst.includes('>') || tekst.toLowerCase().includes('vise')) {
        box.innerText = "Stanje: " + kolicinaTekst + " | Cena: " + cenaCista;
        box.style.backgroundColor = "#28a745";
        return;
    }

    let broj = parseInt(tekst.replace(/[^0-9]/g, '')) || 0;
    
    if (broj > 0) {
        box.innerText = "Stanje: " + broj + " kom. | Cena: " + cenaCista;
        box.style.backgroundColor = "#28a745";
    } else {
        box.innerText = "Nema na stanju (0 kom.) |  Cena: " + cenaCista;
        box.style.backgroundColor = "#dc3545";
    }
}

function javiGresku(box, tekst) {
    box.innerText = "Upozorenje " + tekst;
    box.style.backgroundColor = "#ffc107";
    box.style.color = "#212529";
}

const observer = new MutationObserver((mutations, obs) => {
    let ceoTekst = document.body.innerText;
    if (/EAN:\s*\d{12,14}/i.test(ceoTekst)) {
        pokreniProveruStanja();
        obs.disconnect();
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', startCheckInventory);