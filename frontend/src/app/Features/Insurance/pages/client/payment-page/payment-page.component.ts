import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../../../services/contract.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../../services/auth.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent implements OnInit {
  contract: any = null;
  allPayments: any[] = [];        // Toutes les tranches (payées + en attente)
  paginatedPayments: any[] = [];
  isLoading = false;
  selectedPayments: Set<number> = new Set();
  totalSelectedAmount = 0;
  selectedPaymentId: number = 0;
  processingPayment = false;
  contractId: number = 0;
  clientEmail: string = '';
  
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
  
  // Stripe
  stripe: Stripe | null = null;
  
  // Helper for Math in template
  Math = Math;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}
  
  // Getter pour le nombre de paiements en attente
  get pendingCount(): number {
    return this.allPayments.filter(p => p.status === 'PENDING').length;
  }
  
  async ngOnInit(): Promise<void> {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    
    await this.initStripe();
    this.clientEmail = this.getUserEmailFromToken();
    
    if (this.contractId) {
      this.loadContractDetails();
      this.loadPayments();
    } else {
      this.toastr.error('Contrat non trouvé');
      this.router.navigate(['/public/insurance/my-contracts']);
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
  
  getUserEmailFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || payload.sub || payload.username || '';
    } catch (e) {
      console.error('Erreur décodage token', e);
      return '';
    }
  }
  
  loadContractDetails(): void {
    this.contractService.getContractById(this.contractId).subscribe({
      next: (contract) => {
        this.contract = contract;
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
        // Trier par date (les plus anciennes d'abord)
        this.allPayments = payments.sort((a, b) => 
          new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
        );
        this.isLoading = false;
        this.currentPage = 1;
        this.updatePagination();
        
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
    // Ne pas sélectionner les paiements déjà payés
    if (status !== 'PENDING') return;
    
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
      
      // Scroll to the selected payment if needed
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
    
    // Vérifier que le paiement est bien en attente
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
    
    if (this.paymentMethod === 'CARD') {
      await this.processStripePayment(selectedPayment);
    } else {
      this.processManualPayment(selectedPayment);
    }
  }
  
  processManualPayment(selectedPayment: any): void {
    let paymentTypeValue: string;
    if (this.paymentMethod === 'CASH') {
      paymentTypeValue = 'CASH';
    } else if (this.paymentMethod === 'BANK_TRANSFER') {
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
        
        // Recharger les paiements pour mettre à jour l'affichage
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
}