<template>
	<div class="flex min-h-screen items-center justify-center bg-gray-50 p-6">
		<div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h1 class="mb-1 text-xl font-semibold text-gray-900">Sign in</h1>
			<p class="mb-4 text-sm text-gray-600">Use your email and password to sign in.</p>

			<form @submit.prevent="onSubmit" class="space-y-3">
				<BaseInput
					v-model="email"
					type="email"
					label="Email"
					required
					:error="emailError"
					placeholder="you@example.com"
				/>
				<BaseInput
					v-model="password"
					type="password"
					label="Password"
					required
					:error="passwordError"
					placeholder="••••••••"
				/>
				<BaseButton
					type="submit"
					variant="primary"
					class="w-full"
					:loading="submitting"
					:left-icon="['fas','right-to-bracket']"
				>
					Sign in
				</BaseButton>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../composables/useToast';

const router = useRouter();
const auth = useAuthStore();
const { error: toastError, success } = useToast();

const email = ref<string>('');
const password = ref<string>('');
const submitting = ref<boolean>(false);

const emailError = ref<string | undefined>();
const passwordError = ref<string | undefined>();

function validate(): boolean {
	emailError.value = !email.value ? 'Email is required' : undefined;
	passwordError.value = !password.value ? 'Password is required' : undefined;
	return !emailError.value && !passwordError.value;
}

async function onSubmit() {
	if (!validate()) return;
	submitting.value = true;
	try {
		await auth.login({ email: email.value, password: password.value });
		success('Logged in');
		router.replace('/dashboard');
	} catch (e) {
		toastError('Login failed');
	} finally {
		submitting.value = false;
	}
}
</script>


