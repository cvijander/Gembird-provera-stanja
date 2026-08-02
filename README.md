# KP Gembird Provera Stanja

Chrome ekstenzija koja automatski proverava dostupnu količinu i cenu artikla na sajtu **gembird.rs**, direktno dok se direktno pregleda oglas na **kupujemprodajem.com**.

## Problem koji rešava

Kada prodajem/pratim proizvode preko KupujemProdajem oglasa, neophodno je otići na sajt Gembirda i proveriti da li je artikal (po EAN kodu) trenutno na stanju i po kojoj ceni. Ova ekstenzija to radi automatski - čim se na stranici prepozna EAN broj, u gornjem delu ekrana se pojavljuje boks sa trenutnim stanjem i cenom.

## Kako radi

1. **content.js** - ubacuje se u kupujemprodajem.com stranice, traži EAN broj u tekstu stranice (regex pretraga) i prikazuje plutajući status boks
2. **background.js** - prima zahtev od content.js i šalje mrežni poziv ka gembird.rs (ovo mora da radi background skripta zbog CORS ograničenja - stranica sama ne sme direktno da "vuče" podatke sa drugog domena)
3. **manifest.json** - definiše dozvole ekstenzije: na koje sajtove sme content.js da se ubaci, i sa kog domena background.js sme da povlači podatke (isključivo gembird.rs)

## Korišćene tehnologije

- Chrome Extension Manifest V3
- Vanilla JavaScript (DOM manipulacija, `MutationObserver`, `fetch`, Promises)
- Chrome Runtime Messaging API (komunikacija između content i background skripte)

## Napomena o razvoju

Ovaj projekat je nastao iz stvarne potrebe na poslu, gde sam identifikovao problem i testirao rešenje u praksi. Pri pisanju samog koda koristio/la sam AI pomoć  da naučim kako funkcioniše Chrome Extension arhitektura, asinhroni JavaScript i komunikacija između skripti. Razumem logiku i strukturu projekta, i i dalje aktivno učim finije detalje JavaScript-a kao junior programer.

## Instalacija (za testiranje)

1. Otvori `chrome://extensions` u Chrome-u
2. Uključi **Developer mode** (gore desno)
3. Klikni **Load unpacked** i izaberi folder sa ovim fajlovima
4. Otvori bilo koji kupujemprodajem.com oglas koji sadrži EAN kod artikla

## Moguća unapređenja

- [ ] Izdvajanje duplirane logike za parsiranje količine/cene u zajedničku funkciju
- [ ] Dodavanje try-catch error handlinga
- [ ] Podrška za proveru na više distributerskih sajtova, ne samo Gembird
