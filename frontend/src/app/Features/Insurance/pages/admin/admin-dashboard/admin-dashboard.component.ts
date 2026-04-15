import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { InsuranceContract } from '../../../../../shared';
import { RiskEvaluationDTO } from '../../../../../shared/dto/risk-evaluation.dto';
import { ContractService } from '../../../services/contract.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  contracts: InsuranceContract[] = [];
  riskEvaluations: Map<number, RiskEvaluationDTO> = new Map();
  
  // Time period filter
  timePeriod: 'day' | 'week' | 'month' | 'year' = 'month';
  
  // Statistics
  stats = {
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    cancelled: 0,
    completed: 0,
    rejected: 0,
    totalPremium: 0,
    averageRiskScore: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0
  };
  
  // Time-based data
  contractsByPeriod: { label: string, active: number, pending: number, rejected: number, chartId: string }[] = [];
  riskDistribution: { label: string, low: number, medium: number, high: number, critical: number }[] = [];
  
  isLoading = true;
  showDetailsModal = false;
  selectedDetailData: any = null;
  
  // Mini charts cache
  miniCharts: Map<string, Chart> = new Map();
  
  constructor(private contractService: ContractService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => this.initAllCharts(), 500);
  }

  goBackToContracts(): void {
    this.router.navigate(['/backoffice/insurance']);
  }
  
  // Helper method to generate safe chart ID
  getSafeChartId(label: string): string {
    return 'pie-' + label.replace(/[^a-zA-Z0-9]/g, '');
  }
  
  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    try {
      this.contracts = await this.contractService.getAllContracts().toPromise() || [];
      
      // Load risk evaluations in parallel
      const promises = this.contracts.map(contract => 
        this.contractService.getRiskEvaluationFromApi(contract.contractId).toPromise()
          .then(riskEval => ({ contractId: contract.contractId, riskEval }))
          .catch(() => ({ contractId: contract.contractId, riskEval: null }))
      );
      
      const results = await Promise.all(promises);
      results.forEach(({ contractId, riskEval }) => {
        if (riskEval) this.riskEvaluations.set(contractId, riskEval);
      });
      
      this.calculateStatistics();
      this.calculateTimeBasedData();
      this.initAllCharts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  calculateStatistics(): void {
    this.stats.total = this.contracts.length;
    this.stats.active = this.contracts.filter(c => c.status === 'ACTIVE').length;
    this.stats.pending = this.contracts.filter(c => c.status === 'INACTIVE').length;
    this.stats.expired = this.contracts.filter(c => c.status === 'EXPIRED').length;
    this.stats.cancelled = this.contracts.filter(c => c.status === 'CANCELLED').length;
    this.stats.completed = this.contracts.filter(c => c.status === 'COMPLETED').length;
    this.stats.totalPremium = this.contracts.reduce((sum, c) => sum + (c.premium || 0), 0);
    
    // Rejected contracts (cancelled or expired)
    this.stats.rejected = this.stats.cancelled + this.stats.expired;
    
    // Risk distribution
    const riskValues = Array.from(this.riskEvaluations.values());
    this.stats.lowRisk = riskValues.filter(r => r.globalRiskLevel === 'LOW').length;
    this.stats.mediumRisk = riskValues.filter(r => r.globalRiskLevel === 'MEDIUM').length;
    this.stats.highRisk = riskValues.filter(r => r.globalRiskLevel === 'HIGH').length;
    this.stats.criticalRisk = riskValues.filter(r => r.globalRiskLevel === 'CRITICAL').length;
    
    const riskScores = riskValues.filter(r => r.globalRiskScore).map(r => r.globalRiskScore || 0);
    this.stats.averageRiskScore = riskScores.length > 0 
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length 
      : 0;
  }
  
  calculateTimeBasedData(): void {
    const now = new Date();
    let labels: string[] = [];
    let dataMap = new Map<string, { active: number, pending: number, rejected: number }>();
    
    switch(this.timePeriod) {
      case 'day':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          labels.push(label);
          dataMap.set(label, { active: 0, pending: 0, rejected: 0 });
        }
        break;
      case 'week':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - (i * 7));
          const weekNum = this.getWeekNumber(date);
          const label = `Week ${weekNum}`;
          labels.push(label);
          dataMap.set(label, { active: 0, pending: 0, rejected: 0 });
        }
        break;
      case 'month':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          labels.push(label);
          dataMap.set(label, { active: 0, pending: 0, rejected: 0 });
        }
        break;
      case 'year':
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const label = year.toString();
          labels.push(label);
          dataMap.set(label, { active: 0, pending: 0, rejected: 0 });
        }
        break;
    }
    
    // Populate data
    this.contracts.forEach(contract => {
      const startDate = new Date(contract.startDate);
      let periodKey = '';
      
      switch(this.timePeriod) {
        case 'day':
          periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case 'week':
          periodKey = `Week ${this.getWeekNumber(startDate)}`;
          break;
        case 'month':
          periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'year':
          periodKey = startDate.getFullYear().toString();
          break;
      }
      
      const existing = dataMap.get(periodKey);
      if (existing) {
        if (contract.status === 'ACTIVE') existing.active++;
        else if (contract.status === 'INACTIVE') existing.pending++;
        else if (contract.status === 'CANCELLED' || contract.status === 'EXPIRED') existing.rejected++;
      }
    });
    
    this.contractsByPeriod = labels.map(label => ({
      label,
      active: dataMap.get(label)?.active || 0,
      pending: dataMap.get(label)?.pending || 0,
      rejected: dataMap.get(label)?.rejected || 0,
      chartId: this.getSafeChartId(label)
    }));
    
    this.calculateRiskDistributionByPeriod();
  }
  
  calculateRiskDistributionByPeriod(): void {
    const now = new Date();
    let labels: string[] = [];
    let dataMap = new Map<string, { low: number, medium: number, high: number, critical: number }>();
    
    switch(this.timePeriod) {
      case 'day':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          labels.push(label);
          dataMap.set(label, { low: 0, medium: 0, high: 0, critical: 0 });
        }
        break;
      case 'week':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - (i * 7));
          const weekNum = this.getWeekNumber(date);
          const label = `Week ${weekNum}`;
          labels.push(label);
          dataMap.set(label, { low: 0, medium: 0, high: 0, critical: 0 });
        }
        break;
      case 'month':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          labels.push(label);
          dataMap.set(label, { low: 0, medium: 0, high: 0, critical: 0 });
        }
        break;
      case 'year':
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const label = year.toString();
          labels.push(label);
          dataMap.set(label, { low: 0, medium: 0, high: 0, critical: 0 });
        }
        break;
    }
    
    this.contracts.forEach(contract => {
      const startDate = new Date(contract.startDate);
      const riskEval = this.riskEvaluations.get(contract.contractId);
      let periodKey = '';
      
      switch(this.timePeriod) {
        case 'day':
          periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case 'week':
          periodKey = `Week ${this.getWeekNumber(startDate)}`;
          break;
        case 'month':
          periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'year':
          periodKey = startDate.getFullYear().toString();
          break;
      }
      
      const existing = dataMap.get(periodKey);
      if (existing && riskEval) {
        switch(riskEval.globalRiskLevel) {
          case 'LOW': existing.low++; break;
          case 'MEDIUM': existing.medium++; break;
          case 'HIGH': existing.high++; break;
          case 'CRITICAL': existing.critical++; break;
        }
      }
    });
    
    this.riskDistribution = labels.map(label => ({
      label,
      low: dataMap.get(label)?.low || 0,
      medium: dataMap.get(label)?.medium || 0,
      high: dataMap.get(label)?.high || 0,
      critical: dataMap.get(label)?.critical || 0
    }));
  }
  
  getWeekNumber(date: Date): number {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / 86400000);
    return Math.ceil((days + startDate.getDay() + 1) / 7);
  }
  
  onTimePeriodChange(): void {
    // Clear existing mini charts
    this.miniCharts.forEach((chart, key) => {
      chart.destroy();
    });
    this.miniCharts.clear();
    
    this.calculateTimeBasedData();
    this.initAllCharts();
  }
  
  initAllCharts(): void {
    this.initStatusChart();
    this.initTrendChart();
    this.initRiskTrendChart();
    this.initRiskDonutChart();
    this.initPremiumTrendChart();
    this.initRiskStackedAreaChart();
    this.initMiniPieCharts();
  }
  
  initStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Pending', 'Expired', 'Cancelled', 'Completed'],
        datasets: [{
          data: [this.stats.active, this.stats.pending, this.stats.expired, 
                 this.stats.cancelled, this.stats.completed],
          backgroundColor: ['#28a745', '#ffc107', '#6c757d', '#dc3545', '#17a2b8'],
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Contract Status Distribution', font: { size: 16, weight: 'bold' } }
        }
      }
    });
  }
  
  initTrendChart(): void {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.contractsByPeriod.map(d => d.label),
        datasets: [
          {
            label: 'Active Contracts',
            data: this.contractsByPeriod.map(d => d.active),
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pending Contracts',
            data: this.contractsByPeriod.map(d => d.pending),
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Rejected Contracts',
            data: this.contractsByPeriod.map(d => d.rejected),
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: true, text: `Contract Trends (By ${this.timePeriod})`, font: { size: 16, weight: 'bold' } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Contracts' } },
          x: { title: { display: true, text: this.timePeriod === 'day' ? 'Day' : this.timePeriod === 'week' ? 'Week' : this.timePeriod === 'month' ? 'Month' : 'Year' } }
        }
      }
    });
  }
  
  initRiskTrendChart(): void {
    const canvas = document.getElementById('riskTrendChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.riskDistribution.map(d => d.label),
        datasets: [
          { label: 'Low Risk', data: this.riskDistribution.map(d => d.low), backgroundColor: '#28a745', borderRadius: 5 },
          { label: 'Medium Risk', data: this.riskDistribution.map(d => d.medium), backgroundColor: '#ffc107', borderRadius: 5 },
          { label: 'High Risk', data: this.riskDistribution.map(d => d.high), backgroundColor: '#fd7e14', borderRadius: 5 },
          { label: 'Critical Risk', data: this.riskDistribution.map(d => d.critical), backgroundColor: '#dc3545', borderRadius: 5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: `Risk Distribution Over Time (By ${this.timePeriod})`, font: { size: 16, weight: 'bold' } },
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Contracts' }, stacked: true },
          x: { title: { display: true, text: this.timePeriod === 'day' ? 'Day' : this.timePeriod === 'week' ? 'Week' : this.timePeriod === 'month' ? 'Month' : 'Year' } }
        }
      }
    });
  }
  
  initRiskDonutChart(): void {
    const canvas = document.getElementById('riskDonutChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
        datasets: [{
          data: [this.stats.lowRisk, this.stats.mediumRisk, this.stats.highRisk, this.stats.criticalRisk],
          backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Overall Risk Distribution', font: { size: 16, weight: 'bold' } }
        }
      }
    });
  }
  
  initPremiumTrendChart(): void {
    const canvas = document.getElementById('premiumTrendChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    const premiumByPeriod = this.contractsByPeriod.map(period => {
      let total = 0;
      this.contracts.forEach(contract => {
        const startDate = new Date(contract.startDate);
        let periodKey = '';
        switch(this.timePeriod) {
          case 'day': periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); break;
          case 'week': periodKey = `Week ${this.getWeekNumber(startDate)}`; break;
          case 'month': periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); break;
          case 'year': periodKey = startDate.getFullYear().toString(); break;
        }
        if (periodKey === period.label) total += contract.premium;
      });
      return total;
    });
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.contractsByPeriod.map(d => d.label),
        datasets: [{
          label: 'Total Premium (DT)',
          data: premiumByPeriod,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: `Premium Trends (By ${this.timePeriod})`, font: { size: 16, weight: 'bold' } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Premium Amount (DT)' } }
        }
      }
    });
  }
  
  initRiskStackedAreaChart(): void {
    const canvas = document.getElementById('riskStackedAreaChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.riskDistribution.map(d => d.label),
        datasets: [
          { 
            label: 'Low Risk', 
            data: this.riskDistribution.map(d => d.low), 
            borderColor: '#28a745', 
            backgroundColor: 'rgba(40, 167, 69, 0.3)', 
            fill: true, 
            tension: 0.4 
          },
          { 
            label: 'Medium Risk', 
            data: this.riskDistribution.map(d => d.medium), 
            borderColor: '#ffc107', 
            backgroundColor: 'rgba(255, 193, 7, 0.3)', 
            fill: true, 
            tension: 0.4 
          },
          { 
            label: 'High Risk', 
            data: this.riskDistribution.map(d => d.high), 
            borderColor: '#fd7e14', 
            backgroundColor: 'rgba(253, 126, 20, 0.3)', 
            fill: true, 
            tension: 0.4 
          },
          { 
            label: 'Critical Risk', 
            data: this.riskDistribution.map(d => d.critical), 
            borderColor: '#dc3545', 
            backgroundColor: 'rgba(220, 53, 69, 0.3)', 
            fill: true, 
            tension: 0.4 
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { 
          title: { display: true, text: `Risk Distribution Over Time (Stacked Area)`, font: { size: 16, weight: 'bold' } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: { 
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Number of Contracts' } }, 
          x: { stacked: true, title: { display: true, text: this.timePeriod === 'day' ? 'Day' : this.timePeriod === 'week' ? 'Week' : this.timePeriod === 'month' ? 'Month' : 'Year' } } 
        }
      }
    });
  }
  
  initMiniPieCharts(): void {
    setTimeout(() => {
      this.contractsByPeriod.forEach(period => {
        const canvas = document.getElementById(period.chartId) as HTMLCanvasElement;
        if (canvas && !this.miniCharts.has(period.chartId)) {
          const total = period.active + period.pending + period.rejected;
          if (total > 0) {
            const chart = new Chart(canvas, {
              type: 'doughnut',
              data: {
                datasets: [{
                  data: [period.active, period.pending, period.rejected],
                  backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                  borderWidth: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
              }
            });
            this.miniCharts.set(period.chartId, chart);
          }
        }
      });
    }, 100);
  }
  
  getRiskPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }
  
  getTotalRisk(period: any): number {
    return period.low + period.medium + period.high + period.critical;
  }
  
  getRiskLevelColor(riskLevel: string): string {
    const colors = { 'LOW': '#28a745', 'MEDIUM': '#ffc107', 'HIGH': '#fd7e14', 'CRITICAL': '#dc3545' };
    return colors[riskLevel as keyof typeof colors] || '#6c757d';
  }
  
  getStatusColor(status: string): string {
    const colors = { 'ACTIVE': '#28a745', 'INACTIVE': '#ffc107', 'EXPIRED': '#6c757d', 'CANCELLED': '#dc3545', 'COMPLETED': '#17a2b8' };
    return colors[status as keyof typeof colors] || '#6c757d';
  }
  
  showRiskPeriodDetails(period: any): void {
    const contracts = this.contracts.filter(contract => {
      const startDate = new Date(contract.startDate);
      const riskEval = this.riskEvaluations.get(contract.contractId);
      let periodKey = '';
      switch(this.timePeriod) {
        case 'day': periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); break;
        case 'week': periodKey = `Week ${this.getWeekNumber(startDate)}`; break;
        case 'month': periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); break;
        case 'year': periodKey = startDate.getFullYear().toString(); break;
      }
      return periodKey === period.label && riskEval;
    });
    
    this.selectedDetailData = {
      title: `Risk Details - ${period.label}`,
      period: period.label,
      contracts: contracts
    };
    this.showDetailsModal = true;
  }
  
  showStatusPeriodDetails(period: any): void {
    const contracts = this.contracts.filter(contract => {
      const startDate = new Date(contract.startDate);
      let periodKey = '';
      switch(this.timePeriod) {
        case 'day': periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); break;
        case 'week': periodKey = `Week ${this.getWeekNumber(startDate)}`; break;
        case 'month': periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); break;
        case 'year': periodKey = startDate.getFullYear().toString(); break;
      }
      return periodKey === period.label;
    });
    
    this.selectedDetailData = {
      title: `Contract Status Details - ${period.label}`,
      period: period.label,
      contracts: contracts
    };
    this.showDetailsModal = true;
  }
  
  showContractDetails(type: string, period: string, status: string): void {
    const contracts = this.contracts.filter(contract => {
      const startDate = new Date(contract.startDate);
      let periodKey = '';
      switch(this.timePeriod) {
        case 'day': periodKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); break;
        case 'week': periodKey = `Week ${this.getWeekNumber(startDate)}`; break;
        case 'month': periodKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); break;
        case 'year': periodKey = startDate.getFullYear().toString(); break;
      }
      return periodKey === period && contract.status === status;
    });
    
    this.selectedDetailData = { type, period, status, contracts, title: `${status} Contracts - ${period}` };
    this.showDetailsModal = true;
  }
  
  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedDetailData = null;
  }
  
  exportToCSV(): void {
    const csvData = this.contracts.map(contract => ({
      'ID': contract.contractId,
      'Client': `${contract.client?.firstName} ${contract.client?.lastName}`,
      'Status': contract.status,
      'Premium': contract.premium,
      'Risk Level': this.riskEvaluations.get(contract.contractId)?.globalRiskLevel || 'N/A',
      'Risk Score': this.riskEvaluations.get(contract.contractId)?.globalRiskScore || 'N/A',
      'Start Date': new Date(contract.startDate).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(','), ...csvData.map(row => headers.map(h => JSON.stringify(row[h as keyof typeof row])).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}