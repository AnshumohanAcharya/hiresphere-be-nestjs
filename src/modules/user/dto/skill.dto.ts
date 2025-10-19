import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Skill {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  createdAt: Date;
}
