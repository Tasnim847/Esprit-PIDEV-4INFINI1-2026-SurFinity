import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-profile.component.html',
  styleUrls: ['./dashboard-profile.component.css']
})
export class DashboardProfileComponent implements OnInit {
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
    this.auth.getMe().subscribe({
      next: (user) => {
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.telephone = user.telephone;
        this.role = user.role;
        if (user.photo) {
          this.profilePhoto = `http://localhost:8083/uploads/${user.photo}`;
        } else {
          this.profilePhoto = '';
        }
      },
      error: (err) => {
        console.error('Error loading user data:', err);
      }
    });
  }

  getRoleName(): string {
    const roles: { [key: string]: string } = {
      'CLIENT': 'Client',
      'ADMIN': 'Administrator',
      'AGENT_FINANCE': 'Finance Agent',
      'AGENT_ASSURANCE': 'Insurance Agent'
    };
    return roles[this.role] || this.role;
  }

  getRoleClass(): string {
    const roleClasses: { [key: string]: string } = {
      'CLIENT': 'role-client',
      'ADMIN': 'role-admin',
      'AGENT_FINANCE': 'role-finance',
      'AGENT_ASSURANCE': 'role-assurance'
    };
    return roleClasses[this.role] || 'role-default';
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
      alert('❌ Passwords do not match');
      return;
    }

    if (this.newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters');
      return;
    }

    const role = this.auth.getRole();
    const userId = this.auth.getUserId();

    const request = {
      id: userId,
      oldPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.auth.changePassword(role, request).subscribe({
      next: () => {
        alert('✅ Password changed successfully');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: () => {
        alert('❌ Error or incorrect current password');
      }
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Here you would typically upload the file to your backend
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhoto = e.target.result;
        localStorage.setItem('profilePhoto', this.profilePhoto);
        alert('✅ Profile photo updated!');
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
        alert('✅ Profile updated successfully');
        this.loadUserData();
        this.isEditing = false;
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error updating profile');
      }
    });
  }
}
