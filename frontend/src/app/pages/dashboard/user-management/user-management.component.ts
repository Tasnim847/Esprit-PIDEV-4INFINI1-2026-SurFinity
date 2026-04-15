// pages/dashboard/user-management/user-management.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, User } from '../../../services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  @Input() type: 'clients' | 'agents-assurance' | 'agents-finance' | 'admins' = 'clients';

  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  showModal = false;
  isEditMode = false;
  selectedUserId: number | null = null;
  formData: any = {};
  selectedFile: File | null = null;
  loading = false;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  getTitle(): string {
    const titles = {
      'clients': 'Gestion des Clients',
      'agents-assurance': 'Gestion des Agents Assurance',
      'agents-finance': 'Gestion des Agents Finance',
      'admins': 'Gestion des Administrateurs'
    };
    return titles[this.type];
  }

  getTypeLabel(): string {
    const labels = {
      'clients': 'Client',
      'agents-assurance': 'Agent Assurance',
      'agents-finance': 'Agent Finance',
      'admins': 'Administrateur'
    };
    return labels[this.type];
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    console.log(`🔄 Chargement des ${this.type}...`);

    const methods = {
      'clients': () => this.adminService.getClients(),
      'agents-assurance': () => this.adminService.getAgentsAssurance(),
      'agents-finance': () => this.adminService.getAgentsFinance(),
      'admins': () => this.adminService.getAdmins()
    };

    methods[this.type]().subscribe({
      next: (data) => {
        console.log(`✅ ${this.type} reçus du backend:`, data);
        this.users = data;
        this.filteredUsers = [...data];
        this.loading = false;
      },
      error: (err) => {
        console.error(`❌ Erreur chargement ${this.type}:`, err);
        this.error = err.message || 'Erreur de chargement';
        this.loading = false;

        if (err.status === 403) {
          this.error = 'Accès non autorisé. Veuillez vous reconnecter.';
        }
      }
    });
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.telephone.includes(this.searchTerm)
    );
  }

  openAddModal() {
    this.isEditMode = false;
    this.formData = {};
    this.selectedFile = null;
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.formData = { ...user };
    delete this.formData.password;
    this.selectedFile = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.formData = {};
    this.selectedFile = null;
  }

  closeModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeModal();
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  saveUser() {
    const formData = new FormData();

    Object.keys(this.formData).forEach(key => {
      if (this.formData[key] && key !== 'photo') {
        formData.append(key, this.formData[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.loading = true;

    const methods = {
      'clients': () => this.isEditMode
        ? this.adminService.updateClient(this.selectedUserId!, formData)
        : this.adminService.addClient(formData),
      'agents-assurance': () => this.isEditMode
        ? this.adminService.updateAgentAssurance(this.selectedUserId!, formData)
        : this.adminService.addAgentAssurance(formData),
      'agents-finance': () => this.isEditMode
        ? this.adminService.updateAgentFinance(this.selectedUserId!, formData)
        : this.adminService.addAgentFinance(formData),
      'admins': () => this.isEditMode
        ? this.adminService.updateAdmin(this.selectedUserId!, formData)
        : this.adminService.addAdmin(formData)
    };

    methods[this.type]().subscribe({
      next: () => {
        console.log('✅ Utilisateur sauvegardé avec succès');
        this.loadUsers();
        this.closeModal();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error saving user', err);
        this.loading = false;
        alert(`Erreur: ${err.message || 'Erreur lors de l\'enregistrement'}`);
      }
    });
  }

  deleteUser(id: number) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet utilisateur ?`)) {
      this.loading = true;
      const methods = {
        'clients': () => this.adminService.deleteClient(id),
        'agents-assurance': () => this.adminService.deleteAgentAssurance(id),
        'agents-finance': () => this.adminService.deleteAgentFinance(id),
        'admins': () => this.adminService.deleteAdmin(id)
      };

      methods[this.type]().subscribe({
        next: () => {
          console.log('✅ Utilisateur supprimé avec succès');
          this.loadUsers();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error deleting user', err);
          this.loading = false;
          alert(`Erreur: ${err.message || 'Erreur lors de la suppression'}`);
        }
      });
    }
  }

  retry() {
    this.loadUsers();
  }
}
