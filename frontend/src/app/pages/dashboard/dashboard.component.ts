// dashboard.component.ts (avec logs améliorés)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatisticsService } from '../../services/statistics.service';

interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalAgentsAssurance: number;
  totalAgentsFinance: number;
  totalAdmins: number;
  recentActivities: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    totalClients: 0,
    totalAgentsAssurance: 0,
    totalAgentsFinance: 0,
    totalAdmins: 0,
    recentActivities: []
  };

  loading = true;
  error: string | null = null;

  constructor(private statsService: StatisticsService) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    console.log('🔄 Chargement des stats...');
    this.loading = true;
    this.error = null;

    this.statsService.getDashboardStats().subscribe({
      next: (data: DashboardStats) => {
        console.log('✅ Stats reçues:', data);
        this.stats = data;
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('❌ Erreur:', err);
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  getRolePercentage(roleCount: number): number {
    if (this.stats.totalUsers === 0) return 0;
    return (roleCount / this.stats.totalUsers) * 100;
  }

  retry() {
    this.loadDashboardStats();
  }
}
