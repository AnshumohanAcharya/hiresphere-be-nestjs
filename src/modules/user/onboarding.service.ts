import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { OnboardingStep1Input } from './dto/onboarding/onboarding-step1.dto';
import { OnboardingStep2Input } from './dto/onboarding/onboarding-step2.dto';
import { OnboardingStep3Input } from './dto/onboarding/onboarding-step3.dto';
import { OnboardingStep4Input } from './dto/onboarding/onboarding-step4.dto';
import { OnboardingStep5Input } from './dto/onboarding/onboarding-step5.dto';
import { CompleteOnboardingInput } from './dto/onboarding/complete-onboarding.dto';
import { OnboardingProgress } from './dto/onboarding/onboarding-progress.dto';
import { ProfileCompleteness } from './dto/onboarding/profile-completeness.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async onboardingStep1(userId: string, input: OnboardingStep1Input): Promise<OnboardingProgress> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });

    return this.getOnboardingProgress(userId);
  }

  async onboardingStep2(userId: string, input: OnboardingStep2Input): Promise<OnboardingProgress> {
    // Check if step 1 is completed
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.firstName || !user.lastName) {
      throw new BadRequestException('Please complete step 1 first');
    }

    // Create or update user profile
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        experience: input.experience,
        location: input.location,
        workPreference: input.workPreference,
      },
      create: {
        userId,
        experience: input.experience,
        location: input.location,
        workPreference: input.workPreference,
      },
    });

    return this.getOnboardingProgress(userId);
  }

  async onboardingStep3(userId: string, input: OnboardingStep3Input): Promise<OnboardingProgress> {
    // Validate step 2 completion
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.experience === null || profile.experience === undefined) {
      throw new BadRequestException('Please complete step 2 first');
    }

    // Use transaction to add all skills
    await this.prisma.$transaction(async (tx) => {
      // Delete existing skills if any
      await tx.userSkill.deleteMany({
        where: { userId },
      });

      // Add new skills
      for (const skill of input.skills) {
        await tx.userSkill.create({
          data: {
            userId,
            skillId: skill.skillId,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          },
        });
      }
    });

    return this.getOnboardingProgress(userId);
  }

  async onboardingStep4(userId: string, input: OnboardingStep4Input): Promise<OnboardingProgress> {
    // Validate step 3 completion
    const skillsCount = await this.prisma.userSkill.count({
      where: { userId },
    });

    if (skillsCount < 3) {
      throw new BadRequestException('Please complete step 3 with at least 3 skills first');
    }

    // Ensure either content or fileBase64 is provided
    if (!input.content && !input.fileBase64) {
      throw new BadRequestException('Either resume content or file must be provided');
    }

    // If this resume is set as default, unset all other default resumes
    if (input.isDefault) {
      await this.prisma.resume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    let fileUrl = input.filePath;
    let content = input.content || '';

    // If file is uploaded, upload to Cloudinary
    if (input.fileBase64) {
      try {
        const uploadResult = await this.cloudinaryService.uploadBase64(
          input.fileBase64,
          `resumes/${userId}`,
          'raw',
        );
        fileUrl = uploadResult.secure_url;
        content = `Uploaded file: ${input.fileName || 'resume'}`;
      } catch (error) {
        throw new BadRequestException('Failed to upload resume file');
      }
    }

    // Create resume
    await this.prisma.resume.create({
      data: {
        userId,
        title: input.title,
        content,
        filePath: fileUrl,
        isDefault: input.isDefault,
      },
    });

    return this.getOnboardingProgress(userId);
  }

  async onboardingStep5(userId: string, input: OnboardingStep5Input): Promise<OnboardingProgress> {
    // Validate step 4 completion
    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });

    if (resumeCount === 0) {
      throw new BadRequestException('Please complete step 4 with at least 1 resume first');
    }

    // Update user profile with optional fields
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        preferredJobTypes: input.preferredJobTypes,
        salaryExpectation: input.salaryExpectation,
        availability: input.availability,
        bio: input.bio,
        linkedin: input.linkedin,
        github: input.github,
        website: input.website,
      },
    });

    // Mark onboarding as complete
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboardingCompleted: true },
    });

    return this.getOnboardingProgress(userId);
  }

  async skipOnboardingStep5(userId: string): Promise<OnboardingProgress> {
    // Validate that steps 1-4 are complete
    const isValid = await this.validateMinimumRequirements(userId);

    if (!isValid) {
      throw new BadRequestException('Please complete steps 1-4 before skipping step 5');
    }

    // Mark onboarding as complete even without step 5
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboardingCompleted: true },
    });

    return this.getOnboardingProgress(userId);
  }

  async completeOnboarding(userId: string, input: CompleteOnboardingInput) {
    // Handle file upload before transaction if needed
    let resumeFileUrl = input.step4.filePath;
    let resumeContent = input.step4.content || '';

    if (input.step4.fileBase64) {
      try {
        const uploadResult = await this.cloudinaryService.uploadBase64(
          input.step4.fileBase64,
          `resumes/${userId}`,
          'raw',
        );
        resumeFileUrl = uploadResult.secure_url;
        resumeContent = `Uploaded file: ${input.step4.fileName || 'resume'}`;
      } catch (error) {
        throw new BadRequestException('Failed to upload resume file');
      }
    }

    // Use transaction to ensure all steps complete successfully
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Update user basic info
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: input.step1.firstName,
          lastName: input.step1.lastName,
          phone: input.step1.phone,
        },
      });

      // Step 2: Create/update profile
      await tx.userProfile.upsert({
        where: { userId },
        update: {
          experience: input.step2.experience,
          location: input.step2.location,
          workPreference: input.step2.workPreference,
        },
        create: {
          userId,
          experience: input.step2.experience,
          location: input.step2.location,
          workPreference: input.step2.workPreference,
        },
      });

      // Step 3: Add skills
      await tx.userSkill.deleteMany({ where: { userId } });
      for (const skill of input.step3.skills) {
        await tx.userSkill.create({
          data: {
            userId,
            skillId: skill.skillId,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          },
        });
      }

      // Step 4: Create resume
      if (input.step4.isDefault) {
        await tx.resume.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      await tx.resume.create({
        data: {
          userId,
          title: input.step4.title,
          content: resumeContent,
          filePath: resumeFileUrl,
          isDefault: input.step4.isDefault,
        },
      });

      // Step 5: Update profile with optional fields (if provided)
      if (input.step5) {
        await tx.userProfile.update({
          where: { userId },
          data: {
            preferredJobTypes: input.step5.preferredJobTypes,
            salaryExpectation: input.step5.salaryExpectation,
            availability: input.step5.availability,
            bio: input.step5.bio,
            linkedin: input.step5.linkedin,
            github: input.step5.github,
            website: input.step5.website,
          },
        });
      }

      // Mark onboarding as complete
      const user = await tx.user.update({
        where: { id: userId },
        data: { isOnboardingCompleted: true },
        include: {
          profile: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      return user;
    });
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completedSteps: number[] = [];
    let currentStep = 1;

    // Check step 1: Basic info
    if (user.firstName && user.lastName) {
      completedSteps.push(1);
      currentStep = 2;
    }

    // Check step 2: Professional background
    if (user.profile && user.profile.experience !== null && user.profile.experience !== undefined) {
      completedSteps.push(2);
      currentStep = 3;
    }

    // Check step 3: Skills (minimum 3)
    if (user.skills.length >= 3) {
      completedSteps.push(3);
      currentStep = 4;
    }

    // Check step 4: Resume
    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });
    if (resumeCount > 0) {
      completedSteps.push(4);
      currentStep = 5;
    }

    // Check step 5: Optional preferences (considered complete if user marked onboarding as complete)
    if (user.isOnboardingCompleted) {
      completedSteps.push(5);
    }

    return {
      currentStep,
      completedSteps,
      isComplete: user.isOnboardingCompleted,
      user,
    };
  }

  async getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalFields = 15; // Total meaningful profile fields
    let completedFields = 0;
    const missingFields: string[] = [];
    const recommendations: string[] = [];

    // Check user fields
    if (user.firstName) {
      completedFields++;
    } else {
      missingFields.push('firstName');
    }

    if (user.lastName) {
      completedFields++;
    } else {
      missingFields.push('lastName');
    }

    if (user.phone) {
      completedFields++;
    } else {
      missingFields.push('phone');
      recommendations.push('Add your phone number for better communication');
    }

    if (user.avatar) {
      completedFields++;
    } else {
      recommendations.push('Upload a profile picture to make your profile stand out');
    }

    // Check profile fields
    if (user.profile) {
      if (user.profile.experience !== null && user.profile.experience !== undefined) {
        completedFields++;
      } else {
        missingFields.push('experience');
      }

      if (user.profile.location) {
        completedFields++;
      } else {
        missingFields.push('location');
        recommendations.push('Add your location to find relevant local jobs');
      }

      if (user.profile.workPreference) {
        completedFields++;
      } else {
        missingFields.push('workPreference');
      }

      if (user.profile.bio) {
        completedFields++;
      } else {
        recommendations.push('Add a bio to tell employers about yourself');
      }

      if (user.profile.linkedin) {
        completedFields++;
      } else {
        recommendations.push('Connect your LinkedIn profile');
      }

      if (user.profile.github) {
        completedFields++;
      } else {
        recommendations.push('Connect your GitHub profile to showcase your code');
      }

      if (user.profile.website) {
        completedFields++;
      }

      if (user.profile.education) {
        completedFields++;
      } else {
        recommendations.push('Add your education background');
      }

      if (user.profile.salaryExpectation) {
        completedFields++;
      } else {
        recommendations.push('Set your salary expectations for better job matches');
      }

      if (user.profile.availability) {
        completedFields++;
      } else {
        recommendations.push('Update your availability status');
      }

      if (user.profile.preferredJobTypes && user.profile.preferredJobTypes.length > 0) {
        completedFields++;
      } else {
        recommendations.push('Select your preferred job types');
      }
    }

    // Check skills (considered complete if >= 3)
    if (user.skills.length >= 3) {
      completedFields++;
    } else {
      missingFields.push('skills');
      recommendations.push(
        `Add at least ${3 - user.skills.length} more skills to improve job matching`,
      );
    }

    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      missingFields,
      recommendations,
    };
  }

  async validateMinimumRequirements(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return false;
    }

    // Check step 1: Basic info
    if (!user.firstName || !user.lastName) {
      return false;
    }

    // Check step 2: Professional background
    if (
      !user.profile ||
      user.profile.experience === null ||
      user.profile.experience === undefined
    ) {
      return false;
    }

    // Check step 3: Skills (minimum 3)
    const skillsCount = await this.prisma.userSkill.count({
      where: { userId },
    });
    if (skillsCount < 3) {
      return false;
    }

    // Check step 4: Resume
    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });
    if (resumeCount === 0) {
      return false;
    }

    return true;
  }
}
