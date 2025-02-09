import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  private apiUrl = 'http://localhost:3000/api/graph';

  graphData = signal<any | null>(null);

  constructor(private http: HttpClient) {
    this.fetchGraph();
  }

  fetchGraph(): void {
    this.http.get<any>(this.apiUrl).subscribe((data) => {
      this.graphData.set(data);  
    });
  }
}
