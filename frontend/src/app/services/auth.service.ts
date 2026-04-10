import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = 'http://localhost:8083/api/auth';

  constructor(private http: HttpClient) { }

  login(data: { email: string, password: string }): Observable<any> {
    return this.http.post<any>(`${this.API}/login`, data);
  }

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.API}/register`, formData, {
      responseType: 'text' as 'json'
    });
  }
  getMe(): Observable<any> {
    return this.http.get(`${this.API}/me`);
  }

  updateMe(data: any) {
    return this.http.put(
      'http://localhost:8083/api/auth/update-me',
      data,
      { responseType: 'text' }
    );
  }
  // Vérifier si on est dans le navigateur
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  saveSession(token: string, role: string) {
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
    }
  }

  getRole(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('role');
    }
    return null;
  }

  isLoggedIn(): boolean {
    if (this.isBrowser()) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.clear();
    }
  }
}
