import {
  securityEventRepository,
  type SecurityEventListQuery,
} from "../repositories/security.repository";

export class SecurityService {
  list(query: SecurityEventListQuery) {
    return securityEventRepository.list(query);
  }
}

export const securityService = new SecurityService();
