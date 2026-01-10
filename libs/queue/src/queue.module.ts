import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global() // 👈 Makes this module available everywhere without re-importing
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  exports: [BullModule],
})
export class SharedQueueModule {}
