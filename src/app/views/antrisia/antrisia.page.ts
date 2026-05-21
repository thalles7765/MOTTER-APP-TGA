import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonMenuButton, IonSearchbar, IonHeader, IonTitle, IonToolbar, IonButtons } from '@ionic/angular/standalone';
import { GeminiService } from 'src/app/services/gemini/gemini.service';

@Component({
  selector: 'app-antrisia',
  templateUrl: './antrisia.page.html',
  styleUrls: ['./antrisia.page.scss'],
  standalone: true,
  imports: [IonButtons, IonMenuButton, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AntrisiaPage implements OnInit {
  protected searchText = '';
  protected answerText = '';

  constructor(private geminiSvc : GeminiService) { }

  ngOnInit() {
  }

  async searchAnswer(event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toUpperCase() || '';
    this.searchText = query;
    this.answerText = '';

    if (this.searchText){
      await this.geminiSvc.getAnswer(this.searchText).then((data) => {
          console.log(data)

        if (data.status === 200) {
          this.answerText = data.data.message;
        } else {
          this.answerText = '';
          console.log('@@@')
          console.log(data)
        }
      })
    }
  }

}
