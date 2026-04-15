export interface CategoryRiskDTO {
    categoryName: string;
    score: number;
    weight: number;
    riskLevel: string;
    description: string;
    details: string[];
}