const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../Metro-Transit.json');
const outputFile = path.join(__dirname, '../data/graph.json');

// Haversine Formula to calculate distance in km
function getDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
        return 1; // Default weight if coords missing
    }

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    // Return distance, minimum 0.1 to avoid zero-cost loops
    return Math.max(d, 0.1);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Hardcoded Metro Lines (Red, Orange, Blue) with coordinates
const metroLines = {
    "Red Line": [
        { name: "Saddar", lat: 33.59844, lng: 73.04507 },
        { name: "Marir Chowk", lat: 33.60145, lng: 73.04683 },
        { name: "Liaquat Bagh", lat: 33.60577, lng: 73.0499 },
        { name: "Committee Chowk", lat: 33.61211, lng: 73.05473 },
        { name: "Warisc Khan", lat: 33.61847, lng: 73.05955 },
        { name: "Rehmanabad", lat: 33.62483, lng: 73.06437 },
        { name: "6th Road", lat: 33.6312, lng: 73.06919 },
        { name: "Shamsabad", lat: 33.63756, lng: 73.07401 },
        { name: "Faizabad", lat: 33.66682, lng: 73.08816 },
        { name: "IJP", lat: 33.65156, lng: 73.07972 },
        { name: "Potohar", lat: 33.65701, lng: 73.07603 },
        { name: "Khayaban-e-Johar", lat: 33.66246, lng: 73.07233 },
        { name: "Faiz Ahmad Faiz", lat: 33.67931, lng: 73.05161 },
        { name: "Kashmir Highway", lat: 33.68389, lng: 73.04766 },
        { name: "Chaman", lat: 33.68911, lng: 73.04359 },
        { name: "Ibn-e-Sina", lat: 33.69583, lng: 73.03858 },
        { name: "Katchery", lat: 33.71167, lng: 73.03968 },
        { name: "PIMS", lat: 33.70615, lng: 73.05207 },
        { name: "Stock Exchange", lat: 33.70924, lng: 73.05386 },
        { name: "7th Avenue", lat: 33.71233, lng: 73.05565 },
        { name: "Shaheed-e-Millat", lat: 33.71542, lng: 73.05744 },
        { name: "Parade Ground", lat: 33.71851, lng: 73.05923 },
        { name: "Secretariat", lat: 33.7216, lng: 73.06102 }
    ],
    "Orange Line": [
        { name: "Peshawar Mor", lat: 33.65083, lng: 72.98794 },
        { name: "Faiz Ahmad Faiz", lat: 33.67931, lng: 73.05161 },
        { name: "NUST", lat: 33.65616, lng: 72.99355 },
        { name: "Police Foundation", lat: 33.66401, lng: 73.00666 },
        { name: "G-10", lat: 33.66812, lng: 73.012 },
        { name: "G-11", lat: 33.67001, lng: 72.9987 },
        { name: "Golra", lat: 33.68933, lng: 72.98238 },
        { name: "N5", lat: 33.70, lng: 72.97 },
        { name: "Airport", lat: 33.61667, lng: 72.98333 }
    ],
    "Blue Line": [
        { name: "PIMS", lat: 33.70615, lng: 73.05207 },
        { name: "G-7", lat: 33.69967, lng: 73.04819 },
        { name: "G-6", lat: 33.71279, lng: 73.08047 },
        { name: "Melody", lat: 33.71518, lng: 73.08434 },
        { name: "Aabpara", lat: 33.71007, lng: 73.09164 },
        { name: "Ataturk Avenue", lat: 33.71700, lng: 73.09200 },
        { name: "F-6", lat: 33.72400, lng: 73.09000 },
        { name: "F-7", lat: 33.72238, lng: 73.05763 },
        { name: "Blue Area", lat: 33.71500, lng: 73.08500 }
    ]
};

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const routes = data.metro_transit_routes;

    const graph = {
        nodes: {},
        edges: []
    };

    // Helper to add node
    const addNode = (name, lat, lng) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!graph.nodes[id]) {
            graph.nodes[id] = { id, name, lat, lng };
        }
        return id;
    };

    // Helper to add edge with distance
    const addEdge = (fromId, toId, routeName) => {
        const from = graph.nodes[fromId];
        const to = graph.nodes[toId];
        const weight = getDistance(from.lat, from.lng, to.lat, to.lng);

        // Add forward edge
        graph.edges.push({
            from: fromId,
            to: toId,
            route: routeName,
            weight: weight
        });
        // Add reverse edge
        graph.edges.push({
            from: toId,
            to: fromId,
            route: routeName,
            weight: weight
        });
    };

    // Process Feeder Routes from Metro-Transit.json
    routes.forEach(route => {
        const routeId = route.route_id;
        const locations = route.locations;

        for (let i = 0; i < locations.length - 1; i++) {
            const from = locations[i];
            const to = locations[i + 1];

            const fromId = addNode(from.name, from.latitude, from.longitude);
            const toId = addNode(to.name, to.latitude, to.longitude);
            addEdge(fromId, toId, routeId);
        }
    });

    console.log(`Processed ${routes.length} feeder routes from Metro-Transit.json`);

    // Process Hardcoded Metro Lines (Red, Orange, Blue)
    Object.entries(metroLines).forEach(([lineName, stops]) => {
        for (let i = 0; i < stops.length - 1; i++) {
            const from = stops[i];
            const to = stops[i + 1];

            const fromId = addNode(from.name, from.lat, from.lng);
            const toId = addNode(to.name, to.lat, to.lng);
            addEdge(fromId, toId, lineName);
        }
    });

    console.log(`Processed ${Object.keys(metroLines).length} main metro lines`);

    // Manual Aliases for interchange stations
    const aliases = [
        ["pims-hospital", "pims-metro-station"],
        ["pims-metro-station", "pims"],
        ["faizabad", "faizabad-metro-station"],
        ["nust-metro-station", "nust"],
        ["police-foundation-metro-station", "police-foundation"],
        ["g-10-metro-station", "g-10"],
        ["g-11-metro-station", "g-11"],
        ["golra-morh-metro-station", "golra-morh"],
        ["golra-morh", "golra"],
        ["ijp-metro-station", "ijp"],
        ["chaman-metro-station", "chaman"],
        ["ibn-e-sina-metro-station", "ibn-e-sina"]
    ];

    aliases.forEach(([id1, id2]) => {
        if (graph.nodes[id1] && graph.nodes[id2]) {
            // Very low cost for walking between interchanges
            graph.edges.push({ from: id1, to: id2, route: "Walk", weight: 0.05 });
            graph.edges.push({ from: id2, to: id1, route: "Walk", weight: 0.05 });
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(graph, null, 2));
    console.log(`✅ Graph generated with ${Object.keys(graph.nodes).length} nodes and ${graph.edges.length} edges.`);

} catch (err) {
    console.error("❌ Error generating graph:", err);
}
