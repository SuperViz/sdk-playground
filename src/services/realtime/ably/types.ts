import type Ably from 'ably';

import { RealtimeStateTypes } from '../../../common/types/realtime.types';
import { DefaultRealtimeMethods } from '../base/types';

export interface AblyRealtime extends DefaultRealtimeMethods {}

export interface AblyActor {
  [id: string]: Ably.Types.PresenceMessage;
}

export enum AblyConnectionState {
  failed = RealtimeStateTypes.FAILED,
  closed = RealtimeStateTypes.DISCONNECTED,
  initialized = RealtimeStateTypes.DISCONNECTED,
  connecting = RealtimeStateTypes.DISCONNECTED,
  connected = RealtimeStateTypes.CONNECTED,
  disconnected = RealtimeStateTypes.DISCONNECTED,
  closing = RealtimeStateTypes.DISCONNECTED,
  suspended = RealtimeStateTypes.DISCONNECTED,
}
export enum AblyChannelState {
  initialized = RealtimeStateTypes.CONNECTING,
  attaching = RealtimeStateTypes.CONNECTING,
  attached = RealtimeStateTypes.JOINED,
  detaching = RealtimeStateTypes.DISCONNECTED,
  detached = RealtimeStateTypes.READY_TO_JOIN,
  failed = RealtimeStateTypes.FAILED,
  suspended = RealtimeStateTypes.RETRYING,
}
