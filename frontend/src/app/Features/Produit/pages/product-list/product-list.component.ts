import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductApiService } from '../../services/product-api.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { InsuranceProduct, ProductType } from '../../../../shared';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: InsuranceProduct[] = [];
  filteredProducts: InsuranceProduct[] = [];
  isLoading = true;
  
  // Variables pour le filtrage
  selectedType: string = '';
  searchTerm: string = '';

  // Pour l'affichage des labels
  productTypeLabels = ProductType;

  constructor(private productApiService: ProductApiService) {}

  ngOnInit() {
    // 🔍 CODE DE DÉBOGAGE À AJOUTER ICI
    this.debugAuthInfo();
    
    this.loadProducts();
  }

  // 🔍 NOUVELLE MÉTHODE DE DÉBOGAGE
  private debugAuthInfo(): void {
    console.log('========== 🔍 INFORMATIONS D\'AUTHENTIFICATION ==========');
    
    // Vérifier si on est dans le navigateur
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const email = localStorage.getItem('email');
      
      console.log('📧 Email stocké:', email);
      console.log('👤 Rôle stocké dans localStorage:', role);
      console.log('🔑 Token présent:', !!token);
      
      if (token) {
        console.log('🔑 Token (preview):', token.substring(0, 50) + '...');
        
        try {
          // Décoder le token JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('📦 Payload du token JWT:', payload);
          console.log('👥 Rôles dans le token:', payload.roles || payload.authorities || payload.role);
          console.log('📧 Email dans le token:', payload.sub || payload.email);
          console.log('⏰ Expiration:', new Date(payload.exp * 1000).toLocaleString());
          
          // Vérifier si le token est expiré
          const isExpired = payload.exp * 1000 < Date.now();
          console.log('⏰ Token expiré:', isExpired);
          
          if (isExpired) {
            console.warn('⚠️ LE TOKEN EST EXPIRÉ ! Veuillez vous reconnecter.');
          }
        } catch(e) {
          console.error('❌ Erreur lors du décodage du token:', e);
        }
      } else {
        console.warn('⚠️ AUCUN TOKEN TROUVÉ ! Veuillez vous connecter.');
      }
    } else {
      console.log('⚠️ Exécution côté serveur (SSR) - Pas de localStorage');
    }
    
    console.log('=========================================================');
  }

  loadProducts() {
    this.isLoading = true;
    console.log('🔄 Chargement des produits actifs...');
    
    this.productApiService.getActiveProducts().subscribe({
      next: (data: InsuranceProduct[]) => {
        this.products = data;
        this.filteredProducts = [...data];
        this.isLoading = false;
        console.log('✅ Produits chargés avec succès:', this.products.length, 'produits');
        console.log('📦 Détails des produits:', this.products);
      },
      error: (error) => {
        console.error('❌ Erreur chargement produits:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ URL:', error.url);
        
        // Afficher un message plus explicite
        if (error.status === 403) {
          console.error('🔒 ERREUR 403: Accès interdit. Vérifiez vos droits d\'accès.');
          console.error('   Rôle requis: CLIENT, AGENT_ASSURANCE ou ADMIN');
          console.error('   Rôle actuel:', localStorage.getItem('role'));
        } else if (error.status === 401) {
          console.error('🔒 ERREUR 401: Non authentifié. Veuillez vous reconnecter.');
        }
        
        this.isLoading = false;
      }
    });
  }

  // Récupérer les types uniques des produits (avec labels)
  getUniqueTypes(): { value: string; label: string }[] {
    const types = this.products.map(product => product.productType);
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.map(type => ({
      value: type,
      label: ProductType[type as ProductType] || type
    }));
  }

  // Appliquer les filtres (type et recherche)
  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Filtre par type (utilise productType au lieu de type)
      const matchesType = !this.selectedType || product.productType === this.selectedType;
      
      // Filtre par recherche (nom, description, type)
      const matchesSearch = !this.searchTerm || 
        product.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ProductType[product.productType]?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }

  // Obtenir le label du type pour l'affichage
  getTypeLabel(type: string): string {
    return ProductType[type as ProductType] || type;
  }

  // Effacer le filtre de type
  clearTypeFilter() {
    this.selectedType = '';
    this.applyFilters();
  }

  // Effacer la recherche
  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Effacer tous les filtres
  clearAllFilters() {
    this.selectedType = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  filterByCategory(categoryValue: string) {
    this.selectedType = this.selectedType === categoryValue ? '' : categoryValue;
    this.applyFilters();
  }
}