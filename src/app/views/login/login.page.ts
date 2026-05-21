import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NavController, MenuController, IonInputPasswordToggle, AlertController, LoadingController, IonInput, IonItem, IonContent, IonButton, IonHeader, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { addIcons } from 'ionicons';
import { key, person } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
	styleUrls: ['./login.page.scss'],
	standalone: true,
	imports: [IonIcon, IonInputPasswordToggle, IonItem, IonButton, IonInput, IonContent, IonHeader, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {

	protected brand = environment;
	protected credentials: FormGroup;

	constructor(
		public navCtrl: NavController,
		public menuCtrl: MenuController,
		private auth: AuthService,
		// private authService: AuthenticationService,
		private alertController: AlertController,
		private router: Router,
		private loadingController: LoadingController,

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
				await loading.dismiss();

				this.router.navigateByUrl('/app/home')
			} else {
				await loading.dismiss();
			}
		}).catch(async (err) => {
			await loading.dismiss();

			const alert = await this.alertController.create({
				header: 'Login inválido',
				message: 'verifique suas credenciais e tente novamente.',
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

	// Easy access for form fields
	get email() {
		return this.credentials.get('email');
	}

	get password() {
		return this.credentials.get('password');
	}

}
