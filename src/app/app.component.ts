
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AlertController, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp } from 'ionicons/icons';
import { AuthService } from './services/auth/auth.service';
import { applyBrandTheme } from './branding/apply-brand-theme';
import { brandConfig } from './branding/brand-config';
import { SecurityService } from './services/security/security.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet],
})
export class AppComponent {
  public brand = brandConfig;
  public isAdmin = false;
  public pendingSecurityRequests = 0;

  public appPages = [
    { title: 'Início', url: '/app/home', icon: 'home' },
    // { title: 'Clientes', url: '/app/clients', icon: 'people' },
    { title: 'Produtos', url: '/app/products', icon: 'qr-code' },
    { title: 'Clientes', url: '/app/clients', icon: 'people' },
    { title: 'Movimentos', url: '/app/orders', icon: 'bag' },
    // { title: 'Antrisia (I.A)', url: '/app/antrisia', icon: 'bulb' },
    { title: 'Configurações', url: '/app/config', icon: 'settings' },
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
    private router: Router
  ) {
    applyBrandTheme(this.brand);
    this.authSvc.currentUser$.subscribe((user) => {
      this.isAdmin = this.toBoolean(user?.admin);

      if (this.isAdmin) {
        this.loadPendingSecurityRequests();
      } else {
        this.pendingSecurityRequests = 0;
      }
    });
    this.authSvc.getCurrentUser();
    setInterval(() => this.loadPendingSecurityRequests(), 60000);
  }

  get visibleAppPages() {
    return this.appPages.filter((page) => !page.adminOnly || this.isAdmin);
  }

  async logout(event) {
    // console.log(event)
    if (event.url === '/app/login') {
      await this.authSvc.logoutUser();
    }

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

  async openSecurityRequests() {
    this.pendingSecurityRequests = 0;
    await this.router.navigate(['/app/security-requests'], { queryParams: { allBranches: '1' } });
  }

  private async loadPendingSecurityRequests() {
    if (!this.isAdmin) {
      return;
    }

    try {
      const requests = await this.securitySvc.getRequests();
      this.pendingSecurityRequests = requests.filter((request) => request.STATUS === 'A').length;
    } catch (error) {
      this.pendingSecurityRequests = 0;
    }
  }

}
