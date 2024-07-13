import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KeycloakService {
  constructor(private httpService: HttpService) {}

  async getAccessToken(): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.post(
        'http://localhost:8080/auth/realms/master/protocol/openid-connect/token',
        new URLSearchParams({
          username: 'admin',
          password: 'admin',
          grant_type: 'password',
          client_id: 'admin-cli',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return response.data.access_token;
  }

  async createRealm(accessToken: string): Promise<void> {
    await lastValueFrom(
      this.httpService.post(
        'http://localhost:8080/auth/admin/realms',
        {
          realm: 'myrealm',
          enabled: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  async createClient(accessToken: string): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.post(
        'http://localhost:8080/auth/admin/realms/myrealm/clients',
        {
          clientId: 'nestjs-client',
          rootUrl: 'http://localhost:3000',
          adminUrl: 'http://localhost:3000',
          redirectUris: ['http://localhost:3000/*'],
          publicClient: false,
          secret: 'your-client-secret',
          enabled: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data.id;
  }

  async configureClient(accessToken: string, clientId: string): Promise<void> {
    await lastValueFrom(
      this.httpService.put(
        `http://localhost:8080/auth/admin/realms/myrealm/clients/${clientId}`,
        {
          clientId: 'nestjs-client',
          rootUrl: 'http://localhost:3000',
          adminUrl: 'http://localhost:3000',
          redirectUris: ['http://localhost:3000/*'],
          publicClient: false,
          secret: 'your-client-secret',
          enabled: true,
          access: {
            confidential: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  async signup(
    username: string,
    password: string,
    email: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    await lastValueFrom(
      this.httpService.post(
        'http://localhost:8080/auth/admin/realms/myrealm/users',
        {
          username: username,
          email: email,
          enabled: true,
          credentials: [
            {
              type: 'password',
              value: password,
              temporary: false,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  async login(username: string, password: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'http://localhost:8080/auth/realms/myrealm/protocol/openid-connect/token',
          new URLSearchParams({
            username: username,
            password: password,
            grant_type: 'password',
            client_id: 'nestjs-client',
            client_secret: 'your-client-secret',
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await lastValueFrom(
      this.httpService.post(
        'http://localhost:8080/auth/realms/myrealm/protocol/openid-connect/logout',
        new URLSearchParams({
          client_id: 'nestjs-client',
          client_secret: 'your-client-secret',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
  }

  async assignRole(userId: string, roleName: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    const rolesResponse = await lastValueFrom(
      this.httpService.get(
        `http://localhost:8080/auth/admin/realms/myrealm/roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    const role = rolesResponse.data.find((role) => role.name === roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await lastValueFrom(
      this.httpService.post(
        `http://localhost:8080/auth/admin/realms/myrealm/users/${userId}/role-mappings/realm`,
        [role],
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }
}
