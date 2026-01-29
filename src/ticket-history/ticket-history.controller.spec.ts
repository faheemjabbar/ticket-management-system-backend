import { Test, TestingModule } from '@nestjs/testing';
import { TicketHistoryController } from './ticket-history.controller';

describe('TicketHistoryController', () => {
  let controller: TicketHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketHistoryController],
    }).compile();

    controller = module.get<TicketHistoryController>(TicketHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
