<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$SHEET_DISPATCHED = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=855486761&single=true&output=csv";
$SHEET_ATRVK      = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=1595329530&single=true&output=csv";
$SHEET_PRINTING   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgKjNlzWYcEagDnxSdcRWkAZZsPYyKaJ3nx1bmzNlGQSj8mzyc8RUHtGNoiiG0c79svYzEH1ZDINyp/pub?gid=594840163&single=true&output=csv";

// Sheet column positions (0-based index):
// A=0 G(row no) | B=1 SC(card no) | C=2 DC Code | D=3 Centre Name | E=4 Full Name | H=7 Remarks | I=8 Status

$search_name   = isset($_GET["name"])        ? strtolower(trim($_GET["name"]))        : "";
$search_centre = isset($_GET["centre"])      ? strtolower(trim($_GET["centre"]))      : "";
$search_card   = isset($_GET["card_number"]) ? strtolower(trim($_GET["card_number"])) : "";

if (empty($search_name) && empty($search_card)) {
    echo json_encode(["status" => "notfound"]);
    exit;
}

function fetchCSV($url) {
    $context = stream_context_create([
        "http" => ["timeout" => 10, "follow_location" => true, "user_agent" => "Mozilla/5.0"]
    ]);
    $csv = @file_get_contents($url, false, $context);
    if ($csv === false) return [];
    $lines = explode("\n", trim($csv));
    if (count($lines) < 2) return [];
    array_shift($lines); // remove header row
    $rows = [];
    foreach ($lines as $line) {
        if (empty(trim($line))) continue;
        $rows[] = str_getcsv($line);
    }
    return $rows;
}

// Build a record from a dispatched row
function buildRecord($row) {
    $card_no  = strtoupper(trim($row[1] ?? ""));
    $dc_code  = trim($row[2] ?? "");
    $centre   = trim($row[3] ?? "");
    $name     = trim($row[4] ?? "");
    $remarks  = strtolower(trim($row[7] ?? ""));
    $status_col = strtolower(trim($row[8] ?? ""));

    // Determine real status:
    // Column I says "DISPATCHED" = dispatched
    // Column I is empty but remarks say "not sent from rvk" = atrvk
    // Otherwise = notfound in this sheet
    if ($status_col === "dispatched") {
        $status = "dispatched";
    } elseif (str_contains($remarks, "not sent from rvk") || str_contains($remarks, "rvk")) {
        $status = "atrvk";
    } else {
        $status = "dispatched"; // in this sheet = dispatched by default
    }

    return [
        "status"      => $status,
        "name"        => $name,
        "card_number" => $card_no,
        "dc_code"     => $dc_code,
        "centre"      => $centre,
    ];
}

// ── SEARCH BY CARD NUMBER ────────────────────────────────────
if (!empty($search_card)) {

    // Check DISPATCHED DETAILS
    foreach (fetchCSV($SHEET_DISPATCHED) as $row) {
        $card_in_sheet = strtolower(trim($row[1] ?? ""));
        if ($card_in_sheet === $search_card) {
            echo json_encode(buildRecord($row));
            exit;
        }
    }

    // Check AT RKV sheet
    foreach (fetchCSV($SHEET_ATRVK) as $row) {
        $card_in_sheet = strtolower(trim($row[0] ?? ""));
        if ($card_in_sheet === $search_card) {
            echo json_encode(["status" => "atrvk", "card_number" => strtoupper($search_card)]);
            exit;
        }
    }

    // Check IN PRINTING sheet
    foreach (fetchCSV($SHEET_PRINTING) as $row) {
        $card_in_sheet = strtolower(trim($row[0] ?? ""));
        if ($card_in_sheet === $search_card) {
            echo json_encode(["status" => "printing", "card_number" => strtoupper($search_card)]);
            exit;
        }
    }

    echo json_encode(["status" => "notfound"]);
    exit;
}

// ── SEARCH BY NAME + optional CENTRE ────────────────────────
if (!empty($search_name)) {
    $matches = [];

    foreach (fetchCSV($SHEET_DISPATCHED) as $row) {
        $name_in_sheet   = strtolower(trim($row[4] ?? ""));
        $centre_in_sheet = strtolower(trim($row[3] ?? ""));

        $name_match   = $name_in_sheet === $search_name;
        $centre_match = empty($search_centre) || str_contains($centre_in_sheet, $search_centre);

        if ($name_match && $centre_match) {
            $matches[] = buildRecord($row);
        }
    }

    if (count($matches) === 0) {
        echo json_encode(["status" => "notfound"]);
    } elseif (count($matches) === 1) {
        echo json_encode($matches[0]);
    } else {
        echo json_encode(["multiple" => true, "results" => $matches]);
    }
    exit;
}

echo json_encode(["status" => "notfound"]);
?>