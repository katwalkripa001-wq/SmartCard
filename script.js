// ============================================================
//  SMART CARD PORTAL — script.js
// ============================================================

var STATUS_MESSAGES = {
    dispatched: "तपार्इँको स्मार्टकार्ड तयारी भइ वितरणा भइसकेको छ । तपार्इँलार्इ प्राप्त नभएको भए कृपया आफ्नो केन्द्रमा सम्पर्क गर्नहुन अनुरोध छ ।",
    atrvk:      "तपार्इँको स्मार्टकार्ड हाल तयारी भइसकेको छ र आर भि के मा छ । केन्द्रीय कार्यालयलार्इ प्राप्त भएपछि यहाँको केन्द्रमा पठाइनेछ ।",
    printing:   "तपार्इँको स्मार्टकार्ड हाल तयारी प्रिन्टिङ्ग हुने क्रममा छ । प्रिन्टिङ्ग भए नभएको थाहा पाउनलाइर् यसै पोर्टलमा हेर्नुहुन अनुरोध छ ।",
    notfound:   "तपार्इँको स्मार्टकार्डको विवरण प्राप्त हुन सकेन । कृपया आफ्नो केन्द्रमा सम्पर्क गर्नहुन अनुरोध छ ।"
};

var STATUS_LABELS = {
    dispatched: "✅  Dispatched — वितरण भएको",
    atrvk:      "📦  At Vendor (RVK) — आर भि के मा",
    printing:   "🖨️  In Printing — प्रिन्टिङ्ग क्रममा",
    notfound:   "❌  Not Found — फेला परेन"
};

var STATUS_ICONS = {
    dispatched: "🎉",
    atrvk:      "📦",
    printing:   "🖨️",
    notfound:   "🔍"
};

var lastMultiResults = [];
var activeTab = "name";

// ============================================================
//  TAB SWITCHER
// ============================================================
function switchTab(tab, el) {
    activeTab = tab;
    document.getElementById("tab-name").style.display = tab === "name" ? "block" : "none";
    document.getElementById("tab-card").style.display = tab === "card" ? "block" : "none";
    document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
    el.classList.add("active");
    clearSearch();
}

// ============================================================
//  SEARCH
// ============================================================
function searchCard() {
    var name   = document.getElementById("nameInput").value.trim();
    var centre = document.getElementById("centreInput").value.trim();
    var cardNo = document.getElementById("cardInput").value.trim();

    document.getElementById("errorMsg").style.display    = "none";
    document.getElementById("fullNameMsg").style.display = "none";
    document.getElementById("resultBox").style.display   = "none";
    document.getElementById("multiBox").style.display    = "none";

    // -- Validation --
    if (activeTab === "name") {
        if (name === "") {
            document.getElementById("errorMsg").style.display = "block";
            return;
        }
        if (!name.includes(" ")) {
            document.getElementById("fullNameMsg").style.display = "block";
            return;
        }
    } else {
        if (cardNo === "") {
            document.getElementById("errorMsg").style.display = "block";
            return;
        }
    }

    // -- Build URL --
    var url = "search.php?";
    if (activeTab === "name") {
        url += "name=" + encodeURIComponent(name) + "&";
        if (centre !== "") url += "centre=" + encodeURIComponent(centre) + "&";
    } else {
        url += "card_number=" + encodeURIComponent(cardNo) + "&";
    }

    // -- Show loader --
    document.getElementById("btnText").style.display   = "none";
    document.getElementById("btnLoader").style.display = "flex";
    document.getElementById("searchBtn").disabled = true;

    fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            resetBtn();
            handleResult(data);
        })
        .catch(function(err) {
            console.error(err);
            resetBtn();
            showSingleResult({ status: "notfound" });
        });
}

// ============================================================
//  HANDLE RESULT
// ============================================================
function handleResult(data) {
    if (data.multiple && data.results && data.results.length > 1) {
        lastMultiResults = data.results;
        showMultipleResults(data.results);
    } else {
        showSingleResult(data, false);
    }
}

// ============================================================
//  SHOW MULTIPLE RESULTS
// ============================================================
function showMultipleResults(results) {
    var multiBox  = document.getElementById("multiBox");
    var multiList = document.getElementById("multiList");

    document.getElementById("multiCount").innerText = results.length + " records found";
    multiList.innerHTML = "";

    results.forEach(function(record) {
        var item = document.createElement("div");
        item.className = "multi-item";
        item.innerHTML =
            '<div class="multi-item-info">' +
                '<div class="multi-item-name">' + record.name + '</div>' +
                '<div class="multi-item-sub">Card: ' + record.card_number + ' &nbsp;·&nbsp; Centre: ' + record.centre + '</div>' +
            '</div>' +
            '<span class="multi-item-arrow">→</span>';
        item.onclick = function() { showSingleResult(record, true); };
        multiList.appendChild(item);
    });

    multiBox.style.display = "block";
    multiBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ============================================================
//  SHOW SINGLE RESULT
// ============================================================
function showSingleResult(data, showBack) {
    var status    = data.status;
    var resultBox = document.getElementById("resultBox");

    document.getElementById("multiBox").style.display   = "none";
    document.getElementById("backBtn").style.display    = showBack ? "inline-block" : "none";

    resultBox.classList.remove("status-dispatched", "status-atrvk", "status-printing", "status-notfound");
    resultBox.classList.add("status-" + status);

    document.getElementById("resultIcon").innerText    = STATUS_ICONS[status]    || "🔍";
    document.getElementById("statusLabel").innerText   = STATUS_LABELS[status]   || STATUS_LABELS["notfound"];
    document.getElementById("statusMessage").innerText = STATUS_MESSAGES[status] || STATUS_MESSAGES["notfound"];

    var details = document.getElementById("cardDetails");
    if (status === "dispatched" && data.name) {
        document.getElementById("detailName").innerText   = data.name        || "—";
        document.getElementById("detailCard").innerText   = data.card_number || "—";
        document.getElementById("detailDcCode").innerText = data.dc_code     || "—";
        document.getElementById("detailCentre").innerText = data.centre      || "—";
        details.style.display = "flex";
    } else {
        details.style.display = "none";
    }

    resultBox.style.display = "block";
    setTimeout(function() {
        resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
}

// ============================================================
//  SHOW MULTI (back button)
// ============================================================
function showMulti() {
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("multiBox").style.display  = "block";
    document.getElementById("multiBox").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ============================================================
//  RESET BUTTON
// ============================================================
function resetBtn() {
    document.getElementById("btnText").style.display   = "inline";
    document.getElementById("btnLoader").style.display = "none";
    document.getElementById("searchBtn").disabled = false;
}

// ============================================================
//  CLEAR
// ============================================================
function clearSearch() {
    document.getElementById("nameInput").value           = "";
    document.getElementById("centreInput").value         = "";
    document.getElementById("cardInput").value           = "";
    document.getElementById("errorMsg").style.display    = "none";
    document.getElementById("fullNameMsg").style.display = "none";
    document.getElementById("resultBox").style.display   = "none";
    document.getElementById("multiBox").style.display    = "none";
    lastMultiResults = [];
}

// ============================================================
//  ENTER KEY
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    ["nameInput", "centreInput", "cardInput"].forEach(function(id) {
        document.getElementById(id).addEventListener("keydown", function(e) {
            if (e.key === "Enter") searchCard();
        });
    });
});