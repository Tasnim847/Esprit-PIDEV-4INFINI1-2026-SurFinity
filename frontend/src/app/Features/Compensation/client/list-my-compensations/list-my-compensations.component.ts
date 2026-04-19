import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CompensationService } from '../../services/compensation.service';
import { Compensation } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-list-my-compensations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-my-compensations.component.html',
  styleUrl: './list-my-compensations.component.css'
})
export class ListMyCompensationsComponent implements OnInit {
  compensations: Compensation[] = [];
  loading = false;
  error = '';
  selectedCompensation: any = null;
  showDetails = false;
  paymentStatus: any = null;
  Math = Math;

  // Payment properties
  selectedCompensationForPayment: Compensation | null = null;
  processingPayment = false;
  paymentMethod: string = 'CARD'; // 'CARD' ou 'CASH'
  
  // Stripe
  stripe: Stripe | null = null;
  
  // Card details (pour affichage uniquement)
  cardDetails = {
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  };

  statusColors: { [key: string]: string } = {
    'PENDING': 'badge bg-warning',
    'CALCULATED': 'badge bg-info',
    'PAID': 'badge bg-success',
    'CANCELLED': 'badge bg-danger'
  };

  riskLevelColors: { [key: string]: string } = {
    'TRES_FAIBLE': 'text-success',
    'FAIBLE': 'text-info',
    'MOYEN': 'text-warning',
    'ELEVE': 'text-danger',
    'TRES_ELEVE': 'text-danger fw-bold'
  };

  constructor(
    private compensationService: CompensationService,
    private toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.initStripe();
    this.loadCompensations();
  }

  async initStripe(): Promise<void> {
    if (!environment.stripePublicKey) {
      console.error('❌ Stripe key not configured');
      return;
    }
    
    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (this.stripe) {
        console.log('✅ Stripe initialized successfully');
      }
    } catch (error) {
      console.error('❌ Stripe error:', error);
    }
  }

  loadCompensations(): void {
    this.loading = true;
    this.compensationService.getMyCompensations().subscribe({
      next: (data) => {
        this.compensations = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading compensations: ' + err.message;
        this.loading = false;
      }
    });
  }

  viewCompensationDetails(compensationId: number): void {
    this.compensationService.getMyCompensationDetails(compensationId).subscribe({
      next: (data) => {
        this.selectedCompensation = data;
        this.showDetails = true;
      },
      error: (err) => {
        this.error = 'Error loading details: ' + err.message;
      }
    });
  }

  selectCompensationForPayment(compensation: Compensation): void {
    if (compensation.status !== 'CALCULATED') {
      this.toastr.warning('This compensation cannot be paid');
      return;
    }
    
    this.selectedCompensationForPayment = compensation;
    this.paymentMethod = 'CARD';
    this.cardDetails = {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: ''
    };
  }

  cancelPayment(): void {
    this.selectedCompensationForPayment = null;
    this.processingPayment = false;
  }

  async processCardPayment(): Promise<void> {
    if (!this.selectedCompensationForPayment) return;
    
    this.processingPayment = true;
    
    this.compensationService.payCompensationByCard(this.selectedCompensationForPayment.compensationId).subscribe({
      next: async (response) => {
        if (response.success && response.clientSecret && this.stripe) {
          try {
            // Afficher le formulaire Stripe
            const result = await this.stripe.confirmCardPayment(response.clientSecret, {
              payment_method: {
                card: {
                  token: 'tok_visa', // En développement, utiliser un token de test
                },
                billing_details: {
                  name: this.cardDetails.cardHolder || 'Client',
                },
              },
            });
            
            if (result.error) {
              this.processingPayment = false;
              this.toastr.error('Payment error: ' + result.error.message);
            } else if (result.paymentIntent?.status === 'succeeded') {
              // Confirmer le paiement
              this.compensationService.confirmCompensationPayment(result.paymentIntent.id).subscribe({
                next: (confirmResponse) => {
                  this.processingPayment = false;
                  if (confirmResponse.success) {
                    this.toastr.success('✅ Payment successful!');
                    this.loadCompensations();
                    this.cancelPayment();
                  } else {
                    this.toastr.error(confirmResponse.error || 'Confirmation failed');
                  }
                },
                error: (err) => {
                  this.processingPayment = false;
                  this.toastr.error('Confirmation error: ' + err.message);
                }
              });
            }
          } catch (error) {
            this.processingPayment = false;
            console.error('Stripe error:', error);
            this.toastr.error('Payment processing error');
          }
        } else {
          this.processingPayment = false;
          this.toastr.error(response.error || 'Failed to initialize payment');
        }
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('Payment error:', err);
        this.toastr.error(err.error?.error || 'Payment initialization failed');
      }
    });
  }

  processCashPayment(): void {
    if (!this.selectedCompensationForPayment) return;
    
    const confirmMessage = `Confirm cash payment of ${this.formatAmount(this.selectedCompensationForPayment.clientOutOfPocket)} for compensation #${this.selectedCompensationForPayment.compensationId}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    this.processingPayment = true;
    
    this.compensationService.payCompensationByCash(this.selectedCompensationForPayment.compensationId).subscribe({
      next: (response) => {
        this.processingPayment = false;
        
        if (response.success) {
          this.toastr.success(response.message || 'Cash payment recorded successfully!');
          this.loadCompensations();
          this.cancelPayment();
        } else {
          this.toastr.error(response.error || 'Payment failed');
        }
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('Payment error:', err);
        this.toastr.error(err.error?.error || 'Payment failed');
      }
    });
  }

  processPayment(): void {
    if (!this.selectedCompensationForPayment) {
      this.toastr.warning('Please select a compensation to pay');
      return;
    }
    
    if (this.selectedCompensationForPayment.status !== 'CALCULATED') {
      this.toastr.error('This compensation has already been paid');
      this.cancelPayment();
      return;
    }
    
    if (this.paymentMethod === 'CARD') {
      this.processCardPayment();
    } else if (this.paymentMethod === 'CASH') {
      this.processCashPayment();
    }
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedCompensation = null;
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || 'badge bg-secondary';
  }

  getRiskLevelColor(riskLevel: string): string {
    return this.riskLevelColors[riskLevel] || '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '0.00 DT';
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DT';
  }
}