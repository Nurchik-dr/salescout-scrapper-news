import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../decorators/user-id.decorator';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  async getProfileInfo(@UserId() userId: string) {
    return this.userService.getProfileInfo(userId)
  }

  // @Patch('/hot-word')
  // @UseGuards(JwtAuthGuard)
  // @UsePipes(new ValidationPipe({
  //   whitelist: true,
  //   forbidNonWhitelisted: false,
  //   transform: true
  // }))
  //
  // async updateHotWord(
  //   @UserId() userId: string,
  //   @Body() dto: UpdateHotWordDto,
  // ) {
  //   console.log('dto', dto);
  //   return this.userService.updateHotWord(userId, dto.hotWord);
  // }
}
