import {
  Body,
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserId } from '../decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // Создание компании
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateCompanyDto, @Req() req: any, @UserId() userId: string) {
    return this.companyService.create(userId, dto);
  }

  // Получение всех компаний пользователя
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@UserId() userId: string) {
    return this.companyService.findAllByUser(userId);
  }

  // Получение активной компании
  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActive(@UserId() userId: string) {
    return this.companyService.getActiveCompany(userId);
  }

  // Обновление компании
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @UserId() userId: string,
  ) {
    return this.companyService.update(companyId, userId, dto);
  }

  // Удаление компании
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') companyId: string, @UserId() userId: string) {
    return this.companyService.delete(companyId, userId);
  }
}
