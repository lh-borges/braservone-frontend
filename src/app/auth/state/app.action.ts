// app.action.ts
import { createAction, props } from '@ngrx/store';

export const setBaseUrl = createAction(
  '[App] Set Base URL',
  props<{ url: string }>()
);