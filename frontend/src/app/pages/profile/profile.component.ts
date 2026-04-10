import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  telephone: string = '';
  role: string = '';
  profilePhoto: string = '';
  currentDate: Date = new Date();

  isEditing: boolean = false;

  // Password change
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Backup for cancel
  private backupData: any = {};

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuth();
    this.loadUserData();
  }

  checkAuth() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/public/login']);
      return;
    }
  }

  loadUserData() {
    this.auth.getMe().subscribe(user => {
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.email = user.email;
      this.telephone = user.telephone;
      this.role = user.role;
      if (user.photo) {
        this.profilePhoto = `http://localhost:8083/uploads/${user.photo}`;
      } else {
        this.profilePhoto = ''; // pas d'image
      }
    });
  }
  getRoleName(): string {
    const roles: { [key: string]: string } = {
      'CLIENT': 'Client',
      'ADMIN': 'Administrateur',
      'AGENT_FINANCE': 'Agent Finance',
      'AGENT_ASSURANCE': 'Agent Assurance'
    };
    return roles[this.role] || this.role;
  }

  enableEditing() {
    this.isEditing = true;
    this.backupData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      telephone: this.telephone
    };
  }

  cancelEditing() {
    this.isEditing = false;
    this.firstName = this.backupData.firstName;
    this.lastName = this.backupData.lastName;
    this.email = this.backupData.email;
    this.telephone = this.backupData.telephone;
  }


  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (this.newPassword.length < 6) {
      alert('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Simuler l'envoi au backend
    console.log('Changement de mot de passe:', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    });

    alert('✅ Mot de passe modifié avec succès !');

    // Reset form
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhoto = e.target.result;
        localStorage.setItem('profilePhoto', this.profilePhoto);
        alert('✅ Photo de profil mise à jour !');
      };
      reader.readAsDataURL(file);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  updateProfile() {
    const data = {
      firstName: this.firstName,
      lastName: this.lastName,
      telephone: this.telephone
    };

    this.auth.updateMe(data).subscribe({
      next: () => {
        alert("Profil mis à jour");

        // refresh data from backend
        this.loadUserData();

        this.isEditing = false;
      },
      error: (err) => {
        console.error(err);
        alert("Erreur update");
      }
    });
  }
}
