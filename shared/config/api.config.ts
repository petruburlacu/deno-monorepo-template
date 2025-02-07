export interface ApiConfig {
    baseUrl: string;
    apiKey: string;
}

export const getApiConfig = (): ApiConfig => ({
    baseUrl: Deno.env.get('CORE_API_URL') ?? 'http://localhost:3000',
    apiKey: Deno.env.get('CORE_API_KEY') ?? '',
});