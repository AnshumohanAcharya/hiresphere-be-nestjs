import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { AiInterviewStatus } from '../../../../generated/prisma';

@ObjectType()
export class AiInterviewSession {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  jobId?: string;

  @Field(() => [String])
  questions: string[];

  @Field(() => [String])
  answers: string[];

  @Field(() => Int, { nullable: true })
  score?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field(() => String)
  status: AiInterviewStatus;

  @Field()
  startedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Additional fields for active sessions
  @Field({ nullable: true })
  currentQuestion?: string;

  @Field(() => Int, { nullable: true })
  questionIndex?: number;

  @Field(() => Int, { nullable: true })
  totalQuestions?: number;

  @Field({ nullable: true })
  isCompleted?: boolean;
}
