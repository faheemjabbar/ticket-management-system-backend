import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Connection } from 'mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { TicketsModule } from './tickets/tickets.module';
import { CommentsModule } from './comments/comments.module';
import { TicketHistoryModule } from './ticket-history/ticket-history.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivitiesModule } from './activities/activities.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI ?? '', {
      connectionFactory: (connection: Connection) => {
        if (connection.readyState === 1) {
          console.log('✅ MongoDB connected successfully');
        }

        connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
        });

        connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
        });

        return connection;
      },
    }),

    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    TicketsModule,
    CommentsModule,
    TicketHistoryModule,
    UploadModule,
    NotificationsModule,
    ActivitiesModule,
    MailModule,
  ],
})
export class AppModule {}
