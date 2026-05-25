import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonSearchbar, IonTitle, IonToggle, IonToolbar, LoadingController, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bagCheck, business, chevronDown, chevronForward, personCircle, shieldCheckmark } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { app_user } from 'src/app/interfaces/app-user';
import { branch } from 'src/app/interfaces/branch';
import { movements_type } from 'src/app/interfaces/movements_type';
import { sellers } from 'src/app/interfaces/sellers';
import { UserPermissionsService } from 'src/app/services/users/user-permissions.service';
import { MovementsTypeComponent } from '../modals/movements-type/movements-type.component';
import { SellersComponent } from '../modals/sellers/sellers.component';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { BranchService } from 'src/app/services/branches/branch.service';

type PermissionKey = 'admin' | 'clients' | 'products' | 'movements' | 'edit_product' | 'edit_client' | 'active';
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
  protected branches: branch[] = [];
  protected sellers: sellers[] = [];
  protected movements: movements_type[] = [];
  private branchesByCode = new Map<number, branch>();
  private sellersByCode = new Map<string, sellers>();
  private movementsByCode = new Map<string, movements_type>();
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
    { key: 'edit_product', label: 'Edita produtos' },
    { key: 'edit_client', label: 'Edita clientes' },
  ];

  protected permissionOptions: { key: PermissionKey; label: string; description: string }[] = [
    { key: 'admin', label: 'Administrador', description: 'Acesso total e configurações' },
    { key: 'clients', label: 'Clientes', description: 'Visualiza e gerencia clientes' },
    { key: 'products', label: 'Produtos', description: 'Consulta produtos e saldos' },
    { key: 'movements', label: 'Movimentos', description: 'Acesso a movimentos e pedidos' },
    { key: 'edit_product', label: 'Editar produtos', description: 'Permite alterar dados cadastrais de produtos' },
    { key: 'edit_client', label: 'Editar clientes', description: 'Permite alterar dados cadastrais de clientes' },
    { key: 'active', label: 'Usuário ativo', description: 'Permite login no aplicativo' },
  ];

  constructor(
    private userPermissionsSvc: UserPermissionsService,
    private utilsSvc: UtilsService,
    private branchSvc: BranchService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    addIcons({ bagCheck, business, chevronDown, chevronForward, personCircle, shieldCheckmark });
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
      await Promise.all([
        this.loadDefaultOptions(),
        this.loadBranches(),
      ]);
      const users = await this.userPermissionsSvc.getUsers();
      this.users = users.map((user) => this.hydrateDefaultNames(this.normalizeUser(user)));
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

  async selectDefaultMovement(user: app_user) {
    const modal = await this.modalController.create({
      component: MovementsTypeComponent,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<movements_type>();

    if (role !== 'confirm' || !data?.CODTIPOMOV) {
      return;
    }

    const previousMovement = user.default_movement;
    const previousMovementName = user.default_movement_name;
    user.default_movement = this.movementCode(data);
    user.default_movement_name = this.abbreviate(data.NOME);
    this.addMovementToCache(data);

    try {
      await this.saveBranchDefaults(user);
    } catch (error) {
      user.default_movement = previousMovement;
      user.default_movement_name = previousMovementName;
      await this.showMessage('Nao foi possivel salvar o movimento padrao.');
    }
  }

  async selectDefaultSeller(user: app_user) {
    const modal = await this.modalController.create({
      component: SellersComponent,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<sellers>();

    if (role !== 'confirm' || !data?.CODVEN) {
      return;
    }

    const previousSeller = user.default_seller;
    const previousSellerName = user.default_seller_name;
    user.default_seller = this.sellerCode(data);
    user.default_seller_name = this.abbreviate(data.NOME);
    this.addSellerToCache(data);

    try {
      await this.saveBranchDefaults(user);
    } catch (error) {
      user.default_seller = previousSeller;
      user.default_seller_name = previousSellerName;
      await this.showMessage('Nao foi possivel salvar o vendedor padrao.');
    }
  }

  async selectDefaultBranch(user: app_user) {
    if (this.branches.length <= 0) {
      await this.showMessage('Nenhuma filial disponivel para selecao.');
      return;
    }

    const previousBranch = user.default_branch;
    const alert = await this.alertController.create({
      header: 'Filial padrao',
      message: 'Selecione a filial padrao deste usuario.',
      inputs: this.branches.map((item) => ({
        type: 'radio',
        label: this.branchOptionLabel(item),
        value: item.CODFILIAL,
        checked: Number(user.default_branch) === Number(item.CODFILIAL),
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar filial',
          handler: async (value) => {
            if (!value) {
              return false;
            }

            user.default_branch = Number(value);

            try {
              await this.saveBranchDefaults(user);
              return true;
            } catch (error) {
              user.default_branch = previousBranch;
              await this.showMessage('Nao foi possivel salvar a filial padrao.');
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async updateSelectBranch(user: app_user, event: CustomEvent) {
    const nextValue = Boolean(event.detail.checked);
    const previousValue = Boolean(user.select_branch);
    user.select_branch = nextValue;

    try {
      await this.saveBranchDefaults(user);
    } catch (error) {
      user.select_branch = previousValue;
      await this.showMessage('Nao foi possivel salvar a permissao de selecao de filial.');
    }
  }

  userId(user: app_user) {
    return Number(user.id || user.ID || 0);
  }

  userName(user: app_user) {
    return user.name || user.NOME || user.user || user.USER || user.username || user.USERNAME || `Usuário ${this.userId(user)}`;
  }

  userLogin(user: app_user) {
    return user.username || user.USERNAME || user.user || user.USER || user.email || user.EMAIL || 'sem login';
  }

  defaultMovementLabel(user: app_user) {
    const movement = this.resolveMovement(user.default_movement);
    const name = movement?.NOME || user.default_movement_name;

    return user.default_movement
      ? `${user.default_movement}${name ? ' - ' + this.abbreviate(name) : ''}`
      : 'Selecionar movimento';
  }

  defaultSellerLabel(user: app_user) {
    const seller = this.resolveSeller(user.default_seller);
    const name = seller?.NOME || user.default_seller_name;

    return user.default_seller
      ? `${user.default_seller}${name ? ' - ' + this.abbreviate(name) : ''}`
      : 'Selecionar vendedor';
  }

  defaultBranchLabel(user: app_user) {
    const selectedBranch = this.resolveBranch(user.default_branch);

    return selectedBranch
      ? `${selectedBranch.CODFILIAL} - ${selectedBranch.NOMEFANTASIA}`
      : `Filial ${user.default_branch || 1}`;
  }

  private async loadDefaultOptions() {
    const [sellersResponse, movementsResponse] = await Promise.allSettled([
      this.utilsSvc.getSellers(),
      this.utilsSvc.getMovementsType(),
    ]);

    if (sellersResponse.status === 'fulfilled' && sellersResponse.value.status === 200) {
      this.sellers = this.extractList<sellers>(sellersResponse.value.data);
      this.sellersByCode.clear();
      this.sellers.forEach((seller) => this.addSellerToCache(seller));
    }

    if (movementsResponse.status === 'fulfilled' && movementsResponse.value.status === 200) {
      this.movements = this.extractList<movements_type>(movementsResponse.value.data);
      this.movementsByCode.clear();
      this.movements.forEach((movement) => this.addMovementToCache(movement));
    }
  }

  private async loadBranches() {
    this.branches = await this.branchSvc.getBranches();
    this.branchesByCode.clear();
    this.branches.forEach((item) => this.branchesByCode.set(Number(item.CODFILIAL), item));
  }

  private saveBranchDefaults(user: app_user) {
    return this.userPermissionsSvc.updateBranchDefaults(this.userPermissionsSvc.toBranchDefaultsPayload(user));
  }

  private hydrateDefaultNames(user: app_user) {
    if (user.default_seller && !user.default_seller_name) {
      const seller = this.resolveSeller(user.default_seller);
      user.default_seller_name = seller?.NOME ? this.abbreviate(seller.NOME) : null;
    }

    if (user.default_movement && !user.default_movement_name) {
      const movement = this.resolveMovement(user.default_movement);
      user.default_movement_name = movement?.NOME ? this.abbreviate(movement.NOME) : null;
    }

    return user;
  }

  private abbreviate(value = '') {
    const normalized = String(value || '').trim();

    return normalized.length > 28 ? `${normalized.slice(0, 28)}...` : normalized;
  }

  private extractList<T>(responseData: any): T[] {
    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    return Array.isArray(responseData) ? responseData : [];
  }

  private addSellerToCache(seller: sellers) {
    const code = this.sellerCode(seller);

    if (code) {
      this.sellersByCode.set(this.normalizeCode(code), seller);
    }
  }

  private addMovementToCache(movement: movements_type) {
    const code = this.movementCode(movement);

    if (code) {
      this.movementsByCode.set(this.normalizeCode(code), movement);
    }
  }

  private resolveSeller(code?: string | null) {
    return code ? this.sellersByCode.get(this.normalizeCode(code)) : null;
  }

  private resolveMovement(code?: string | null) {
    return code ? this.movementsByCode.get(this.normalizeCode(code)) : null;
  }

  private resolveBranch(code?: number | null) {
    return code ? this.branchesByCode.get(Number(code)) : null;
  }

  private branchOptionLabel(item: branch) {
    return `${item.CODFILIAL} - ${item.NOMEFANTASIA} | ${item.CIDADE}/${item.ESTADO}`;
  }

  private sellerCode(seller: any) {
    return seller?.CODVEN || seller?.codven || seller?.code || seller?.id || null;
  }

  private movementCode(movement: any) {
    return movement?.CODTIPOMOV || movement?.codtipomov || movement?.CODTMV || movement?.codtmv || movement?.code || null;
  }

  private normalizeCode(value: any) {
    return String(value || '').trim().toUpperCase();
  }

  private normalizeUser(user: any): app_user {
    const defaultSeller = this.valueFromAliases(user, [
      'default_seller',
      'DEFAULT_SELLER',
      'defaultSeller',
      'default_seller_code',
      'DEFAULT_SELLER_CODE',
      'defaultSellerCode',
      'CODVENPADRAO',
      'CODVEN_PADRAO',
      'CODVEN_DEFAULT',
      'codven_default',
      'codven',
      'CODVEN',
    ]);
    const defaultMovement = this.valueFromAliases(user, [
      'default_movement',
      'DEFAULT_MOVEMENT',
      'defaultMovement',
      'default_movement_code',
      'DEFAULT_MOVEMENT_CODE',
      'defaultMovementCode',
      'CODTMVPADRAO',
      'CODTMV_PADRAO',
      'CODTMV_DEFAULT',
      'codtmv_default',
      'codtmv',
      'CODTMV',
      'CODTIPOMOV',
    ]);

    return {
      ...user,
      id: user.id || user.ID,
      user: user.user || user.USER || user.username || user.USERNAME,
      username: user.username || user.USERNAME || user.user || user.USER,
      email: user.email || user.EMAIL,
      name: user.name || user.NOME,
      admin: this.toBoolean(this.valueFromAliases(user, ['admin', 'ADMIN'])),
      clients: this.toBoolean(this.valueFromAliases(user, ['clients', 'CLIENTS'])),
      products: this.toBoolean(this.valueFromAliases(user, ['products', 'PRODUCTS'])),
      movements: this.toBoolean(this.valueFromAliases(user, ['movements', 'MOVEMENTS'])),
      edit_product: this.toBoolean(this.valueFromAliases(user, ['edit_product', 'EDIT_PRODUCT', 'editProduct'])),
      edit_client: this.toBoolean(this.valueFromAliases(user, ['edit_client', 'EDIT_CLIENT', 'editClient'])),
      active: this.toBoolean(this.valueFromAliases(user, ['active', 'ACTIVE'])),
      default_branch: this.valueFromAliases(user, ['default_branch', 'DEFAULT_BRANCH', 'defaultBranch']) || 1,
      select_branch: this.toBoolean(this.valueFromAliases(user, ['select_branch', 'SELECT_BRANCH', 'selectBranch'])),
      default_seller: defaultSeller ? String(defaultSeller) : null,
      default_seller_name: this.textFromAliases(user, [
        'default_seller_name',
        'DEFAULT_SELLER_NAME',
        'defaultSellerName',
        'seller_name',
        'SELLER_NAME',
        'NOMEVENDEDOR',
        'VENDEDOR',
      ]),
      default_movement: defaultMovement ? String(defaultMovement) : null,
      default_movement_name: this.textFromAliases(user, [
        'default_movement_name',
        'DEFAULT_MOVEMENT_NAME',
        'defaultMovementName',
        'movement_name',
        'MOVEMENT_NAME',
        'NOMEMOVIMENTO',
        'MOVIMENTO',
      ]),
    };
  }

  private valueFromAliases(source: any, aliases: string[]) {
    const sources = this.userValueSources(source);

    for (const item of sources) {
      for (const alias of aliases) {
        const value = item?.[alias];

        if (value === undefined || value === null || value === '') {
          continue;
        }

        if (typeof value === 'object') {
          return value.CODVEN || value.codven || value.CODTIPOMOV || value.codtmv || value.CODTMV || value.code || value.id || null;
        }

        return value;
      }
    }

    return null;
  }

  private textFromAliases(source: any, aliases: string[]) {
    const sources = this.userValueSources(source);

    for (const item of sources) {
      for (const alias of aliases) {
        const value = item?.[alias];

        if (value === undefined || value === null || value === '') {
          continue;
        }

        if (typeof value === 'object') {
          return value.NOME || value.nome || value.DESCRICAO || value.descricao || value.name || null;
        }

        return String(value);
      }
    }

    return null;
  }

  private userValueSources(source: any) {
    return [
      source,
      source?.branch,
      source?.BRANCH,
      source?.defaults,
      source?.DEFAULTS,
      source?.permissions,
      source?.PERMISSIONS,
      source?.config,
      source?.CONFIG,
      source?.seller,
      source?.SELLER,
      source?.movement,
      source?.MOVEMENT,
    ].filter(Boolean);
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
    const normalized = String(value ?? '').trim().toUpperCase();
    return value === true || value === 1 || normalized === '1' || normalized === 'TRUE' || normalized === 'T' || normalized === 'S';
  }
}

