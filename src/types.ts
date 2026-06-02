// Core domain types for SHOW TIME.

export type CategoryId =
  | "play" // הצגה
  | "concert" // הופעה
  | "movie" // סרט
  | "classical" // קונצרט
  | "standup" // סטנדאפ
  | "lecture" // הרצאה
  | "festival" // פסטיבל
  | "other"; // אחר

export interface ShowEvent {
  id: string;
  title: string;
  category: CategoryId;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** HH:mm, optional */
  time?: string;
  venue?: string;
  city?: string;
  seats?: string;
  ticketsCount?: number;
  ticketPrice?: number;
  ticketUrl?: string;
  /** Free notes written before the event (planning). */
  notes?: string;
  /** Storage path of the event's poster/cover image (private bucket). */
  posterImagePath?: string;
  // Subscription usage
  subscriptionId?: string;
  subscriptionTicketsUsed?: number;
  // After the event (memory archive)
  rating?: number; // 1..5
  /** Post-event review / memories (maps to events.post_notes). */
  review?: string;
  highlights?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Subscription {
  id: string;
  name: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  totalTickets?: number;
  remainingTickets?: number;
  notes?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

/** The event payload carried inside a share (snapshot, no ids/subscriptions). */
export interface SharedEventPayload {
  title: string;
  category: CategoryId;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  seats?: string;
  ticketsCount?: number;
  ticketPrice?: number;
  ticketUrl?: string;
  notes?: string;
  rating?: number;
  review?: string;
  highlights?: string[];
  senderName: string;
  senderEmail?: string;
}

/** A share addressed to the current user. */
export interface SharedEvent {
  id: string;
  senderUserId: string;
  posterImagePath?: string;
  status: "pending" | "accepted" | "dismissed";
  createdAt: number;
  data: SharedEventPayload;
}

export interface PhotoRecord {
  id: string;
  eventId: string;
  blob: Blob;
  createdAt: number;
}

export interface Settings {
  notificationsEnabled: boolean;
  demoSeeded: boolean;
}
