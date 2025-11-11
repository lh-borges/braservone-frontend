// src/app/shared/services/notify.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastMsg { kind: ToastKind; text: string; }

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private _messages = new Subject<ToastMsg>();
  messages$ = this._messages.asObservable();

  success(text: string) { this._messages.next({ kind: 'success', text }); }
  error(text: string)   { this._messages.next({ kind: 'error',   text }); }
  info(text: string)    { this._messages.next({ kind: 'info',    text }); }
  warn(text: string)    { this._messages.next({ kind: 'warning', text }); }
}
