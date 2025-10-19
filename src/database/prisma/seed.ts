import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create skills
  const skills = await Promise.all([
    prisma.skill.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: {
        name: 'JavaScript',
        category: 'Programming Language',
        description: 'A high-level programming language',
      },
    }),
    prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: {
        name: 'TypeScript',
        category: 'Programming Language',
        description: 'A typed superset of JavaScript',
      },
    }),
    prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: {
        name: 'React',
        category: 'Frontend Framework',
        description: 'A JavaScript library for building user interfaces',
      },
    }),
    prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: {
        name: 'Node.js',
        category: 'Backend Framework',
        description: 'A JavaScript runtime for server-side development',
      },
    }),
    prisma.skill.upsert({
      where: { name: 'NestJS' },
      update: {},
      create: {
        name: 'NestJS',
        category: 'Backend Framework',
        description:
          'A progressive Node.js framework for building efficient server-side applications',
      },
    }),
  ]);

  console.log('Skills created:', skills);

  // Create a sample admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hiresphere.com' },
    update: {},
    create: {
      email: 'admin@hiresphere.com',
      password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJByJ.jdGvM8nK8Z2yW', // password: admin123
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('Admin user created:', adminUser);

  // Create a sample recruiter user
  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter@hiresphere.com' },
    update: {},
    create: {
      email: 'recruiter@hiresphere.com',
      password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJByJ.jdGvM8nK8Z2yW', // password: admin123
      firstName: 'John',
      lastName: 'Recruiter',
      role: 'RECRUITER',
      isVerified: true,
    },
  });

  console.log('Recruiter user created:', recruiterUser);

  // Create a sample candidate user
  const candidateUser = await prisma.user.upsert({
    where: { email: 'candidate@hiresphere.com' },
    update: {},
    create: {
      email: 'candidate@hiresphere.com',
      password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJByJ.jdGvM8nK8Z2yW', // password: admin123
      firstName: 'Jane',
      lastName: 'Candidate',
      role: 'CANDIDATE',
      isVerified: true,
    },
  });

  console.log('Candidate user created:', candidateUser);

  // Create user profile for candidate
  await prisma.userProfile.upsert({
    where: { userId: candidateUser.id },
    update: {},
    create: {
      userId: candidateUser.id,
      bio: 'Experienced full-stack developer with 5+ years of experience',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/janecandidate',
      github: 'https://github.com/janecandidate',
      experience: 5,
      education: 'Bachelor of Computer Science',
      workPreference: 'REMOTE',
    },
  });

  // Create user skills for candidate
  const candidateSkills = await Promise.all([
    prisma.userSkill.create({
      data: {
        userId: candidateUser.id,
        skillId: skills[0].id, // JavaScript
        level: 'ADVANCED',
        yearsOfExperience: 5,
      },
    }),
    prisma.userSkill.create({
      data: {
        userId: candidateUser.id,
        skillId: skills[1].id, // TypeScript
        level: 'INTERMEDIATE',
        yearsOfExperience: 3,
      },
    }),
    prisma.userSkill.create({
      data: {
        userId: candidateUser.id,
        skillId: skills[2].id, // React
        level: 'ADVANCED',
        yearsOfExperience: 4,
      },
    }),
  ]);

  console.log('User skills created:', candidateSkills);

  // Create a sample job
  const sampleJob = await prisma.job.create({
    data: {
      title: 'Senior Full Stack Developer',
      description: 'We are looking for a senior full-stack developer to join our team...',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      salaryMin: 120000,
      salaryMax: 180000,
      jobType: 'FULL_TIME',
      workMode: 'HYBRID',
      experience: '5+ years',
      requirements: 'Strong experience with React, Node.js, and TypeScript',
      benefits: 'Health insurance, 401k, flexible work hours',
      postedBy: recruiterUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('Sample job created:', sampleJob);

  // Create job skills
  const jobSkills = await Promise.all([
    prisma.jobSkill.create({
      data: {
        jobId: sampleJob.id,
        skillId: skills[0].id, // JavaScript
        required: true,
        level: 'ADVANCED',
      },
    }),
    prisma.jobSkill.create({
      data: {
        jobId: sampleJob.id,
        skillId: skills[1].id, // TypeScript
        required: true,
        level: 'INTERMEDIATE',
      },
    }),
    prisma.jobSkill.create({
      data: {
        jobId: sampleJob.id,
        skillId: skills[2].id, // React
        required: true,
        level: 'ADVANCED',
      },
    }),
  ]);

  console.log('Job skills created:', jobSkills);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
