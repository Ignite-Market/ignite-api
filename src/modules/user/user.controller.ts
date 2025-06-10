import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { WalletLoginDto } from './dtos/wallet-login.dto';
import { ValidationGuard } from '../../guards/validation.guard';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UserEmailDto } from './dtos/user-email.dto';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { ValidateFor } from '../../config/types';

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

  @Get('/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.userService.getUserById(id, context);
  }

  @Get('/:id/predictions')
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getUserPredictions(@Param('id', ParseIntPipe) id: number, @Query() query: BaseQueryFilter, @Ctx() context: Context) {
    return await this.userService.getUserPredictions(id, query, context);
  }

  @Get('/:id/funding-positions')
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getUserFundingPositions(@Param('id', ParseIntPipe) id: number, @Query() query: BaseQueryFilter, @Ctx() context: Context) {
    return await this.userService.getUserFundingPositions(id, query, context);
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

  @Post('email-verification')
  @UseGuards(AuthGuard)
  async sendEmailVerification(@Body() data: any, @Ctx() context: Context) {
    return await this.userService.sendEmailVerification(data, context);
  }

  @Patch('change-email')
  async changeEmail(@Body() data: any, @Ctx() context: Context) {
    return await this.userService.changeEmail(data, context);
  }
}
