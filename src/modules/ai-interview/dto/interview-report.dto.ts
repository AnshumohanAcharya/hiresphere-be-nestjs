import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class InterviewReport {
  @Field(() => ID)
  id: string;

  @Field()
  sessionId: string;

  // Overall metrics
  @Field(() => Float)
  overallScore: number;

  @Field(() => Float, { nullable: true })
  technicalScore?: number;

  @Field(() => Float, { nullable: true })
  communicationScore?: number;

  @Field(() => Float, { nullable: true })
  confidenceScore?: number;

  // Per-question analysis
  @Field(() => String) // JSON string
  questionAnalyses: any;

  // Strengths and weaknesses
  @Field(() => [String])
  strengths: string[];

  @Field(() => [String])
  weaknesses: string[];

  @Field(() => [String])
  improvementAreas: string[];

  // Communication metrics
  @Field(() => Float, { nullable: true })
  averageResponseTime?: number;

  @Field(() => Float, { nullable: true })
  speechClarity?: number;

  @Field(() => Float, { nullable: true })
  pace?: number;

  @Field(() => Int, { nullable: true })
  fillerWordsCount?: number;

  // Technical assessment
  @Field(() => Float, { nullable: true })
  technicalDepth?: number;

  @Field(() => Float, { nullable: true })
  relevanceScore?: number;

  @Field(() => Float, { nullable: true })
  accuracyScore?: number;

  // Job requirement comparison
  @Field(() => String, { nullable: true }) // JSON string
  skillGaps?: any;

  @Field(() => Float, { nullable: true })
  requirementMatch?: number;

  // Behavioral insights
  @Field(() => Float, { nullable: true })
  confidenceLevel?: number;

  @Field(() => Float, { nullable: true })
  engagementLevel?: number;

  @Field(() => Float, { nullable: true })
  timeManagement?: number;

  // Recommendations
  @Field({ nullable: true })
  hiringRecommendation?: string;

  @Field()
  detailedFeedback: string;

  // Visualizations data
  @Field(() => String, { nullable: true }) // JSON string
  performanceChart?: any;

  @Field(() => String, { nullable: true }) // JSON string
  timelineData?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
