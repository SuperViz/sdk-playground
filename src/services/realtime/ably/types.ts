import type Ably from 'ably';

import { RealtimeStateTypes } from '../../../common/types/realtime.types';
import { DefaultRealtimeMethods, SyncProperty } from '../base/types';

export interface AblyRealtime extends DefaultRealtimeMethods {}

export interface AblyActors {
  [id: string]: AblyActor;
}

export interface AblyActor extends Ably.Types.PresenceMessage {
  userId: string;
  customProperties: any;
}

export interface AblyRealtimeData {
  hostClientId?: string;
  isGridModeEnable?: boolean;
  syncProperties?: SyncProperty;

  slots?: AblySlot[];
}

export interface AblySlot {
  color?: string;
  connectionId?: string;
  timestamp?: number;
  userId?: string;
}

export type AblyTokenCallBack = (
  error: Ably.Types.ErrorInfo | string,
  tokenRequestOrDetails: Ably.Types.TokenDetails | Ably.Types.TokenRequest | string,
) => void;

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
