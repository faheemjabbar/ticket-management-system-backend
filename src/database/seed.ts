import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const projectsService = app.get(ProjectsService);

  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await usersService.create({
      name: 'Admin User',
      email: 'admin@tickflo.com',
      password: hashedPassword,
      role: 'admin',
      bio: 'System Administrator',
    });
    console.log('✅ Admin user created');

    // Create QA user
    const qa = await usersService.create({
      name: 'Jane QA',
      email: 'qa@tickflo.com',
      password: await bcrypt.hash('QA123!', 10),
      role: 'qa',
      bio: 'Quality Assurance Engineer',
    });
    console.log('✅ QA user created');

    // Create developer user
    const dev = await usersService.create({
      name: 'John Developer',
      email: 'john@tickflo.com',
      password: await bcrypt.hash('Dev123!', 10),
      role: 'developer',
      bio: 'Full-stack Developer',
    });
    console.log('✅ Developer user created');

    // Create sample project
    await projectsService.create({
      name: 'E-Commerce Platform',
      description: 'Building a modern e-commerce platform with React and Node.js',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      teamMembers: [
        { userId: admin.id, role: 'admin' },
        { userId: qa.id, role: 'qa' },
        { userId: dev.id, role: 'developer' },
      ],
    }, admin.id);
    console.log('✅ Sample project created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@tickflo.com / Admin123!');
    console.log('QA: qa@tickflo.com / QA123!');
    console.log('Developer: john@tickflo.com / Dev123!');
    
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
