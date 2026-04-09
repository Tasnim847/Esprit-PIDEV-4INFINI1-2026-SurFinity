import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { DashboardNavbarComponent } from '../../components/sidebar/dashboard-navbar/dashboard-navbar.component';
import { DashboardFooterComponent } from '../../components/sidebar/dashboard-footer/dashboard-footer.component';

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [SidebarComponent, DashboardNavbarComponent, DashboardFooterComponent, RouterModule],
  templateUrl: './sidebar-layout.component.html',
  styleUrls: ['./sidebar-layout.component.css']
})
export class SidebarLayoutComponent {
  isSidebarCollapsed = false;

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }
}