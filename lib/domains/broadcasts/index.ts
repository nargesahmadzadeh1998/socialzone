// DEFERRED — stub only. Hosts broadcasting to registered attendees.

export interface BroadcastService {
  broadcastToEventAttendees(input: {
    eventId: string;
    subject: string;
    body: string;
    sentByUserId: string;
  }): Promise<void>;
}
