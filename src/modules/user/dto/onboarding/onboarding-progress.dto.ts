import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from '../../../auth/dto/user.dto';

@ObjectType()
export class OnboardingProgress {
  @Field(() => Int)
  currentStep: number;

  @Field(() => [Int])
  completedSteps: number[];

  @Field()
  isComplete: boolean;

  @Field(() => User)
  user: User;
}
