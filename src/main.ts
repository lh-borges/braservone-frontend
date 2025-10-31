// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig, importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const toastConfig: ApplicationConfig = {
  providers: [
    // requerido pelo ngx-toastr
    provideAnimations(),
    // registra o módulo com config global
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-bottom-center',
        timeOut: 3000,
        preventDuplicates: true,
        closeButton: true,
        progressBar: true,
      })
    ),
  ],
};

bootstrapApplication(AppComponent, mergeApplicationConfig(appConfig, toastConfig))
  .catch(err => console.error(err));
