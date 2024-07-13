import { Controller, Post, Body, Param } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';

@Controller('keycloak')
export class KeycloakController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Post('configure')
  async configureKeycloak(): Promise<string> {
    const accessToken = await this.keycloakService.getAccessToken();
    await this.keycloakService.createRealm(accessToken);
    const clientId = await this.keycloakService.createClient(accessToken);
    await this.keycloakService.configureClient(accessToken, clientId);
    return 'Keycloak configured successfully';
  }

  @Post('signup')
  async signup(
    @Body() body: { username: string; password: string; email: string },
  ): Promise<string> {
    await this.keycloakService.signup(body.username, body.password, body.email);
    return 'User registered successfully';
  }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
  ): Promise<any> {
    return this.keycloakService.login(body.username, body.password);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }): Promise<string> {
    await this.keycloakService.logout(body.refreshToken);
    return 'User logged out successfully';
  }

  @Post('assign-role/:userId')
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: { roleName: string },
  ): Promise<string> {
    await this.keycloakService.assignRole(userId, body.roleName);
    return 'Role assigned successfully';
  }
}
