import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../config/env';

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

  async getSiteVerify(procaptcha: any) {
    // send a POST application/json request to the API endpoint
    const response = await axios.post('https://api.prosopo.io/siteverify', {
      token: procaptcha.token,
      secret: env.PROSOPO_SECRET_KEY
    });

    return response.data?.verified ?? false;
  }
}
