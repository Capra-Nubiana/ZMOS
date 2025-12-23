import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionTypeDto } from './create-session-type.dto';

export class UpdateSessionTypeDto extends PartialType(CreateSessionTypeDto) {}
