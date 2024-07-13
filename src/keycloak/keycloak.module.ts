import { Module } from '@nestjs/common';
import { KeycloakController } from './keycloak.controller';
import { KeycloakService } from './keycloak.service';

@Module({
  controllers: [KeycloakController],
  providers: [KeycloakService],
})
export class KeycloakModule {}
