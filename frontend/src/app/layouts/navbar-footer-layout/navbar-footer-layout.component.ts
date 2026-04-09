import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-navbar-footer-layout',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterModule],
  templateUrl: './navbar-footer-layout.component.html',
  styleUrls: ['./navbar-footer-layout.component.css']
})
export class NavbarFooterLayoutComponent {}