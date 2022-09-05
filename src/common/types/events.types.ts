export enum MeetingEvent {
  FRAME_LOAD = 'frame.load',
  FRAME_SIZE_UPDATE = 'frame.size-update',

  MEETING_START = 'meeting.start',
  MEETING_LEAVE = 'meeting.leave',
  MEETING_USER_AMOUNT_UPDATE = 'meeting.amount-of-users-update',
  MEETING_USER_LIST_UPDATE = 'meeting.user-list-update',
  MEETING_USER_JOINED = 'meeting.user-joined',
  MEETING_USER_LEFT = 'meeting.user-left',
  MEETING_JOIN = 'meeting.join',
  MEETING_USER_PROPERTIES = 'meeting.user-properties',
  MEETING_HOST_CHANGE = 'meeting.host-change',
  MEETING_GRID_MODE_CHANGE = 'meeting.grid-mode-change',
  MEETING_SAME_USER_ERROR = 'meeting.same-user-error',
  MEETING_DEVICES_CHANGE = 'meeting.devices-change',
  MEETING_KICK_USERS = 'meeting.kick-all-users',
  MEETING_STATE_UPDATE = 'meeting.state-update',

  MY_USER_UPDATED = 'my-user.update',
  MY_USER_LEFT = 'my-user.left',
  MY_USER_JOINED = 'my-user.joined',

  HEARTBEAT = 'heartbeat',
  DESTROY = 'destroy',
}

export enum RealtimeEvent {
  REALTIME_JOIN = 'realtime.join',
  REALTIME_USER_LIST_UPDATE = 'realtime.user-list-update',
  REALTIME_HOST_CHANGE = 'realtime.host-change',
  REALTIME_GRID_MODE_CHANGE = 'realtime.grid-mode-change',
  REALTIME_WAIT_FOR_HOST = 'realtime.wait-for-host',
  REALTIME_AUTHENTICATION_FAILED = 'realtime.authentication-failed',
}

export enum MeetingState {
  MEETING_FAILED = -1,
  MEETING_DISCONNECTED = 0,
  MEETING_INITIALIZING = 1,
  MEETING_READY_TO_JOIN = 2,
  MEETING_CONNECTING = 3,
  MEETING_CONNECTED = 4,
  FRAME_INITIALIZING = 5,
  FRAME_INITIALIZED = 6,
  FRAME_UNINITIALIZED = 7,
}

export enum DeviceEvent {
  NO_CAM = 'devices.no-cam',
  NO_DEVICES = 'devices.no-devices',
  DEVICES_BLOCKED = 'devices.blocked',
  DEVICES_CAM_BLOCKED = 'devices.cam-blocked',
  DEVICES_INITIALIZATION_ERROR = 'devices.inititalization-error',
  DEVICES_UNKNOWN_ERROR = 'devices.unknown-error',
}
