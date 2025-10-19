import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Job } from './job.dto';

@ObjectType()
export class JobConnection {
  @Field(() => [Job])
  jobs: Job[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}
