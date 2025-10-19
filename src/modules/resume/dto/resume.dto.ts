import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Resume {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  filePath?: string;

  @Field()
  isDefault: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
