/**
 * Dijkstra's Algorithm Implementation for UniGo
 * With Transfer Penalty to prefer route continuity
 * Exposed as a global object UniGoPathfinder
 */

(function (global) {

    class PriorityQueue {
        constructor() {
            this.values = [];
        }

        enqueue(val, priority) {
            this.values.push({ val, priority });
            this.sort();
        }

        dequeue() {
            return this.values.shift();
        }

        sort() {
            this.values.sort((a, b) => a.priority - b.priority);
        }

        isEmpty() {
            return this.values.length === 0;
        }
    }

    function findShortestPath(graph, startNodeId, endNodeId) {
        if (!graph || !graph.nodes || !graph.nodes[startNodeId] || !graph.nodes[endNodeId]) {
            console.warn(`[UniGoPathfinder] Invalid graph or nodes: ${startNodeId} -> ${endNodeId}`);
            return null;
        }

        const distances = {}; // Key: "nodeId:routeId"
        const previous = {};  // Key: "nodeId:routeId"
        const pq = new PriorityQueue();
        const TRANSFER_PENALTY = 3.0; // 3km penalty for each route transfer

        // Initialize with START state
        const startState = `${startNodeId}:START`;
        distances[startState] = 0;
        pq.enqueue({ id: startNodeId, route: "START" }, 0);

        let finalState = null;

        while (!pq.isEmpty()) {
            const { val: { id: currentId, route: currentRoute } } = pq.dequeue();
            const currentState = `${currentId}:${currentRoute}`;

            // If we found a path to the end node (via any route), we are done
            // Dijkstra guarantees the first time we pop a state with id === endNodeId,
            // that is the shortest path to endNodeId
            if (currentId === endNodeId) {
                finalState = currentState;
                break;
            }

            if (distances[currentState] === Infinity) break;

            // Find neighbors
            const neighbors = graph.edges.filter(e => e.from === currentId);
            for (let neighbor of neighbors) {
                let edgeCost = neighbor.weight;

                // Add transfer penalty if switching routes
                if (currentRoute !== "START" && currentRoute !== neighbor.route) {
                    if (neighbor.route === "Walk") {
                        // No penalty for starting to walk
                    } else {
                        // Penalty for switching to a new route (vehicle)
                        edgeCost += TRANSFER_PENALTY;
                    }
                }

                const neighborState = `${neighbor.to}:${neighbor.route}`;
                const currentDist = distances[currentState];
                const candidateDist = currentDist + edgeCost;

                if (distances[neighborState] === undefined || candidateDist < distances[neighborState]) {
                    distances[neighborState] = candidateDist;
                    previous[neighborState] = { id: currentId, route: currentRoute, edgeRoute: neighbor.route };
                    pq.enqueue({ id: neighbor.to, route: neighbor.route }, candidateDist);
                }
            }
        }

        if (!finalState) return null; // No path found

        // Reconstruct path
        const path = [];
        let currState = finalState;
        while (currState) {
            const prev = previous[currState];
            if (prev) {
                const u = prev.id;
                const v = currState.split(':')[0]; // Extract node ID

                path.unshift({
                    from: graph.nodes[u].name,
                    to: graph.nodes[v].name,
                    route: prev.edgeRoute
                });

                currState = `${prev.id}:${prev.route}`;
            } else {
                currState = null;
            }
        }
        return path;
    }

    // Helper to format the path into human-readable steps
    function formatPath(path) {
        if (!path) return [];

        // Merge consecutive steps of the same route
        const mergedPath = [];
        if (path.length === 0) return [];

        let currentStep = {
            route: path[0].route,
            from: path[0].from,
            to: path[0].to
        };

        for (let i = 1; i < path.length; i++) {
            if (path[i].route === currentStep.route) {
                // Extend current step
                currentStep.to = path[i].to;
            } else {
                // Push current and start new
                mergedPath.push(`${currentStep.route} from ${currentStep.from} → ${currentStep.to}`);
                currentStep = {
                    route: path[i].route,
                    from: path[i].from,
                    to: path[i].to
                };
            }
        }
        mergedPath.push(`${currentStep.route} from ${currentStep.from} → ${currentStep.to}`);
        return mergedPath;
    }

    // Expose to global scope
    global.UniGoPathfinder = {
        findShortestPath,
        formatPath
    };

})(typeof window !== 'undefined' ? window : this);
