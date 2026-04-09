import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  stats = [
    { title: 'Produits', value: 24, icon: '📦' },
    { title: 'Clients', value: 152, icon: '👥' },
    { title: 'Commandes', value: 89, icon: '🛒' },
    { title: 'Revenus', value: '12 500 TND', icon: '💰' }
  ];

  recentActivities = [
    'Nouveau produit ajouté',
    'Client inscrit aujourd’hui',
    'Paiement validé',
    'Réclamation traitée'
  ];
}