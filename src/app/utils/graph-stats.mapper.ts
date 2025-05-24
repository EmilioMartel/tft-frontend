export interface GraphStats {
  connectedComponents: number;
  deadEnds: number;
  edgeCount: number;
  estimatedSequenceLength: number;
  largestComponent: number;
  largestEdgeOverlap: number;
  longestNode: number;
  lowerQuartileNode: number;
  medianDepth: number;
  medianNode: number;
  n50: number;
  nodeCount: number;
  percentageDeadEnds: number;
  shortestNode: number;
  smallestEdgeOverlap: number;
  totalLength: number;
  totalLengthNoOverlaps: number;
  totalLengthOrphanedNodes: number;
  upperQuartileNode: number;
}

export function mapGraphStats(raw: Record<string, string | number>): GraphStats {
  return {
    connectedComponents: Number(raw["Connected components"]),
    deadEnds: Number(raw["Dead ends"]),
    edgeCount: Number(raw["Edge count"]),
    estimatedSequenceLength: Number(raw["Estimated sequence length (bp)"]),
    largestComponent: Number(raw["Largest component (bp)"]),
    largestEdgeOverlap: Number(raw["Largest edge overlap (bp)"]),
    longestNode: Number(raw["Longest node (bp)"]),
    lowerQuartileNode: Number(raw["Lower quartile node (bp)"]),
    medianDepth: Number(raw["Median depth"]),
    medianNode: Number(raw["Median node (bp)"]),
    n50: Number(raw["N50 (bp)"]),
    nodeCount: Number(raw["Node count"]),
    percentageDeadEnds: parseFloat(String(raw["Percentage dead ends"]).replace('%', '')),
    shortestNode: Number(raw["Shortest node (bp)"]),
    smallestEdgeOverlap: Number(raw["Smallest edge overlap (bp)"]),
    totalLength: Number(raw["Total length (bp)"]),
    totalLengthNoOverlaps: Number(raw["Total length no overlaps (bp)"]),
    totalLengthOrphanedNodes: Number(raw["Total length orphaned nodes (bp)"]),
    upperQuartileNode: Number(raw["Upper quartile node (bp)"]),
  };
}
export function mapGraphStatsToDisplay(stats: GraphStats): Record<string, string | number> {
  return {
    "Connected components": stats.connectedComponents,
    "Dead ends": stats.deadEnds,
    "Edge count": stats.edgeCount,
    "Estimated sequence length (bp)": stats.estimatedSequenceLength,
    "Largest component (bp)": stats.largestComponent,
    "Largest edge overlap (bp)": stats.largestEdgeOverlap,
    "Longest node (bp)": stats.longestNode,
    "Lower quartile node (bp)": stats.lowerQuartileNode,
    "Median depth": stats.medianDepth,
    "Median node (bp)": stats.medianNode,
    "N50 (bp)": stats.n50,
    "Node count": stats.nodeCount,
    "Percentage dead ends": `${stats.percentageDeadEnds}%`,
    "Shortest node (bp)": stats.shortestNode,
    "Smallest edge overlap (bp)": stats.smallestEdgeOverlap,
    "Total length (bp)": stats.totalLength,
    "Total length no overlaps (bp)": stats.totalLengthNoOverlaps,
    "Total length orphaned nodes (bp)": stats.totalLengthOrphanedNodes,
    "Upper quartile node (bp)": stats.upperQuartileNode
  };
}