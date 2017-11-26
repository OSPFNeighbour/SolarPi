<?php

$db = new PDO('sqlite:/srv/solarpi.sqlite');

$result = $db->query("SELECT * FROM pdu WHERE timestamp > datetime('now','-36 hour')");

//$result = $db->query("SELECT * FROM voltages ORDER BY id DESC LIMIT 10000");

$datapie = array();

$result->setFetchMode(PDO::FETCH_ASSOC);

while ($row = $result->fetch()) {

extract($row);
$datapie[] = $row;
}

$data = json_encode($datapie);

print($data);
?>
