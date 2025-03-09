import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Node {
  id: string;
  x: number;
  y: number;
}

export interface Link {
  source: Node;
  target: Node;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  private apiUrl = 'http://localhost:3000/api/graph';

  graphData = signal<GraphData | null>(null);

  constructor(private http: HttpClient) {
    this.fetchGraph();
  }

  fetchGraph(): void {
    this.http.get<GraphData>(this.apiUrl).subscribe(({ nodes = [], links = [] }) => {
      const nodesMap = new Map(nodes.map(node => [node.id, node]));
  
      this.graphData.set({
        nodes,
        links: links.map(link => ({
          source: nodesMap.get(link.source.toString())!,
          target: nodesMap.get(link.target.toString())!,
        })),
      });
    });
  }
  
}
