export type NodeId = number | string;

export interface GraphEdge {
  from: NodeId;
  to: NodeId;
  weight: number;
}

export interface GraphData {
  nodes: NodeId[];
  edges: GraphEdge[];
  directed: boolean;
}

export interface ShortestPathResult {
  path: NodeId[];
  total_cost: number;
}

export interface ShortestTourResult {
  tour: NodeId[];
  total_cost: number;
  segments: NodeId[][];
}
