import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BandageService {

  private readonly apiUrl = `${environment.HOST_NAME}:${environment.PORT}/api/bandage`;

  constructor(private http: HttpClient) {}

  getGraphInfo(): Observable<Record<string, string | number>> {
    return this.http.get<Record<string, string | number>>(this.apiUrl);
  }

  getGraphLayout(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/layout`);
  }
}
