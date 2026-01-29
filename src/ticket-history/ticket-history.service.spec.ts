import { Test, TestingModule } from '@nestjs/testing';
import { TicketHistoryService } from './ticket-history.service';

describe('TicketHistoryService', () => {
  let service: TicketHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketHistoryService],
    }).compile();

    service = module.get<TicketHistoryService>(TicketHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
