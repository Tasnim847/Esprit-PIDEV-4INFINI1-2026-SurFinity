import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';

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
