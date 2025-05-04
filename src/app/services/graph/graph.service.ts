import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// graph.service.ts
export interface Node {
  id: string;
  points: [number, number][];
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

  constructor(private http: HttpClient) {}
  
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  fetchGraph(): void {
    this.http.get<GraphData>(this.apiUrl).subscribe(({ nodes = [], links = [] }) => {
      const nodesMap = new Map(nodes.map(node => [node.id, node]));
  
      this.graphData.set({
        nodes,
        links: this.getLinks(links, nodesMap)
      });
    });
  }

  private getLinks(links: Link[], nodesMap: Map<string, Node>): Link[] {
    return links.map(link => ({
      source: nodesMap.get(link.source.toString())!,
      target: nodesMap.get(link.target.toString())!,
    }));
  }
}
