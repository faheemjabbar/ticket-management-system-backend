import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = process.env.SUPERADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  try {
    // Check if superadmin already exists
    const existingUser = await usersService.findByEmail(email);
    
    if (existingUser) {
      console.log('✅ Superadmin already exists:', email);
      console.log('User ID:', existingUser.id);
      console.log('Role:', existingUser.role);
      await app.close();
      return;
    }

    // Create superadmin
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const superadmin = await usersService.create({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin',
      // No organizationId for superadmin
      // No createdBy for superadmin
    });

    console.log('✅ Superadmin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', superadmin.id);
    console.log('Role:', superadmin.role);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
  }

  await app.close();
}

bootstrap();
