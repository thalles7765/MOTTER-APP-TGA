import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingController, ModalController, IonSearchbar, IonHeader, IonToolbar, IonButton, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ClientService } from 'src/app/services/clients/client.service';
import { ClientDetailComponent } from '../client-detail/client-detail.component';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  imports: [IonButton, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton]
})
export class ClientsPage implements OnInit {
  @Input() status_modal = 0;

  private clientSvc = inject(ClientService);
  protected brand = brandConfig;
  protected clients: any[] = [];
  // protected searchText = '';

  constructor(private loadingController: LoadingController, private modalCtrl: ModalController) { }

  async ngOnInit() {
    await this.getClients();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(client) {
    return this.modalCtrl.dismiss(client, 'confirm');
  }

  async searchClients(event: any) {

    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toUpperCase() || '';
    // this.searchText = query;
    // await this.showLoading();
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });

    try {
      await loading.present();
      await this.clientSvc.getData({ search: query }).then(async (data) => {

        if (data.status === 200) {
          this.clients = data.data.data;
        } else {
          console.log('Erro na requisição')
          console.log(data)
        }
      }).catch(async () => await loading.dismiss())

      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
    }
    // this.results = this.data.filter((d) => d.toLowerCase().includes(query));
  }

  async openModal(xCliente) {
    const modal = await this.modalCtrl.create({
      component: ClientDetailComponent,
      componentProps: { client: xCliente }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    // if (role === 'confirm') {
    //   this.message = `Hello, ${data}!`;
    // }
  }

  async showLoading() {
    const loading = await this.loadingController.create();
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
    }, 1800);
  }

  async getClients() {
    // await this.showLoading();
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });
    try {
      await loading.present();
      await this.clientSvc.getData({}).then(async (data) => {
        if (data.status === 200) {
          this.clients = data.data.data;
        } else {
          console.log('@@@')
          console.log(data)
        }
        await loading.dismiss()
      }).catch(async () => await loading.dismiss())
    } catch (error) {
      await loading.dismiss();
    }


  }

}
