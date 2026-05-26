
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AlertController, MenuController, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp } from 'ionicons/icons';
import { AuthService } from './services/auth/auth.service';
import { applyBrandTheme } from './branding/apply-brand-theme';
import { brandConfig } from './branding/brand-config';
import { SecurityService } from './services/security/security.service';
import { Subscription } from 'rxjs';
import { NotificationService } from './services/notifications/notification.service';
import { ConfigService } from './services/config/config.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  public brand = brandConfig;
  public isAdmin = false;
  public currentUserName = '';
  public pendingSecurityRequests = 0;
  private securityRefreshInterval?: number;
  private securityRequestsChangedSub?: Subscription;

  public appPages = [
    { title: 'Início', url: '/app/home', icon: 'home' },
    // { title: 'Clientes', url: '/app/clients', icon: 'people' },
    { title: 'Produtos', url: '/app/products', icon: 'qr-code' },
    { title: 'Clientes', url: '/app/clients', icon: 'people' },
    { title: 'Movimentos', url: '/app/orders', icon: 'bag' },
    { title: 'Sincronizacao', url: '/app/offline-sync', icon: 'sync' },
    { title: 'Configuracoes', url: '/app/config', icon: 'settings', adminOnly: true },
    // { title: 'Antrisia (I.A)', url: '/app/antrisia', icon: 'bulb' },
    // { title: 'Configurações', url: '/app/config', icon: 'settings' },
    { title: 'Permissões', url: '/app/user-permissions', icon: 'shield-checkmark', adminOnly: true },
    { title: 'Liberações', url: '/app/security-requests', icon: 'lock-open', adminOnly: true },
    { title: 'Sair', url: '/app/login', icon: 'log-in' },
    // { title: 'Orçamentos', url: '/app/store', icon: 'document-text' },
    // { title: 'Configurações', url: '/app/config', icon: 'settings' },    
  ];


  // constructor() {
  // addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp });
  // }

  constructor(
    private alertController: AlertController,
    private authSvc: AuthService,
    private securitySvc: SecurityService,
    private notificationSvc: NotificationService,
    private configSvc: ConfigService,
    private router: Router,
    private menuCtrl: MenuController
  ) {
    applyBrandTheme(this.brand);
    this.configSvc.getData().catch((error) => {
      console.log('Nao foi possivel carregar as configuracoes do sistema.', error);
    });
    this.authSvc.currentUser$.subscribe((user) => {
      this.isAdmin = this.toBoolean(user?.admin);
      this.currentUserName = this.getUserDisplayName(user);

      if (this.isAdmin) {
        this.loadPendingSecurityRequests();
        this.notificationSvc.registerAdminDevice(user).catch((error) => {
          console.log('Nao foi possivel registrar notificacao do administrador.', error);
        });
      } else {
        this.pendingSecurityRequests = 0;
        this.notificationSvc.unregisterCurrentToken().catch((error) => {
          console.log('Nao foi possivel remover notificacao local.', error);
        });
      }
    });
    this.authSvc.getCurrentUser();
    this.securityRequestsChangedSub = this.securitySvc.requestsChanged$.subscribe(() => {
      this.loadPendingSecurityRequests();
    });
    this.securityRefreshInterval = window.setInterval(() => this.loadPendingSecurityRequests(), 20000);
  }

  get visibleAppPages() {
    return this.appPages.filter((page) => !page.adminOnly || this.isAdmin);
  }

  async handleMenuClick(page: any) {
    await this.menuCtrl.close('menuOpt');

    if (page.url === '/app/login') {
      await this.logout();
    }
  }

  async logout() {
    await this.authSvc.logoutUser();
    await this.router.navigateByUrl('/app/login', { replaceUrl: true });
  }

  async funcEmpty() {
    const alert = await this.alertController.create({
      header: 'Função Indisponível',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Este recurso deve ser disponibilizado em breve, por favor aguarde!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }

  private toBoolean(value: any) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private getUserDisplayName(user: any) {
    return String(user?.name || user?.NOME || user?.user || user?.USER || user?.username || user?.USERNAME || user?.email || user?.EMAIL || '').trim();
  }

  async openSecurityRequests() {
    this.pendingSecurityRequests = 0;
    await this.router.navigate(['/app/security-requests'], { queryParams: { allBranches: '1' } });
  }

  private async loadPendingSecurityRequests() {
    if (!this.isAdmin) {
      this.pendingSecurityRequests = 0;
      return;
    }

    try {
      const requests = await this.securitySvc.getRequests();
      this.pendingSecurityRequests = requests.filter((request) => request.STATUS === 'A').length;
    } catch (error) {
      this.pendingSecurityRequests = 0;
    }
  }

  ngOnDestroy() {
    this.securityRequestsChangedSub?.unsubscribe();

    if (this.securityRefreshInterval) {
      window.clearInterval(this.securityRefreshInterval);
    }
  }

}
