import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NavController, MenuController, IonInputPasswordToggle, AlertController, LoadingController, ModalController, IonInput, IonItem, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { addIcons } from 'ionicons';
import { key, person } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { brandConfig } from 'src/app/branding/brand-config';
import { BranchService } from 'src/app/services/branches/branch.service';
import { BranchSelectComponent, BranchSelectionResult } from '../branch-select/branch-select.component';
import { branch } from 'src/app/interfaces/branch';
import { NetworkService } from 'src/app/services/offline/network.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
	styleUrls: ['./login.page.scss'],
	standalone: true,
	imports: [IonIcon, IonInputPasswordToggle, IonItem, IonButton, IonInput, IonContent, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {

	protected brand = brandConfig;
	protected credentials: FormGroup;

	constructor(
		public navCtrl: NavController,
		public menuCtrl: MenuController,
		private auth: AuthService,
		// private authService: AuthenticationService,
		private alertController: AlertController,
		private router: Router,
		private loadingController: LoadingController,
		private modalController: ModalController,
		private branchSvc: BranchService,
		private networkSvc: NetworkService,

	) {
		this.credentials = new FormGroup({
			username: new FormControl('', [Validators.required]),
			password: new FormControl('', [Validators.required, Validators.minLength(6)])
		});

		addIcons({ key, person });
	}

	ngOnInit() {
		this.menuCtrl.enable(false, 'menuOpt');

		this.getDataStorage();
	}

	async setDataStorage() {
		Preferences.set({ key: 'user_login', value: this.credentials.value['username'].toUpperCase() });
		Preferences.set({ key: 'user_pass', value: this.credentials.value['password'] });

		const alert = await this.alertController.create({
			header: 'Dados Salvos',
			message: `Os dados preenchidos no campo usuário e senha foram salvos.`,
			buttons: ['Fechar']
		});

		await alert.present();
	}

	async getDataStorage() {
		let xUser = await Preferences.get({ key: 'user_login' });
		let xPass = await Preferences.get({ key: 'user_pass' });

		this.credentials.patchValue({
			username: xUser.value || '',
			password: xPass.value || ''
		});
	}

	async login(form: FormGroup) {
		const loading = await this.loadingController.create();
		await loading.present();

		await this.auth.authUser(form.value['username'].toUpperCase(), form.value['password']).then(async (login) => {
			// console.log('###@@@')
			// console.log(login.data)
			if (!login.data.data.error) {
				const userData = this.extractUserData(login.data.data);
				await loading.dismiss();

				const branchWasSelected = await this.resolveBranchSelection(userData);

				if (branchWasSelected) {
					await this.auth.setCurrentUser(userData);
					this.router.navigateByUrl('/app/home')
				}
			} else {
				await loading.dismiss();
			}
		}).catch(async (err) => {
			if (!err?.response && !(await this.networkSvc.refreshStatus())) {
				const currentUser = await this.auth.getCurrentUser();

				if (currentUser) {
					const branchWasSelected = await this.resolveBranchSelection(currentUser);

					if (branchWasSelected) {
						await loading.dismiss();
						this.router.navigateByUrl('/app/home');
						return;
					}
				}
			}

			await loading.dismiss();

			const alert = await this.alertController.create({
				header: 'Login indisponivel',
				message: 'Sem conexao e sem sessao local valida. Conecte-se a internet para acessar.',
				buttons: ['Fechar']
			});

			await alert.present();
		})

		// setTimeout(async () => {
		// }, 1800);

		// this.authService.login(this.credentials.value).subscribe(
		// 	async (res) => {
		// 		await loading.dismiss();
		// 		this.router.navigateByUrl('/tabs', { replaceUrl: true });
		// 	},
		// 	async (res) => {
		// 		await loading.dismiss();

		// 	}
		// );
	}

	private async resolveBranchSelection(userData: any) {
		await this.branchSvc.clearSelectedBranch();

		const branches = await this.branchSvc.getBranches(true);
		const defaultBranch = Number(userData?.default_branch || 0) || null;
		const canSelectBranch = this.toBoolean(userData?.select_branch) || this.toBoolean(userData?.admin);

		await this.branchSvc.setBranchPolicy({ defaultBranch, canSelectBranch });

		const selectedDefaultBranch = this.branchSvc.resolveDefaultBranch(branches, defaultBranch);

		if (selectedDefaultBranch) {
			await this.branchSvc.setSelectedBranch(selectedDefaultBranch);
			return true;
		}

		if (branches.length === 1) {
			await this.branchSvc.setSelectedBranch(branches[0]);
			return true;
		}

		if (!canSelectBranch && branches.length > 0) {
			await this.branchSvc.setSelectedBranch(branches[0]);
			return true;
		}

		if (canSelectBranch && branches.length > 1) {
			const selectedBranchResult = await this.openBranchSelection(branches);

			if (selectedBranchResult) {
				if (selectedBranchResult.saveAsDefault) {
					try {
						await this.branchSvc.updateDefaultBranch(selectedBranchResult.branch.CODFILIAL, userData);
					} catch (error) {
						console.log('Nao foi possivel salvar a filial padrao. Mantendo filial selecionada na sessao.', error);
					}

					await this.branchSvc.setBranchPolicy({
						defaultBranch: selectedBranchResult.branch.CODFILIAL,
						canSelectBranch
					});
				}

				await this.branchSvc.setSelectedBranch(selectedBranchResult.branch);
				return true;
			}
		}

		await this.showBranchRequiredAlert();
		return false;
	}

	private extractUserData(authData: any) {
		return authData?.data || authData?.DATA || authData;
	}

	private async openBranchSelection(branches: branch[]) {
		const modal = await this.modalController.create({
			component: BranchSelectComponent,
			componentProps: { branches },
			backdropDismiss: false,
			cssClass: 'branch-selection-modal'
		});

		await modal.present();
		const { data, role } = await modal.onWillDismiss<BranchSelectionResult>();

		return role === 'confirm' ? data || null : null;
	}

	private async showBranchRequiredAlert() {
		const alert = await this.alertController.create({
			header: 'Filial obrigatÃ³ria',
			message: 'NÃ£o foi possÃ­vel definir uma filial para este usuÃ¡rio.',
			buttons: ['Fechar']
		});

		await alert.present();
	}

	private toBoolean(value: any) {
		return value === true || value === 1 || value === '1' || value === 'true';
	}

	// Easy access for form fields
	get email() {
		return this.credentials.get('email');
	}

	get password() {
		return this.credentials.get('password');
	}

}
