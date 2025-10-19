import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class ProfileCompleteness {
  @Field(() => Int)
  percentage: number;

  @Field(() => [String])
  missingFields: string[];

  @Field(() => [String])
  recommendations: string[];
}
