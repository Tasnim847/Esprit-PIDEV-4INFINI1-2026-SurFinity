import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ContractService, CashApprovalRequest } from '../../../services/contract.service';
import { AuthService } from '../../../../../services/auth.service';

@Component({
  selector: 'app-agent-cash-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-cash-approvals.component.html',
  styleUrls: ['./agent-cash-approvals.component.css']
})
export class AgentCashApprovalsComponent implements OnInit, OnDestroy {
  pendingRequests: CashApprovalRequest[] = [];
  allRequests: CashApprovalRequest[] = [];
  filteredRequests: CashApprovalRequest[] = [];
  currentFilter: string = 'all';
  searchTerm: string = '';
  private refreshInterval: any;
  processingRequestId: number | null = null;
  agentId: number = 0;
  isLoading: boolean = false;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private contractService: ContractService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getAgentId();
    this.loadRequestsFromBackend();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  getAgentId(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.agentId = payload.id || payload.userId || 0;
        console.log('✅ Agent ID récupéré:', this.agentId);
      } catch (e) {
        console.error('Erreur décodage token', e);
      }
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadRequestsFromBackend();
    }, 5000);
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadRequestsFromBackend(): void {
    if (!this.agentId) {
      console.warn('⚠️ Agent ID non disponible');
      return;
    }
    
    this.isLoading = true;
    console.log('📡 Chargement des demandes pour l\'agent:', this.agentId);
    
    this.contractService.getPendingCashRequests(this.agentId).subscribe({
      next: (response) => {
        console.log('📦 Réponse reçue:', response);
        
        if (response && Array.isArray(response)) {
          const oldPendingCount = this.pendingRequests.length;
          this.allRequests = response;
          this.pendingRequests = this.allRequests.filter(r => r.status === 'PENDING');
          this.applyFilters();
          
          console.log(`📊 ${this.allRequests.length} demandes totales, ${this.pendingRequests.length} en attente`);
          
          // Notification sonore si nouvelle demande
          if (this.pendingRequests.length > oldPendingCount && oldPendingCount > 0) {
            this.playNotificationSound();
            this.toastr.info(
              `Nouvelle demande de paiement reçue`, 
              'Nouvelle demande CASH',
              { timeOut: 5000, positionClass: 'toast-top-right' }
            );
          }
        } else {
          console.warn('⚠️ Réponse inattendue:', response);
          this.allRequests = [];
          this.pendingRequests = [];
          this.filteredRequests = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement demandes:', err);
        this.toastr.error('Erreur lors du chargement des demandes', 'Erreur');
        this.isLoading = false;
      }
    });
  }

  playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/notification.mp3');
      audio.play().catch(e => console.log('Son non joué:', e));
    } catch (e) {
      console.log('Erreur lecture son:', e);
    }
  }

  applyFilters(): void {
    let filtered = [...this.allRequests];

    if (this.currentFilter !== 'all') {
      const filterUpper = this.currentFilter.toUpperCase();
      filtered = filtered.filter(r => r.status === filterUpper);
    }

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.clientName?.toLowerCase().includes(term) || false) ||
        (r.clientEmail?.toLowerCase().includes(term) || false) ||
        (r.contractId?.toString().includes(term) || false) ||
        (r.amount?.toString().includes(term) || false)
      );
    }

    this.filteredRequests = filtered;
  }

  get approvedCount(): number {
    return this.allRequests.filter(r => r.status === 'APPROVED').length;
  }

  get rejectedCount(): number {
    return this.allRequests.filter(r => r.status === 'REJECTED').length;
  }

  getPercentage(count: number): number {
    if (this.allRequests.length === 0) return 0;
    return Math.round((count / this.allRequests.length) * 100);
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  approveRequest(request: CashApprovalRequest): void {
    if (this.processingRequestId) {
      this.toastr.warning('Un traitement est déjà en cours', 'Attention');
      return;
    }
    
    this.processingRequestId = request.id;
    console.log('✅ Approbation de la demande:', request.id);
    
    this.contractService.approveCashRequest(request.id).subscribe({
      next: (response) => {
        this.toastr.success(`Paiement de ${request.amount} DT approuvé pour ${request.clientName}`, 'Approuvé');
        console.log('✅ Demande approuvée avec succès');
        this.processingRequestId = null;
        this.loadRequestsFromBackend();
      },
      error: (err) => {
        console.error('❌ Erreur lors de l\'approbation:', err);
        this.toastr.error(`Erreur: ${err.message || 'Échec de l\'approbation'}`, 'Erreur');
        this.processingRequestId = null;
      }
    });
  }

  rejectRequest(request: CashApprovalRequest): void {
    if (this.processingRequestId) {
      this.toastr.warning('Un traitement est déjà en cours', 'Attention');
      return;
    }
    
    const reason = prompt('Raison du refus (optionnel):');
    if (reason === null) return;
    
    this.processingRequestId = request.id;
    console.log('❌ Refus de la demande:', request.id);
    
    this.contractService.rejectCashRequest(request.id, reason || 'Refusé par l\'agent').subscribe({
      next: (response) => {
        this.toastr.warning(`Paiement de ${request.amount} DT refusé pour ${request.clientName}`, 'Refusé');
        console.log('❌ Demande refusée');
        this.processingRequestId = null;
        this.loadRequestsFromBackend();
      },
      error: (err) => {
        console.error('❌ Erreur lors du refus:', err);
        this.toastr.error(`Erreur: ${err.message || 'Échec du refus'}`, 'Erreur');
        this.processingRequestId = null;
      }
    });
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'PENDING': return 'En attente';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Refusé';
      case 'FAILED': return 'Échoué';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refresh(): void {
    this.loadRequestsFromBackend();
  }
}