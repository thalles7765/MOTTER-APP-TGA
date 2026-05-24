import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { LoadingController, AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { order } from 'src/app/interfaces/order';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Platform } from '@ionic/angular';
import { brandConfig } from 'src/app/branding/brand-config';
import { OrderNewComponent } from '../order-new/order-new.component';
import { BranchService } from 'src/app/services/branches/branch.service';
import { branch } from 'src/app/interfaces/branch';

@Component({
  selector: 'app-orders-detail',
  templateUrl: './orders-detail.component.html',
  styleUrls: ['./orders-detail.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class OrdersDetailComponent implements OnInit {
  @Input() order: any;
  protected products: any;
  private orderSvc = inject(OrdersService);
  private branchSvc = inject(BranchService);
  private pdfObj: any;
  protected brand = brandConfig;
  protected branches: branch[] = [];

  constructor(private loadingController: LoadingController, private alertController: AlertController, private modalCtrl: ModalController, public platform: Platform) { }

  async ngOnInit() {
    // console.log(this.order)

    await Promise.all([
      this.loadBranches(),
      this.getItemsOrder(),
    ]);
  }

  branchLabel() {
    const codfilial = Number(this.order?.CODFILIAL || 0);
    const selectedBranch = this.branches.find((item) => Number(item.CODFILIAL) === codfilial);

    if (!codfilial) {
      return 'Filial nao informada';
    }

    if (!selectedBranch) {
      return `Filial ${codfilial}`;
    }

    return `${selectedBranch.CODFILIAL} - ${selectedBranch.NOMEFANTASIA}${selectedBranch.CGC ? ` / ${selectedBranch.CGC}` : ''}`;
  }

  private async loadBranches() {
    try {
      this.branches = await this.branchSvc.getBranches();
    } catch (error) {
      this.branches = [];
    }
  }

  async getItemsOrder() {
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });

    try {
      await loading.present();
      await this.orderSvc.getItemsOrder(this.order?.IDMOV).then(async (ItemsOrder) => {

        if (!ItemsOrder.data.error) {
          this.products = ItemsOrder.data.data;
        }
        await loading.dismiss()
      }).catch(async () => await loading.dismiss())
    }
    catch {
      await loading.dismiss()
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  canEditOrder() {
    return this.order?.STATUSPEDIDO === 'D';
  }

  async editOrder() {
    if (!this.canEditOrder()) {
      const alert = await this.alertController.create({
        header: 'Movimento bloqueado',
        message: 'Apenas movimentos pendentes podem ser editados.',
        buttons: ['Fechar'],
      });

      await alert.present();
      return;
    }

    const modal = await this.modalCtrl.create({
      component: OrderNewComponent,
      componentProps: {
        editOrderData: this.order,
        editOrderItems: this.products || [],
      }
    });

    await modal.present();
    const { role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.getItemsOrder();
      this.confirm();
    }
  }

  formatarData(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  }

  async generatePdf(xOrder: order) {
    // console.log('generate pdf');
    (<any>pdfMake).addVirtualFileSystem(pdfFonts);
    const brandLogo = await this.assetToDataUrl(this.brand.assets.logo);
    const pdfPrimary = this.brand.theme?.["--ion-color-primary"] || '#04467c';
    const pdfSecondary = this.brand.theme?.["--ion-color-secondary"] || '#252525';

    console.log(xOrder);
    let xItens: any[] = [[
      {
        "text": 'Código',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Descrição',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Unidade',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Unit.',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Qtd',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Desc.',
        "bold": true,
        "color": "white",
        "fillColor": pdfPrimary,
        "fontSize": 8,
      },
      {
        "text": 'Total',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      }
    ]]

    console.log(this.formatarData(new Date(xOrder.DATAEMISSAO)))
    await this.orderSvc.getItemsOrder(xOrder.IDMOV).then((ItemsOrder) => {
      // console.log('items order')
      // console.log(ItemsOrder.data)

      console.log(ItemsOrder.data.data)

      if (!ItemsOrder.data.error) {
        if (ItemsOrder.data.data.length > 0) {


          ItemsOrder.data.data.map((item) => {
            // if (ItemsOrder.data.data.length === 1) {
            //   xItens.push(
            //     {
            //       "text": item.NOMEFANTASIA,
            //       "bold": true,
            //     },
            //     {
            //       "text": item.VALORUNITARIO,
            //     },
            //     {
            //       "text": item.QUANTIDADE,
            //     },
            //     {
            //       "text": item.VALORDESC,
            //     },
            //     {
            //       "text": item.VALORTOTALITEM,
            //       "bold": true,
            //     }
            //   )
            // } else {
            xItens.push([
              {
                "text": item.CODPRD,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.NOMEFANTASIA,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.CODUND_ECM,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.PRECOUNITARIO.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.QUANTIDADE.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.VALORDESC.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": `R$ ${item.VALORTOTALITEM.toFixed(2)}`,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              }]
            )

          })
        }
      }
    })


    var dd = {
      header: {
        columns: [
          // { text: `${this.brand.companyName} - App`, fontSize: 8, bold:true, italics: true, marginLeft:40, marginTop: 15 },
          { text: 'Orçamento gerado via aplicativo mobile', marginLeft: 40, fontSize: 8, italics: true, bold: true, marginTop: 15, color: pdfSecondary },
          { text: 'Versão do sistema 1.5', fontSize: 8, italics: true, marginLeft: 170, bold: true, marginTop: 15, color: pdfSecondary },
        ]
      },
      footer: {
        columns: [
          { text: 'Motter Sistemas', marginLeft: 40, style: 'documentFooterCenter', bold: true, fontSize: 10, color: pdfSecondary },
          { text: this.brand.website, marginLeft: 35, style: 'documentFooterRight', color: pdfPrimary },
        ]
      },
      content: [
        // Header
        {
          columns: [
            {
              image: brandLogo,
              width: 150,
            },
            [
              {
                text: this.brand.companyFullName,
                fontSize: 18,
                bold: true,
                marginTop: 15,
                width: '*'
              },
              {
                stack: [
                  {
                    columns: [
                      {
                        text: this.brand.companyDocument,
                        width: '*'
                      },
                      {
                        text: this.brand.stateRegistration ? `Insc.: ${this.brand.stateRegistration}` : '',
                        width: 120
                      }
                    ]
                  },
                  {
                    columns: [
                      {
                        text: this.brand.cityState,
                        width: '*'
                      },
                      {
                        text: this.brand.phone,
                        bold: true,
                        width: 120
                      }
                    ]
                  },
                  {
                    columns: [
                      {
                        text: this.brand.zipCode,
                        width: '*'

                      },
                      {
                        text: this.brand.mobilePhone,
                        bold: true,
                        width: 120

                      }
                    ]
                  },

                ]
              }
            ],
          ],
        },
        // Billing Headers
        {
          columns: [
            {
              text: 'Vendedor',
              fontSize: 8,
              width: '*'
            },
            {
              text: 'Emissão',
              fontSize: 8
            },
            // {
            //   text: 'Movimento',
            //   fontSize: 8
            // },
            {
              text: 'Pagamento',
              fontSize: 8
            },
            {
              text: 'Nº Documento',
              fontSize: 8
            },
          ]
        },
        // Billing Details
        {
          columns: [
            {
              text: `(${xOrder.CODVEN1}) - ${xOrder.VENDEDOR}`,
              bold: true,
              fontSize: 10,
              width: '*'
            },
            {
              text: `${this.formatarData(new Date(xOrder.DATAEMISSAO))}`,
              bold: true,
              fontSize: 10,
            },
            // {
            //   text: `(${xOrder.CODTMV}) - ${xOrder.NOME}`,
            //   bold: true,
            //   fontSize: 10,

            // },
            {
              text: `(${xOrder.CODCPG}) - ${xOrder.DESC_CONDPGTO}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `${xOrder.NUMEROMOV}`,
              bold: true,
              fontSize: 10,
            },
          ]
        },
        // Billing Address Title
        {
          columns: [
            {
              text: 'Cliente',
              fontSize: 8,
              marginTop: 5
            },
            {
              text: 'Contato',
              fontSize: 8,
              marginTop: 5
            },
          ]

        },
        // Billing Address
        {
          columns: [
            {
              text: `${xOrder.CODCFO}\n${xOrder.NOMEFANTASIA}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `${xOrder.TELEFONE_CLIENTE}\n${xOrder.CIDADE_CLIENTE} - ${xOrder.ESTADO_CLIENTE}`,
              bold: true,
              fontSize: 10,
            },
          ]
        },
        // Line breaks
        '\n',
        // Items
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: [40, '*', 'auto', 'auto', 'auto', 'auto', 'auto'],

            body:
              // Table Header
              xItens,
            // [
            //   {
            //     text: 'teste',
            //     bold: true,
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //     bold: true,
            //   }
            // ],
            // END Items

          }, // table
          //  layout: 'lightHorizontalLines'
        },
        // TOTAL
        '\n',
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 0,
            widths: ['*', 'auto'],

            body: [
              // Total
              [
                {
                  text: 'Valor Bruto',
                  style: 'itemsFooterSubTitle',
                },
                {
                  text: `R$ ${xOrder.VALORBRUTO.toFixed(2)}`,
                  style: 'itemsFooterSubValue',
                  bold: true,
                }
              ],
              [
                {
                  text: 'Desconto',
                  style: 'itemsFooterSubTitle',
                },
                {
                  text: `R$ ${xOrder.VALORDESC.toFixed(2)}`,
                  style: 'itemsFooterSubValue',
                  bold: true,
                }
              ],
              [
                {
                  text: 'Total',
                  style: 'itemsFooterTotalTitle'
                },
                {
                  text: `R$ ${xOrder.VALORLIQUIDO.toFixed(2)}`,
                  style: 'itemsFooterTotalValue',
                  bold: true,
                }
              ],
            ]
          }, // table
          layout: 'lightHorizontalLines'
        },
        // Signature
        '\n\n',
        {
          text: 'AVISOS',
          style: 'notesTitle',
          bold: true,
        },
        {
          text: `O VALOR DESSE ORÇAMENTO ESTARÁ SUJEITO A\nALTERAÇÕES EM DECORRÊNCIA DE ATUALIZAÇÃO DE PREÇO DO FORNECEDOR.`,
          style: 'notesText',
          fontSize: 8
        },
        {
          text: `VALIDADE DO ORÇAMENTO PRA 10 DIAS A CONTAR DA DATA DE EMISSÃO`,
          style: 'notesText',
          marginTop: 4,
          fontSize: 8
        }
        // {
        //   text: `( * ) Estoque indisponível ou parcial por ocasião do ORÇAMENTO.`,
        //   style: 'notesText',
        //   fontSize: 10
        // }
      ],

      center: {
        alignment: 'center',
      },
      defaultStyle: {
        columnGap: 20,
      }
    }

    this.pdfObj = pdfMake.createPdf(dd);
    console.log(this.pdfObj);
  }

  private async assetToDataUrl(assetUrl: string) {
    const response = await fetch(assetUrl);
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  async downloadPdf(orderData) {
    try {
      await this.generatePdf(orderData);

      // if (this.platform.is('capacitor') || this.platform.is('mobile')) {
      if (this.platform.is('capacitor') || this.platform.is('android')) {

        this.pdfObj.getBase64(async (data) => {
          try {
            let path = `orcamentos/orc_${orderData.NUMEROMOV}.pdf`
            console.log(data)

            const result = await Filesystem.writeFile({
              path,
              data,
              directory: Directory.Documents,
              recursive: true
            }).then(async (createdFile) => {
              const fileOpenerOptions: FileOpenerOptions = {
                filePath: createdFile.uri,
                contentType: 'application/pdf',
                openWithDefault: true,
              };
              await FileOpener.open(fileOpenerOptions);
            })


          } catch (error) {

          }
        })

      } else {
        this.pdfObj.open();
      }
    } catch (error) {

    }
  }

}
