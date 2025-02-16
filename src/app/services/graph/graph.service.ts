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

  // Inicializamos con null y luego se actualiza a GraphData
  graphData = signal<GraphData | null>(null);

  constructor(private http: HttpClient) {
    this.fetchGraph();
  }

  fetchGraph(): void {
    this.http.get<any>(this.apiUrl).subscribe((data) => {
      console.log('Datos recibidos del backend:', data);

      const nodes: Node[] = Array.isArray(data.nodes) ? data.nodes : [];
      const rawLinks: { source: string; target: string }[] = Array.isArray(data.links) ? data.links : [];

      const nodesMap = new Map(nodes.map((node) => [node.id, node]));

      const processedLinks: Link[] = rawLinks.map((link) => ({
        source: nodesMap.get(link.source)!,
        target: nodesMap.get(link.target)!,
      }));

      console.log('Nodos procesados:', nodes);
      console.log('Links procesados:', processedLinks);

      this.graphData.set({ nodes, links: processedLinks });
    });
  }
}
