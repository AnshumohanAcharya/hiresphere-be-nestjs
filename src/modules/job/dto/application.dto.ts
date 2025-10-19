import { Field, ObjectType, ID } from '@nestjs/graphql';

import { ApplicationStatus } from '../../../../generated/prisma';
import { User } from '../../auth/dto/user.dto';

@ObjectType()
export class Application {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  jobId: string;

  @Field(() => String)
  status: ApplicationStatus;

  @Field({ nullable: true })
  coverLetter?: string;

  @Field({ nullable: true })
  resumeId?: string;

  @Field()
  appliedAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  user?: User;

  // Use forwardRef to avoid circular dependency with Job
  @Field(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Job } = require('./job.dto');
      return Job;
    },
    { nullable: true },
  )
  job?: any;
}
