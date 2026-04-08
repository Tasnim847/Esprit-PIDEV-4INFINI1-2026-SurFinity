import { NewsStatus } from '../enums/NewsStatus';

export interface News {
    newsId: number;
    title: string;
    content: string;
    publishDate: Date;
    author: string;
    category: string;
    summary: string;
    imageUrl: string;
    viewCount: number;
    status: NewsStatus;
}