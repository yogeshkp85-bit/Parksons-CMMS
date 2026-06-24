import apiClient from './apiClient'; // Assuming a pre-configured axios instance
import { AxiosResponse } from 'axios';

// Define a type for the API response payload for pending breakdowns.
// This should match the actual structure returned by your backend.
interface PendingBreakdown {
    id: number | string;
    machine_name: string;
    duration_minutes: number;
    problem_description: string;
    attended_by: string;
    created_at: string;
}

/**
 * Fetches all breakdown entries that are pending approval.
 */
export const getPendingBreakdowns = (): Promise<AxiosResponse<{ data: PendingBreakdown[] }>> => {
    return apiClient.get('/breakdowns/pending');
};

/**
 * Approves a specific breakdown entry.
 */
export const approveBreakdown = (id: number | string): Promise<AxiosResponse> => apiClient.put(`/breakdowns/${id}/approve`);

/**
 * Rejects a specific breakdown entry.
 */
export const rejectBreakdown = (id: number | string, payload: { reason: string }): Promise<AxiosResponse> => apiClient.post(`/breakdowns/${id}/reject`, payload);