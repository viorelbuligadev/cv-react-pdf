import React from "react";
import Text from "./components/CvDocument/elements/Text";

export type EnabledProjects = (keyof typeof projectsByName)[];

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
      <><Text isBold>Upgraded production EC2 instances to a supported OS baseline</Text> using AI-assisted development to build a repeatable Terraform-based migration strategy, preserving data integrity and application availability while eliminating end-of-life security exposure.</>,
      <><Text isBold>Cut monthly AWS spend by ~$4000</Text> by decommissioning orphaned EBS volumes via reusable Pulumi modules contributed to the internal infrastructure library.</>,
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
      <><Text isBold>Built the core subscribe/unsubscribe flow for filter-based email notifications</Text>, enabling users to self-manage their alerts and reducing the volume of irrelevant emails received.</>,
      <><Text isBold>Removed manual database deployment steps from the release process</Text> by automating EF Core migrations in Azure DevOps pipelines, guaranteeing the database schema is up-to-date just before the application is deployed.</>,
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
      <><Text isBold>Increased trade processing throughput by 10x</Text> by moving complex trade decomposition out of Allegro into a cloud-native, event-driven pipeline built on Azure Functions, Azure App Services, Service Bus, and CosmosDB.</>,
      <><Text isBold>Reduced production issue investigation time by 80%</Text> by adding correlation IDs across the request pipeline, enabling engineers to trace a single transaction end-to-end through all microservices involved.</>,
    ],
    skills: ['C#', '.NET 8', 'ASP.NET Core 8', 'Azure Functions', 'Azure CosmosDB', 'Blob Storage', 'Service Bus', 'Kafka', 'Angular', 'Event-Driven Architecture', 'Azure Logic Apps', 'Kafka', 'DDD', 'Azure DevOps'],
  },
  costko: {
    projectName: 'COST MANAGEMENT SYSTEM',
    from: 'November 2021',
    to: 'May 2022',
    title: 'Senior .NET Engineer',
    company: 'Cognizant Softvision',
    clientProblem: 'The client, a top player in the nutrition industry, was losing significant time on repetitive work because its system could not be configured to handle different CSV and Excel file structures.',
    achievements: [
      <><Text isBold>Accelerated the development of new import/export integrations by ~80%</Text>, through a core backend component that enabled dynamic configuration of column structures for CSV and Excel files.</>,
      <><Text isBold>Eliminated manual data cleanup after failed imports</Text> by introducing transactional behavior per web request through a refactored codebase and properly scoped dependency injection lifetimes, ensuring that a single failed row never left the system in an inconsistent state.</>,
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
      <><Text isBold>Saved over 4 hours of work/admin task</Text> by fully automating the wire-transfer subscription algorithm by extending the backend API with new features and exposing them through a highly intuitive UI.</>,
      <><Text isBold>Eliminated admin involvement in license purchases</Text> and saved ~30 minutes per request by implementing a self-service 'add licenses' feature, achieved by refactoring and extending the backend API.</>
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
      <><Text isBold>Reduced cloud hosting costs by 20%</Text> by switching from VM (IaaS) to a cheaper and more efficient Azure Function (FaaS), leveraging Service Bus triggers to consume messages instead of legacy worker service</>,
      <><Text isBold>Improved application maintenance by 2x</Text> by enhancing the application observability by eliminating the vast majority of daily audit messages logged into Elasticsearch by refactoring the code and logging only the exception generated by unexpected behavior.</>,
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
      <><Text isBold>Boosted overall application's performance by 12% and dropped start-up time from 4 minutes to 10 seconds</Text> by successfully upgrading the application's framework to the latest version of ASP.NET Core by in-depth researching the new functional documentation.</>,
      <><Text isBold>Reduced DB load by ~20%</Text> by filtering synchronization messages between SQL Server and Elasticsearch via an ASP.NET Core middleware, cutting message volume by ~75%.</>,
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
      <><Text isBold>Cut application response time in half</Text> by migrating the legacy framework to ASP.NET Core, significantly improving the end-user experience.</>,
      <><Text isBold>Improved production tracking and reporting accuracy</Text> by extending the application's management capabilities with new backend components and detailed reports for each production step.</>,
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
      <><Text isBold>Extended the purchase module's capabilities by over 20%</Text> by contributing new business workflows on top of the existing framework, based on specifications provided by the business analyst.</>,
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
      <><Text isBold>Delivered a suite of BIM automation tools used across structural engineering projects</Text>, including Revit add-ins in C#, Dynamo scripts, and WPF applications that automated structural element modeling, data extraction, and integrations with analysis software and Excel.</>,
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
    <><Text isBold>Produced 3D structural models in Revit Structure</Text> for live engineering projects, along with engineering drawings and reinforcement details in AutoCAD and Armacad, gaining first-hand experience of the manual workflows BIM automation would later target.</>,
  ],
  skills: ['Autodesk Revit', 'AutoCAD', 'Armacad', 'Structural Engineering', '3D Modeling'],
},
}
