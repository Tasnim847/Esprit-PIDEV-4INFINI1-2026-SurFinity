import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Compensation } from '../../../../shared';
import { CompensationService } from '../../services/compensation.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-all-compensations',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './list-all-compensations.component.html',
  styleUrl: './list-all-compensations.component.css'
})
export class ListAllCompensationsComponent implements OnInit {
  
  compensations: Compensation[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Pour le filtrage
  filterStatus: string = '';
  searchTerm: string = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  constructor(
    private compensationService: CompensationService,
    private toastr: ToastrService
  ) {}
  
  ngOnInit(): void {
    this.loadAllCompensations();
  }
  
  loadAllCompensations(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.compensationService.getAllCompensations().subscribe({
      next: (data) => {
        this.compensations = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement:', err);
        this.errorMessage = 'Impossible de charger les compensations. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }
  
  // Obtenir le libellé du statut
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'En attente',
      'CALCULATED': 'Calculée',
      'PAID': 'Payée',
      'CANCELLED': 'Annulée'
    };
    return statusMap[status] || status;
  }
  
  // Obtenir la classe CSS pour le badge de statut
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'badge-warning',
      'CALCULATED': 'badge-info',
      'PAID': 'badge-success',
      'CANCELLED': 'badge-danger'
    };
    return classMap[status] || 'badge-secondary';
  }
  
  // Formater la date
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Formater le montant
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '0,00 DT';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' DT';
  }
  
  // Filtrer les compensations
  get filteredCompensations(): Compensation[] {
    let filtered = [...this.compensations];
    
    if (this.filterStatus) {
      filtered = filtered.filter(c => c.status === this.filterStatus);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.compensationId.toString().includes(term) ||
        c.message?.toLowerCase().includes(term) ||
        c.riskLevel?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }
  
  // Pagination
  get paginatedCompensations(): Compensation[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCompensations.slice(start, end);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredCompensations.length / this.itemsPerPage);
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Actions admin
  viewDetails(compensation: Compensation): void {
    // Utiliser Toastr pour afficher les détails ou ouvrir un modal
    this.toastr.info(`Compensation #${compensation.compensationId}
    Montant: ${this.formatAmount(compensation.amount)}
    Reste à charge: ${this.formatAmount(compensation.clientOutOfPocket)}
    Statut: ${compensation.status}
    Risque: ${compensation.riskLevel || 'N/A'}`, 'Détails', {
      timeOut: 5000,
      enableHtml: true
    });
  }
  
  // ✅ CORRIGÉ: Utiliser la bonne méthode pour marquer comme payée
  markAsPaid(compensation: Compensation): void {
    if (confirm(`Confirmer le paiement de la compensation #${compensation.compensationId} ?`)) {
      // Utiliser l'endpoint existant /{id}/pay
      this.compensationService.markAsPaid(compensation.compensationId).subscribe({
        next: (response) => {
          this.successMessage = `Compensation #${compensation.compensationId} marquée comme payée`;
          this.toastr.success(`Compensation #${compensation.compensationId} marquée comme payée`);
          this.loadAllCompensations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => {
          console.error('Erreur:', err);
          this.errorMessage = err.error?.error || 'Erreur lors du paiement';
          this.toastr.error(this.errorMessage);
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }
  
  recalculate(compensation: Compensation): void {
    if (compensation.claim?.claimId) {
      if (confirm(`Recalculer la compensation #${compensation.compensationId} ?`)) {
        this.compensationService.recalculateCompensation(compensation.claim.claimId).subscribe({
          next: (response) => {
            this.successMessage = `Compensation #${compensation.compensationId} recalculée`;
            this.toastr.success(`Compensation #${compensation.compensationId} recalculée`);
            this.loadAllCompensations();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err: any) => {
            console.error('Erreur:', err);
            this.errorMessage = err.error?.error || 'Erreur lors du recalcul';
            this.toastr.error(this.errorMessage);
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
      }
    } else {
      this.toastr.warning('Impossible de recalculer: claim ID non trouvé');
    }
  }
  
  // Statistiques
  getTotalAmount(): number {
    return this.filteredCompensations.reduce((sum, c) => sum + (c.amount || 0), 0);
  }
  
  getAverageAmount(): number {
    if (this.filteredCompensations.length === 0) return 0;
    return this.getTotalAmount() / this.filteredCompensations.length;
  }
  
  getCountByStatus(status: string): number {
    return this.filteredCompensations.filter(c => c.status === status).length;
  }
}