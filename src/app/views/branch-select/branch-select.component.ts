import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { business, location, mail, call, checkmarkCircle } from 'ionicons/icons';
import { branch } from 'src/app/interfaces/branch';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-branch-select',
  templateUrl: './branch-select.component.html',
  styleUrls: ['./branch-select.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonIcon]
})
export class BranchSelectComponent {
  @Input() branches: branch[] = [];

  protected brand = brandConfig;
  protected selectedBranch: branch | null = null;

  constructor(private modalCtrl: ModalController) {
    addIcons({ business, location, mail, call, checkmarkCircle });
  }

  selectBranch(selectedBranch: branch) {
    this.selectedBranch = selectedBranch;
  }

  confirm() {
    if (this.selectedBranch) {
      return this.modalCtrl.dismiss(this.selectedBranch, 'confirm');
    }

    return null;
  }
}
