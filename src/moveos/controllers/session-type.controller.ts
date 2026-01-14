/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionTypeService } from '../services/session-type.service';
import { CreateSessionTypeDto } from '../dto/create-session-type.dto';
import { UpdateSessionTypeDto } from '../dto/update-session-type.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('session-types')
@UseGuards(JwtAuthGuard)
export class SessionTypeController {
  constructor(private readonly sessionTypeService: SessionTypeService) {}

  @Post()
  create(@Body() createSessionTypeDto: CreateSessionTypeDto) {
    return this.sessionTypeService.create(createSessionTypeDto);
  }

  @Get()
  findAll() {
    return this.sessionTypeService.findAll();
  }

  @Get('active')
  findActive() {
    return this.sessionTypeService.findActive();
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.sessionTypeService.findByCategory(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionTypeDto: UpdateSessionTypeDto,
  ) {
    return this.sessionTypeService.update(id, updateSessionTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionTypeService.remove(id);
  }
}
