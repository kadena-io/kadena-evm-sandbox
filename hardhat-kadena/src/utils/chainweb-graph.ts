/* *************************************************************************** */
/* Compute Chain Distances */

// Compute shortest path via breadth first search. For small, connected,
// degree-diameter graphs this has acceptable performance. (well, it's bad, but
// not terribly bad)
//
export function distance(
  srcChain: number,
  trgChain: number,
  graph: Record<number, number[]>
) {
  if (srcChain == trgChain) {
    return 0;
  }
  const visited = [srcChain];
  const queue = [[srcChain, 0] as [number, number]];

  while (queue.length > 0) {
    const [cur, d] = queue.shift()!;
    for (const adj of graph[cur]) {
      if (adj == trgChain) {
        return d + 1;
      }
      if (!visited.includes(adj)) {
        visited.push(adj);
        queue.push([adj, d + 1]);
      }
    }
  }
  throw new Error("Chain not found in Chainweb");
}
