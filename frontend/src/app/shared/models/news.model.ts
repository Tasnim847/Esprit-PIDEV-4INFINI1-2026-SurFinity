import { NewsStatus } from '../enums/news-status.enum';

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
