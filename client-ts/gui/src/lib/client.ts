import type {
    Message,
    MessageState,
    RegisterWebHookRequest,
    WebHook,
    Device,
    DeviceSettings,
    HealthResponse,
    LogEntry,
    MessagesExportRequest
} from "./domain";
import type { HttpClient } from "./http";

export const BASE_URL = "/api";

export class Client {
    private baseUrl: string;
    private httpClient: HttpClient;
    private defaultHeaders: Record<string, string>;

    /**
     * @param login The login to use for authentication
     * @param password The password to use for authentication
     * @param httpClient The HTTP client to use for requests
     * @param baseUrl The base URL to use for requests. Defaults to {@link BASE_URL}.
     */
    constructor(login: string, password: string, httpClient: HttpClient, baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.httpClient = httpClient;
        this.defaultHeaders = {
            "User-Agent": "android-sms-gateway/3.0 (client; js)",
            "Authorization": `Basic ${btoa(`${login}:${password}`)}`,
        }
    }

    /**
     * Sends a new message to the API
     * @param request - The message to send
     * @param options - Optional parameters
     * @param options.skipPhoneValidation - Whether to skip phone number validation
     * @returns The state of the message after sending
     */
    async send(request: Message, options?: { skipPhoneValidation?: boolean }): Promise<MessageState> {
        let url = `${this.baseUrl}/message`;
        if (options?.skipPhoneValidation !== undefined) {
            url += `?skipPhoneValidation=${options.skipPhoneValidation.toString()}`;
        }

        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.post<MessageState>(url, request, headers);
    }

    /**
     * Retrieves the state of an SMS message from the API
     * @param messageId - The ID of the message to retrieve the state for
     * @returns The state of the message
     */
    async getState(messageId: string): Promise<MessageState> {
        const url = `${this.baseUrl}/message/${messageId}`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<MessageState>(url, headers);
    }

    /**
     * Retrieves a list of registered webhooks from the API
     * @returns An array of webhooks
     */
    async getWebhooks(): Promise<WebHook[]> {
        const url = `${this.baseUrl}/webhooks`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<WebHook[]>(url, headers);
    }

    /**
     * Registers a new webhook
     * @param request - The webhook to register
     * @returns The registered webhook
     */
    async registerWebhook(request: RegisterWebHookRequest): Promise<WebHook> {
        const url = `${this.baseUrl}/webhooks`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.post<WebHook>(url, request, headers);
    }

    /**
     * Removes a webhook by its ID
     * @param webhookId - The ID of the webhook to remove
     */
    async deleteWebhook(webhookId: string): Promise<void> {
        const url = `${this.baseUrl}/webhooks/${webhookId}`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.delete<void>(url, headers);
    }

    /**
     * Get a list of registered devices
     * @returns An array of registered devices
     */
    async getDevices(): Promise<Device[]> {
        const url = `${this.baseUrl}/devices`;
        console.log('getDevices - baseUrl:', this.baseUrl, 'url:', url);
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<Device[]>(url, headers);
    }

    /**
     * Remove a device by ID
     * @param deviceId - The ID of the device to remove
     */
    async deleteDevice(deviceId: string): Promise<void> {
        const url = `${this.baseUrl}/devices/${deviceId}`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.delete<void>(url, headers);
    }

    /**
     * Check if the service is healthy
     * @returns A promise that resolves to the health response
     */
    async getHealth(): Promise<HealthResponse> {
        const url = `${this.baseUrl}/health`;
        console.log('getHealth - baseUrl:', this.baseUrl, 'url:', url);
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<HealthResponse>(url, headers);
    }

    /**
     * Request inbox messages export
     * @param request - The export request parameters
     */
    async exportInbox(request: MessagesExportRequest): Promise<void> {
        const url = `${this.baseUrl}/inbox/export`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        const exportRequest = {
            deviceId: request.deviceId,
            since: request.since.toISOString(),
            until: request.until.toISOString(),
        };

        return this.httpClient.post<void>(url, exportRequest, headers);
    }

    /**
     * Get logs within a specified time range
     * @param from - The start of the time range (optional)
     * @param to - The end of the time range (optional)
     * @returns An array of log entries
     */
    async getLogs(from?: Date, to?: Date): Promise<LogEntry[]> {
        let url = `${this.baseUrl}/logs`;
        const params = new URLSearchParams();
        if (from) {
            params.append('from', from.toISOString());
        }
        if (to) {
            params.append('to', to.toISOString());
        }
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<LogEntry[]>(url, headers);
    }

    /**
     * Get settings for the user
     * @returns The user's settings
     */
    async getSettings(): Promise<DeviceSettings> {
        const url = `${this.baseUrl}/settings`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<DeviceSettings>(url, headers);
    }

    /**
     * Update settings for the user
     * @param settings - The new settings to apply
     */
    async updateSettings(settings: DeviceSettings): Promise<void> {
        const url = `${this.baseUrl}/settings`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.put<void>(url, settings, headers);
    }

    /**
     * Partially update settings for the user
     * @param settings - The partial settings to update
     */
    async patchSettings(settings: Partial<DeviceSettings>): Promise<void> {
        const url = `${this.baseUrl}/settings`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.patch<void>(url, settings, headers);
    }

    /**
     * Get inbound webhooks for the user
     * @returns Array of webhooks
     */
    async getInboundWebhooks(): Promise<any[]> {
        const url = `${this.baseUrl}/inbound-webhooks`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<any[]>(url, headers);
    }

    /**
     * Create a new inbound webhook
     * @param webhookData - The webhook data
     * @returns The created webhook
     */
    async createInboundWebhook(webhookData: any): Promise<any> {
        const url = `${this.baseUrl}/inbound-webhooks`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.post<any>(url, webhookData, headers);
    }

    /**
     * Update an inbound webhook
     * @param webhookId - The webhook ID
     * @param webhookData - The updated webhook data
     * @returns The updated webhook
     */
    async updateInboundWebhook(webhookId: string, webhookData: any): Promise<any> {
        const url = `${this.baseUrl}/inbound-webhooks/${webhookId}`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        };

        return this.httpClient.put<any>(url, webhookData, headers);
    }

    /**
     * Delete an inbound webhook
     * @param webhookId - The webhook ID
     * @returns The deletion result
     */
    async deleteInboundWebhook(webhookId: string): Promise<any> {
        const url = `${this.baseUrl}/inbound-webhooks/${webhookId}`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.delete<any>(url, headers);
    }

    /**
     * Get webhook logs
     * @param webhookId - The webhook ID
     * @param limit - Number of logs to retrieve
     * @returns Array of webhook logs
     */
    async getWebhookLogs(webhookId: string, limit: number = 50): Promise<any[]> {
        const url = `${this.baseUrl}/inbound-webhooks/${webhookId}/logs?limit=${limit}`;
        const headers = {
            ...this.defaultHeaders,
        };

        return this.httpClient.get<any[]>(url, headers);
    }
}