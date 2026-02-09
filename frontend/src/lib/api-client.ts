/**
 * API Client for Backend Communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class APIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest: any = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (refreshToken) {
                            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                                refreshToken,
                            });

                            localStorage.setItem('accessToken', data.accessToken);
                            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Auth
    async register(data: any) {
        return this.client.post('/auth/register', data);
    }

    async login(data: { email: string; password: string }) {
        return this.client.post('/auth/login', data);
    }

    // OTP-based authentication
    async initiateSignup(data: any) {
        return this.client.post('/auth/signup/initiate', data);
    }

    async verifySignupOTP(tempToken: string, otp: string) {
        return this.client.post('/auth/signup/verify', { tempToken, otp });
    }

    async initiateLogin(email: string, password: string) {
        return this.client.post('/auth/login/initiate', { email, password });
    }

    async verifyLoginOTP(tempToken: string, otp: string) {
        return this.client.post('/auth/login/verify', { tempToken, otp });
    }

    async resendOTP(tempToken: string) {
        return this.client.post('/auth/otp/resend', { tempToken });
    }

    async getProfile() {
        return this.client.get('/auth/profile');
    }

    async changePassword(data: { currentPassword: string; newPassword: string }) {
        return this.client.post('/auth/change-password', data);
    }

    // Security Demos
    async base64Encode(data: string) {
        return this.client.post('/security/base64/encode', { data });
    }

    async base64Decode(data: string) {
        return this.client.post('/security/base64/decode', { data });
    }

    async xorEncrypt(data: string, key?: string) {
        return this.client.post('/security/xor/encrypt', { data, key });
    }

    async xorDecrypt(data: string, key: string) {
        return this.client.post('/security/xor/decrypt', { data, key });
    }

    async generateHash(data: string, algorithm?: string) {
        return this.client.post('/security/hash/generate', { data, algorithm });
    }

    async verifyHash(data: string, hash: string, algorithm?: string) {
        return this.client.post('/security/hash/verify', { data, hash, algorithm });
    }

    async createSignature(data: string) {
        return this.client.post('/security/signature/create', { data });
    }

    async verifySignature(data: string, signature: string, publicKey: string) {
        return this.client.post('/security/signature/verify', { data, signature, publicKey });
    }

    async analyzePassword(password: string) {
        return this.client.post('/security/password/analyze', { password });
    }

    async crackPassword(password: string, method?: string) {
        return this.client.post('/security/password/crack', { password, method });
    }

    async generatePassword(length?: number, includeSymbols?: boolean) {
        return this.client.post('/security/password/generate', { length, includeSymbols });
    }

    // RFQs
    async createRFQ(data: any) {
        return this.client.post('/rfqs', data);
    }

    async getRFQs(params?: any) {
        return this.client.get('/rfqs', { params });
    }

    async getRFQById(id: string) {
        return this.client.get(`/rfqs/${id}`);
    }

    async updateRFQ(id: string, data: any) {
        return this.client.put(`/rfqs/${id}`, data);
    }

    async deleteRFQ(id: string) {
        return this.client.delete(`/rfqs/${id}`);
    }

    async publishRFQ(id: string) {
        return this.client.post(`/rfqs/${id}/publish`);
    }

    // Quotations
    async createQuotation(data: any) {
        return this.client.post('/quotations', data);
    }

    async getQuotations(params?: any) {
        return this.client.get('/quotations', { params });
    }

    async getQuotationById(id: string, encryptionKey?: string) {
        return this.client.get(`/quotations/${id}`, {
            params: { encryptionKey },
        });
    }

    async submitQuotation(id: string) {
        return this.client.post(`/quotations/${id}/submit`);
    }

    async verifyQuotationSignature(id: string) {
        return this.client.post(`/quotations/${id}/verify-signature`);
    }

    // Approvals
    async getPendingApprovals() {
        return this.client.get('/approvals/pending');
    }

    async getMyApprovals(status?: string) {
        return this.client.get('/approvals/mine', {
            params: { status }
        });
    }

    async getAllApprovals(status?: string) {
        return this.client.get('/approvals/all', {
            params: { status },
        });
    }

    async getApprovalById(id: string) {
        return this.client.get(`/approvals/${id}`);
    }

    async approveQuotation(id: string, comments?: string) {
        return this.client.post(`/approvals/${id}/approve`, { comments });
    }

    async rejectQuotation(id: string, comments: string) {
        return this.client.post(`/approvals/${id}/reject`, { comments });
    }

    async getApprovalHistory(quotationId: string) {
        return this.client.get(`/approvals/history/${quotationId}`);
    }

    // Negotiation & Revisions
    async createRevision(quotationId: string, data: any) {
        return this.client.post(`/quotations/${quotationId}/revisions`, data);
    }

    async getRevisions(quotationId: string) {
        return this.client.get(`/quotations/${quotationId}/revisions`);
    }

    async compareVersions(quotationId: string, version1: number, version2: number) {
        return this.client.get(`/quotations/${quotationId}/revisions/compare`, {
            params: { version1, version2 }
        });
    }

    async addComment(quotationId: string, comment: string, commentType?: string, isInternal?: boolean) {
        return this.client.post(`/quotations/${quotationId}/comments`, {
            comment,
            comment_type: commentType,
            is_internal: isInternal
        });
    }

    async getComments(quotationId: string) {
        return this.client.get(`/quotations/${quotationId}/comments`);
    }

    async requestRevision(quotationId: string, comment: string, suggestedChanges?: string) {
        return this.client.post(`/quotations/${quotationId}/request-revision`, {
            comment,
            suggested_changes: suggestedChanges
        });
    }
}

export const apiClient = new APIClient();
