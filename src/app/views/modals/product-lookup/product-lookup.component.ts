import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonSearchbar, IonTitle, IonToolbar, LoadingController, ModalController } from '@ionic/angular/standalone';
import { brandConfig } from 'src/app/branding/brand-config';
import { UtilsService } from 'src/app/services/utils/utils.service';

export type ProductLookupType = 'cest' | 'fiscal-classifications' | 'groups' | 'manufacturers' | 'units';

@Component({
  selector: 'app-product-lookup',
  templateUrl: './product-lookup.component.html',
  styleUrls: ['./product-lookup.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonButtons, IonContent, IonHeader, IonSearchbar, IonTitle, IonToolbar]
})
export class ProductLookupComponent implements OnInit {
  @Input() lookupType: ProductLookupType = 'groups';
  @Input() title = 'Selecionar';
  @Input() searchText = '';

  protected brand = brandConfig;
  protected items: any[] = [];
  protected loading = false;

  constructor(
    private utilsSvc: UtilsService,
    private loadingController: LoadingController,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    await this.search();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(item: any) {
    return this.modalCtrl.dismiss(item, 'confirm');
  }

  async search(event?: any) {
    if (event?.target) {
      const target = event.target as HTMLIonSearchbarElement;
      this.searchText = target.value || '';
    }

    const loading = await this.loadingController.create({ message: 'Pesquisando...' });

    try {
      this.loading = true;
      await loading.present();
      this.items = await this.loadLookupItems(this.searchText);
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  itemCode(item: any) {
    return item?.CEST || item?.CODCLAS || item?.CODGRUPO || item?.CODFAB || item?.CODUND || '';
  }

  itemTitle(item: any) {
    return item?.DESCRICAO || item?.NOME || item?.descricao || item?.nome || 'Registro sem descricao';
  }

  itemSubtitle(item: any) {
    const parts = [
      item?.NCM ? `NCM ${item.NCM}` : null,
      item?.CODEMPRESA ? `Empresa ${item.CODEMPRESA}` : null,
      item?.UNIDADE ? `Unidade ${item.UNIDADE}` : null,
      item?.INATIVO ? `Inativo ${item.INATIVO}` : null,
    ].filter(Boolean);

    return parts.join(' | ');
  }

  private requestLookup(params: any) {
    if (this.lookupType === 'cest') {
      return this.utilsSvc.getCest(params);
    }

    if (this.lookupType === 'fiscal-classifications') {
      return this.utilsSvc.getFiscalClassifications(params);
    }

    if (this.lookupType === 'manufacturers') {
      return this.utilsSvc.getManufacturers(params);
    }

    if (this.lookupType === 'units') {
      return this.utilsSvc.getUnits(params);
    }

    return this.utilsSvc.getGroups(params);
  }

  private extractList(responseData: any) {
    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    return Array.isArray(responseData) ? responseData : [];
  }

  private async loadLookupItems(search: string) {
    const normalizedSearch = this.normalize(search);
    const response = await this.requestLookup({ search });
    let items = this.extractList(response.data);

    if (items.length <= 0 && normalizedSearch) {
      const fallbackResponse = await this.requestLookup({});
      items = this.extractList(fallbackResponse.data)
        .filter((item) => this.matchesSearch(item, normalizedSearch));
    }

    return items;
  }

  private matchesSearch(item: any, normalizedSearch: string) {
    if (!normalizedSearch) {
      return true;
    }

    return [
      item?.CEST,
      item?.NCM,
      item?.CODCLAS,
      item?.CODGRUPO,
      item?.CODFAB,
      item?.CODUND,
      item?.DESCRICAO,
      item?.NOME,
    ].some((value) => this.normalize(value).includes(normalizedSearch));
  }

  private normalize(value: any) {
    return String(value || '').trim().toUpperCase();
  }
}
