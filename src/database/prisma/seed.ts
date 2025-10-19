import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create comprehensive skills list
  const skillsData = [
    // Programming Languages
    {
      name: 'JavaScript',
      category: 'Programming Language',
      description: 'A high-level programming language',
    },
    {
      name: 'TypeScript',
      category: 'Programming Language',
      description: 'A typed superset of JavaScript',
    },
    {
      name: 'Python',
      category: 'Programming Language',
      description: 'High-level general-purpose programming language',
    },
    {
      name: 'Java',
      category: 'Programming Language',
      description: 'Object-oriented programming language',
    },
    {
      name: 'C++',
      category: 'Programming Language',
      description: 'General-purpose programming language',
    },
    {
      name: 'C#',
      category: 'Programming Language',
      description: 'Modern object-oriented language',
    },
    {
      name: 'Go',
      category: 'Programming Language',
      description: 'Statically typed compiled language',
    },
    { name: 'Rust', category: 'Programming Language', description: 'Systems programming language' },
    {
      name: 'PHP',
      category: 'Programming Language',
      description: 'Server-side scripting language',
    },
    { name: 'Ruby', category: 'Programming Language', description: 'Dynamic programming language' },
    {
      name: 'Swift',
      category: 'Programming Language',
      description: 'Programming language for iOS',
    },
    {
      name: 'Kotlin',
      category: 'Programming Language',
      description: 'Modern programming language for Android',
    },

    // Frontend Frameworks & Libraries
    {
      name: 'React',
      category: 'Frontend Framework',
      description: 'JavaScript library for building user interfaces',
    },
    {
      name: 'Vue.js',
      category: 'Frontend Framework',
      description: 'Progressive JavaScript framework',
    },
    {
      name: 'Angular',
      category: 'Frontend Framework',
      description: 'Platform for building web applications',
    },
    {
      name: 'Next.js',
      category: 'Frontend Framework',
      description: 'React framework for production',
    },
    {
      name: 'Svelte',
      category: 'Frontend Framework',
      description: 'Cybernetically enhanced web apps',
    },
    { name: 'Redux', category: 'Frontend Library', description: 'State management library' },
    {
      name: 'Tailwind CSS',
      category: 'Frontend Library',
      description: 'Utility-first CSS framework',
    },

    // Backend Frameworks
    {
      name: 'Node.js',
      category: 'Backend Framework',
      description: 'JavaScript runtime for server-side',
    },
    { name: 'NestJS', category: 'Backend Framework', description: 'Progressive Node.js framework' },
    {
      name: 'Express.js',
      category: 'Backend Framework',
      description: 'Fast Node.js web framework',
    },
    {
      name: 'Django',
      category: 'Backend Framework',
      description: 'High-level Python web framework',
    },
    {
      name: 'Flask',
      category: 'Backend Framework',
      description: 'Lightweight Python web framework',
    },
    {
      name: 'Spring Boot',
      category: 'Backend Framework',
      description: 'Java framework for microservices',
    },
    {
      name: 'Laravel',
      category: 'Backend Framework',
      description: 'PHP web application framework',
    },
    {
      name: 'Ruby on Rails',
      category: 'Backend Framework',
      description: 'Server-side web framework',
    },

    // Databases
    { name: 'PostgreSQL', category: 'Database', description: 'Advanced open source database' },
    { name: 'MySQL', category: 'Database', description: 'Popular relational database' },
    { name: 'MongoDB', category: 'Database', description: 'NoSQL document database' },
    { name: 'Redis', category: 'Database', description: 'In-memory data structure store' },
    { name: 'DynamoDB', category: 'Database', description: 'AWS NoSQL database service' },
    { name: 'Cassandra', category: 'Database', description: 'Distributed NoSQL database' },

    // DevOps & Cloud
    { name: 'Docker', category: 'DevOps', description: 'Container platform' },
    { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration' },
    { name: 'AWS', category: 'Cloud Platform', description: 'Amazon Web Services' },
    { name: 'Azure', category: 'Cloud Platform', description: 'Microsoft cloud platform' },
    { name: 'Google Cloud', category: 'Cloud Platform', description: 'Google cloud services' },
    { name: 'CI/CD', category: 'DevOps', description: 'Continuous integration and deployment' },
    { name: 'Jenkins', category: 'DevOps', description: 'Automation server' },
    { name: 'GitHub Actions', category: 'DevOps', description: 'CI/CD platform' },
    { name: 'Terraform', category: 'DevOps', description: 'Infrastructure as code' },

    // Testing
    { name: 'Jest', category: 'Testing', description: 'JavaScript testing framework' },
    { name: 'Cypress', category: 'Testing', description: 'E2E testing framework' },
    { name: 'Selenium', category: 'Testing', description: 'Browser automation' },
    { name: 'JUnit', category: 'Testing', description: 'Java testing framework' },

    // Mobile Development
    {
      name: 'React Native',
      category: 'Mobile Development',
      description: 'Cross-platform mobile framework',
    },
    { name: 'Flutter', category: 'Mobile Development', description: 'UI toolkit for mobile' },
    { name: 'iOS Development', category: 'Mobile Development', description: 'Native iOS apps' },
    {
      name: 'Android Development',
      category: 'Mobile Development',
      description: 'Native Android apps',
    },

    // Data Science & ML
    { name: 'Machine Learning', category: 'Data Science', description: 'ML algorithms and models' },
    { name: 'TensorFlow', category: 'Data Science', description: 'ML framework' },
    { name: 'PyTorch', category: 'Data Science', description: 'Deep learning framework' },
    { name: 'Pandas', category: 'Data Science', description: 'Data analysis library' },
    { name: 'NumPy', category: 'Data Science', description: 'Numerical computing library' },

    // Other Skills
    { name: 'GraphQL', category: 'API', description: 'Query language for APIs' },
    { name: 'REST API', category: 'API', description: 'RESTful web services' },
    { name: 'Git', category: 'Version Control', description: 'Distributed version control' },
    { name: 'Agile', category: 'Methodology', description: 'Agile development methodology' },
    { name: 'Scrum', category: 'Methodology', description: 'Agile framework' },
  ];

  const skills = await Promise.all(
    skillsData.map((skill) =>
      prisma.skill.upsert({
        where: { name: skill.name },
        update: {},
        create: skill,
      }),
    ),
  );

  console.log(`${skills.length} skills created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
