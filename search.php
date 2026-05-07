<?php
// ============================================================
//  SMART CARD PORTAL — search.php
//  Reads live data directly from Google Sheets (CSV)
//  No Excel file needed, No composer needed!
// ============================================================

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// ============================================================
//  GOOGLE SHEETS CSV LINKS
//  These links auto-update when you edit the Google Sheet
// ============================================================
$SHEET_DISPATCHED = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=855486761&single=true&output=csv";
$SHEET_ATRVK      = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=1595329530&single=true&output=csv";
$SHEET_PRINTING   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=594840163&single=true&output=csv";


// ============================================================
//  GET SEARCH INPUTS
// ============================================================
$search_name = isset($_GET["name"])        ? strtolower(trim($_GET["name"]))        : "";
$search_card = isset($_GET["card_number"]) ? strtolower(trim($_GET["card_number"])) : "";

if (empty($search_name) && empty($search_card)) {
    echo json_encode(["status" => "notfound"]);
    exit;
}


// ============================================================
//  HELPER: Download CSV from Google Sheets and parse into rows
// ============================================================
function fetchCSV($url) {
    $context = stream_context_create([
        "http" => [
            "timeout"         => 10,
            "follow_location" => true,
            "user_agent"      => "Mozilla/5.0"
        ]
    ]);

    $csv = @file_get_contents($url, false, $context);

    if ($csv === false) return [];

    $lines = explode("\n", trim($csv));
    if (count($lines) < 2) return [];

    // First line = headers
    $headers = str_getcsv(array_shift($lines));
    $headers = array_map(fn($h) => strtolower(trim($h)), $headers);

    $rows = [];
    foreach ($lines as $line) {
        if (empty(trim($line))) continue;
        $values = str_getcsv($line);
        // Pad values if row has fewer columns than headers
        while (count($values) < count($headers)) {
            $values[] = "";
        }
        $rows[] = array_combine($headers, $values);
    }

    return $rows;
}


// ============================================================
//  STEP 1: Search DISPATCHED DETAILS sheet
//  Columns: sn | smart card no | dc code | centre name | full name
// ============================================================
$dispatched_rows = fetchCSV($SHEET_DISPATCHED);

foreach ($dispatched_rows as $row) {
    // Get values — try both possible column name formats
    $card_in_sheet = strtolower(trim($row["smart card no"]  ?? $row["smart card no."] ?? ""));
    $name_in_sheet = strtolower(trim($row["full name"]      ?? ""));

    $card_match = !empty($search_card) && $card_in_sheet === $search_card;
    $name_match = !empty($search_name) && $name_in_sheet === $search_name;

    if ($card_match || $name_match) {
        echo json_encode([
            "status"      => "dispatched",
            "name"        => trim($row["full name"]      ?? ""),
            "card_number" => strtoupper(trim($row["smart card no"] ?? $row["smart card no."] ?? "")),
            "dc_code"     => trim($row["dc code"]        ?? ""),
            "centre"      => trim($row["centre name"]    ?? ""),
        ]);
        exit;
    }
}


// ============================================================
//  STEP 2: Search AT RKV sheet (card numbers only)
//  Only possible to search by card number here
// ============================================================
if (!empty($search_card)) {
    $atrvk_rows = fetchCSV($SHEET_ATRVK);

    foreach ($atrvk_rows as $row) {
        // Card number is in first column — get it regardless of header name
        $card_in_sheet = strtolower(trim(array_values($row)[0] ?? ""));

        if ($card_in_sheet === $search_card) {
            echo json_encode([
                "status"      => "atrvk",
                "card_number" => strtoupper($search_card),
            ]);
            exit;
        }
    }
}


// ============================================================
//  STEP 3: Search IN PRINTING sheet (card numbers only)
// ============================================================
if (!empty($search_card)) {
    $printing_rows = fetchCSV($SHEET_PRINTING);

    foreach ($printing_rows as $row) {
        $card_in_sheet = strtolower(trim(array_values($row)[0] ?? ""));

        if ($card_in_sheet === $search_card) {
            echo json_encode([
                "status"      => "printing",
                "card_number" => strtoupper($search_card),
            ]);
            exit;
        }
    }
}


// ============================================================
//  STEP 4: Nothing found anywhere
// ============================================================
echo json_encode(["status" => "notfound"]);
?>