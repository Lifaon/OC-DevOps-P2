import { Routes } from '@angular/router';
import {RegisterComponent} from './pages/register/register.component';
import {AppComponent} from './app.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'register',
    component: RegisterComponent
  }

];
