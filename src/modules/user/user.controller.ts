import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { WalletLoginDto } from './dtos/wallet-login.dto';
import { ValidationGuard } from '../../guards/validation.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getUserProfile(@Ctx() context: Context) {
    return await this.userService.getUserProfile(context);
  }

  @Get('/wallet-message')
  getWalletAuthMessage(): any {
    return this.userService.getWalletAuthMessage();
  }

  @Post('wallet-login')
  @Validation({ dto: WalletLoginDto })
  @UseGuards(ValidationGuard)
  async loginWithWallet(@Body() data: WalletLoginDto, @Ctx() context: Context) {
    return await this.userService.loginWithWallet(data, context);
  }
}
