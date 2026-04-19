// Mise à jour du component avec les méthodes supplémentaires
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductApiService } from '../../services/product-api.service';
import { InsuranceProduct } from '../../../../shared';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productApiService = inject(ProductApiService);
  
  product: InsuranceProduct | null = null;
  recommendedProducts: InsuranceProduct[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  defaultImage = 'assets/images/default-product.jpg';

  ngOnInit() {
    this.loadProduct();
  }

  loadProduct() {
    this.isLoading = true;
    this.errorMessage = null;
    
    const productId = this.route.snapshot.params['id'];
    
    if (!productId) {
      this.errorMessage = 'Product ID not specified';
      this.isLoading = false;
      return;
    }

    this.productApiService.getProductById(productId).subscribe({
      next: (data: InsuranceProduct) => {
        this.product = data;
        this.loadRecommendedProducts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.errorMessage = 'Unable to load product details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadRecommendedProducts() {
    this.productApiService.getActiveProducts().subscribe({
      next: (products) => {
        this.recommendedProducts = products
          .filter(p => p.productId !== this.product?.productId)
          .slice(0, 4);
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
      }
    });
  }

  getImageUrl(): string {
    if (this.product?.displayImageUrl) {
      return this.product.displayImageUrl;
    }
    if (this.product?.imageUrl) {
      return this.product.imageUrl;
    }
    return this.defaultImage;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }

  getTypeLabel(): string {
    const types: Record<string, string> = {
      'AUTO': 'Auto Insurance',
      'HEALTH': 'Health Insurance',
      'HOME': 'Home Insurance',
      'LIFE': 'Life Insurance',
      'OTHER': 'Other'
    };
    return types[this.product?.productType || ''] || this.product?.productType || '';
  }

  getStatusLabel(): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'REFUSED': 'Refused'
    };
    return statusMap[this.product?.status || ''] || this.product?.status || '';
  }

  getCurrencySymbol(): string {
    return 'TND';
  }

  formatPrice(price: number): string {
    if (!price && price !== 0) return '0';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }).format(price);
  }

  zoomImage() {
    // Implement image zoom modal
    console.log('Zoom image');
  }

  addToFavorites() {
    console.log('Add to favorites:', this.product);
    // Implement favorite logic
  }

  shareProduct() {
    console.log('Share product:', this.product);
    // Implement share logic
  }

  goBackToProducts() {
    this.router.navigate(['/public/products']);
  }
  
  subscribeNow() {
    if (this.product) {
      this.router.navigate(['/public/insurance/add-contract'], {
        queryParams: { productId: this.product.productId }
      });
    }
  }

  contactUs() {
    this.router.navigate(['/public/contact']);
  }

  goToProduct(productId: number) {
    this.router.navigate(['/public/product-detail', productId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}