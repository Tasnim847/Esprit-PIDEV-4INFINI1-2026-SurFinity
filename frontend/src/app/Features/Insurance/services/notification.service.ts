// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private newRequestSubject = new Subject<any>();
  private requestUpdateSubject = new Subject<any>();

  constructor() {
    // Écouter les événements localStorage pour la communication entre onglets
    window.addEventListener('storage', (event) => {
      if (event.key === 'pendingCashApprovals') {
        const newData = JSON.parse(event.newValue || '[]');
        const oldData = JSON.parse(event.oldValue || '[]');
        
        // Vérifier s'il y a une nouvelle demande
        if (newData.length > oldData.length) {
          const newRequest = newData.find((r: any) => 
            !oldData.some((o: any) => o.id === r.id)
          );
          if (newRequest && newRequest.status === 'pending') {
            this.newRequestSubject.next(newRequest);
          }
        }
        
        // Vérifier les mises à jour de statut
        newData.forEach((request: any) => {
          const oldRequest = oldData.find((o: any) => o.id === request.id);
          if (oldRequest && oldRequest.status !== request.status) {
            this.requestUpdateSubject.next(request);
          }
        });
      }
    });
  }

  // Émettre une nouvelle demande (appelé par le client)
  emitNewRequest(request: any): void {
    // Stocker dans localStorage (déjà fait par le client)
    // Émettre localement pour les composants actifs
    this.newRequestSubject.next(request);
  }

  // Écouter les nouvelles demandes (pour l'agent)
  listenForNewRequests(): Observable<any> {
    return this.newRequestSubject.asObservable();
  }

  // Écouter les mises à jour de statut (pour le client)
  listenForRequestUpdate(): Observable<any> {
    return this.requestUpdateSubject.asObservable();
  }
}