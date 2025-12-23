import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SessionInstanceService } from '../services/session-instance.service';
import { CreateSessionInstanceDto } from '../dto/create-session-instance.dto';
import { UpdateSessionInstanceDto } from '../dto/update-session-instance.dto';
import { QuerySessionsDto } from '../dto/query-sessions.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(
    private readonly sessionInstanceService: SessionInstanceService,
  ) {}

  @Post()
  create(@Body() createSessionInstanceDto: CreateSessionInstanceDto) {
    return this.sessionInstanceService.create(createSessionInstanceDto);
  }

  @Get()
  findAll(@Query() query: QuerySessionsDto) {
    return this.sessionInstanceService.findAll(query);
  }

  @Get('available')
  getAvailableSessions(@Query() query: QuerySessionsDto) {
    return this.sessionInstanceService.getAvailableSessions(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionInstanceService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionInstanceDto: UpdateSessionInstanceDto,
  ) {
    return this.sessionInstanceService.update(id, updateSessionInstanceDto);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.sessionInstanceService.cancel(id);
  }

  @Put(':id/complete')
  complete(@Param('id') id: string) {
    return this.sessionInstanceService.complete(id);
  }

  @Post(':id/checkin')
  checkIn(@Param('id') id: string) {
    // This will need to be updated to get memberId from JWT token
    // For now, we'll assume it's passed or extracted from auth
    return this.sessionInstanceService.findOne(id); // Placeholder
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionInstanceService.cancel(id); // Soft delete via cancel
  }
}
