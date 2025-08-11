import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DefaultUserRole } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { AirdropService } from './airdrop.service';
import { Roles } from '../../decorators/role.decorator';
import { ValidationGuard } from '../../guards/validation.guard';
import { Validation } from '../../decorators/validation.decorator';
import { AirdropUser } from './models/airdrop-user.model';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('join')
  @UseGuards(ValidationGuard)
  @Validation({ dto: AirdropUser })
  async joinAirdrop(@Body() data: AirdropUser, @Ctx() context: Context) {
    return await this.airdropService.joinAirdrop(data, context);
  }
}
