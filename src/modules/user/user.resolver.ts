import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../auth/dto/user.dto';
import { UserProfile } from '../auth/dto/user-profile.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Skill } from './dto/skill.dto';
import { UserSkill } from './dto/user-skill.dto';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context) {
    return this.userService.getUserProfile(context.req.user.id);
  }

  @Mutation(() => UserProfile)
  @UseGuards(JwtAuthGuard)
  async createProfile(@Context() context, @Args('input') createProfileDto: CreateUserProfileDto) {
    return this.userService.createUserProfile(context.req.user.id, createProfileDto);
  }

  @Mutation(() => UserProfile)
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Context() context, @Args('input') updateProfileDto: UpdateUserProfileDto) {
    return this.userService.updateUserProfile(context.req.user.id, updateProfileDto);
  }

  @Query(() => [Skill])
  async skills() {
    return this.userService.getAllSkills();
  }

  @Query(() => [UserSkill])
  @UseGuards(JwtAuthGuard)
  async mySkills(@Context() context) {
    return this.userService.getUserSkills(context.req.user.id);
  }

  @Mutation(() => UserSkill)
  @UseGuards(JwtAuthGuard)
  async addSkill(
    @Context() context,
    @Args('skillId') skillId: string,
    @Args('level') level: string,
    @Args('yearsOfExperience', { nullable: true }) yearsOfExperience?: number,
  ) {
    return this.userService.addUserSkill(context.req.user.id, skillId, level, yearsOfExperience);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeSkill(@Context() context, @Args('skillId') skillId: string) {
    await this.userService.removeUserSkill(context.req.user.id, skillId);
    return true;
  }
}
