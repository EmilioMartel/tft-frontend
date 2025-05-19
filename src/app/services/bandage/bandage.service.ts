import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BandageService {

  private readonly apiUrl = 'http://localhost:3000/api/bandage';

  constructor(private http: HttpClient) {}

  getGraphInfo(): Observable<Record<string, string | number>> {
    return this.http.get<Record<string, string | number>>(this.apiUrl);
  }
}
