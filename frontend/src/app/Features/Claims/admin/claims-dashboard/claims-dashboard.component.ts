// claims-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClaimDTO } from '../../../../shared/dto/claim-dto.model';
import { ClaimsService } from '../../services/claims.service';
import { ClaimStatus } from '../../../../shared/enums/claim-status.enum';
import { ClientStat } from '../../../../shared/models/client-stat.model';
import { ClaimScoreDTO, DetailedAnalysis } from '../../../../shared/dto/scoring-dto.model';

@Component({
  selector: 'app-claims-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './claims-dashboard.component.html',
  styleUrls: ['./claims-dashboard.component.css']
})
export class ClaimsDashboardComponent implements OnInit {
  claims: ClaimDTO[] = [];
  loading = false;
  
  // Statistiques globales
  totalClaims = 0;
  approvedClaims = 0;
  rejectedClaims = 0;
  pendingClaims = 0;
  inReviewClaims = 0;
  compensatedClaims = 0;
  
  // Taux d'approbation
  approvalRate = 0;
  
  // Statistiques par client
  clientStats: ClientStat[] = [];
  topClients: ClientStat[] = [];
  
  // Données pour les graphiques
  statusDistribution = [
    { name: 'Approved', value: 0, color: '#10b981', icon: '✅' },
    { name: 'Rejected', value: 0, color: '#ef4444', icon: '❌' },
    { name: 'Declared', value: 0, color: '#f59e0b', icon: '⏳' },
    { name: 'In Review', value: 0, color: '#3b82f6', icon: '🔍' },
    { name: 'Compensated', value: 0, color: '#8b5cf6', icon: '💰' }
  ];
  
  // Montants par mois
  monthlyData: { month: string, claimed: number, approved: number, year: number, monthNum: number }[] = [];
  
  // Données pour les tendances
  weeklyTrend: { day: string, count: number }[] = [];
  
  // Scoring data
  claimScores: Map<number, ClaimScoreDTO> = new Map();
  selectedClaimAnalysis: DetailedAnalysis | null = null;
  showScoringModal = false;
  scoringLoading = false;
  
  constructor(
    private claimsService: ClaimsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading = true;
    this.claimsService.getMyClaims().subscribe({
      next: (claims) => {
        this.claims = claims;
        this.calculateStatistics();
        this.loadScoresForClaims();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.loading = false;
      }
    });
  }

  loadScoresForClaims() {
    this.claims.forEach(claim => {
      if (claim.claimId) {
        this.claimsService.getAdvancedClaimScore(claim.claimId).subscribe({
          next: (score) => {
            this.claimScores.set(claim.claimId!, score);
          },
          error: (err) => console.error(`Error loading score for claim ${claim.claimId}:`, err)
        });
      }
    });
  }

  calculateStatistics() {
    this.totalClaims = this.claims.length;
    this.approvedClaims = this.claims.filter(c => c.status === ClaimStatus.APPROVED).length;
    this.rejectedClaims = this.claims.filter(c => c.status === ClaimStatus.REJECTED).length;
    this.pendingClaims = this.claims.filter(c => c.status === ClaimStatus.DECLARED).length;
    this.inReviewClaims = this.claims.filter(c => c.status === ClaimStatus.IN_REVIEW).length;
    this.compensatedClaims = this.claims.filter(c => c.status === ClaimStatus.COMPENSATED).length;
    
    this.statusDistribution = [
      { name: 'Approved', value: this.approvedClaims, color: '#10b981', icon: '✅' },
      { name: 'Rejected', value: this.rejectedClaims, color: '#ef4444', icon: '❌' },
      { name: 'Declared', value: this.pendingClaims, color: '#f59e0b', icon: '⏳' },
      { name: 'In Review', value: this.inReviewClaims, color: '#3b82f6', icon: '🔍' },
      { name: 'Compensated', value: this.compensatedClaims, color: '#8b5cf6', icon: '💰' }
    ];
    
    const completedClaims = this.approvedClaims + this.rejectedClaims;
    this.approvalRate = completedClaims > 0 
      ? (this.approvedClaims / completedClaims) * 100 
      : 0;
    
    const clientMap = new Map<number, ClientStat>();
    
    this.claims.forEach(claim => {
      const clientId = claim.client?.id;
      const clientName = claim.client 
        ? `${claim.client.firstName} ${claim.client.lastName}`
        : `Client ${clientId}`;
      
      if (!clientId) return;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName,
          totalClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          pendingClaims: 0,
          inReviewClaims: 0,
          compensatedClaims: 0,
          totalAmount: 0,
          approvedAmount: 0
        });
      }
      
      const stat = clientMap.get(clientId)!;
      stat.totalClaims++;
      stat.totalAmount += claim.claimedAmount;
      stat.approvedAmount += claim.approvedAmount || 0;
      
      switch(claim.status) {
        case ClaimStatus.APPROVED:
          stat.approvedClaims++;
          break;
        case ClaimStatus.REJECTED:
          stat.rejectedClaims++;
          break;
        case ClaimStatus.DECLARED:
          stat.pendingClaims++;
          break;
        case ClaimStatus.IN_REVIEW:
          stat.inReviewClaims++;
          break;
        case ClaimStatus.COMPENSATED:
          stat.compensatedClaims++;
          break;
      }
    });
    
    this.clientStats = Array.from(clientMap.values())
      .sort((a, b) => b.totalClaims - a.totalClaims);
    
    this.topClients = this.clientStats.slice(0, 5);
    this.calculateMonthlyData();
    this.calculateWeeklyTrend();
  }
  
  calculateMonthlyData() {
    const monthlyMap = new Map<string, { claimed: number, approved: number, year: number, monthNum: number }>();
    
    this.claims.forEach(claim => {
      if (!claim.claimDate) return;
      
      const date = new Date(claim.claimDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { 
          claimed: 0, 
          approved: 0, 
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1
        });
      }
      
      const data = monthlyMap.get(monthKey)!;
      data.claimed += claim.claimedAmount;
      if (claim.approvedAmount) {
        data.approved += claim.approvedAmount;
      }
    });
    
    this.monthlyData = Array.from(monthlyMap.entries())
      .map(([key, value]) => ({
        month: key,
        claimed: value.claimed,
        approved: value.approved,
        year: value.year,
        monthNum: value.monthNum
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .slice(-6);
  }
  
  calculateWeeklyTrend() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyMap = new Map<string, number>();
    
    days.forEach(day => weeklyMap.set(day, 0));
    
    this.claims.forEach(claim => {
      if (!claim.claimDate) return;
      const date = new Date(claim.claimDate);
      const dayIndex = date.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
      weeklyMap.set(dayName, (weeklyMap.get(dayName) || 0) + 1);
    });
    
    this.weeklyTrend = days.map(day => ({
      day,
      count: weeklyMap.get(day) || 0
    }));
  }

  // ============ SCORING METHODS ============
  
  getClaimScore(claimId: number): ClaimScoreDTO | undefined {
    return this.claimScores.get(claimId);
  }
  
  getRiskClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'moderate';
    if (score >= 35) return 'risky';
    return 'critical';
  }
  
  getRiskIcon(riskLevel: string): string {
    switch(riskLevel) {
      case 'TRES_FAIBLE': return '🟢';
      case 'FAIBLE': return '🟢';
      case 'MODERE': return '🟡';
      case 'ELEVE': return '🟠';
      case 'TRES_ELEVE': return '🔴';
      default: return '⚪';
    }
  }
  
  getRiskText(riskLevel: string): string {
    switch(riskLevel) {
      case 'TRES_FAIBLE': return 'Very Low Risk';
      case 'FAIBLE': return 'Low Risk';
      case 'MODERE': return 'Moderate Risk';
      case 'ELEVE': return 'High Risk';
      case 'TRES_ELEVE': return 'Critical Risk';
      default: return 'Unknown';
    }
  }
  
  viewDetailedAnalysis(claim: ClaimDTO) {
    if (!claim.claimId) return;
    
    this.scoringLoading = true;
    this.showScoringModal = true;
    
    this.claimsService.getDetailedClaimAnalysis(claim.claimId).subscribe({
      next: (analysis) => {
        this.selectedClaimAnalysis = analysis;
        this.scoringLoading = false;
      },
      error: (error) => {
        console.error('Error loading analysis:', error);
        this.scoringLoading = false;
      }
    });
  }
  
  autoDecisionWithAI(claimId: number) {
    if (!confirm('🤖 AI Decision: The system will analyze this claim using advanced scoring and decide automatically. Continue?')) return;
    
    this.claimsService.autoDecisionWithAdvancedScoring(claimId).subscribe({
      next: (updatedClaim) => {
        const index = this.claims.findIndex(c => c.claimId === updatedClaim.claimId);
        if (index !== -1) {
          this.claims[index] = updatedClaim;
        }
        this.loadScoresForClaims();
        this.successMessage = '✅ AI decision completed successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = '❌ AI decision failed. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }
  
  closeScoringModal() {
    this.showScoringModal = false;
    this.selectedClaimAnalysis = null;
  }
  
  extractPercentage(recommendation: string, factorName: string): number {
    const match = recommendation.match(new RegExp(`${factorName}: (\\d+)/100`));
    return match ? parseInt(match[1]) : 0;
  }

  // ============ EXISTING METHODS ============
  
  getClientApprovalRate(client: ClientStat): number {
    const completed = client.approvedClaims + client.rejectedClaims;
    return completed > 0 ? (client.approvedClaims / completed) * 100 : 0;
  }
  
  getMaxAmount(): number {
    return Math.max(...this.monthlyData.map(d => d.claimed), 1);
  }
  
  getMaxWeeklyCount(): number {
    return Math.max(...this.weeklyTrend.map(d => d.count), 1);
  }

  formatAmount(amount: number): string {
    return amount ? amount.toLocaleString('fr-TN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) : '0';
  }

  getTotalClaimedAmount(): number {
    return this.claims.reduce((sum, claim) => sum + claim.claimedAmount, 0);
  }

  getTotalApprovedAmount(): number {
    return this.claims.reduce((sum, claim) => sum + (claim.approvedAmount || 0), 0);
  }

  getAverageClaimAmount(): number {
    return this.totalClaims > 0 ? this.getTotalClaimedAmount() / this.totalClaims : 0;
  }

  goBack() {
    this.router.navigate(['/backoffice/claims']);
  }

  viewClientClaims(clientId: number) {
    this.router.navigate(['/backoffice/claims'], { queryParams: { clientId } });
  }
  
  get donutChartData() {
    let cumulativePercent = 0;
    return this.statusDistribution.filter(s => s.value > 0).map(item => {
      const percent = this.totalClaims > 0 ? (item.value / this.totalClaims) * 100 : 0;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return { ...item, percent, start, end: cumulativePercent };
    });
  }

  getCurrentDate(): string {
    const date = new Date();
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('fr-FR', { month: 'short' });
  }

  getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getAvatarColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ef4444, #dc2626)'
    ];
    return colors[index % colors.length];
  }

  // ============ AI INSIGHTS METHODS ============
  
  getAIMessage(): string {
    if (this.totalClaims === 0) return "No claims data available for analysis.";
    
    const insights = [];
    
    if (this.approvalRate > 70) {
      insights.push("Excellent approval rate! 🎉 Your claims processing is highly efficient.");
    } else if (this.approvalRate > 50) {
      insights.push("Good approval rate. There's room for improvement in claim quality.");
    } else {
      insights.push("Approval rate needs attention. Consider reviewing claim submission guidelines.");
    }
    
    if (this.pendingClaims > this.totalClaims * 0.3) {
      insights.push(`${this.pendingClaims} claims pending review - suggest prioritizing these for faster resolution.`);
    }
    
    if (this.rejectedClaims > this.approvedClaims) {
      insights.push("More rejections than approvals detected. Review rejection patterns to identify common issues.");
    }
    
    return insights.join(" ");
  }

  refreshAIInsights(): void {
    this.loadClaims();
  }

  predictNextMonth(): number {
    if (this.monthlyData.length < 2) return 0;
    const recentAvg = this.monthlyData.slice(-3).reduce((sum, d) => sum + d.claimed, 0) / 3;
    const firstAmount = this.monthlyData[0].claimed;
    const lastAmount = this.monthlyData[this.monthlyData.length - 1].claimed;
    const growth = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;
    return Math.round(recentAvg * (1 + growth / 100));
  }

  getApprovalTrend(): string {
    if (this.approvalRate > 70) return "↑ Excellent";
    if (this.approvalRate > 50) return "↑ Good";
    if (this.approvalRate > 30) return "↓ Needs improvement";
    return "↓ Critical";
  }

  getRejectionReason(): string {
    const rejectionRate = (this.rejectedClaims / this.totalClaims) * 100;
    if (rejectionRate > 30) return "High rejection rate";
    if (rejectionRate > 15) return "Moderate rejections";
    return "Low rejections";
  }

  getAverageProcessingTime(): number {
    return Math.max(3, Math.min(30, Math.round(this.pendingClaims * 1.5)));
  }

  getSuccessRateAnalysis(): string {
    if (this.approvalRate >= 80) return "Excellent performance";
    if (this.approvalRate >= 60) return "Above average";
    if (this.approvalRate >= 40) return "Average performance";
    return "Needs improvement";
  }

  getPerformanceScore(): number {
    const efficiencyScore = (this.approvedClaims / (this.approvedClaims + this.rejectedClaims + 1)) * 100;
    const volumeScore = Math.min(100, (this.totalClaims / 10) * 20);
    const pendingPenalty = Math.max(0, 100 - (this.pendingClaims * 5));
    return Math.min(100, Math.max(0, Math.round((efficiencyScore + volumeScore + pendingPenalty) / 3)));
  }

  getEfficiencyScore(): number {
    return Math.min(100, Math.round((this.approvedClaims / (this.approvedClaims + this.rejectedClaims + 1)) * 100));
  }

  getAccuracyScore(): number {
    if (this.totalClaims === 0) return 0;
    const accuracy = ((this.approvedClaims + this.rejectedClaims) / this.totalClaims) * 100;
    return Math.min(100, Math.round(accuracy));
  }

  getSpeedScore(): number {
    const speed = Math.max(0, 100 - (this.pendingClaims * 2));
    return Math.min(100, Math.round(speed));
  }

  getDistributionInsight(): string {
    const approved = this.statusDistribution[0].value;
    const rejected = this.statusDistribution[1].value;
    
    if (approved > rejected) {
      return `Approved claims (${approved}) outnumber rejections (${rejected}) by ${Math.round((approved / (rejected + 1)) * 100)}%`;
    } else if (rejected > approved) {
      return `Rejection rate is ${Math.round((rejected / (approved + rejected)) * 100)}% - consider reviewing submission quality`;
    }
    return "Balanced approval and rejection rates";
  }

  getHeatmapColor(value: number, max: number): string {
    const intensity = value / max;
    if (intensity > 0.7) return '#ef4444';
    if (intensity > 0.4) return '#f59e0b';
    if (intensity > 0.1) return '#10b981';
    return '#3b82f6';
  }

  getPeakActivityDay(): string {
    if (this.weeklyTrend.length === 0) return 'N/A';
    const peak = [...this.weeklyTrend].sort((a, b) => b.count - a.count)[0];
    return peak.day;
  }

  getPeakActivityCount(): number {
    if (this.weeklyTrend.length === 0) return 0;
    return Math.max(...this.weeklyTrend.map(d => d.count));
  }

  getForecastAmount(): number {
    if (this.monthlyData.length === 0) return 0;
    const lastThree = this.monthlyData.slice(-3);
    if (lastThree.length < 2) return lastThree[0]?.claimed || 0;
    const avgGrowth = (lastThree[lastThree.length - 1].claimed - lastThree[0].claimed) / 3;
    return Math.max(0, lastThree[lastThree.length - 1].claimed + avgGrowth);
  }

  getForecastHeight(): number {
    const maxAmount = this.getMaxAmount();
    const forecast = this.getForecastAmount();
    return Math.min(70, (forecast / maxAmount) * 70);
  }

  getTrendPrediction(): string {
    if (this.monthlyData.length < 2) return "Insufficient data for prediction";
    
    const lastMonth = this.monthlyData[this.monthlyData.length - 1];
    const prevMonth = this.monthlyData[this.monthlyData.length - 2];
    const growth = ((lastMonth.claimed - prevMonth.claimed) / prevMonth.claimed) * 100;
    
    if (growth > 10) return `Claims volume expected to increase by ${growth.toFixed(1)}% next month`;
    if (growth < -10) return `Claims volume expected to decrease by ${Math.abs(growth).toFixed(1)}% next month`;
    return `Stable claim volume expected (±${Math.abs(growth).toFixed(1)}%)`;
  }

  getRiskAlert(): string {
    const rejectionRate = (this.rejectedClaims / this.totalClaims) * 100;
    const pendingRate = (this.pendingClaims / this.totalClaims) * 100;
    
    if (rejectionRate > 30) {
      return "⚠️ High rejection rate detected. Review claim quality standards.";
    }
    if (pendingRate > 40) {
      return "⚠️ Large backlog detected. Consider increasing processing capacity.";
    }
    if (this.approvalRate < 30) {
      return "⚠️ Critical approval rate. Immediate action recommended.";
    }
    return "✓ All metrics within normal ranges";
  }

  getClientRiskLevel(client: ClientStat): string {
    const rejectionRate = (client.rejectedClaims / client.totalClaims) * 100;
    if (rejectionRate > 40) return "High";
    if (rejectionRate > 20) return "Medium";
    return "Low";
  }

  getClientTrend(client: ClientStat): string {
    const rate = (client.approvedClaims / client.totalClaims) * 100;
    if (rate > 70) return "↑ Excellent";
    if (rate > 50) return "↗ Good";
    if (rate > 30) return "→ Average";
    return "↓ Poor";
  }

  getGrowthRate(): number {
    if (this.monthlyData.length < 2) return 0;
    const lastMonth = this.monthlyData[this.monthlyData.length - 1];
    const prevMonth = this.monthlyData[this.monthlyData.length - 2];
    return Math.round(((lastMonth.claimed - prevMonth.claimed) / prevMonth.claimed) * 100);
  }

  getApprovedGrowth(): string {
    const growth = this.getGrowthRate();
    if (growth > 0) return `+${growth}%`;
    if (growth < 0) return `${growth}%`;
    return "Stable";
  }

  getProcessingImprovement(): number {
    return Math.min(30, Math.round(this.pendingClaims * 2));
  }

  getAIConfidence(): number {
    if (this.totalClaims < 5) return 65;
    if (this.totalClaims < 20) return 75;
    if (this.totalClaims < 50) return 85;
    return 92;
  }

  // Message state
  successMessage = '';
  errorMessage = '';
}