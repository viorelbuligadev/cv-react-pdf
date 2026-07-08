export type EnabledProjects = (keyof typeof projectsByName)[];

export interface Achievement {
  highlight: string;
  text: string;
}

export interface Project {
  projectName: string;
  from: string;
  to: string;
  title: string;
  company?: string;
  clientProblem: string;
  achievements: Achievement[];
  skills: string[];
}

// ---- Left section (shared between PDF and HTML renderers) ----

export type ContactType = 'phone' | 'email' | 'location' | 'linkedin';

export interface Contact {
  type: ContactType;
  text: string;
  link?: string;
}

export const contacts: Contact[] = [
  { type: 'phone', text: '(+40) 740 502 565', link: 'tel:+40740502565' },
  { type: 'email', text: 'viorel.buliga.dev@gmail.com', link: 'mailto:viorel.buliga.dev@gmail.com' },
  { type: 'location', text: 'Romania' },
  { type: 'linkedin', text: 'in/viorel-buliga', link: 'https://www.linkedin.com/in/viorel-buliga/' },
];

export const aiTools: string[] = ['Claude Code', 'Codex', 'GitHub Copilot'];

export interface Skill {
  name: string;
  years: number;
}

export const skills: Skill[] = [
  { name: 'C#/.NET', years: 9 },
  { name: 'SQL', years: 8 },
  { name: 'ASP.NET Core', years: 7 },
  { name: 'REST API', years: 7 },
  { name: 'Azure', years: 6 },
  { name: 'Microservices', years: 6 },
  { name: 'Unit Testing', years: 6 },
  { name: 'Azure DevOps', years: 6 },
  { name: 'Docker', years: 3 },
  { name: 'Angular', years: 3 },
  { name: 'CosmosDB', years: 2 },
  { name: 'Python', years: 2 },
  { name: 'IaC', years: 2 },
  { name: 'AWS', years: 1 },
];

export const certifications: string[] = [
  'Terraform Associate',
  'AWS Cloud Practitioner',
  'Azure Fundamentals',
  'Azure Developer Associate',
];

export const education = {
  institution: 'Technical University “Gheorghe Asachi”',
  degree: 'Engineering Degree',
  location: 'Iasi, 2008 - 2012',
};

export const profilePhoto = '/images/profile-photo-zoomed.jpg';

// ---- Right section header (shared) ----

export const fullName = 'Viorel Buliga';

export const titleItems: string[] = [
  'Senior AI Engineer',
  '.NET Full-Stack',
  'Contractor',
  'Freelancer',
];

// ---- Projects ----

export const enabledProjectsAll: EnabledProjects = [
  'mosaic',
  'umm',
  'etrm',
  'costko',
  'officetimelineAdmin',
  'officetimelineOptimizations',
  'officetimelinePerformanceOptimizations',
  'carla',
  'fluentisERP',
  'arcadisBIM',
  'arcadisStructural'
];

export const enabledProjectsOnePage: EnabledProjects = [
  'mosaic',
  'umm',
  'etrm',
]


export const projectsByName = {
  mosaic: {
    projectName: 'Mosaic Platform',
    from: 'November 2025',
    to: 'May 2026',
    title: 'Senior AI/.NET/Cloud Engineer',
    company: 'Siemens Energy',
    clientProblem: 'The client, a global energy technology leader, needed to bring its AWS infrastructure back into compliance and reduce both operational risk and cloud spend, without disrupting the running engineering workloads on top of it.',
    achievements: [
      { highlight: 'Upgraded production EC2 instances to a supported OS baseline', text: ' using AI-assisted development to build a repeatable Terraform-based migration strategy, preserving data integrity and application availability while eliminating end-of-life security exposure.' },
      { highlight: 'Cut monthly AWS spend by ~$4000', text: ' by decommissioning orphaned EBS volumes via reusable Pulumi modules contributed to the internal infrastructure library.' },
    ],
    skills: ['C#', '.NET 10', 'Azure DevOps', 'Azure', 'Docker', 'CI/CD pipelines and templates', 'Pulumi', 'Terraform', 'AWS(EC2, RDS, ECS, IAM, VPC, ECR, ALB, SQS, CloudWatch, CloudFront)', 'PowerShell', 'YAML', 'Claude Code'],
  },
  umm: {
    projectName: 'Urgent Market Messages',
    from: 'March 2025',
    to: 'November 2025',
    title: 'Senior AI/.NET/Azure Developer',
    company: 'Axpo Group',
    clientProblem: 'The client, Switzerland\'s largest producer of renewable energy, was wasting time and money because traders did not have a real-time alert system about power plant unavailabilities.',
    achievements: [
      { highlight: 'Built the core subscribe/unsubscribe flow for filter-based email notifications', text: ', enabling users to self-manage their alerts and reducing the volume of irrelevant emails received.' },
      { highlight: 'Removed manual database deployment steps from the release process', text: ' by automating EF Core migrations in Azure DevOps pipelines, guaranteeing the database schema is up-to-date just before the application is deployed.' },
    ],
    skills: ['C#', '.ASP.NET Core', 'Angular', 'TypeScript', 'Python', 'FastAPI', 'Azure Cloud', 'Azure DevOps', 'Terraform', 'Docker', 'Container Apps', 'Azure SQL Database', 'Service Bus', 'PowerShell', 'YAML', 'GitHub Copilot', ],
  },
  etrm: {
    projectName: 'Energy Trading System - ETRM',
    from: 'May 2022',
    to: 'December 2024',
    title: 'Senior .NET Azure Developer',
    company: 'E.ON Digital Technology',
    clientProblem: 'The client, one of Europe\'s largest energy companies, was held back by its Allegro ETRM platform, which blocked the delivery of new trading features. At the same time, the surrounding distributed services made production issues slow to diagnose.',
    achievements: [
      { highlight: 'Increased trade processing throughput by 10x', text: ' by moving complex trade decomposition out of Allegro into a cloud-native, event-driven pipeline built on Azure Functions, Azure App Services, Service Bus, and CosmosDB.' },
      { highlight: 'Reduced production issue investigation time by 80%', text: ' by adding correlation IDs across the request pipeline, enabling engineers to trace a single transaction end-to-end through all microservices involved.' },
    ],
    skills: ['C#', '.NET 8', 'ASP.NET Core 8', 'Azure Functions', 'CosmosDB', 'Blob Storage', 'Service Bus', 'Kafka', 'Angular', 'Python', 'Azure Logic Apps', 'Kafka', 'DDD', 'Azure DevOps'],
  },
  costko: {
    projectName: 'COST MANAGEMENT SYSTEM',
    from: 'November 2021',
    to: 'May 2022',
    title: 'Senior .NET Engineer',
    company: 'Cognizant Softvision',
    clientProblem: 'The client, a top player in the nutrition industry, was losing significant time on repetitive work because its system could not be configured to handle different CSV and Excel file structures.',
    achievements: [
      { highlight: 'Accelerated the development of new import/export integrations by ~80%', text: ', through a core backend component that enabled dynamic configuration of column structures for CSV and Excel files.' },
      { highlight: 'Eliminated manual data cleanup after failed imports', text: ' by introducing transactional behavior per web request through a refactored codebase and properly scoped dependency injection lifetimes, ensuring that a single failed row never left the system in an inconsistent state.' },
    ],
    skills: ['C#', 'ASP.NET Core', 'OData', 'EF Core', 'PostgreSQL', 'xUnit', 'Moq', 'Docker', 'Kubernetes', 'SonarQube'],
  },
  officetimelineAdmin: {
    projectName: 'E-COMMERCE SYSTEM PLATFORM',
    from: 'June 2021',
    to: 'November 2021',
    title: 'Senior .NET Engineer',
    company: 'RomSoft',
    clientProblem: 'The client, offering project management tools as a subscription, was experiencing considerable annual losses on its major in-house product due to lacking key-business functionalities in the back office.',
    achievements: [
      { highlight: 'Saved over 4 hours of work/admin task', text: ' by fully automating the wire-transfer subscription algorithm by extending the backend API with new features and exposing them through a highly intuitive UI.' },
      { highlight: 'Eliminated admin involvement in license purchases', text: ' and saved ~30 minutes per request by implementing a self-service \'add licenses\' feature, achieved by refactoring and extending the backend API.' },
    ],
    skills: ['C#', 'ASP.NET Core MVC', 'EF Core', 'SQL Server', 'Azure', 'CI/CD', 'Elastic Stack', 'xUnit', 'Moq', 'Microservices', 'Azure DevOps'],
  },

  officetimelineOptimizations: {
    projectName: 'E-COMMERCE SYSTEM RESOURCES OPTIMIZATION',
    from: 'January 2021',
    to: 'May 2021',
    title: 'Senior Azure Developer',
    company: 'RomSoft',
    clientProblem: 'The client, a US-based company active in the e-commerce industry, was wasting a significant amount of money and time due to its continued use of an outdated technology stack and an inefficient system for application observability.',
    achievements: [
      { highlight: 'Reduced cloud hosting costs by 20%', text: ' by switching from VM (IaaS) to a cheaper and more efficient Azure Function (FaaS), leveraging Service Bus triggers to consume messages instead of legacy worker service' },
      { highlight: 'Improved application maintenance by 2x', text: ' by enhancing the application observability by eliminating the vast majority of daily audit messages logged into Elasticsearch by refactoring the code and logging only the exception generated by unexpected behavior.' },
    ],
    skills: ['C#', 'ASP.NET Core MVC', 'EF Core', 'SQL Server', 'Azure', 'CI/CD', 'Elastic Stack', 'xUnit', 'Moq', 'Microservices', 'Azure DevOps'],
  },

  officetimelinePerformanceOptimizations: {
    projectName: 'E-COMMERCE SYSTEM PERFORMANCE OPTIMIZATION',
    from: 'July 2020',
    to: 'December 2020',
    title: 'Senior .NET Engineer',
    company: 'RomSoft',
    clientProblem: 'The client, a US based e-commerce company, was wasting an important amount of time and money, due to still using a legacy system with an outdated framework.',
    achievements: [
      { highlight: 'Boosted overall application\'s performance by 12% and dropped start-up time from 4 minutes to 10 seconds', text: ' by successfully upgrading the application\'s framework to the latest version of ASP.NET Core by in-depth researching the new functional documentation.' },
      { highlight: 'Reduced DB load by ~20%', text: ' by filtering synchronization messages between SQL Server and Elasticsearch via an ASP.NET Core middleware, cutting message volume by ~75%.' },
    ],
    skills: ['C#', 'ASP.NET Core MVC', 'EF Core', 'SQL Server', 'Azure', 'CI/CD', 'Elastic Stack', 'xUnit', 'Moq', 'Microservices', 'Azure DevOps'],
  },

  carla: {
    projectName: 'ERP SYSTEM FOR FAN FACTORY',
    from: 'April 2019',
    to: 'July 2020',
    title: '.NET/Angular Engineer',
    company: 'Beenear',
    clientProblem: 'The client, a software development company, was dealing with low customer satisfaction due to its inability to scale the business.',
    achievements: [
      { highlight: 'Cut application response time in half', text: ' by migrating the legacy framework to ASP.NET Core, significantly improving the end-user experience.' },
      { highlight: 'Improved production tracking and reporting accuracy', text: ' by extending the application\'s management capabilities with new backend components and detailed reports for each production step.' },
    ],
    skills: ['AngularJS', 'ASP.NET', 'ASP.NET Core', 'EF Core', 'SQL Server'],
  },

  fluentisERP: {
    projectName: 'ERP SYSTEM',
    from: 'April 2019',
    to: 'July 2020',
    title: '.NET Engineer',
    company: 'Artinfo SRL',
    clientProblem: 'The client, a company focused on ERP tools, was struggling to expand its business due to missing key functionalities.',
    achievements: [
      { highlight: 'Extended the purchase module\'s capabilities by over 20%', text: ' by contributing new business workflows on top of the existing framework, based on specifications provided by the business analyst.' },
    ],
    skills: ['C#', 'WPF', 'SOA', 'NHibernate', 'WCF', 'SQL Server'],
  },

  arcadisBIM: {
    projectName: 'BIM Automation R&D',
    from: 'November 2017',
    to: 'July 2018',
    title: '.NET/BIM Engineer',
    company: 'Arcadis',
    clientProblem: 'Arcadis was investing in BIM adoption to automate manual, repetitive tasks in structural engineering, but its engineers needed firm-specific tooling that no off-the-shelf BIM product provided. The internal R&D department was set up to build that tooling.',
    achievements: [
      { highlight: 'Delivered a suite of BIM automation tools used across structural engineering projects', text: ', including Revit add-ins in C#, Dynamo scripts, and WPF applications that automated structural element modeling, data extraction, and integrations with analysis software and Excel.' },
    ],
    skills: ['Autodesk Revit', 'C#', 'Python', 'DynamoBIM', 'Visual Studio', 'WPF'],
  },

arcadisStructural: {
  projectName: 'Structural Engineering Projects',
  from: 'July 2013',
  to: 'October 2017',
  title: 'Structural Engineer',
  company: 'Arcadis',
  clientProblem: 'Arcadis was delivering large-scale civil engineering projects where structural engineers spent significant time on repetitive modeling, drafting, and detailing tasks. This was the environment that later inspired the move into software development — building the very tools that could automate this kind of work.',
  achievements: [
    { highlight: 'Produced 3D structural models in Revit Structure', text: ' for live engineering projects, along with engineering drawings and reinforcement details in AutoCAD and Armacad, gaining first-hand experience of the manual workflows BIM automation would later target.' },
  ],
  skills: ['Autodesk Revit', 'AutoCAD', 'Armacad', 'Structural Engineering', '3D Modeling'],
},
}
