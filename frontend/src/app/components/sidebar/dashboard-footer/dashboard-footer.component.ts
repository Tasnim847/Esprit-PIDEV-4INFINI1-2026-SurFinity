import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-footer.component.html',
  styleUrls: ['./dashboard-footer.component.css']
})
export class DashboardFooterComponent {
  @Input() sidebarCollapsed: boolean = false;
  currentYear = new Date().getFullYear();
}