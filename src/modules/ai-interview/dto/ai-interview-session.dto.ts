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

  // Video/WebRTC fields
  @Field({ nullable: true })
  videoRecordingPath?: string;

  @Field({ nullable: true })
  audioRecordingPath?: string;

  @Field({ nullable: true })
  webrtcSessionId?: string;

  @Field({ nullable: true })
  signalingServerUrl?: string;

  // Job Description fields
  @Field({ nullable: true })
  jobDescription?: string;

  @Field({ nullable: true })
  roleTitle?: string;

  @Field({ nullable: true })
  difficultyLevel?: string;

  @Field(() => [String], { nullable: true })
  extractedSkills?: string[];

  // Cheating detection fields
  @Field(() => Number, { nullable: true })
  cheatingScore?: number;

  @Field(() => [String], { nullable: true })
  suspiciousActivities?: string[];

  // Timing fields
  @Field(() => String, { nullable: true })
  questionTimings?: any; // JSON field

  @Field(() => Int, { nullable: true })
  totalDuration?: number;
}
