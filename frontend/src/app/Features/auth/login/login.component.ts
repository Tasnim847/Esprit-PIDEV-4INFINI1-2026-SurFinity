import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onLogin() {
    // Validation des champs
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        console.log('Réponse du backend:', res);
        this.isLoading = false;

        // Sauvegarder la session avec les infos utilisateur
        // Supposons que votre backend retourne aussi firstName, lastName et email
        const token = res.token;
        const role = res.role;
        const firstName = res.firstName || '';  // À adapter selon votre réponse backend
        const lastName = res.lastName || '';    // À adapter selon votre réponse backend
        const userEmail = res.email || this.email;

        // Stocker dans localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('lastName', lastName);
        localStorage.setItem('userEmail', userEmail);

        // Redirection selon le rôle
        if (role === 'ADMIN') {
          this.router.navigate(['/backoffice']);
        }
        else if (
          role === 'CLIENT' ||
          role === 'AGENT_ASSURANCE' ||
          role === 'AGENT_FINANCE'
        ) {
          this.router.navigate(['/public/home']);
        }
        else {
          this.router.navigate(['/public/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Gestion des erreurs plus précise
        if (err.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 404) {
          this.errorMessage = 'Service indisponible, veuillez réessayer plus tard';
        } else {
          this.errorMessage = err.error?.message || 'Une erreur est survenue';
        }
        console.error('Login error:', err);
      }
    });
  }
}
