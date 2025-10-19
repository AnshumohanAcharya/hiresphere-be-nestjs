import { Field, ObjectType, ID, Int, registerEnumType } from '@nestjs/graphql';
import { WorkPreference } from '../../../../generated/prisma';

// Register WorkPreference enum with GraphQL
registerEnumType(WorkPreference, {
  name: 'WorkPreference',
  description: 'Work preference enum',
});

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field(() => String, { nullable: true })
  linkedin?: string | null;

  @Field(() => String, { nullable: true })
  github?: string | null;

  @Field(() => Int, { nullable: true })
  experience?: number | null;

  @Field(() => String, { nullable: true })
  education?: string | null;

  @Field(() => String, { nullable: true })
  availability?: string | null;

  @Field(() => Int, { nullable: true })
  salaryExpectation?: number | null;

  @Field(() => [String], { nullable: true })
  preferredJobTypes?: string[] | null;

  @Field(() => WorkPreference)
  workPreference: WorkPreference;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
