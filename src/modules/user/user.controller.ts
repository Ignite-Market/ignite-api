import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getUserProfile(@Ctx() context: Context) {
    return await this.userService.getUserProfile(context);
  }

  @Post('wallet-login')
  async loginWithWallet(@Body() data: any, @Ctx() context: Context) {
    return await this.userService.loginWithWallet(data, context);
  }
}
