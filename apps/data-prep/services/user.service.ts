import { ClientFactory, type CoreClient, type HttpClient } from '@shared/http';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
}

export class UserService {
    private readonly http: HttpClient;
    constructor() {
        this.http = ClientFactory.getCoreClient().getHttpClient();
    }

    async getData(id: string): Promise<Record<string, unknown>[]> {
        const response = await this.http.get<Record<string, unknown>[]>(`/data/${id}`);
        return response.data;
    }

    async getUser(id: string): Promise<User> {
        const response = await this.http.get<User>(`/users/${id}`);
        return response.data;
    }

    async createUser(data: CreateUserDto): Promise<User> {
        const response = await this.http.post<User>('/users', data);
        return response.data;
    }

    async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User> {
        const response = await this.http.put<User>(`/users/${id}`, data);
        return response.data;
    }

    async deleteUser(id: string): Promise<void> {
        await this.http.delete(`/users/${id}`);
    }
}