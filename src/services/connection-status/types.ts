import { MeetingConnectionStatus } from '../../common/types/events.types';

export interface DefaultConnectionService {
  connectionStatus: MeetingConnectionStatus;

  addListerners: () => void;
  removeListeners: () => void;
  updateMeetingConnectionStatus: (newStatus: MeetingConnectionStatus) => void;
}

export type WindowConnectionStatus = 'online' | 'offline';
