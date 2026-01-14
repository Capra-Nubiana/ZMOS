/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentMember {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
}

export const CurrentMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentMember => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // This is set by JwtStrategy.validate()
  },
);
