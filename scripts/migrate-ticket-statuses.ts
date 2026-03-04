import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../src/tickets/schemas/ticket.schema';

/**
 * Migration script to update existing tickets with new status and type fields
 * 
 * Old Status → New Status mapping:
 * - pending → backlog
 * - assigned → todo
 * - awaiting → in_progress
 * - closed → done
 * 
 * All tickets get default type: 'task'
 */

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🚀 Starting ticket migration...\n');

    // Get Ticket model
    const ticketModel = app.get<Model<TicketDocument>>('TicketModel');

    // Count existing tickets
    const totalTickets = await ticketModel.countDocuments();
    console.log(`📊 Found ${totalTickets} tickets to migrate\n`);

    if (totalTickets === 0) {
      console.log('✅ No tickets to migrate');
      await app.close();
      return;
    }

    // Migrate statuses
    const statusMigrations = [
      { old: 'pending', new: 'backlog' },
      { old: 'assigned', new: 'todo' },
      { old: 'awaiting', new: 'in_progress' },
      { old: 'closed', new: 'done' },
    ];

    for (const migration of statusMigrations) {
      const result = await ticketModel.updateMany(
        { status: migration.old },
        { $set: { status: migration.new } }
      );
      console.log(`✅ Updated ${result.modifiedCount} tickets from '${migration.old}' to '${migration.new}'`);
    }

    // Add default type to all tickets
    const typeResult = await ticketModel.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'task' } }
    );
    console.log(`✅ Added default type 'task' to ${typeResult.modifiedCount} tickets`);

    // Add default priorityScore to all tickets
    const priorityResult = await ticketModel.updateMany(
      { priorityScore: { $exists: false } },
      { $set: { priorityScore: 1000 } }
    );
    console.log(`✅ Added default priorityScore to ${priorityResult.modifiedCount} tickets`);

    // Add empty arrays for new fields
    const fieldsResult = await ticketModel.updateMany(
      {},
      {
        $set: {
          watchers: [],
          acceptanceCriteria: []
        }
      }
    );
    console.log(`✅ Initialized new fields for ${fieldsResult.modifiedCount} tickets`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total tickets migrated: ${totalTickets}`);
    console.log(`   - New status values: backlog, todo, in_progress, done`);
    console.log(`   - Default type: task`);
    console.log(`   - Default priorityScore: 1000`);
    console.log(`   - New fields: watchers, acceptanceCriteria, storyPoints, estimatedHours`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  }

  await app.close();
}

bootstrap();
