import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonSearchbar, IonTitle, IonToggle, IonToolbar, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown, chevronForward, shieldCheckmark } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { app_user } from 'src/app/interfaces/app-user';
import { UserPermissionsService } from 'src/app/services/users/user-permissions.service';

type PermissionKey = 'admin' | 'clients' | 'products' | 'movements' | 'active';
type UserFilter = 'active' | 'inactive' | PermissionKey;

@Component({
  selector: 'app-user-permissions',
  templateUrl: './user-permissions.page.html',
  styleUrls: ['./user-permissions.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonSearchbar, IonTitle, IonToggle, IonToolbar]
})
export class UserPermissionsPage implements OnInit {
  protected brand = brandConfig;
  protected users: app_user[] = [];
  protected expandedUsers = new Set<number>();
  protected activeFilters = new Set<UserFilter>();
  protected searchText = '';

  protected filterOptions: { key: UserFilter; label: string }[] = [
    { key: 'active', label: 'Ativos' },
    { key: 'inactive', label: 'Inativos' },
    { key: 'admin', label: 'Admins' },
    { key: 'clients', label: 'Clientes' },
    { key: 'products', label: 'Produtos' },
    { key: 'movements', label: 'Movimentos' },
  ];

  protected permissionOptions: { key: PermissionKey; label: string; description: string }[] = [
    { key: 'admin', label: 'Administrador', description: 'Acesso total e configurações' },
    { key: 'clients', label: 'Clientes', description: 'Visualiza e gerencia clientes' },
    { key: 'products', label: 'Produtos', description: 'Consulta produtos e saldos' },
    { key: 'movements', label: 'Movimentos', description: 'Acesso a movimentos e pedidos' },
    { key: 'active', label: 'Usuário ativo', description: 'Permite login no aplicativo' },
  ];

  constructor(
    private userPermissionsSvc: UserPermissionsService,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ chevronDown, chevronForward, shieldCheckmark });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  get filteredUsers() {
    return this.users.filter((user) => this.matchesSearch(user) && this.matchesFilters(user));
  }

  async loadUsers() {
    const loading = await this.loadingController.create({ message: 'Carregando usuários...' });

    try {
      await loading.present();
      const users = await this.userPermissionsSvc.getUsers();
      this.users = users.map((user) => this.normalizeUser(user));
    } catch (error) {
      await this.showMessage('Não foi possível carregar os usuários.');
    } finally {
      await loading.dismiss();
    }
  }

  searchUsers(event: any) {
    const target = event.target as HTMLIonSearchbarElement;
    this.searchText = target.value?.toUpperCase() || '';
  }

  toggleFilter(filter: UserFilter) {
    if (this.activeFilters.has(filter)) {
      this.activeFilters.delete(filter);
      return;
    }

    this.activeFilters.add(filter);
  }

  isFilterActive(filter: UserFilter) {
    return this.activeFilters.has(filter);
  }

  clearFilters() {
    this.activeFilters.clear();
  }

  toggleExpanded(user: app_user) {
    const userId = this.userId(user);

    if (this.expandedUsers.has(userId)) {
      this.expandedUsers.delete(userId);
      return;
    }

    this.expandedUsers.add(userId);
  }

  isExpanded(user: app_user) {
    return this.expandedUsers.has(this.userId(user));
  }

  async updatePermission(user: app_user, permission: PermissionKey, event: CustomEvent) {
    const nextValue = Boolean(event.detail.checked);
    const previousValue = Boolean(user[permission]);
    user[permission] = nextValue;

    try {
      await this.userPermissionsSvc.updatePermissions(this.userId(user), this.userPermissionsSvc.toPayload(user));
    } catch (error) {
      user[permission] = previousValue;
      await this.showMessage('Não foi possível salvar a permissão. Tente novamente.');
    }
  }

  userId(user: app_user) {
    return Number(user.id || user.ID || 0);
  }

  userName(user: app_user) {
    return user.name || user.NOME || user.username || user.USERNAME || `Usuário ${this.userId(user)}`;
  }

  userLogin(user: app_user) {
    return user.username || user.USERNAME || 'sem login';
  }

  private normalizeUser(user: any): app_user {
    return {
      ...user,
      id: user.id || user.ID,
      username: user.username || user.USERNAME,
      name: user.name || user.NOME,
      admin: this.toBoolean(user.admin),
      clients: this.toBoolean(user.clients),
      products: this.toBoolean(user.products),
      movements: this.toBoolean(user.movements),
      active: this.toBoolean(user.active),
    };
  }

  private matchesSearch(user: app_user) {
    if (!this.searchText) {
      return true;
    }

    return `${this.userName(user)} ${this.userLogin(user)} ${this.userId(user)}`
      .toUpperCase()
      .includes(this.searchText);
  }

  private matchesFilters(user: app_user) {
    if (this.activeFilters.size <= 0) {
      return true;
    }

    return Array.from(this.activeFilters).every((filter) => {
      if (filter === 'active') {
        return user.active;
      }

      if (filter === 'inactive') {
        return !user.active;
      }

      return Boolean(user[filter]);
    });
  }

  private async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Permissões',
      message,
      buttons: ['Fechar'],
    });

    await alert.present();
  }

  private toBoolean(value: any) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }
}
