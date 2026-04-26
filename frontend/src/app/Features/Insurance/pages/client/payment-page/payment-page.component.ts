import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../../../services/contract.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  contract: any = null;
  allPayments: any[] = [];
  paginatedPayments: any[] = [];
  isLoading = false;
  selectedPayments: Set<number> = new Set();
  totalSelectedAmount = 0;
  selectedPaymentId: number = 0;
  processingPayment = false;
  contractId: number = 0;
  clientEmail: string = '';
  clientId: number = 0;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;
  
  paymentMethod: string = 'CARD';
  cardDetails = {
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  };
  
  // Variables pour paiement CASH
  pendingCashPayment: any = null;
  recentlyRejectedPaymentId: number | null = null;
  
  // Stripe
  stripe: Stripe | null = null;
  
  Math = Math;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService,
    private toastr: ToastrService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
  
  get pendingCount(): number {
    return this.allPayments.filter(p => p.status === 'PENDING').length;
  }
  
  async ngOnInit(): Promise<void> {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    
    await this.initStripe();
    this.getUserInfo();
    
    if (this.contractId) {
      this.loadContractDetails();
      this.loadPayments();
    } else {
      this.toastr.error('Contrat non trouvé');
      this.router.navigate(['/public/insurance/my-contracts']);
    }
    
    // Écouter les mises à jour des demandes CASH
    this.notificationService.listenForRequestUpdate().subscribe((request) => {
      if (request.paymentId && this.selectedPaymentId === request.paymentId) {
        if (request.status === 'approved') {
          this.handleAgentApprovalFromNotification(request);
        } else if (request.status === 'rejected') {
          this.handleAgentRejectionFromNotification(request);
        }
      }
    });
  }
  
  getUserInfo(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.clientEmail = payload.email || payload.sub || '';
        this.clientId = payload.id || payload.userId || 0;
      } catch (e) {
        console.error('Erreur décodage token', e);
      }
    }
  }
  
  async initStripe(): Promise<void> {
    if (!environment.stripePublicKey) {
      console.error('❌ Clé Stripe non configurée');
      return;
    }
    
    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (this.stripe) {
        console.log('✅ Stripe initialisé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur Stripe:', error);
    }
  }
  
  loadContractDetails(): void {
  this.contractService.getContractById(this.contractId).subscribe({
    next: (contract) => {
      this.contract = contract;
      console.log('📄 Contrat chargé:', contract);
      console.log('👤 Agent ID (agentAssuranceId):', contract?.agentAssuranceId);
      console.log('👤 Client:', contract?.client);
    },
    error: (err) => {
      console.error('Error loading contract:', err);
      this.toastr.error('Erreur lors du chargement du contrat');
    }
  });
}
  
  loadPayments(): void {
    this.isLoading = true;
    this.contractService.getPaymentsByContract(this.contractId).subscribe({
      next: (payments) => {
        this.allPayments = payments.sort((a, b) => 
          new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
        );
        this.isLoading = false;
        this.currentPage = 1;
        this.updatePagination();
        
        // Vérifier si le paiement récemment refusé est toujours PENDING
        if (this.recentlyRejectedPaymentId) {
          const rejectedPayment = this.allPayments.find(p => p.paymentId === this.recentlyRejectedPaymentId);
          if (rejectedPayment && rejectedPayment.status === 'PENDING') {
            this.toastr.info('Le paiement refusé peut être reselectionné', 'Information');
          }
        }
        
        if (this.pendingCount === 0) {
          this.toastr.info('Aucun paiement en attente pour ce contrat');
        }
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.toastr.error('Erreur lors du chargement des paiements');
        this.isLoading = false;
      }
    });
  }
  
  updatePagination(): void {
    this.totalPages = Math.ceil(this.allPayments.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPayments = this.allPayments.slice(start, end);
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      document.querySelector('.card-body')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      document.querySelector('.card-body')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      document.querySelector('.card-body')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  togglePayment(paymentId: number, amount: number, status: string): void {
    if (status !== 'PENDING') {
      if (status === 'PAID') {
        this.toastr.warning('Ce paiement a déjà été effectué');
      }
      return;
    }
    
    // Nettoyer l'indicateur de refus récent si on reselectionne
    if (this.recentlyRejectedPaymentId === paymentId) {
      this.recentlyRejectedPaymentId = null;
    }
    
    if (this.selectedPayments.has(paymentId)) {
      this.selectedPayments.delete(paymentId);
      this.totalSelectedAmount = 0;
      this.selectedPaymentId = 0;
    } else {
      this.selectedPayments.clear();
      this.selectedPayments.add(paymentId);
      this.totalSelectedAmount = amount;
      this.selectedPaymentId = paymentId;
    }
  }
  
  selectFirstPending(): void {
    const firstPending = this.allPayments.find(p => p.status === 'PENDING');
    if (firstPending) {
      this.selectedPayments.clear();
      this.selectedPayments.add(firstPending.paymentId);
      this.totalSelectedAmount = firstPending.amount;
      this.selectedPaymentId = firstPending.paymentId;
      this.toastr.info(`Tranche #${firstPending.paymentId} sélectionnée`);
      
      const element = document.querySelector(`#payment-${firstPending.paymentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      this.toastr.warning('Aucune tranche en attente');
    }
  }
  
  clearSelection(): void {
    this.selectedPayments.clear();
    this.totalSelectedAmount = 0;
    this.selectedPaymentId = 0;
    this.recentlyRejectedPaymentId = null;
  }
  
  async processStripePayment(selectedPayment: any): Promise<void> {
    try {
      this.processingPayment = true;
      
      this.contractService.createPaymentIntent(this.contractId, selectedPayment.amount).subscribe({
        next: async (response) => {
          if (response && response.clientSecret && this.stripe) {
            try {
              const result = await this.stripe.confirmCardPayment(response.clientSecret, {
                payment_method: {
                  card: {
                    token: 'tok_visa',
                  },
                  billing_details: {
                    name: this.cardDetails.cardHolder || 'Client Test',
                    email: this.clientEmail,
                  },
                },
              });
              
              if (result.error) {
                this.processingPayment = false;
                this.toastr.error('Erreur: ' + result.error.message);
              } else if (result.paymentIntent?.status === 'succeeded') {
                this.contractService.confirmPayment(result.paymentIntent.id).subscribe({
                  next: () => {
                    this.processingPayment = false;
                    this.toastr.success('✅ Paiement effectué avec succès!');
                    setTimeout(() => {
                      this.router.navigate(['/public/insurance/my-contracts']);
                    }, 2000);
                  },
                  error: (err) => {
                    this.processingPayment = false;
                    console.error('Erreur confirmation:', err);
                    this.toastr.success('Paiement effectué avec succès!');
                    setTimeout(() => {
                      this.router.navigate(['/public/insurance/my-contracts']);
                    }, 2000);
                  }
                });
              }
            } catch (error) {
              this.processingPayment = false;
              console.error('Erreur:', error);
              this.toastr.error('Erreur lors du paiement');
            }
          } else {
            this.processingPayment = false;
            this.toastr.error('Erreur création paiement');
          }
        },
        error: (err) => {
          this.processingPayment = false;
          console.error('Erreur:', err);
          this.toastr.error('Erreur initialisation paiement');
        }
      });
    } catch (error) {
      this.processingPayment = false;
      console.error(error);
      this.toastr.error('Erreur traitement');
    }
  }
  
  // ==================== MÉTHODES POUR PAIEMENT CASH ====================
  
  requestAgentApproval(selectedPayment: any): void {
  // Récupérer l'ID de l'agent depuis le contrat (utiliser agentAssuranceId)
  const agentId = this.contract?.agentAssuranceId || 0;
  
  console.log('🔍 Vérification avant envoi:');
  console.log('  - agentAssuranceId:', agentId);
  console.log('  - contractId:', this.contractId);
  console.log('  - clientId:', this.clientId);
  console.log('  - clientEmail:', this.clientEmail);
  console.log('  - paymentId:', selectedPayment.paymentId);
  console.log('  - amount:', selectedPayment.amount);
  
  if (!agentId || agentId === 0) {
    this.toastr.error('Impossible de trouver votre agent d\'assurance. Veuillez contacter le support.', 'Erreur');
    this.processingPayment = false;
    return;
  }
  
  if (!this.clientId || this.clientId === 0) {
    this.toastr.error('Informations client manquantes. Veuillez vous reconnecter.', 'Erreur');
    this.processingPayment = false;
    return;
  }
  
  this.pendingCashPayment = {
    paymentId: selectedPayment.paymentId,
    contractId: this.contractId,
    clientId: this.clientId,
    agentId: agentId,
    amount: selectedPayment.amount,
    clientName: `${this.contract?.client?.firstName || ''} ${this.contract?.client?.lastName || ''}`.trim(),
    clientEmail: this.clientEmail,
    requestedAt: new Date().toISOString(),
    status: 'PENDING'
  };
  
  console.log('📝 Demande CASH préparée:', JSON.stringify(this.pendingCashPayment, null, 2));
  
  // Sauvegarder la demande dans la base de données
  this.saveApprovalRequestToBackend(selectedPayment);
}
  
  saveApprovalRequestToBackend(selectedPayment: any): void {
  const requestData = {
    paymentId: Number(selectedPayment.paymentId),
    contractId: Number(this.contractId),
    clientId: Number(this.clientId),
    agentId: Number(this.contract?.agentAssuranceId || 0),
    amount: Number(selectedPayment.amount),
    clientName: `${this.contract?.client?.firstName || ''} ${this.contract?.client?.lastName || ''}`.trim(),
    clientEmail: this.clientEmail,
    status: 'PENDING'
  };
  
  console.log('📤 Envoi au backend:', JSON.stringify(requestData, null, 2));
  
  this.contractService.createCashRequest(requestData).subscribe({
    next: (response) => {
      console.log('✅ Demande enregistrée en base:', response);
      this.showConfirmationPopup(selectedPayment);
    },
    error: (err) => {
      console.error('❌ Erreur sauvegarde demande:', err);
      console.error('Détails erreur:', err.error);
      this.toastr.error(`Erreur: ${err.error?.message || 'Erreur serveur'}`, 'Erreur');
      this.processingPayment = false;
    }
  });
}
  
  saveToLocalStorage(selectedPayment: any, requestId: number): void {
    const pendingRequests = this.getPendingApprovalRequests();
    const newRequest = {
      id: requestId,
      paymentId: selectedPayment.paymentId,
      contractId: this.contractId,
      amount: selectedPayment.amount,
      clientEmail: this.clientEmail,
      clientName: `${this.contract?.client?.firstName || ''} ${this.contract?.client?.lastName || ''}`,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    pendingRequests.push(newRequest);
    localStorage.setItem('pendingCashApprovals', JSON.stringify(pendingRequests));
  }
  
  getPendingApprovalRequests(): any[] {
    const stored = localStorage.getItem('pendingCashApprovals');
    return stored ? JSON.parse(stored) : [];
  }
  
  showConfirmationPopup(selectedPayment: any): void {
    // Afficher une simple popup de confirmation
    this.toastr.success(
      `✅ Demande de paiement de ${selectedPayment.amount} DT envoyée à votre agent.`, 
      'Demande envoyée',
      { timeOut: 3000 }
    );
    
    // Réinitialiser l'état de sélection
    this.clearSelection();
    this.processingPayment = false;
  }
  
  startApprovalPolling(paymentId: number): void {
    // Vérifier le statut toutes les 5 secondes
    const interval = setInterval(() => {
      this.contractService.getCashRequestStatus(paymentId).subscribe({
        next: (requests) => {
          if (requests && requests.length > 0) {
            const request = requests[0];
            if (request.status === 'APPROVED') {
              clearInterval(interval);
              this.handleAgentApproval(paymentId);
            } else if (request.status === 'REJECTED') {
              clearInterval(interval);
              this.handleAgentRejection(paymentId, request.rejectionReason);
            }
          }
        },
        error: (err) => {
          console.error('Erreur vérification statut:', err);
        }
      });
    }, 5000);
    
    // Timeout après 5 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 5 * 60 * 1000);
  }
  
  handleAgentApproval(paymentId: number): void {
    this.toastr.success('✅ Votre paiement a été approuvé par l\'agent!', 'Approuvé');
    
    // Récupérer le paiement approuvé
    const selectedPayment = this.allPayments.find(p => p.paymentId === paymentId);
    if (selectedPayment) {
      this.processCashPaymentAfterApproval(selectedPayment);
    }
    
    // Recharger les paiements pour mettre à jour l'affichage
    this.loadPayments();
  }
  
  handleAgentRejection(paymentId: number, reason?: string): void {
    this.toastr.error(`❌ Paiement refusé: ${reason || 'Contacter votre agent'}`, 'Refusé');
    
    // Marquer ce paiement comme récemment refusé
    this.recentlyRejectedPaymentId = paymentId;
    
    // Recharger les paiements
    this.loadPayments();
    
    // Message pour ressayer
    setTimeout(() => {
      this.toastr.info('Vous pouvez sélectionner à nouveau cette tranche', 'Information');
    }, 3000);
  }
  
  handleAgentApprovalFromNotification(request: any): void {
    if (this.pendingCashPayment && this.pendingCashPayment.paymentId === request.paymentId) {
      this.handleAgentApproval(request.paymentId);
    } else {
      this.loadPayments();
      this.toastr.success('Votre paiement a été approuvé par l\'agent', 'Approuvé');
    }
  }
  
  handleAgentRejectionFromNotification(request: any): void {
    if (this.pendingCashPayment && this.pendingCashPayment.paymentId === request.paymentId) {
      this.handleAgentRejection(request.paymentId, request.rejectionReason || 'Refusé par l\'agent');
    } else {
      this.toastr.warning(`Votre demande de paiement a été refusée`, 'Refusé');
      this.loadPayments();
    }
  }
  
  processCashPaymentAfterApproval(selectedPayment: any): void {
    if (!this.clientEmail) {
      this.toastr.error('Email client non trouvé. Veuillez vous reconnecter.');
      return;
    }
    
    this.processingPayment = true;
    
    const paymentData = {
      clientEmail: this.clientEmail,
      contractId: this.contractId,
      installmentAmount: selectedPayment.amount,
      paymentType: 'CASH',
      remainingAmount: this.contract?.remainingAmount || 0
    };
    
    console.log('📤 Traitement paiement CASH approuvé:', paymentData);
    
    this.contractService.processApprovedCashPayment(paymentData).subscribe({
      next: (response) => {
        this.processingPayment = false;
        this.toastr.success('✅ Paiement en espèces effectué avec succès!');
        
        // Supprimer la demande du localStorage
        this.removeApprovalRequest(selectedPayment.paymentId);
        
        setTimeout(() => {
          this.loadPayments();
          this.clearSelection();
        }, 1000);
        
        setTimeout(() => {
          this.router.navigate(['/public/insurance/my-contracts']);
        }, 3000);
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('❌ Erreur:', err);
        const errorMsg = err.error?.error || err.message || 'Erreur lors du paiement';
        this.toastr.error(errorMsg);
        
        // En cas d'erreur, remettre la demande en attente
        this.markRequestAsFailed(selectedPayment.paymentId);
      }
    });
  }
  
  removeApprovalRequest(paymentId: number): void {
    const pendingRequests = this.getPendingApprovalRequests();
    const filtered = pendingRequests.filter(r => r.paymentId !== paymentId);
    localStorage.setItem('pendingCashApprovals', JSON.stringify(filtered));
  }
  
  markRequestAsFailed(paymentId: number): void {
    const pendingRequests = this.getPendingApprovalRequests();
    const request = pendingRequests.find(r => r.paymentId === paymentId);
    if (request) {
      request.status = 'failed';
      request.failedAt = new Date().toISOString();
      localStorage.setItem('pendingCashApprovals', JSON.stringify(pendingRequests));
    }
  }
  
  // ==================== FIN MÉTHODES CASH ====================
  
  async processPayment(): Promise<void> {
    if (this.selectedPayments.size === 0) {
      this.toastr.warning('Veuillez sélectionner une tranche à payer');
      return;
    }
    
    const selectedPaymentId = Array.from(this.selectedPayments)[0];
    const selectedPayment = this.allPayments.find(p => p.paymentId === selectedPaymentId);
    
    if (!selectedPayment) {
      this.toastr.error('Erreur lors de la sélection du paiement');
      return;
    }
    
    if (selectedPayment.status !== 'PENDING') {
      this.toastr.error('Cette tranche a déjà été payée');
      this.clearSelection();
      return;
    }
    
    if (!this.clientEmail) {
      this.toastr.error('Email client non trouvé. Veuillez vous reconnecter.');
      return;
    }
    
    this.processingPayment = true;
    
    if (this.paymentMethod === 'CASH') {
      // Pour CASH: envoyez la demande et fermez immédiatement
      this.requestAgentApproval(selectedPayment);
    } 
    else if (this.paymentMethod === 'CARD') {
      await this.processStripePayment(selectedPayment);
    } 
    else {
      this.processManualPayment(selectedPayment);
    }
  }
  
  processManualPayment(selectedPayment: any): void {
    let paymentTypeValue: string;
    if (this.paymentMethod === 'BANK_TRANSFER') {
      paymentTypeValue = 'BANK_TRANSFER';
    } else {
      paymentTypeValue = 'CASH';
    }
    
    const paymentData = {
      clientEmail: this.clientEmail,
      contractId: this.contractId,
      installmentAmount: selectedPayment.amount,
      paymentType: paymentTypeValue,
      remainingAmount: this.contract?.remainingAmount || 0
    };
    
    console.log('📤 Envoi paiement manuel:', paymentData);
    
    this.contractService.makePayment(paymentData).subscribe({
      next: (response) => {
        this.processingPayment = false;
        this.toastr.success('Paiement effectué avec succès!');
        console.log('✅ Réponse:', response);
        
        setTimeout(() => {
          this.loadPayments();
          this.clearSelection();
        }, 1000);
        
        setTimeout(() => {
          this.router.navigate(['/public/insurance/my-contracts']);
        }, 3000);
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('❌ Erreur:', err);
        const errorMsg = err.error?.error || err.message || 'Erreur lors du paiement';
        this.toastr.error(errorMsg);
      }
    });
  }
  
  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      case 'LATE': return 'status-late';
      default: return '';
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'PAID': return 'Payé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'LATE': return 'En retard';
      default: return status;
    }
  }
  
  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  goBack(): void {
    this.router.navigate(['/public/insurance/my-contracts']);
  }
  
  ngOnDestroy(): void {
    // Nettoyage si nécessaire
  }
}