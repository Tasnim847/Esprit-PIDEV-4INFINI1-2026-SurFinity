// src/app/Features/Complaint/pages/my-complaints/my-complaints.component.ts

import { Component, OnInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintService } from '../../../../services/complaint.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.css'] 
})
export class MyComplaintsComponent implements OnInit {
  
  complaints: any[] = [];
  selectedComplaint: any = null;
  complaintForm: FormGroup;
  isEditing = false;
  showForm = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  selectedStatus = '';
  
  // Voice recognition properties
  isListening = false;
  recognition: any = null;
  voiceSupported = false;
  voiceMessage = '';

  currentUser: any = null;
  private isBrowser: boolean;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.complaintForm = this.createForm();
    this.initVoiceRecognition();
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      message: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+ ]{8,15}$')]],
      status: ['PENDING']
    });
  }

  // Initialize voice recognition
  private initVoiceRecognition(): void {
    if (!this.isBrowser) return;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.voiceSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR';
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          const currentMessage = this.complaintForm.get('message')?.value || '';
          const newMessage = currentMessage + (currentMessage ? ' ' : '') + transcript;
          this.complaintForm.patchValue({ message: newMessage });
          this.isListening = false;
          this.voiceMessage = '';
        });
      };
      
      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          this.isListening = false;
          this.voiceMessage = '';
          this.errorMessage = 'Erreur de reconnaissance vocale. Veuillez réessayer.';
          setTimeout(() => this.errorMessage = '', 3000);
        });
      };
      
      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.isListening = false;
          this.voiceMessage = '';
        });
      };
    } else {
      this.voiceSupported = false;
      console.log('Speech recognition not supported in this browser');
    }
  }

  // Start voice recognition
  startVoiceRecognition(): void {
    if (!this.voiceSupported) {
      this.errorMessage = 'La reconnaissance vocale n\'est pas supportée par votre navigateur. Utilisez Chrome, Edge ou Safari.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    
    if (this.isListening) {
      this.recognition?.stop();
      this.isListening = false;
      return;
    }
    
    try {
      this.isListening = true;
      this.voiceMessage = '🎤 Écoute en cours... Parlez maintenant';
      this.recognition.start();
    } catch (error) {
      console.error('Voice recognition error:', error);
      this.isListening = false;
      this.voiceMessage = '';
      this.errorMessage = 'Erreur lors du démarrage du microphone. Vérifiez vos permissions.';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  checkAuthentication(): void {
    if (!this.isBrowser) return;
    
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      this.errorMessage = 'Veuillez vous connecter';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }
    
    if (role !== 'CLIENT') {
      this.errorMessage = 'Accès réservé aux clients';
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
        this.loadMyComplaints();
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

  loadMyComplaints(): void {
    this.isLoading = true;
    console.log('🔍 Chargement de mes réclamations...');
    
    this.complaintService.getComplaintsByClient(this.currentUser.id).subscribe({
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
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement:', err);
        this.errorMessage = 'Erreur lors du chargement de vos réclamations';
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
        c.message?.toLowerCase().includes(term)
      );
    }
    
    if (this.selectedStatus) {
      filtered = filtered.filter(c => c.status === this.selectedStatus);
    }
    
    return filtered;
  }

  openAddForm(): void {
    this.isEditing = false;
    this.showForm = true;
    this.selectedComplaint = null;
    this.complaintForm.reset({
      message: '',
      phone: this.currentUser?.telephone || '',
      status: 'PENDING'
    });
    if (this.isListening) {
      this.recognition?.stop();
      this.isListening = false;
    }
  }

  editComplaint(complaint: any, event: Event): void {
    event.stopPropagation();
    this.errorMessage = '❌ Vous ne pouvez pas modifier une réclamation déjà envoyée. Seul un agent peut modifier le statut.';
    setTimeout(() => this.errorMessage = '', 4000);
    return;
  }

  viewDetails(complaint: any): void {
    this.selectedComplaint = complaint;
  }

  closeDetails(): void {
    this.selectedComplaint = null;
  }

  saveComplaint(): void {
    if (this.complaintForm.invalid) {
      Object.keys(this.complaintForm.controls).forEach(key => {
        const control = this.complaintForm.get(key);
        if (control) control.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.complaintForm.value;

    const payload: any = {
      message: formValue.message,
      phone: formValue.phone,
      status: formValue.status,
      client: { email: this.currentUser.email }
    };

    console.log('📤 Envoi payload:', payload);

    this.complaintService.createComplaint(payload).subscribe({
      next: (response: any) => {
        console.log('✅ Réponse création:', response);
        this.successMessage = 'Votre réclamation a été créée avec succès !';
        this.afterSave();
      },
      error: (err: any) => {
        console.error('❌ Erreur création:', err);
        this.handleError(err.error?.message || 'Erreur lors de la création');
      }
    });
  }

  updateComplaint(): void {
    this.errorMessage = '❌ Vous ne pouvez pas modifier une réclamation. Contactez votre agent.';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }

  deleteComplaint(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
      this.isLoading = true;
      this.complaintService.deleteComplaint(id).subscribe({
        next: () => {
          this.successMessage = 'Réclamation supprimée avec succès !';
          this.loadMyComplaints();
          this.isLoading = false;
          if (this.selectedComplaint?.id === id) this.closeDetails();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => {
          console.error('Erreur suppression:', err);
          this.handleError('Erreur lors de la suppression');
          this.isLoading = false;
        }
      });
    }
  }

  afterSave(): void {
    setTimeout(() => {
      this.loadMyComplaints();
      this.closeForm();
      this.isLoading = false;
    }, 500);
    setTimeout(() => this.successMessage = '', 3000);
  }

  handleError(msg: string): void {
    this.errorMessage = msg;
    this.isLoading = false;
    setTimeout(() => this.errorMessage = '', 3000);
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedComplaint = null;
    if (this.isListening) {
      this.recognition?.stop();
      this.isListening = false;
    }
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
}