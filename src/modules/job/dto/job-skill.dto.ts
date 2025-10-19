import { Field, ObjectType, ID } from '@nestjs/graphql';
import { SkillLevel } from '../../../../generated/prisma';
import { Skill } from '../../user/dto/skill.dto';

@ObjectType()
export class JobSkill {
  @Field(() => ID)
  id: string;

  @Field()
  jobId: string;

  @Field()
  skillId: string;

  @Field()
  required: boolean;

  @Field(() => String, { nullable: true })
  level?: SkillLevel;

  @Field(() => Skill)
  skill: Skill;
}
