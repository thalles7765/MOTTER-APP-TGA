import { Routes } from '@angular/router';
import { authenticationGuard } from './services/auth/authguard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'app/login',
    pathMatch: 'full',
  },
  // {
  //   path: 'app/:id',
  //   loadComponent: () =>
  //     import('./folder/folder.page').then((m) => m.FolderPage),
  // },
  {
    path: 'app/login',
    loadComponent: () => import('./views/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'app/home',
    loadComponent: () => import('./views/home/home.page').then(m => m.HomePage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/orders',
    loadComponent: () => import('./views/orders/orders.component').then(m => m.OrdersComponent),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/products',
    loadComponent: () => import('./views/products/products.page').then(m => m.ProductsPage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/product/detail',
    loadComponent: () => import('./views/product-detail/product-detail.page').then(m => m.ProductDetailPage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/clients',
    loadComponent: () => import('./views/clients/clients.page').then(m => m.ClientsPage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/config',
    loadComponent: () => import('./views/config/config.page').then(m => m.ConfigPage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/store',
    loadComponent: () => import('./views/store/store.page').then(m => m.StorePage),
    canActivate: [authenticationGuard]
  },
  {
    path: 'app/antrisia',
    loadComponent: () => import('./views/antrisia/antrisia.page').then(m => m.AntrisiaPage),
    canActivate: [authenticationGuard]
  },
];

