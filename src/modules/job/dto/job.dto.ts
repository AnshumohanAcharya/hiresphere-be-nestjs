import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { JobType, WorkMode } from '../../../../generated/prisma';
import { JobSkill } from './job-skill.dto';
import { Application } from './application.dto';

@ObjectType()
export class Job {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  company: string;

  @Field({ nullable: true })
  location?: string;

  @Field(() => Int, { nullable: true })
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  salaryMax?: number;

  @Field(() => String)
  jobType: JobType;

  @Field(() => String)
  workMode: WorkMode;

  @Field({ nullable: true })
  experience?: string;

  @Field({ nullable: true })
  requirements?: string;

  @Field({ nullable: true })
  benefits?: string;

  @Field()
  isActive: boolean;

  @Field()
  postedBy: string;

  @Field()
  postedAt: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [JobSkill], { nullable: true })
  skills?: JobSkill[];

  @Field(() => [Application], { nullable: true })
  applications?: Application[];
}
