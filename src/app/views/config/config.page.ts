import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { ConfigService, SystemConfig } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonMenuButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class ConfigPage implements OnInit {
  protected brand = brandConfig;
  protected config!: SystemConfig;
  protected loading = false;
  protected saving = false;

  protected priceOptions = [
    { value: 1, label: 'Preco 1', descKey: 'descPreco1' as keyof SystemConfig, enabledKey: 'habilitaPreco1' as keyof SystemConfig },
    { value: 2, label: 'Preco 2', descKey: 'descPreco2' as keyof SystemConfig, enabledKey: 'habilitaPreco2' as keyof SystemConfig },
    { value: 3, label: 'Preco 3', descKey: 'descPreco3' as keyof SystemConfig, enabledKey: 'habilitaPreco3' as keyof SystemConfig },
    { value: 4, label: 'Preco 4', descKey: 'descPreco4' as keyof SystemConfig, enabledKey: 'habilitaPreco4' as keyof SystemConfig },
    { value: 5, label: 'Preco 5', descKey: 'descPreco5' as keyof SystemConfig, enabledKey: 'habilitaPreco5' as keyof SystemConfig },
  ];

  constructor(private configSvc: ConfigService, private toastCtrl: ToastController) { }

  async ngOnInit() {
    this.config = { ...this.configSvc.currentConfig() };
    await this.getConfig();
  }

  async getConfig() {
    this.loading = true;

    try {
      const response = await this.configSvc.refresh();

      this.config = { ...response.data.data };
      console.log(this.config);
    } catch (error) {
      this.showToast('Nao foi possivel consultar as configuracoes.', 'warning');
    } finally {
      this.loading = false;
    }
  }

  protected priceOptionLabel(option: typeof this.priceOptions[number]) {
    const description = String((this.config as any)?.[option.descKey] || '').trim();
    return description || option.label;
  }

  protected enabledPriceOptions() {
    return this.priceOptions.filter((option) => Boolean((this.config as any)?.[option.enabledKey]));
  }

  async saveConfig() {
    this.saving = true;

    try {
      const response = await this.configSvc.updateConfig(this.config);
      this.config = { ...response.data.data };
      this.showToast('Configuracoes atualizadas com sucesso.', 'success');
    } catch (error) {
      this.showToast('Nao foi possivel salvar as configuracoes.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async syncConfig() {
    this.saving = true;

    try {
      const response = await this.configSvc.syncConfig();
      this.config = { ...response.data.data };
      this.showToast('Configuracoes buscadas do sistema e atualizadas.', 'success');
    } catch (error) {
      this.showToast('Nao foi possivel buscar as configuracoes do sistema.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  private async showToast(message: string, color = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 1800,
      position: 'top'
    });

    await toast.present();
  }
}
