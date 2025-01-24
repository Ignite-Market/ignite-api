import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseService {
  /**
   * Returns base API information.
   */
  getRoot() {
    return {
      name: 'Ignite Market API',
      description:
        'Ignite Market is a decentralized prediction market platform, designed to enable users to trade on the outcomes of real-world events.',
      uptime: process.uptime()
    };
  }
}
