import { FrameBricklayer, MessageBridge, ObserverHelper } from '@superviz/immersive-core';
import NoSleep from 'nosleep.js';

import videoConferenceStyle from '../../common/styles/videoConferenceStyle';
import {
  DeviceEvent,
  MeetingConnectionStatus,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
  Dimensions,
} from '../../common/types/events.types';
import { StartMeetingOptions } from '../../common/types/meeting.types';
import { User } from '../../common/types/user.types';
import { logger } from '../../common/utils';
import { BrowserService } from '../browser';

import { VideoFrameState, VideoManagerOptions, FrameSize } from './types';

const FRAME_ID = 'sv-video-frame';
const FRAME_EXPANSIVE_CLASS = 'sv-video-frame--expansive-mode';
const FULL_PERCENT = '100%';

export default class VideoConfereceManager {
  private messageBridge: MessageBridge;
  private bricklayer: FrameBricklayer;
  private browserService: BrowserService;

  public readonly frameStateObserver = new ObserverHelper({ logger });
  public readonly frameSizeObserver = new ObserverHelper({ logger });

  public readonly realtimeObserver = new ObserverHelper({ logger });
  public readonly hostChangeObserver = new ObserverHelper({ logger });
  public readonly gridModeChangeObserver = new ObserverHelper({ logger });
  public readonly followUserObserver = new ObserverHelper({ logger });
  public readonly sameAccountErrorObserver = new ObserverHelper({ logger });
  public readonly devicesObserver = new ObserverHelper({ logger });
  public readonly meetingStateObserver = new ObserverHelper({ logger });
  public readonly meetingConnectionObserver = new ObserverHelper({ logger });

  public readonly userAmountUpdateObserver = new ObserverHelper({ logger });
  public readonly userJoinedObserver = new ObserverHelper({ logger });
  public readonly userAvatarObserver = new ObserverHelper({ logger });
  public readonly userLeftObserver = new ObserverHelper({ logger });
  public readonly userListObserver = new ObserverHelper({ logger });

  frameState = VideoFrameState.UNINITIALIZED;

  constructor(options: VideoManagerOptions) {
    const wrapper = document.createElement('div');
    const style = document.createElement('style');

    style.innerHTML = videoConferenceStyle;

    wrapper.classList.add('sv_video_wrapper');
    wrapper.id = 'sv-video-wrapper';

    document.body.appendChild(wrapper);
    document.head.appendChild(style);

    this.updateFrameState(VideoFrameState.INITIALIZING);

    this.browserService = options.browserService;

    /**
     * @TODO - add full horizontal view support on desktop, currently only works on mobile.
     * request: https://github.com/SuperViz/sdk/issues/33
     */
    const camerasOrientation =
      ['right', 'left'].includes(options.position) && !this.browserService.isMobileDevice
        ? 'vertical'
        : 'horizontal';

    this.bricklayer = new FrameBricklayer();
    this.bricklayer.build(
      wrapper.id,
      process.env.SDK_VIDEO_CONFERENCE_LAYER_URL,
      FRAME_ID,
      { ...options, camerasOrientation, isBroadcast: options.broadcast },
      {
        allow: 'camera *;microphone *; display-capture *;',
      },
    );

    this.bricklayer.element.addEventListener('load', this.onFrameLoad);
    window.addEventListener('resize', this.onWindowResize);

    if (this.browserService.isMobileDevice) {
      this.bricklayer.element.classList.add('sv-video-frame--bottom');
      return;
    }

    this.bricklayer.element.classList.add(`sv-video-frame--${options.position}`);
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
    this.followUserObserver.destroy();

    this.bricklayer = null;
    this.frameState = null;
  }

  private onFrameLoad = () => {
    this.messageBridge = new MessageBridge({
      logger,
      contentWindow: this.bricklayer.element.contentWindow,
    });

    if (this.browserService.isMobileDevice) {
      const noSleep = new NoSleep();

      const enableNoSleep = () => {
        noSleep.enable();
        this.bricklayer.element.removeEventListener('click', enableNoSleep, false);
      };

      this.bricklayer.element.addEventListener('click', enableNoSleep, false);
    }

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
    this.messageBridge.listen(MeetingEvent.FRAME_DIMENSIONS_UPDATE, this.onFrameDimensionsUpdate);
    this.messageBridge.listen(RealtimeEvent.REALTIME_FOLLOW_USER, this.onFollowUserDidChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_SET_AVATAR, this.onUserAvatarChange);

    this.updateFrameState(VideoFrameState.INITIALIZED);
    this.onWindowResize();
  };

  private onFrameDimensionsUpdate = ({ width, height }: Dimensions) => {
    const frame = document.getElementById(FRAME_ID);

    const SET_UPDATE_WIDTH = width !== null;
    const FULL_WIDTH = width === 0;
    const SET_UPDATE_HEIGHT = !!height;
    const FULL_HEIGHT = height === 0 || height > window.innerHeight;

    let frameWidth;
    let frameHeight;

    if (SET_UPDATE_WIDTH) frameWidth = `${width}px`;
    if (FULL_WIDTH) frameWidth = FULL_PERCENT;

    if (SET_UPDATE_HEIGHT) frameHeight = `${height}px`;
    if (FULL_HEIGHT) frameHeight = FULL_PERCENT;

    frame.style.width = frameWidth;
    frame.style.height = frameHeight;

    this.frameSizeObserver.publish({ width: frameWidth, height: frameHeight });
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

  private onUserAvatarChange = (avatarLink: string): void => {
    this.userAvatarObserver.publish(avatarLink);
  };

  private updateFrameSize = (size: FrameSize): void => {
    const frame = document.getElementById(FRAME_ID);
    const isExpanded = frame.classList.contains(FRAME_EXPANSIVE_CLASS);

    if (size === FrameSize.LARGE && isExpanded) return;

    if (size === FrameSize.SMALL && !isExpanded) return;

    frame.classList.toggle(FRAME_EXPANSIVE_CLASS);
  };

  private updateFrameState(state: VideoFrameState): void {
    if (state !== this.frameState) {
      this.frameState = state;
      this.frameStateObserver.publish(this.frameState);
    }

    const states = {
      [VideoFrameState.INITIALIZING]: MeetingState.FRAME_INITIALIZING,
      [VideoFrameState.INITIALIZED]: MeetingState.FRAME_INITIALIZED,
      [VideoFrameState.UNINITIALIZED]: MeetingState.FRAME_UNINITIALIZED,
    };

    this.meetingStateUpdate(states[state]);
  }

  private realtimeJoin = (userInfo = {}): void => {
    this.realtimeObserver.publish(userInfo);
  };

  private onMeetingHostChange = (hostId: string): void => {
    this.hostChangeObserver.publish(hostId);
  };

  private onFollowUserDidChange = (userId: string): void => {
    this.followUserObserver.publish(userId);
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

  private meetingStateUpdate = (newState: MeetingState): void => {
    this.meetingStateObserver.publish(newState);
  };

  private onConnectionStatusChange = (newStatus: MeetingConnectionStatus): void => {
    this.meetingConnectionObserver.publish(newStatus);
  };

  private onWindowResize = (): void => {
    const { innerHeight: height, innerWidth: width } = window;

    this.messageBridge.publish(MeetingEvent.FRAME_PARENT_SIZE_UPDATE, { height, width });
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

  public followUserDidChange = (userId: string | null): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_FOLLOW_USER, userId);
  };
}
