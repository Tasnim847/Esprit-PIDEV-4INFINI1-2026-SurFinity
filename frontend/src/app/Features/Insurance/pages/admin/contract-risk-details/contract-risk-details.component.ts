import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../../services/contract.service';
import { Chart, registerables } from 'chart.js';
import { RiskEvaluationDTO } from '../../../../../shared/dto/risk-evaluation.dto';
import { CategoryRiskDTO } from '../../../../../shared/dto/category-risk.dto';
import { RiskFactorDTO } from '../../../../../shared/dto/risk-factor.dto';

Chart.register(...registerables);

// Interface for analysis sections
interface AnalysisSection {
  title: string;
  icon: string;
  color: string;
  points: { label: string; value: string | number; icon?: string }[];
  score?: number;
}

@Component({
  selector: 'app-contract-risk-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contract-risk-details.component.html',
  styleUrls: ['./contract-risk-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractRiskDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('riskGaugeCanvas') riskGaugeCanvas!: ElementRef;
  @ViewChild('categoriesChartCanvas') categoriesChartCanvas!: ElementRef;
  @ViewChild('riskFactorsChartCanvas') riskFactorsChartCanvas!: ElementRef;
  @ViewChild('indicatorsRadarCanvas') indicatorsRadarCanvas!: ElementRef;

  riskEvaluation: RiskEvaluationDTO | null = null;
  isLoading = true;
  errorMessage = '';
  contractId: number = 0;

  // Simplified risk indicators
  riskIndicators = {
    financialScore: 0,
    clientScore: 0,
    productScore: 0,
    temporalScore: 0,
    globalScore: 0
  };

  // Cache for analyzed sections
  private cachedAnalysisSections: AnalysisSection[] | null = null;
  private cachedCategoriesArray: CategoryRiskDTO[] | null = null;
  private cachedRiskFactors: RiskFactorDTO[] | null = null;
  private cachedPositivePoints: string[] | null = null;
  private cachedRecommendedActions: string[] | null = null;

  // Charts
  riskGaugeChart: Chart | null = null;
  categoriesChart: Chart | null = null;
  riskFactorsChart: Chart | null = null;
  indicatorsRadarChart: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.contractId = +params['id'];
      if (this.contractId) {
        this.loadRiskEvaluation();
      }
    });
  }

  ngAfterViewInit(): void {}

  loadRiskEvaluation(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.contractService.getRiskEvaluationFromApi(this.contractId).subscribe({
      next: (evaluation) => {
        this.riskEvaluation = evaluation;
        this.clearCache();
        this.calculateIndicatorsFromCategories();
        this.isLoading = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.createAllCharts();
        }, 50);
      },
      error: (err) => {
        console.error('Error:', err);
        this.errorMessage = 'Unable to load risk evaluation';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearCache(): void {
    this.cachedAnalysisSections = null;
    this.cachedCategoriesArray = null;
    this.cachedRiskFactors = null;
    this.cachedPositivePoints = null;
    this.cachedRecommendedActions = null;
  }

  calculateIndicatorsFromCategories(): void {
    const categories = this.getCategoriesArray();
    if (categories.length === 0) return;
    
    for (const cat of categories) {
      switch (cat.categoryName) {
        case 'Aspects Financiers':
          this.riskIndicators.financialScore = cat.score;
          break;
        case 'Profil Client':
          this.riskIndicators.clientScore = cat.score;
          break;
        case 'Type de Produit':
          this.riskIndicators.productScore = cat.score;
          break;
        case 'Durée et Temporalité':
          this.riskIndicators.temporalScore = cat.score;
          break;
      }
    }
    this.riskIndicators.globalScore = this.getRiskScore();
  }

  createAllCharts(): void {
    this.createRiskGaugeChart();
    this.createCategoriesChart();
    this.createRiskFactorsChart();
    this.createIndicatorsRadarChart();
  }

  createRiskGaugeChart(): void {
    if (!this.riskGaugeCanvas || this.riskGaugeChart) return;
    
    const score = this.getRiskScore();
    const ctx = this.riskGaugeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.riskGaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [this.getRiskColor(score), '#e9ecef'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: { tooltip: { enabled: false }, legend: { display: false } }
      }
    });
  }

  createCategoriesChart(): void {
    const categories = this.getCategoriesArray();
    if (!this.categoriesChartCanvas || categories.length === 0 || this.categoriesChart) return;
    
    const ctx = this.categoriesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.categoriesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.categoryName),
        datasets: [
          {
            label: 'Risk Score',
            data: categories.map(c => c.score),
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1,
            borderRadius: 8
          },
          {
            label: 'Weight (%)',
            data: categories.map(c => c.weight * 100),
            backgroundColor: 'rgba(46, 204, 113, 0.7)',
            borderColor: 'rgba(46, 204, 113, 1)',
            borderWidth: 1,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Value', font: { size: 12 } } },
          x: { title: { display: true, text: 'Categories', font: { size: 12 } } }
        }
      }
    });
  }

  createRiskFactorsChart(): void {
    const factors = this.getRiskFactors();
    if (!this.riskFactorsChartCanvas || factors.length === 0 || this.riskFactorsChart) return;
    
    const ctx = this.riskFactorsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const impactCount = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    factors.forEach(f => {
      const impact = f.impact?.toUpperCase() || 'MEDIUM';
      if (impact === 'HIGH') impactCount.HIGH++;
      else if (impact === 'MEDIUM') impactCount.MEDIUM++;
      else impactCount.LOW++;
    });
    
    this.riskFactorsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['High Impact', 'Medium Impact', 'Low Impact'],
        datasets: [{
          data: [impactCount.HIGH, impactCount.MEDIUM, impactCount.LOW],
          backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  createIndicatorsRadarChart(): void {
    if (!this.indicatorsRadarCanvas || this.indicatorsRadarChart) return;
    
    const ctx = this.indicatorsRadarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.indicatorsRadarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Financial Aspects', 'Client Profile', 'Product Type', 'Contract Duration'],
        datasets: [{
          label: 'Risk Score (%)',
          data: [
            this.riskIndicators.financialScore,
            this.riskIndicators.clientScore,
            this.riskIndicators.productScore,
            this.riskIndicators.temporalScore
          ],
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(52, 152, 219, 1)',
          pointBorderColor: '#fff',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } }
      }
    });
  }

  // ========== UTILITY METHODS WITH CACHE ==========
  
  getRiskColor(score: number): string {
    if (score >= 70) return '#dc3545';
    if (score >= 40) return '#ffc107';
    return '#28a745';
  }

  getIndicatorClass(value: number): string {
    if (value >= 70) return 'indicator-high';
    if (value >= 40) return 'indicator-medium';
    return 'indicator-low';
  }

  getRiskScore(): number {
    return this.riskEvaluation?.globalRiskScore || 0;
  }

  getRiskLevel(): string {
    const level = this.riskEvaluation?.globalRiskLevel || 'LOW';
    if (level === 'TRES_ELEVE' || level === 'ELEVE') return 'HIGH';
    if (level === 'MODERE') return 'MEDIUM';
    return 'LOW';
  }

  getRiskLevelLabel(): string {
    const level = this.getRiskLevel();
    const labels: Record<string, string> = { 'HIGH': 'High Risk', 'MEDIUM': 'Medium Risk', 'LOW': 'Low Risk' };
    return labels[level] || level;
  }

  getRiskLevelClass(): string {
    const level = this.getRiskLevel();
    return { 'HIGH': 'risk-high', 'MEDIUM': 'risk-medium', 'LOW': 'risk-low' }[level] || '';
  }

  getGlobalRiskClass(): string { return this.riskEvaluation?.globalRiskClass || ''; }
  getRecommendation(): string { return this.riskEvaluation?.recommendation || ''; }
  isAutoReject(): boolean { return this.riskEvaluation?.autoReject || false; }

  getCategoriesArray(): CategoryRiskDTO[] {
    if (this.cachedCategoriesArray) return this.cachedCategoriesArray;
    if (!this.riskEvaluation?.categories) return [];
    this.cachedCategoriesArray = Object.values(this.riskEvaluation.categories);
    return this.cachedCategoriesArray;
  }

  getRiskFactors(): RiskFactorDTO[] {
    if (this.cachedRiskFactors) return this.cachedRiskFactors;
    this.cachedRiskFactors = this.riskEvaluation?.riskFactors || [];
    return this.cachedRiskFactors;
  }
  
  getPositivePoints(): string[] {
    if (this.cachedPositivePoints) return this.cachedPositivePoints;
    this.cachedPositivePoints = this.riskEvaluation?.positivePoints || [];
    return this.cachedPositivePoints;
  }
  
  getRecommendedActions(): string[] {
    if (this.cachedRecommendedActions) return this.cachedRecommendedActions;
    this.cachedRecommendedActions = this.riskEvaluation?.recommendedActions || [];
    return this.cachedRecommendedActions;
  }
  
  getDetailedReport(): string { return this.riskEvaluation?.detailedReport || ''; }

  getEvaluationDate(): string {
    return this.riskEvaluation?.evaluationDate ? new Date(this.riskEvaluation.evaluationDate).toLocaleDateString('en-GB') : '';
  }

  getAgentName(): string { return this.riskEvaluation?.agentName || ''; }
  getContractReference(): string { return this.riskEvaluation?.contractReference || ''; }

  goBack(): void { this.router.navigate(['/backoffice/insurance']); }

  downloadRiskReport(): void {
    this.contractService.downloadContractPdf(this.contractId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `risk_report_contract_${this.contractId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Download error:', err)
    });
  }

  // ========== DETAILED REPORT METHODS (WITH CACHE) ==========

  parseDetailedReport(): AnalysisSection[] {
    if (this.cachedAnalysisSections) return this.cachedAnalysisSections;
    
    const report = this.getDetailedReport();
    if (!report) return [];
    
    const sections: AnalysisSection[] = [];
    
    // Parse CLIENT section
    const clientMatch = report.match(/ANALYSE CLIENT[\s=]*([\s\S]*?)(?=⚠️ \*\*ANALYSE|$)/i);
    if (clientMatch) {
      const clientText = clientMatch[1];
      const scoreMatch = clientText.match(/Score Client:\s*([0-9,.]+)/i);
      const riskLevelMatch = clientText.match(/Niveau de risque:\s*(\w+)/i);
      
      sections.push({
        title: 'Client Profile',
        icon: 'bi bi-person-badge',
        color: '#3498db',
        score: scoreMatch ? parseFloat(scoreMatch[1].replace(',', '.')) : undefined,
        points: [
          { label: 'Score', value: scoreMatch ? scoreMatch[1] : 'N/A', icon: 'bi bi-graph-up' },
          { label: 'Risk Level', value: riskLevelMatch ? riskLevelMatch[1] : 'N/A', icon: 'bi bi-shield' },
          { label: 'Class', value: this.extractValue(clientText, 'Classe de risque:'), icon: 'bi bi-trophy' }
        ]
      });
    }
    
    // Parse PRODUCT section
    const productMatch = report.match(/ANALYSE DU PRODUIT[\s=]*([\s\S]*?)(?=⚠️ \*\*ANALYSE|$)/i);
    if (productMatch) {
      const productText = productMatch[1];
      const typeMatch = productText.match(/Type de produit:\s*(\w+)/i);
      const pointsMatch = productText.match(/Produit auto:\s*\+(\d+)/i);
      
      sections.push({
        title: 'Product Analysis',
        icon: 'bi bi-box-seam',
        color: '#e67e22',
        points: [
          { label: 'Type', value: typeMatch ? typeMatch[1] : 'N/A', icon: 'bi bi-tag' },
          { label: 'Bonus Points', value: pointsMatch ? `+${pointsMatch[1]}` : '0', icon: 'bi bi-plus-circle' }
        ]
      });
    }
    
    // Parse FINANCIAL section
    const financialMatch = report.match(/ANALYSE FINANCIÈRE[\s=]*([\s\S]*?)(?=⚠️ \*\*ANALYSE|$)/i);
    if (financialMatch) {
      const financialText = financialMatch[1];
      const franchiseMatch = financialText.match(/Franchise:\s*([0-9,.]+)/i);
      const plafondMatch = financialText.match(/Plafond de couverture:\s*([0-9,.]+)/i);
      
      sections.push({
        title: 'Financial Analysis',
        icon: 'bi bi-cash-stack',
        color: '#27ae60',
        points: [
          { label: 'Deductible', value: franchiseMatch ? `${franchiseMatch[1]} DT` : 'N/A', icon: 'bi bi-receipt' },
          { label: 'Coverage Limit', value: plafondMatch ? `${plafondMatch[1]} DT` : 'N/A', icon: 'bi bi-credit-card' }
        ]
      });
    }
    
    // Parse TEMPORAL section
    const temporalMatch = report.match(/ANALYSE TEMPORELLE[\s=]*([\s\S]*?)(?=⚠️ \*\*ANALYSE|$)/i);
    if (temporalMatch) {
      const temporalText = temporalMatch[1];
      const durationMatch = temporalText.match(/Durée du contrat:\s*(\d+)/i);
      
      sections.push({
        title: 'Temporal Analysis',
        icon: 'bi bi-calendar-clock',
        color: '#8e44ad',
        points: [
          { label: 'Duration', value: durationMatch ? `${durationMatch[1]} years` : 'N/A', icon: 'bi bi-hourglass' }
        ]
      });
    }
    
    // Extract risk factors
    const riskFactorsMatch = report.match(/Facteurs de risque identifiés:[\s-]*([\s\S]*?)(?=⚠️ \*\*RECOMMANDATION|$)/i);
    if (riskFactorsMatch) {
      const riskText = riskFactorsMatch[1];
      const risks = riskText.split('-').filter(r => r.trim());
      
      sections.push({
        title: 'Risk Factors',
        icon: 'bi bi-exclamation-triangle',
        color: '#e74c3c',
        points: risks.map(r => ({ label: '', value: r.trim(), icon: 'bi bi-dot' }))
      });
    }
    
    // Extract recommendation
    const recommendationMatch = report.match(/RECOMMANDATION:\s*([\s\S]*?)$/i);
    if (recommendationMatch) {
      sections.push({
        title: 'Recommendation',
        icon: 'bi bi-lightbulb',
        color: '#f39c12',
        points: [{ label: '', value: recommendationMatch[1].trim(), icon: 'bi bi-chat-dots' }]
      });
    }
    
    this.cachedAnalysisSections = sections;
    return sections;
  }

  private extractValue(text: string, label: string): string {
    const regex = new RegExp(`${label}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : 'N/A';
  }

  getAnalysisSections(): AnalysisSection[] {
    return this.parseDetailedReport();
  }

  getSectionScore(section: AnalysisSection): number {
    return section.score || 0;
  }

  getCardBackground(score: number): string {
    if (score >= 70) return 'linear-gradient(135deg, #dc3545, #c82333)';
    if (score >= 40) return 'linear-gradient(135deg, #ffc107, #e0a800)';
    return 'linear-gradient(135deg, #28a745, #1e7e34)';
  }

  ngOnDestroy(): void {
    if (this.riskGaugeChart) this.riskGaugeChart.destroy();
    if (this.categoriesChart) this.categoriesChart.destroy();
    if (this.riskFactorsChart) this.riskFactorsChart.destroy();
    if (this.indicatorsRadarChart) this.indicatorsRadarChart.destroy();
  }
}