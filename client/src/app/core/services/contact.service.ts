import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  /** Honeypot — must stay empty. Real users never see this field. */
  website?: string;
}

export interface ContactResponse {
  ok: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(payload: ContactPayload): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${environment.apiUrl}/contact`, payload);
  }
}
