import { FrameBricklayer, MessageBridge, ObserverHelper } from '@superviz/immersive-core';

import videoConferenceStyle from '../../common/styles/videoConferenceStyle';
import {
  DeviceEvent,
  MeetingConnectionStatus,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
} from '../../common/types/events.types';
import { StartMeetingOptions } from '../../common/types/meeting.types';
import { User } from '../../common/types/user.types';
import { logger } from '../../common/utils';

import { VideoFrameState, VideoManagerOptions, FrameSize } from './types';

const FRAME_ID = 'sv-video-frame';
export default class VideoConfereceManager {
  private messageBridge: MessageBridge;
  private bricklayer: FrameBricklayer;

  public readonly frameStateObserver = new ObserverHelper({ logger });
  public readonly realtimeObserver = new ObserverHelper({ logger });
  public readonly hostChangeObserver = new ObserverHelper({ logger });
  public readonly gridModeChangeObserver = new ObserverHelper({ logger });
  public readonly sameAccountErrorObserver = new ObserverHelper({ logger });
  public readonly devicesObserver = new ObserverHelper({ logger });
  public readonly meetingStateObserver = new ObserverHelper({ logger });
  public readonly meetingConnectionObserver = new ObserverHelper({ logger });

  public readonly userAmountUpdateObserver = new ObserverHelper({ logger });
  public readonly userJoinedObserver = new ObserverHelper({ logger });
  public readonly userLeftObserver = new ObserverHelper({ logger });
  public readonly userListObserver = new ObserverHelper({ logger });

  frameState = VideoFrameState.UNINITIALIZED;

  constructor({ apiKey, language, debug, canUseCams, canUseScreenshare }: VideoManagerOptions) {
    const wrapper = document.createElement('div');
    const style = document.createElement('style');

    style.innerHTML = videoConferenceStyle;

    wrapper.classList.add('sv_video_wrapper');
    wrapper.id = 'sv-video-wrapper';

    document.body.appendChild(wrapper);
    document.head.appendChild(style);

    this.updateFrameState(VideoFrameState.INITIALIZING);

    this.bricklayer = new FrameBricklayer();
    this.bricklayer.build(
      wrapper.id,
      process.env.SDK_VIDEO_CONFERENCE_LAYER_URL,
      FRAME_ID,
      {
        apiKey,
        debug,
        language,
        canUseCams,
        canUseScreenshare,
      },
      {
        allow: 'camera *;microphone *; display-capture *;',
      },
    );

    this.bricklayer.element.addEventListener('load', this.onFrameLoad);
  }

  start(options: StartMeetingOptions) {
    this.messageBridge.publish(MeetingEvent.MEETING_START, options);
  }

  leave() {
    this.messageBridge.publish(MeetingEvent.MEETING_LEAVE, {});

    this.destroy();
  }

  destroy() {
    this.messageBridge.destroy();
    this.bricklayer.destroy();
    this.frameStateObserver.destroy();
    this.realtimeObserver.destroy();
    this.hostChangeObserver.destroy();
    this.gridModeChangeObserver.destroy();

    this.bricklayer = null;
    this.frameState = null;
  }

  private onFrameLoad = () => {
    this.messageBridge = new MessageBridge({
      logger,
      contentWindow: this.bricklayer.element.contentWindow,
    });

    // @TODO: create option to destroy all these listens.
    this.messageBridge.listen(MeetingEvent.MEETING_USER_AMOUNT_UPDATE, this.onUserAmountUpdate);
    this.messageBridge.listen(MeetingEvent.MEETING_USER_JOINED, this.onUserJoined);
    this.messageBridge.listen(MeetingEvent.MEETING_USER_LEFT, this.onUserLeft);
    this.messageBridge.listen(MeetingEvent.MEETING_USER_LIST_UPDATE, this.onUserListUpdate);
    this.messageBridge.listen(MeetingEvent.FRAME_SIZE_UPDATE, this.updateFrameSize);
    this.messageBridge.listen(MeetingEvent.MEETING_HOST_CHANGE, this.onMeetingHostChange);
    this.messageBridge.listen(MeetingEvent.MEETING_GRID_MODE_CHANGE, this.onGridModeChange);
    this.messageBridge.listen(MeetingEvent.MEETING_SAME_USER_ERROR, this.onSameAccountError);
    this.messageBridge.listen(MeetingEvent.MEETING_STATE_UPDATE, this.meetingStateUpdate);
    this.messageBridge.listen(
      MeetingEvent.MEETING_CONNECTION_STATUS_CHANGE,
      this.onConnectionStatusChange,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_DEVICES_CHANGE, this.onDevicesChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_JOIN, this.realtimeJoin);

    this.updateFrameState(VideoFrameState.INITIALIZED);
  };

  private onUserAmountUpdate = (users: Array<User>): void => {
    this.userAmountUpdateObserver.publish(users);
  };

  private onUserJoined = (user: User): void => {
    this.userJoinedObserver.publish(user);
  };

  private onUserLeft = (user: User): void => {
    this.userLeftObserver.publish(user);
  };

  private onUserListUpdate = (users: Array<User>): void => {
    this.userListObserver.publish(users);
  };

  private updateFrameSize = (size: FrameSize): void => {
    const frame = document.getElementById(FRAME_ID);
    const isExpanded = frame.classList.contains('sv-video-frame--expansive-mode');

    if (size === FrameSize.LARGE && isExpanded) return;

    if (size === FrameSize.SMALL && !isExpanded) return;

    frame.classList.toggle('sv-video-frame--expansive-mode');
  };

  private updateFrameState(state: VideoFrameState): void {
    if (state !== this.frameState) {
      this.frameState = state;
      this.frameStateObserver.publish(this.frameState);
    }

    switch (state) {
      case VideoFrameState.INITIALIZING:
        this.meetingStateUpdate(MeetingState.FRAME_INITIALIZING);
        break;
      case VideoFrameState.INITIALIZED:
        this.meetingStateUpdate(MeetingState.FRAME_INITIALIZED);
        break;
      case VideoFrameState.UNINITIALIZED:
        this.meetingStateUpdate(MeetingState.FRAME_UNINITIALIZED);
        break;
      default:
        break;
    }
  }

  private realtimeJoin = (userInfo = {}): void => {
    this.realtimeObserver.publish(userInfo);
  };

  private onMeetingHostChange = (hostId: string): void => {
    this.hostChangeObserver.publish(hostId);
  };

  private onGridModeChange = (isGridModeEnable: boolean): void => {
    this.gridModeChangeObserver.publish(isGridModeEnable);
  };

  private onSameAccountError = (error: string): void => {
    this.sameAccountErrorObserver.publish(error);
  };

  private onDevicesChange = (state: DeviceEvent): void => {
    this.devicesObserver.publish(state);
  };

  public waitForHostDidChange = (isWating: boolean): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_WAIT_FOR_HOST, isWating);
  };

  public gridModeDidChange = (isGridModeEnable: boolean): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_GRID_MODE_CHANGE, isGridModeEnable);
  };

  public actorsListDidChange = (actorsList): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_USER_LIST_UPDATE, actorsList);
  };

  public onMasterActorDidChange = (hostId: string): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_HOST_CHANGE, hostId);
  };

  private meetingStateUpdate = (newState: MeetingState): void => {
    this.meetingStateObserver.publish(newState);
  };

  private onConnectionStatusChange = (newStatus: MeetingConnectionStatus): void => {
    this.meetingConnectionObserver.publish(newStatus);
  };
}
