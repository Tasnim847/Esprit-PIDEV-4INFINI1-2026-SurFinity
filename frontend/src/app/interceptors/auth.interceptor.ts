// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🚀 INTERCEPTEUR CHARGÉ !'); // ← Ajoutez cette ligne

  let token: string | null = null;

  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    console.log('🔍 Interceptor - URL:', req.url);
    console.log('🔍 Interceptor - Token présent:', !!token);
    if (token) {
      console.log('🔍 Interceptor - Token (preview):', token.substring(0, 20) + '...');
    }
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Interceptor - Token ajouté à la requête');
    return next(clonedReq);
  }

  console.log('⚠️ Interceptor - Pas de token, requête sans autorisation');
  return next(req);
};
