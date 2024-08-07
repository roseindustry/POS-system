<script>
import { defineComponent, ref, computed } from 'vue';
import navscrollto from '@/components/app/NavScrollTo.vue';
import { ScrollSpy } from 'bootstrap';
import { useUserStore } from '@/stores/user-role';
import { auth, db } from '../firebase/init';
import { ref as dbRef, update, get, child } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const userStore = useUserStore();

export default defineComponent({
	components: {
		navScrollTo: navscrollto
	},
	computed: {
		currentPageName() {
			return this.$route.name;
		}
	},
	data() {
		return {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',

			firstName: '',
			lastName: '',
			identification: '',
			phoneNumber: '',
			email: '',
			sector: '',
			address: '',

			// Edit states
			editStates: {
				firstName: false,
				lastName: false,
				phoneNumber: false,
				email: false,
				password: false,
				identification: false,
				sector: false,
				address: false
			},

			// Field definitions to iterate over
			fields: [
				{ name: 'firstName', label: 'Nombre', value: '' },
				{ name: 'lastName', label: 'Apellido', value: '' },
				{ name: 'identification', label: 'Cedula', value: '' },
				{ name: 'sector', label: 'Sector', value: '' },
				{ name: 'address', label: 'Dirección', value: '' },
				{ name: 'phoneNumber', label: 'Telefono', value: '' },
				{ name: 'email', label: 'Correo electronico', value: '' },
			],
		};
	},
	setup() {
		const userStore = useUserStore();

		// Expose userStore's state to the template
		const role = computed(() => userStore.role);

		return {
			role,
		};
	},
	mounted() {

		const userStore = useUserStore();
		const userId = userStore.userId;

		// Immediately invoked async function within mounted
		(async () => {
			await userStore.fetchUser(); // Await the fetching of the user
		})();

		new ScrollSpy(document.body, {
			target: '#sidebar-bootstrap',
			offset: 200,
		});

		this.fetchUserData(userId);
	},
	methods: {
		fetchUserData(userId) {
			const userRef = dbRef(db);
			get(child(userRef, `Users/${userId}`))
				.then((snapshot) => {
					if (snapshot.exists()) {
						const userData = snapshot.val();
						this.fields.forEach(field => {
							if (userData[field.name] !== undefined) {
								field.value = userData[field.name];
							}
						});
					} else {
						console.log("No data available");
					}
				}).catch((error) => {
					console.error(error);
				});
		},
		toggleEdit(fieldName) {
			this.editStates[fieldName] = !this.editStates[fieldName];
		},
		async updateField(fieldName) {
			const userStore = useUserStore();
			const userId = userStore.userId;

			const userDataRef = dbRef(db, `Users/${userId}`);

			// Find the field value to update based on fieldName
			const fieldToUpdate = this.fields.find(field => field.name === fieldName);
			if (!fieldToUpdate) {
				console.error('Field to update not found');
				return;
			}

			const updateData = {
				[fieldName]: fieldToUpdate.value
			};

			try {
				await update(userDataRef, updateData);
				console.log("User data updated successfully");

				Toastify({
					text: "Datos actualizados con éxito!",
					duration: 3000,
					close: true,
					gravity: "top",
					position: "right",
					stopOnFocus: true,
					style: {
						background: "linear-gradient(to right, #00b09b, #96c93d)",
					},
				}).showToast();

				this.toggleEdit(fieldName);
			} catch (error) {
				console.error("Error updating menu item:", error);
			}
		},
		async changePassword() {
			if (this.newPassword !== this.confirmPassword) {
				alert('La nueva contraseña y la confirmación de contraseña no coinciden.');
				return;
			}

			const user = auth.currentUser;
			console.log(user);
			const credential = EmailAuthProvider.credential(user.email, this.currentPassword);

			try {
				await reauthenticateWithCredential(user, credential);
				await updatePassword(user, this.newPassword);
				Toastify({
					text: 'contraseña actualizada con éxito.',
					duration: 3000,
					close: true,
					gravity: 'top',
					position: 'right',
					stopOnFocus: true,
					style: {
						background: 'linear-gradient(to right, #00b09b, #96c93d)',
					},
				}).showToast();
				this.currentPassword = '';
				this.newPassword = '';
				this.confirmPassword = '';
			} catch (error) {
				console.error('Error updating password:', error);
				alert('Error al actualizar la contraseña. Inténtalo de nuevo.');
			}
		},
	}
});
</script>
<template>
	<!-- BEGIN container -->
	<div class="container py-5 h-100">
		<nav style="--bs-breadcrumb-divider: '>';" aria-label="breadcrumb">
			<ol class="breadcrumb">
				<li class="breadcrumb-item"><router-link to="/page/client-portal">Portal de clientes</router-link></li>
				<li class="breadcrumb-item active" aria-current="page">{{ currentPageName }}</li>
			</ol>
		</nav>
		<div class="row">
			<div class="col-xl-9">
				<div id="general" class="mb-5">
					<h4><i class="far fa-user fa-fw"></i> General</h4>
					<p>Puedes actualizar tus datos de usuario aqui.</p>
					<div class="card shadow-sm">
						<div class="list-group list-group-flush">
							<div class="list-group-item" v-for="field in fields" :key="field.name">
								<div class="d-flex justify-content-between align-items-center flex-wrap">
									<div class="flex-fill pe-2">
										<div class="fw-bold">{{ field.label }}</div>
										<div v-if="!editStates[field.name]" class="text-secondary">{{ field.value }}
										</div>
										<input v-else v-model="field.value" type="text" class="form-control mt-2">
									</div>
									<div>
										<button class="btn btn-outline-primary btn-sm me-2"
											@click.prevent="toggleEdit(field.name)">Editar</button>
										<button v-if="editStates[field.name]" class="btn btn-success btn-sm"
											@click.prevent="updateField(field.name)">Actualizar</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Change Password Section -->
				<div id="change-password" class="mb-5">
					<h4><i class="fas fa-key fa-fw"></i> Cambiar Contraseña</h4>
					<p>Actualiza tu contraseña aquí.</p>
					<div class="card shadow-sm">
						<div class="card-body">
							<div class="mb-3">
								<label for="currentPassword" class="form-label">Contraseña Actual</label>
								<input type="password" class="form-control" id="currentPassword"
									v-model="currentPassword">
							</div>
							<div class="mb-3">
								<label for="newPassword" class="form-label">Nueva Contraseña</label>
								<input type="password" class="form-control" id="newPassword" v-model="newPassword">
							</div>
							<div class="mb-3">
								<label for="confirmPassword" class="form-label">Confirmar Nueva Contraseña</label>
								<input type="password" class="form-control" id="confirmPassword"
									v-model="confirmPassword">
							</div>
							<button class="btn btn-primary" @click.prevent="changePassword">Actualizar
								Contraseña</button>
						</div>
					</div>
				</div>

				<div id="notifications" class="mb-5" v-if="role !== 'cliente'">
					<h4><i class="far fa-bell fa-fw"></i> Notificaciones</h4>
					<p>Habilite o deshabilite las notificaciones que desea recibir.</p>
					<div class="card">
						<div class="list-group list-group-flush">
							<div class="list-group-item d-flex align-items-center">
								<div class="flex-fill">
									<div>Comments</div>
									<div class="text-gray-500 d-flex align-items-center">
										<i class="fa fa-circle fs-8px fa-fw text-success me-1"></i> Enabled
										(Push, SMS)
									</div>
								</div>
								<div>
									<a class="btn btn-default w-100px">Editar</a>
								</div>
							</div>
							<div class="list-group-item d-flex align-items-center">
								<div class="flex-fill">
									<div>Tags</div>
									<div class="text-gray-500 d-flex align-items-center">
										<i class="fa fa-circle fs-8px fa-fw text-muted me-1"></i> Disabled
									</div>
								</div>
								<div>
									<a class="btn btn-default w-100px">Editar</a>
								</div>
							</div>
							<div class="list-group-item d-flex align-items-center">
								<div class="flex-fill">
									<div>Reminders</div>
									<div class="text-gray-500 d-flex align-items-center">
										<i class="fa fa-circle fs-8px fa-fw text-success me-1"></i> Enabled
										(Push, Email, SMS)
									</div>
								</div>
								<div>
									<a class="btn btn-default w-100px">Editar</a>
								</div>
							</div>
							<div class="list-group-item d-flex align-items-center">
								<div class="flex-fill">
									<div>New orders</div>
									<div class="text-gray-500 d-flex align-items-center">
										<i class="fa fa-circle fs-8px fa-fw text-success me-1"></i> Enabled
										(Push, Email, SMS)
									</div>
								</div>
								<div>
									<a class="btn btn-default w-100px">Editar</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="col-xl-3">
				<nav id="sidebar-bootstrap" class="navbar navbar-sticky d-none d-xl-block">
					<nav class="nav">
						<nav-scroll-to target="#general" data-toggle="scroll-to">General</nav-scroll-to>
						<nav-scroll-to target="#change-password" data-toggle="scroll-to">Cambiar contraseña</nav-scroll-to>
						<nav-scroll-to v-if="role !== 'cliente'" target="#notifications"
							data-toggle="scroll-to">Notifications</nav-scroll-to>
					</nav>
				</nav>
			</div>
		</div>
	</div>
</template>