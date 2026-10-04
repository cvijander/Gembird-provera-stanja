// Slušamo poruke koje nam šalje stranica (content.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "proveriGembird") {
    
    // Background skripta ima pravo da slobodno vuče podatke sa drugih sajtova
    fetch(request.url)
      .then(response => response.text())
      .then(html => sendResponse({ success: true, data: html }))
      .catch(error => sendResponse({ success: false, error: error.message }));
      
    return true; // Govori Chrome-u da će odgovor stići asinhrono
  }
});