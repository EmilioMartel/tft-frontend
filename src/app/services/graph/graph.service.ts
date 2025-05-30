import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

/** Nodo tal cual viene de /api/graph */
export interface Node {
  id: string;
  points: [number, number][];
  x?: number;
  y?: number;
}

/** Enlace tal cual viene de /api/parsed-gfa */
export interface Link {
  source: string;
  target: string;
  fromOrient: '+' | '-';
  toOrient:   '+' | '-';
}


/** Grafo completo para dibujar */
export interface GraphData {
  nodes: Node[];
  links: Link[];
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private readonly graphUrl      = 'http://localhost:3000/api/graph';
  private readonly parsedGfaUrl  = 'http://localhost:3000/api/graph/parsed-gfa';

  /** Señal con nodos+enlaces listos para el componente */
  graphData = signal<GraphData | null>(null);

  constructor(private http: HttpClient) {}

  /** Subida de archivo idéntica a la tuya */
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
        // 1️⃣ Nodes igual que antes
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

        // 2️⃣ Links: renombramos from/to → source/target y pasamos orientaciones
        const links: Link[] = parsed.links.map(l => ({
          source:     String(l.from).trim(),
          target:     String(l.to).trim(),
          fromOrient: l.fromOrient,
          toOrient:   l.toOrient
        }));

        return { nodes, links };
      })
    ).subscribe({
      next: data => this.graphData.set(data),
      error: err => console.error('fetchGraph error', err)
    });
  }


  /** Centroid simple de un array de puntos */
  private getCentroid(points: [number, number][]): [number, number] | null {
    if (!points.length) return null;
    const [sx, sy] = points.reduce(
      ([ax, ay], [px, py]) => [ax + px, ay + py],
      [0, 0]
    );
    return [sx / points.length, sy / points.length];
  }
}
