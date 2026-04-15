// config/api.config.ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:8083',
  apiPrefix: '/api',
  get fullUrl(): string {
    return `${this.baseUrl}${this.apiPrefix}`;
  }
};
