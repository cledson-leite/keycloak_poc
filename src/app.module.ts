import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { KeycloakModule } from './keycloak/keycloak.module';

@Module({
  imports: [HttpModule, KeycloakModule],
})
export class AppModule {}
