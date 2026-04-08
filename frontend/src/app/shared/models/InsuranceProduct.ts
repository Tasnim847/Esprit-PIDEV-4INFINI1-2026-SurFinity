import { ProductType } from '../enums/ProductType';
import { ProductStatus } from '../enums/ProductStatus';

export interface InsuranceProduct {
    productId: number;
    name: string;
    description: string;
    basePrice: number;
    productType: ProductType;
    status: ProductStatus;
    otherType?: string;
    imageUrl?: string;
}