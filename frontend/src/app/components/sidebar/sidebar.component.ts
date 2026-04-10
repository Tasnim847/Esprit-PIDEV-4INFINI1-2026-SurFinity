import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() sidebarToggle = new EventEmitter<boolean>();

  menuItems = [
    { label: 'Home', icon: '🏠', link: '/backoffice' },
    { label: 'Credit', icon: '💳', link: '/backoffice/credit' },
    { label: 'Insurance', icon: '🛡️', link: '/backoffice/insurance' },
    { label: 'Account', icon: '👤', link: '/backoffice/account' },
    { label: 'Complaint', icon: '📄', link: '/backoffice/complaint' },
    { label: 'News', icon: '📰', link: '/backoffice/news' },
    { label: 'Products', icon: '📦', link: '/backoffice/products' }
  ];

  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    // Émettre l'événement
    this.sidebarToggle.emit(this.isCollapsed);
  }
}
