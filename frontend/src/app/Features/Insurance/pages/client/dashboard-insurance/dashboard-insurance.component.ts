import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { ContractService } from '../../../services/contract.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ClaimDTO } from '../../../../../shared/dto/claim-dto.model';
import { ClaimsService } from '../../../../Claims/services/claims.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-insurance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-insurance.component.html',
  styleUrls: ['./dashboard-insurance.component.css']
})
export class DashboardInsuranceComponent implements OnInit {
  // Données principales
  contracts: any[] = [];
  isLoading = true;
  
  // Statistiques globales
  stats = {
    totalContracts: 0,
    activeContracts: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalPremium: 0,
    completionRate: 0
  };
  
  // Statistiques par statut
  statusStats = {
    ACTIVE: 0,
    INACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    EXPIRED: 0
  };
  
  // Statistiques par fréquence de paiement
  frequencyStats = {
    MONTHLY: 0,
    SEMI_ANNUAL: 0,
    ANNUAL: 0
  };
  
  // Claims - utilisant ClaimDTO du service
  claimsByContract: Map<number, ClaimDTO[]> = new Map();
  allClaims: ClaimDTO[] = [];
  totalClaims = 0;
  pendingClaims = 0;
  approvedClaims = 0;
  rejectedClaims = 0;
  compensatedClaims = 0;
  
  // Stats par statut de claim
  claimsStatusStats = {
    DECLARED: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    COMPENSATED: 0
  };
  
  claimsAmountByStatus = {
    DECLARED: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    COMPENSATED: 0
  };
  
  // Graphiques
  statusChart: Chart | null = null;
  frequencyChart: Chart | null = null;
  paymentProgressChart: Chart | null = null;
  claimsStatusChart: Chart | null = null;
  claimsAmountChart: Chart | null = null;
  
  // Contrat sélectionné
  selectedContract: any = null;
  
  constructor(
    private contractService: ContractService,
    private claimsService: ClaimsService,
    private toastr: ToastrService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  loadDashboardData(): void {
    this.isLoading = true;
    
    // Charger les contrats et les claims en parallèle
    Promise.all([
      this.loadContracts(),
      this.loadClaims()
    ]).then(() => {
      this.calculateStats();
      this.processClaimsData();
      setTimeout(() => {
        this.initCharts();
        this.initClaimsCharts();
      }, 100);
      this.isLoading = false;
    }).catch((err) => {
      console.error('Erreur:', err);
      this.toastr.error('Erreur lors du chargement des données');
      this.isLoading = false;
    });
  }
  
  loadContracts(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.contractService.getMyContracts().subscribe({
        next: (contracts) => {
          this.contracts = contracts;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement contrats:', err);
          reject(err);
        }
      });
    });
  }
  
  loadClaims(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.claimsService.getMyClaims().subscribe({
        next: (claims: ClaimDTO[]) => {
          this.allClaims = claims;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement claims:', err);
          // Ne pas bloquer le dashboard si les claims échouent
          this.allClaims = [];
          resolve();
        }
      });
    });
  }
  
  calculateStats(): void {
    this.stats = {
      totalContracts: 0,
      activeContracts: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalPremium: 0,
      completionRate: 0
    };
    
    this.statusStats = {
      ACTIVE: 0,
      INACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      EXPIRED: 0
    };
    
    this.frequencyStats = {
      MONTHLY: 0,
      SEMI_ANNUAL: 0,
      ANNUAL: 0
    };
    
    this.contracts.forEach(contract => {
      this.stats.totalContracts++;
      this.stats.totalPaid += contract.totalPaid || 0;
      this.stats.totalRemaining += contract.remainingAmount || 0;
      this.stats.totalPremium += contract.premium || 0;
      
      if (contract.status === 'ACTIVE') {
        this.stats.activeContracts++;
      }
      
      if (this.statusStats.hasOwnProperty(contract.status)) {
        this.statusStats[contract.status as keyof typeof this.statusStats]++;
      }
      
      if (contract.paymentFrequency && this.frequencyStats.hasOwnProperty(contract.paymentFrequency)) {
        this.frequencyStats[contract.paymentFrequency as keyof typeof this.frequencyStats]++;
      }
    });
    
    if (this.stats.totalPremium > 0) {
      this.stats.completionRate = (this.stats.totalPaid / this.stats.totalPremium) * 100;
    }
  }
  
  processClaimsData(): void {
    // Reset des compteurs
    this.totalClaims = 0;
    this.pendingClaims = 0;
    this.approvedClaims = 0;
    this.rejectedClaims = 0;
    this.compensatedClaims = 0;
    
    this.claimsStatusStats = {
      DECLARED: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      COMPENSATED: 0
    };
    
    this.claimsAmountByStatus = {
      DECLARED: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      COMPENSATED: 0
    };
    
    this.claimsByContract.clear();
    
    // Initialiser la map pour tous les contrats
    this.contracts.forEach(contract => {
      this.claimsByContract.set(contract.contractId, []);
    });
    
    // Traiter chaque claim
    this.allClaims.forEach(claim => {
      this.totalClaims++;
      
      // Ajouter le claim au contrat correspondant
      const contractClaims = this.claimsByContract.get(claim.contractId) || [];
      contractClaims.push(claim);
      this.claimsByContract.set(claim.contractId, contractClaims);
      
      // Compter par statut
      const status = claim.status || 'DECLARED';
      switch(status) {
        case 'DECLARED':
          this.claimsStatusStats.DECLARED++;
          this.pendingClaims++;
          break;
        case 'IN_REVIEW':
          this.claimsStatusStats.IN_REVIEW++;
          this.pendingClaims++;
          break;
        case 'APPROVED':
          this.claimsStatusStats.APPROVED++;
          this.approvedClaims++;
          break;
        case 'REJECTED':
          this.claimsStatusStats.REJECTED++;
          this.rejectedClaims++;
          break;
        case 'COMPENSATED':
          this.claimsStatusStats.COMPENSATED++;
          this.approvedClaims++;
          this.compensatedClaims++;
          break;
      }
      
      // Additionner les montants par statut
      const amount = claim.claimedAmount || 0;
      if (this.claimsAmountByStatus.hasOwnProperty(status)) {
        this.claimsAmountByStatus[status as keyof typeof this.claimsAmountByStatus] += amount;
      }
    });
  }
  
  initCharts(): void {
    this.initStatusChart();
    this.initFrequencyChart();
    this.initPaymentProgressChart();
  }
  
  initClaimsCharts(): void {
    this.initClaimsStatusChart();
    this.initClaimsAmountChart();
  }
  
  initClaimsStatusChart(): void {
    const ctx = document.getElementById('claimsStatusChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.claimsStatusChart) {
      this.claimsStatusChart.destroy();
    }
    
    this.claimsStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Déclarés', 'En revue', 'Approuvés', 'Rejetés', 'Indemnisés'],
        datasets: [{
          data: [
            this.claimsStatusStats.DECLARED,
            this.claimsStatusStats.IN_REVIEW,
            this.claimsStatusStats.APPROVED,
            this.claimsStatusStats.REJECTED,
            this.claimsStatusStats.COMPENSATED
          ],
          backgroundColor: ['#3498db', '#e67e22', '#2c7a4d', '#e74c3c', '#1a4a6f'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                const value = context.raw as number;
                const total = this.totalClaims;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  initClaimsAmountChart(): void {
    const ctx = document.getElementById('claimsAmountChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.claimsAmountChart) {
      this.claimsAmountChart.destroy();
    }
    
    this.claimsAmountChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Déclarés', 'En revue', 'Approuvés', 'Rejetés', 'Indemnisés'],
        datasets: [{
          label: 'Montant (DT)',
          data: [
            this.claimsAmountByStatus.DECLARED,
            this.claimsAmountByStatus.IN_REVIEW,
            this.claimsAmountByStatus.APPROVED,
            this.claimsAmountByStatus.REJECTED,
            this.claimsAmountByStatus.COMPENSATED
          ],
          backgroundColor: ['#3498db', '#e67e22', '#2c7a4d', '#e74c3c', '#1a4a6f'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = context.raw as number;
                return `${value.toLocaleString()} DT`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Montant (DT)' } }
        }
      }
    });
  }
  
  initStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.statusChart) this.statusChart.destroy();
    
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Actifs', 'En attente', 'Terminés', 'Annulés', 'Expirés'],
        datasets: [{
          data: [
            this.statusStats.ACTIVE, 
            this.statusStats.INACTIVE, 
            this.statusStats.COMPLETED, 
            this.statusStats.CANCELLED, 
            this.statusStats.EXPIRED
          ],
          backgroundColor: ['#2c7a4d', '#e67e22', '#3498db', '#e74c3c', '#95a5a6'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                const value = context.raw as number;
                const total = this.stats.totalContracts;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  initFrequencyChart(): void {
    const ctx = document.getElementById('frequencyChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.frequencyChart) this.frequencyChart.destroy();
    
    this.frequencyChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Mensuel', 'Semestriel', 'Annuel'],
        datasets: [{
          data: [
            this.frequencyStats.MONTHLY, 
            this.frequencyStats.SEMI_ANNUAL, 
            this.frequencyStats.ANNUAL
          ],
          backgroundColor: ['#1a4a6f', '#2980b9', '#3498db'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'pie'>) => `${context.label}: ${context.raw} contrat(s)`
            }
          }
        }
      }
    });
  }
  
  initPaymentProgressChart(): void {
    const ctx = document.getElementById('paymentProgressChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.paymentProgressChart) this.paymentProgressChart.destroy();
    
    const displayContracts = this.contracts.slice(0, 6);
    
    this.paymentProgressChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: displayContracts.map(c => `#${c.contractId}`),
        datasets: [
          { 
            label: 'Payé (DT)', 
            data: displayContracts.map(c => c.totalPaid || 0), 
            backgroundColor: '#2c7a4d', 
            borderRadius: 8 
          },
          { 
            label: 'Restant (DT)', 
            data: displayContracts.map(c => c.remainingAmount || 0), 
            backgroundColor: '#e67e22', 
            borderRadius: 8 
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => 
                `${context.dataset.label}: ${(context.raw as number).toLocaleString()} DT`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Montant (DT)' } },
          x: { title: { display: true, text: 'Contrats' } }
        }
      }
    });
  }
  
  // Helper methods
  getContractClaimsCount(contractId: number): number {
    return this.claimsByContract.get(contractId)?.length || 0;
  }
  
  getContractClaimsTotal(contractId: number): number {
    const claims = this.claimsByContract.get(contractId) || [];
    return claims.reduce((sum, claim) => sum + (claim.claimedAmount || 0), 0);
  }
  
  getContractClaims(contractId: number): ClaimDTO[] {
    return this.claimsByContract.get(contractId) || [];
  }
  
  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'ACTIVE': 'Actif', 
      'INACTIVE': 'En attente', 
      'COMPLETED': 'Terminé', 
      'CANCELLED': 'Annulé', 
      'EXPIRED': 'Expiré'
    };
    return labels[status] || status;
  }
  
  getStatusClass(status: string): string {
    const classes: {[key: string]: string} = {
      'ACTIVE': 'status-active', 
      'INACTIVE': 'status-inactive', 
      'COMPLETED': 'status-completed', 
      'CANCELLED': 'status-cancelled', 
      'EXPIRED': 'status-expired'
    };
    return classes[status] || '';
  }
  
  getFrequencyLabel(frequency: string): string {
    const labels: {[key: string]: string} = {
      'MONTHLY': 'Mensuel', 
      'SEMI_ANNUAL': 'Semestriel', 
      'ANNUAL': 'Annuel'
    };
    return labels[frequency] || frequency;
  }
  
  getClaimStatusLabel(status?: string): string {
    const labels: {[key: string]: string} = {
      'DECLARED': 'Déclaré', 
      'IN_REVIEW': 'En revue', 
      'APPROVED': 'Approuvé', 
      'REJECTED': 'Rejeté', 
      'COMPENSATED': 'Indemnisé'
    };
    return labels[status || 'DECLARED'] || 'Déclaré';
  }
  
  getClaimStatusClass(status?: string): string {
    const classes: {[key: string]: string} = {
      'DECLARED': 'status-declared', 
      'IN_REVIEW': 'status-review', 
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected', 
      'COMPENSATED': 'status-compensated'
    };
    return classes[status || 'DECLARED'] || 'status-declared';
  }
  
  getProgressPercentage(contract: any): number {
    if (!contract.premium || contract.premium === 0) return 0;
    return (contract.totalPaid / contract.premium) * 100;
  }
  
  // CORRECTION: Méthode formatDate accepte Date | string | undefined
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
    }
  }
  
  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }
  
  getDaysRemaining(endDate: string): number {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Méthode pour fermer le modal
  closeModal(): void {
    this.selectedContract = null;
  }

  // Modifiez également la méthode selectContract existante
  selectContract(contract: any): void {
    if (this.selectedContract?.contractId === contract.contractId) {
      this.selectedContract = null;
    } else {
      this.selectedContract = contract;
    }
  }
  
  viewContractDetails(contract: any): void {
    this.selectedContract = contract;
  }
  
  makePayment(contract: any): void {
    this.router.navigate(['/public/insurance/payment', contract.contractId]);
  }
  
  refresh(): void {
    this.loadDashboardData();
    this.toastr.info('Actualisation du tableau de bord');
  }
  // Ajoutez ces méthodes à votre composant existant

  goToInsurance(): void {
    this.router.navigate(['/public/insurance']);
  }

  viewAllContracts(): void {
    this.router.navigate(['/public/insurance/my-contracts']);
  }

  createContract(): void {
    this.router.navigate(['/public/insurance/add-contract']);
  }
  // Ajoutez cette méthode pour définir la couleur de progression
  getProgressColor(contract: any): string {
    const percentage = this.getProgressPercentage(contract);
    if (percentage >= 75) return '#2ECC71';
    if (percentage >= 50) return '#4A90D9';
    if (percentage >= 25) return '#F5A623';
    return '#E74C3C';
  }
}