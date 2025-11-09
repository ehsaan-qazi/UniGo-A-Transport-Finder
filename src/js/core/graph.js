/**
 * UniGo Graph Data Structure
 * Represents the metro network as a graph for pathfinding algorithms
 * 
 * TODO: This will be fully implemented in future phases
 * when dynamic pathfinding with A* algorithm is added.
 */

/**
 * Node class representing a metro stop
 */
class Node {
  constructor(id, name, coordinates, lines = []) {
    this.id = id;
    this.name = name;
    this.coordinates = coordinates; // {lat, lng}
    this.lines = lines; // Array of line names this stop belongs to
    this.isTransfer = lines.length > 1;
  }

  /**
   * Calculate distance to another node
   * @param {Node} otherNode
   * @returns {number} Distance in kilometers
   */
  distanceTo(otherNode) {
    return UniGoHelpers.calculateDistance(this.coordinates, otherNode.coordinates);
  }
}

/**
 * Edge class representing a connection between two stops
 */
class Edge {
  constructor(from, to, line, distance = null, travelTime = null) {
    this.from = from; // Node ID
    this.to = to; // Node ID
    this.line = line; // Line name (e.g., "Red Line", "FR-01")
    this.distance = distance; // Distance in km (calculated if null)
    this.travelTime = travelTime; // Travel time in minutes (estimated if null)
    this.weight = this.calculateWeight();
  }

  /**
   * Calculate edge weight for pathfinding
   * Weight is based on distance and transfer penalties
   * @returns {number} Edge weight
   */
  calculateWeight() {
    // Base weight is distance or travel time
    let weight = this.travelTime || this.distance || 1;
    
    // TODO: Add transfer penalties, waiting times, etc.
    // This will be refined when A* is implemented
    
    return weight;
  }
}

/**
 * Graph class representing the entire metro network
 */
class MetroGraph {
  constructor() {
    this.nodes = new Map(); // Map of node ID to Node object
    this.edges = new Map(); // Map of node ID to array of edges
    this.lines = new Map(); // Map of line name to array of node IDs
  }

  /**
   * Add a node to the graph
   * @param {Node} node
   */
  addNode(node) {
    this.nodes.set(node.id, node);
    
    // Track nodes by line
    node.lines.forEach(line => {
      if (!this.lines.has(line)) {
        this.lines.set(line, []);
      }
      this.lines.get(line).push(node.id);
    });

    UniGoHelpers.debug(`Added node: ${node.name} (${node.id})`);
  }

  /**
   * Add an edge to the graph
   * @param {Edge} edge
   */
  addEdge(edge) {
    if (!this.edges.has(edge.from)) {
      this.edges.set(edge.from, []);
    }
    this.edges.get(edge.from).push(edge);

    UniGoHelpers.debug(`Added edge: ${edge.from} -> ${edge.to} via ${edge.line}`);
  }

  /**
   * Add a bidirectional edge
   * @param {string} nodeId1
   * @param {string} nodeId2
   * @param {string} line
   * @param {number} distance
   * @param {number} travelTime
   */
  addBidirectionalEdge(nodeId1, nodeId2, line, distance = null, travelTime = null) {
    // Calculate distance if not provided
    if (!distance && this.nodes.has(nodeId1) && this.nodes.has(nodeId2)) {
      const node1 = this.nodes.get(nodeId1);
      const node2 = this.nodes.get(nodeId2);
      distance = node1.distanceTo(node2);
    }

    // Calculate travel time if not provided
    if (!travelTime && distance) {
      travelTime = UniGoHelpers.estimateTravelTime(distance);
    }

    this.addEdge(new Edge(nodeId1, nodeId2, line, distance, travelTime));
    this.addEdge(new Edge(nodeId2, nodeId1, line, distance, travelTime));
  }

  /**
   * Get neighbors of a node
   * @param {string} nodeId
   * @returns {Array<Edge>} Array of edges
   */
  getNeighbors(nodeId) {
    return this.edges.get(nodeId) || [];
  }

  /**
   * Get node by ID
   * @param {string} nodeId
   * @returns {Node|undefined} Node or undefined
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all stops on a specific line
   * @param {string} lineName
   * @returns {Array<Node>} Array of nodes
   */
  getStopsOnLine(lineName) {
    const nodeIds = this.lines.get(lineName) || [];
    return nodeIds.map(id => this.nodes.get(id)).filter(Boolean);
  }

  /**
   * Build graph from stops data
   * @param {Object} stopsData - Data from stops.json
   */
  buildFromStopsData(stopsData) {
    if (!stopsData || !stopsData.stops) {
      console.warn('[UniGo] No stops data provided to build graph');
      return;
    }

    // Add all nodes
    stopsData.stops.forEach(stopData => {
      const node = new Node(
        stopData.id,
        stopData.name,
        stopData.coordinates,
        stopData.lines
      );
      this.addNode(node);
    });

    // Add edges based on route definitions
    if (stopsData.routes) {
      // Red Line
      if (stopsData.routes['red-line']) {
        this.connectStopsInSequence(stopsData.routes['red-line'], 'Red Line');
      }

      // Orange Line
      if (stopsData.routes['orange-line']) {
        this.connectStopsInSequence(stopsData.routes['orange-line'], 'Orange Line');
      }

      // Green Feeders
      if (stopsData.routes['green-feeders']) {
        Object.entries(stopsData.routes['green-feeders']).forEach(([feederCode, stops]) => {
          this.connectStopsInSequence(stops, `Green Feeder ${feederCode}`);
        });
      }
    }

    UniGoHelpers.debug(`Graph built: ${this.nodes.size} nodes, ${Array.from(this.edges.values()).flat().length} edges`);
  }

  /**
   * Connect stops in a sequence (for a line route)
   * @param {Array<string>} stopIds - Array of stop IDs in order
   * @param {string} lineName - Name of the line
   */
  connectStopsInSequence(stopIds, lineName) {
    for (let i = 0; i < stopIds.length - 1; i++) {
      this.addBidirectionalEdge(stopIds[i], stopIds[i + 1], lineName);
    }
  }

  /**
   * Get graph statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      nodes: this.nodes.size,
      edges: Array.from(this.edges.values()).flat().length,
      lines: this.lines.size,
      transferStations: Array.from(this.nodes.values()).filter(n => n.isTransfer).length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Node, Edge, MetroGraph };
}

