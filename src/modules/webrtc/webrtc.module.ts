import { Module } from '@nestjs/common';
import { WebRtcGateway } from './webrtc.gateway';
import { WebRtcService } from './webrtc.service';

@Module({
  providers: [WebRtcGateway, WebRtcService],
  exports: [WebRtcGateway, WebRtcService],
})
export class WebRtcModule {}
