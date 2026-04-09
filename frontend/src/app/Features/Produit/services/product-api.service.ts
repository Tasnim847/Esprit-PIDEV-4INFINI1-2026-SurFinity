import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {

  private baseUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  getActiveProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/activeProducts`);
  }
}