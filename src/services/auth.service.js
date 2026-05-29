// src/services/auth.service.js
import { api }       from './api.js';
import { ENDPOINTS } from './endpoints.js';

export const authService = {

  register: (data) =>
    api.post(ENDPOINTS.REGISTER, data),

  login: (email, password) =>
    api.post(ENDPOINTS.LOGIN, { email, password }),

  logout: () =>
    api.post(ENDPOINTS.LOGOUT),

  refreshToken: () =>
    api.post(ENDPOINTS.REFRESH_TOKEN),

  verifyOtp: (email, otp) =>
    api.post(ENDPOINTS.VERIFY_OTP, { email, otp }),

  resendOtp: (email) =>
    api.post(ENDPOINTS.RESEND_OTP, { email }),

  forgotPassword: (email) =>
    api.post(ENDPOINTS.FORGOT_PASSWORD, { email }),

  resetPassword: (email, otp, newPassword, confirmPassword) =>
    api.post(ENDPOINTS.RESET_PASSWORD, { email, otp, newPassword, confirmPassword }),

  changePassword: (currentPassword, newPassword) =>
    api.post(ENDPOINTS.CHANGE_PASSWORD, { currentPassword, newPassword }),

  getMe: () =>
    api.get(ENDPOINTS.GET_ME),

  updateProfile: (data) =>
    api.patch(ENDPOINTS.UPDATE_PROFILE, data),

  googleAuth: (idToken) =>
    api.post(ENDPOINTS.GOOGLE_AUTH, { idToken }),

};