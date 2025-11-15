import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';
import type { LoginRequestDto, LoginResponseDto, UserDto } from '../types/auth.types';

export const useAuthStore = defineStore('authStore', () => {
	const token = ref<string | null>(localStorage.getItem('auth_token'));
	const refreshToken = ref<string | null>(localStorage.getItem('auth_refresh_token'));
	const user = ref<UserDto | null>(
		localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')!) : null
	);

	const isAuthenticated = computed<boolean>(() => Boolean(token.value && user.value));

	async function login(payload: LoginRequestDto): Promise<void> {
		const response = await api.post<LoginResponseDto>('/auth/login', payload);
		const data = response.data;

		// Store tokens and user data
		token.value = data.token;
		refreshToken.value = data.refreshToken;
		user.value = data.user;

		// Persist to localStorage
		localStorage.setItem('auth_token', data.token);
		localStorage.setItem('auth_refresh_token', data.refreshToken);
		localStorage.setItem('auth_user', JSON.stringify(data.user));
	}

	function logout(): void {
		token.value = null;
		refreshToken.value = null;
		user.value = null;
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_refresh_token');
		localStorage.removeItem('auth_user');
	}

	return {
		// state
		token,
		refreshToken,
		user,
		// getters
		isAuthenticated,
		// actions
		login,
		logout
	};
});


