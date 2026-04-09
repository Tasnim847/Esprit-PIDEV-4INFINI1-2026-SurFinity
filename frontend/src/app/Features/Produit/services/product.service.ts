import { Injectable } from '@angular/core';
import { ProductApiService } from './product-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private productApiService: ProductApiService) {}

  getActiveProducts() {
    return this.productApiService.getActiveProducts();
  }
}