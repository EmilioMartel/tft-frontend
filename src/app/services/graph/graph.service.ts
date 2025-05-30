import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Node {
  id: string;
  points: [number, number][];
  x?: number;
  y?: number;
}

export interface Link {
  source: string;
  target: string;
  fromOrient: '+' | '-';
  toOrient:   '+' | '-';
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private readonly graphUrl      = 'http://localhost:3000/api/graph';
  private readonly parsedGfaUrl  = 'http://localhost:3000/api/graph/parsed-gfa';

  graphData = signal<GraphData | null>(null);

  constructor(private http: HttpClient) {}

  uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.graphUrl}/upload`, fd);
  }

  /**
   * Obtiene nodos y enlaces en paralelo, procesa centroides
   * y actualiza la señal `graphData`.
   */
   fetchGraph(): void {
    forkJoin({
      graph:  this.http.get<{ nodes: Node[] }>(this.graphUrl),
      parsed: this.http.get<{ links: any[] }>(this.parsedGfaUrl)
    }).pipe(
      map(({ graph, parsed }) => {
        const nodes = graph.nodes.map(node => {
          const [cx, cy] = this.getCentroid(node.points) ?? [0,0];
          return {
            ...node,
            id: String(node.id).trim(),
            x: cx, y: cy,
            points: node.points.map(
              ([px,py]) => [px - cx, py - cy]
            ) as [number,number][]
          };
        });

        const links: Link[] = parsed.links.map(link => ({
          source:     String(link.from).trim(),
          target:     String(link.to).trim(),
          fromOrient: link.fromOrient,
          toOrient:   link.toOrient
        }));

        return { nodes, links };
      })
    ).subscribe({
      next: data => this.graphData.set(data),
      error: err => console.error('fetchGraph error', err)
    });
  }


  private getCentroid(points: [number, number][]): [number, number] | null {
    if (!points.length) return null;
    const [sx, sy] = points.reduce(
      ([ax, ay], [px, py]) => [ax + px, ay + py],
      [0, 0]
    );
    return [sx / points.length, sy / points.length];
  }
}
