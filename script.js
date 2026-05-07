// ============================================================
//  SMART CARD MANAGEMENT SYSTEM — script.js
//
//  What this file does:
//  1. Validates the search input
//  2. Sends the search to search.php
//  3. Reads the response and shows the correct Nepali message
// ============================================================


// ============================================================
//  NEPALI STATUS MESSAGES
//  Copied exactly from the MESSAGES sheet in the Excel file.
//  4 possible statuses:
//    dispatched = card printed and sent to centre
//    atrvk      = card ready but still at vendor (RVK)
//    printing   = card is being printed
//    notfound   = no record found
// ============================================================
var STATUS_MESSAGES = {
    dispatched: "तपार्इँको स्मार्टकार्ड तयारी भइ वितरणा भइसकेको छ । तपार्इँलार्इ प्राप्त नभएको भए कृपया आफ्नो केन्द्रमा सम्पर्क गर्नहुन अनुरोध छ ।",
    atrvk:      "तपार्इँको स्मार्टकार्ड हाल तयारी भइसकेको छ र आर भि के मा छ । केन्द्रीय कार्यालयलार्इ प्राप्त भएपछि यहाँको केन्द्रमा पठाइनेछ ।",
    printing:   "तपार्इँको स्मार्टकार्ड हाल तयारी प्रिन्टिङ्ग हुने क्रममा छ । प्रिन्टिङ्ग भए नभएको थाहा पाउनलाइर् यसै पोर्टलमा हेर्नुहुन अनुरोध छ ।",
    notfound:   "तपार्इँको स्मार्टकार्डको विवरण प्राप्त हुन सकेन । कृपया आफ्नो केन्द्रमा सम्पर्क गर्नहुन अनुरोध छ ।"
};

var STATUS_LABELS = {
    dispatched: "✅  Dispatched / वितरण भएको",
    atrvk:      "📦  At Vendor (RVK) / आर भि के मा",
    printing:   "🖨️  In Printing / प्रिन्टिङ्ग क्रममा",
    notfound:   "❌  Not Found / फेला परेन"
};


// ============================================================
//  SEARCH FUNCTION
//  Called when user clicks the Search button or presses Enter.
// ============================================================
function searchCard() {
    var name   = document.getElementById("nameInput").value.trim();
    var cardNo = document.getElementById("cardInput").value.trim();

    // --- Hide all previous messages and results ---
    document.getElementById("errorMsg").style.display    = "none";
    document.getElementById("fullNameMsg").style.display = "none";
    document.getElementById("resultBox").style.display   = "none";
    document.getElementById("cardDetails").style.display = "none";

    // --- Validation 1: Both fields are empty ---
    if (name === "" && cardNo === "") {
        document.getElementById("errorMsg").style.display = "block";
        return;
    }

    // --- Validation 2: Name entered but only one word (no space) ---
    if (name !== "" && !name.includes(" ")) {
        document.getElementById("fullNameMsg").style.display = "block";
        return;
    }

    // --- Build the URL for search.php ---
    var url = "search.php?";
    if (name)   url += "name="        + encodeURIComponent(name)   + "&";
    if (cardNo) url += "card_number=" + encodeURIComponent(cardNo) + "&";

    // --- Show loading state on button ---
    document.getElementById("searchBtn").innerText = "Searching...";
    document.getElementById("searchBtn").disabled  = true;

    // --- Call search.php ---
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            document.getElementById("searchBtn").innerText = "Search / खोज्नुहोस्";
            document.getElementById("searchBtn").disabled  = false;
            showResult(data);
        })
        .catch(function(error) {
            document.getElementById("searchBtn").innerText = "Search / खोज्नुहोस्";
            document.getElementById("searchBtn").disabled  = false;
            console.error("Search error:", error);
            showResult({ status: "notfound" });
        });
}


// ============================================================
//  SHOW RESULT FUNCTION
//  Receives JSON from PHP and updates the page.
// ============================================================
function showResult(data) {
    var status    = data.status;
    var resultBox = document.getElementById("resultBox");

    // Remove any old status class
    resultBox.classList.remove(
        "status-dispatched",
        "status-atrvk",
        "status-printing",
        "status-notfound"
    );

    // Add the new status class — this changes the color
    resultBox.classList.add("status-" + status);

    // Set the label and Nepali message
    document.getElementById("statusLabel").innerText   = STATUS_LABELS[status]   || STATUS_LABELS["notfound"];
    document.getElementById("statusMessage").innerText = STATUS_MESSAGES[status] || STATUS_MESSAGES["notfound"];

    // Show the result box
    resultBox.style.display = "block";

    // Show details table only when dispatched (that's when we have full info)
    if (status === "dispatched" && data.name) {
        document.getElementById("detailName").innerText   = data.name        || "—";
        document.getElementById("detailCard").innerText   = data.card_number || "—";
        document.getElementById("detailDcCode").innerText = data.dc_code     || "—";
        document.getElementById("detailCentre").innerText = data.centre      || "—";
        document.getElementById("cardDetails").style.display = "block";
    }
}


// ============================================================
//  CLEAR FUNCTION
//  Resets all inputs and hides all messages.
// ============================================================
function clearSearch() {
    document.getElementById("nameInput").value           = "";
    document.getElementById("cardInput").value           = "";
    document.getElementById("errorMsg").style.display    = "none";
    document.getElementById("fullNameMsg").style.display = "none";
    document.getElementById("resultBox").style.display   = "none";
    document.getElementById("cardDetails").style.display = "none";
}


// ============================================================
//  ENTER KEY SUPPORT
//  User can press Enter in either input to trigger search.
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("nameInput").addEventListener("keydown", function(e) {
        if (e.key === "Enter") searchCard();
    });
    document.getElementById("cardInput").addEventListener("keydown", function(e) {
        if (e.key === "Enter") searchCard();
    });
});