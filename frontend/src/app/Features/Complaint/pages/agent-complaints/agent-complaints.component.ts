// src/app/Features/Complaint/pages/agent-complaints/agent-complaints.component.ts

import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintService } from '../../../../services/complaint.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-agent-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './agent-complaints.component.html',
  styleUrls: ['./agent-complaints.component.css']
})
export class AgentComplaintsComponent implements OnInit {
  
  complaints: any[] = [];
  selectedComplaint: any = null;
  updateForm: FormGroup;
  showUpdateModal = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  selectedStatus = '';
  currentUser: any = null;
  currentUserRole: string = '';
  private isBrowser: boolean;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.updateForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      status: ['', Validators.required]
    });
  }

  checkAuthentication(): void {
    if (!this.isBrowser) return;
    
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    this.currentUserRole = role || '';
    
    if (!token) {
      this.errorMessage = 'Veuillez vous connecter';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }
    
    if (role !== 'AGENT_ASSURANCE' && role !== 'AGENT_FINANCE') {
      this.errorMessage = 'Accès réservé aux agents';
      setTimeout(() => this.router.navigate(['/']), 2000);
      return;
    }
    
    this.loadCurrentUser();
  }
  
  loadCurrentUser(): void {
    this.isLoading = true;
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.currentUser = user;
        this.loadComplaints();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement user:', err);
        this.errorMessage = 'Erreur de chargement';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  loadComplaints(): void {
    this.isLoading = true;
    console.log('🔍 Chargement des réclamations pour agent...');
    
    let endpoint = '';
    if (this.currentUserRole === 'AGENT_ASSURANCE') {
      endpoint = 'agent-assurance/complaints';
    } else if (this.currentUserRole === 'AGENT_FINANCE') {
      endpoint = 'agent-finance/complaints';
    }
    
    this.complaintService.getComplaintsForAgent(endpoint).subscribe({
      next: (response: any) => {
        let complaintsList: any[] = [];
        
        if (response && response.complaints) {
          complaintsList = response.complaints;
        } else if (Array.isArray(response)) {
          complaintsList = response;
        }
        
        this.complaints = complaintsList.map(c => ({
          ...c,
          status: c.status || 'PENDING'
        }));
        
        console.log(`✅ ${this.complaints.length} réclamation(s) chargée(s)`);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement:', err);
        this.errorMessage = 'Erreur lors du chargement des réclamations';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  get filteredComplaints(): any[] {
    let filtered = this.complaints;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.message?.toLowerCase().includes(term) ||
        c.client?.firstName?.toLowerCase().includes(term) ||
        c.client?.lastName?.toLowerCase().includes(term) ||
        c.client?.email?.toLowerCase().includes(term)
      );
    }
    
    if (this.selectedStatus) {
      filtered = filtered.filter(c => c.status === this.selectedStatus);
    }
    
    return filtered;
  }

  viewDetails(complaint: any): void {
    this.selectedComplaint = complaint;
  }

  closeDetails(): void {
    this.selectedComplaint = null;
  }

  // Ouvre le modal de changement de statut
  openUpdateModal(complaint: any, event: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    console.log('🟢 Ouverture modal changement de statut');
    
    if (!complaint) {
      console.error('❌ Complaint est null');
      this.errorMessage = 'Erreur: réclamation non trouvée';
      return;
    }
    
    // Fermer le modal détails si ouvert
    this.selectedComplaint = null;
    
    // Définir la réclamation pour le modal de statut
    this.complaintForStatus = complaint;
    
    // Mettre à jour le formulaire
    this.updateForm.patchValue({
      status: complaint.status || 'PENDING'
    });
    
    // Afficher le modal
    this.showUpdateModal = true;
    this.cdr.detectChanges();
  }
  
  // Variable pour stocker la réclamation dont on change le statut
  complaintForStatus: any = null;

  // Met à jour le statut
  updateStatus(): void {
    if (this.updateForm.invalid || !this.complaintForStatus) {
      console.log('Formulaire invalide ou pas de réclamation');
      return;
    }

    const complaintId = this.complaintForStatus.id;
    console.log('ID réclamation:', complaintId);
    
    if (!complaintId || complaintId === 0) {
      this.errorMessage = 'Erreur: ID de réclamation invalide';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isLoading = true;
    const newStatus = this.updateForm.get('status')?.value;

    const payload = { status: newStatus };

    this.complaintService.updateComplaintStatus(complaintId, payload).subscribe({
      next: (response: any) => {
        console.log('✅ Statut mis à jour:', response);
        this.successMessage = `Statut changé à ${this.getStatusLabel(newStatus)} !`;
        this.afterUpdate();
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  afterUpdate(): void {
    setTimeout(() => {
      this.loadComplaints();
      this.closeUpdateModal();
      this.isLoading = false;
    }, 500);
    setTimeout(() => this.successMessage = '', 3000);
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.complaintForStatus = null;
    this.updateForm.reset({ status: 'PENDING' });
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'IN_PROGRESS': 'En cours',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Rejeté',
      'CLOSED': 'Fermé'
    };
    return labels[status] || 'En attente';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending',
      'IN_PROGRESS': 'status-progress',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'CLOSED': 'status-closed'
    };
    return classes[status] || 'status-pending';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': '🟡',
      'IN_PROGRESS': '🔵',
      'APPROVED': '🟢',
      'REJECTED': '🔴',
      'CLOSED': '⚫'
    };
    return icons[status] || '🟡';
  }

  formatDate(date: any): string {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAgentType(): string {
    return this.currentUserRole === 'AGENT_ASSURANCE' ? "d'Assurance" : "Financier";
  }
}