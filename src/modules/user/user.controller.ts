import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { WalletLoginDto } from './dtos/wallet-login.dto';
import { ValidationGuard } from '../../guards/validation.guard';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UserEmailDto } from './dtos/user-email.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getUserProfile(@Ctx() context: Context) {
    return await this.userService.getUserProfile(context);
  }

  @Get('wallet-message')
  getWalletAuthMessage(): any {
    return this.userService.getWalletAuthMessage();
  }

  @Post('wallet-login')
  @Validation({ dto: WalletLoginDto })
  @UseGuards(ValidationGuard)
  async loginWithWallet(@Body() data: WalletLoginDto, @Ctx() context: Context) {
    return await this.userService.loginWithWallet(data, context);
  }

  @Put('update-profile')
  @Validation({ dto: UserProfileDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async updateProfile(@Body() data: UserProfileDto, @Ctx() context: Context) {
    return await this.userService.updateProfile(data, context);
  }

  @Put('update-email')
  @Validation({ dto: UserEmailDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async updateEmail(@Body() data: UserEmailDto, @Ctx() context: Context) {
    return await this.userService.updateEmail(data, context);
  }
}
