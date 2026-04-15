// config/api.config.ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:8081',
  apiPrefix: '/api',
  get fullUrl(): string {
    return `${this.baseUrl}${this.apiPrefix}`;
  }
};
