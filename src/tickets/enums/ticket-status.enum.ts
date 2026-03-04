export enum TicketStatus {
  BACKLOG = 'backlog',           // Not yet prioritized
  TODO = 'todo',                 // Ready to start
  IN_PROGRESS = 'in_progress',   // Being worked on
  IN_REVIEW = 'in_review',       // Code review
  QA_TESTING = 'qa_testing',     // QA is testing
  DONE = 'done',                 // Completed
  CLOSED = 'closed',             // Archived
  BLOCKED = 'blocked',           // Waiting on dependency
  REJECTED = 'rejected',         // Won't implement
}

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  [TicketStatus.BACKLOG]: [TicketStatus.TODO, TicketStatus.REJECTED],
  [TicketStatus.TODO]: [TicketStatus.IN_PROGRESS, TicketStatus.BACKLOG],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.IN_REVIEW, TicketStatus.BLOCKED, TicketStatus.BACKLOG],
  [TicketStatus.IN_REVIEW]: [TicketStatus.QA_TESTING, TicketStatus.IN_PROGRESS],
  [TicketStatus.QA_TESTING]: [TicketStatus.DONE, TicketStatus.IN_PROGRESS],
  [TicketStatus.BLOCKED]: [TicketStatus.IN_PROGRESS, TicketStatus.BACKLOG],
  [TicketStatus.DONE]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS], // Can reopen
  [TicketStatus.REJECTED]: [], // Terminal state
  [TicketStatus.CLOSED]: [TicketStatus.IN_PROGRESS], // Can reopen
};

export function isValidStatusTransition(from: string, to: string): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[from];
  return allowedTransitions ? allowedTransitions.includes(to) : false;
}
