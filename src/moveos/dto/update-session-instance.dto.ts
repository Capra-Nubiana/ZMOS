import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionInstanceDto } from './create-session-instance.dto';

export class UpdateSessionInstanceDto extends PartialType(
  CreateSessionInstanceDto,
) {}
