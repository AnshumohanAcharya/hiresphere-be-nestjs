import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { SkillLevel } from '../../../../generated/prisma';
import { Skill } from './skill.dto';

@ObjectType()
export class UserSkill {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  skillId: string;

  @Field(() => String)
  level: SkillLevel;

  @Field(() => Int, { nullable: true })
  yearsOfExperience?: number | null;

  @Field(() => Skill)
  skill: Skill;
}
