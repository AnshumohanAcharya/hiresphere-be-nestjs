import { Field, ObjectType, ID } from '@nestjs/graphql';
import { UserRole } from './user-role.enum';
import { UserProfile } from './user-profile.dto';
import { UserSkill } from '../../user/dto/user-skill.dto';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  googleId?: string | null;

  @Field(() => String, { nullable: true })
  githubId?: string | null;

  @Field(() => String, { nullable: true })
  provider?: string | null;

  @Field()
  isActive: boolean;

  @Field()
  isVerified: boolean;

  @Field()
  isOnboardingCompleted: boolean;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => UserProfile, { nullable: true })
  profile?: UserProfile | null;

  @Field(() => [UserSkill], { nullable: true })
  skills?: UserSkill[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
