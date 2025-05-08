import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Node {
  id: string;
  points: [number, number][];
  x: number;
  y: number;
}


export interface Link {
  source: string;
  target: string;
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

  constructor(private http: HttpClient) {}
  
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  fetchGraph(): void {
    this.http.get<GraphData>(this.apiUrl).subscribe(({ nodes = [], links = [] }) => {
      const processedNodes = nodes.map(node => {
        const centroid = this.getCentroid(node.points);
        const x = centroid?.[0] ?? 0;
        const y = centroid?.[1] ?? 0;
        // Ajustar puntos al centro local del nodo
        const points = node.points.map(([px, py]) => [px - x, py - y]) as [number, number][];
        return { ...node, x, y, points };
      });
  
      this.graphData.set({
        nodes: processedNodes,
        links
      });
    });
  }

  private getCentroid(points: [number, number][]): [number, number] | null {
    if (!Array.isArray(points) || points.length < 3) return null;
    const [x, y] = points.reduce(
      ([sumX, sumY], [px, py]) => [sumX + px, sumY + py],
      [0, 0]
    );
    return [x / points.length, y / points.length];
  }
  

}
