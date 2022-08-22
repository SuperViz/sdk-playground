import { FrameBricklayer, MessageBridge, ObserverHelper } from '@superviz/immersive-core';

import videoConferenceStyle from '../common/styles/videoConferenceStyle';
import { DevicesMessageTypes, MessageTypes } from '../common/types/messages.types';
import { logger } from '../common/utils';

import {
  VideoFrameStateType,
  IVideoManagerConfig,
  FrameSizeType,
} from './VideoConferenceManager.types';

const FRAME_ID = 'sv-video-frame';
export default class VideoConfereceManager {
  private messageBridge: MessageBridge;
  private bricklayer: FrameBricklayer;

  private frameStateObserver = new ObserverHelper({ logger });
  private meetingJoinObserver = new ObserverHelper({ logger });
  private hostChangeObserver = new ObserverHelper({ logger });
  private gridModeChangeObserver = new ObserverHelper({ logger });
  private sameAccountErrorObserver = new ObserverHelper({ logger });
  private devicesObserver = new ObserverHelper({ logger });

  private userAmountUpdateObserver = new ObserverHelper({ logger });
  private userJoinedObserver = new ObserverHelper({ logger });
  private userLeftObserver = new ObserverHelper({ logger });
  private userListObserver = new ObserverHelper({ logger });

  frameState = VideoFrameStateType.UNINITIALIZED;

  constructor(config: IVideoManagerConfig) {
    const wrapper = document.createElement('div');
    const style = document.createElement('style');

    style.innerHTML = videoConferenceStyle;

    wrapper.classList.add('sv_video_wrapper');
    wrapper.id = 'sv-video-wrapper';

    document.body.appendChild(wrapper);
    document.head.appendChild(style);

    this.updateFrameState(VideoFrameStateType.INITIALIZING);

    this.bricklayer = new FrameBricklayer();
    this.bricklayer.build(
      wrapper.id,
      process.env.SDK_VIDEO_CONFERENCE_LAYER_URL,
      FRAME_ID,
      {
        apiKey: config.apiKey,
        debug: config.debug,
        language: config.language,
      },
      {
        allow: 'camera *;microphone *; display-capture *;',
      },
    );

    this.bricklayer.element.addEventListener('load', this.onFrameLoad);
  }

  start(options) {
    this.messageBridge.publish(MessageTypes.MEETING_START, options);
  }

  leave() {
    this.messageBridge.publish(MessageTypes.MEETING_LEAVE, {});

    this.destroy();
  }

  destroy() {
    this.messageBridge.destroy();
    this.bricklayer.destroy();
    this.frameStateObserver.destroy();
    this.meetingJoinObserver.destroy();
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
    this.messageBridge.listen(MessageTypes.MEETING_USER_AMOUNT_UPDATE, this.onUserAmountUpdate);
    this.messageBridge.listen(MessageTypes.MEETING_USER_JOINED, this.onUserJoined);
    this.messageBridge.listen(MessageTypes.MEETING_USER_LEFT, this.onUserLeft);
    this.messageBridge.listen(MessageTypes.MEETING_USER_LIST_UPDATE, this.onUserListUpdate);
    this.messageBridge.listen(MessageTypes.FRAME_SIZE_UPDATE, this.updateFrameSize);
    this.messageBridge.listen(MessageTypes.MEETING_JOIN, this.meetingJoin);
    this.messageBridge.listen(MessageTypes.MEETING_HOST_CHANGE, this.onMeetingHostChange);
    this.messageBridge.listen(MessageTypes.MEETING_GRID_MODE_CHANGE, this.onGridModeChange);
    this.messageBridge.listen(MessageTypes.MEETING_SAME_ACCOUNT_ERROR, this.onSameAccountError);
    this.messageBridge.listen(MessageTypes.MEETING_DEVICES_CHANGE, this.onDevicesChange);

    this.updateFrameState(VideoFrameStateType.INITIALIZED);
  };

  private onUserAmountUpdate = (users: Array<Object>): void => {
    this.userAmountUpdateObserver.publish(users);
  };

  private onUserJoined = (user: Object): void => {
    this.userJoinedObserver.publish(user);
  };

  private onUserLeft = (user: Object): void => {
    this.userLeftObserver.publish(user);
  };

  private onUserListUpdate = (users: Array<Object>): void => {
    this.userListObserver.publish(users);
  };

  private updateFrameSize = (size: FrameSizeType): void => {
    const frame = document.getElementById(FRAME_ID);
    const isExpanded = frame.classList.contains('sv-video-frame--expansive-mode');

    if (size === FrameSizeType.LARGE && isExpanded) return;

    if (size === FrameSizeType.SMALL && !isExpanded) return;

    frame.classList.toggle('sv-video-frame--expansive-mode');
  };

  private updateFrameState(state: VideoFrameStateType): void {
    if (state !== this.frameState) {
      this.frameState = state;
      this.frameStateObserver.publish(this.frameState);
    }
  }

  private meetingJoin = (userInfo = {}): void => {
    this.meetingJoinObserver.publish(userInfo);
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

  private onDevicesChange = (state: DevicesMessageTypes): void => {
    this.devicesObserver.publish(state);
  };

  public gridModeDidChange = (isGridModeEnable: boolean): void => {
    this.messageBridge.publish(MessageTypes.REALTIME_GRID_MODE_CHANGE, isGridModeEnable);
  };

  public actorsListDidChange = (actorsList): void => {
    this.messageBridge.publish(MessageTypes.REALTIME_USER_LIST_UPDATE, actorsList);
  };

  public onMasterActorDidChange = (hostId: string): void => {
    this.messageBridge.publish(MessageTypes.REALTIME_HOST_CHANGE, hostId);
  };

  public subscribeToFrameState = this.frameStateObserver.subscribe;
  public unsubscribeFromFrameState = this.frameStateObserver.unsubscribe;

  public subscribeToMeetingJoin = this.meetingJoinObserver.subscribe;
  public unsubscribeFromMeetingJoin = this.meetingJoinObserver.unsubscribe;

  public subscribeToHostChange = this.hostChangeObserver.subscribe;
  public unsubscribeFromHostChange = this.hostChangeObserver.unsubscribe;

  public subscribeToGridModeChange = this.gridModeChangeObserver.subscribe;
  public unsubscribeFromGridModeChange = this.gridModeChangeObserver.unsubscribe;

  public subscribeToSameAccountError = this.sameAccountErrorObserver.subscribe;
  public unsubscribeFromSameAccountError = this.sameAccountErrorObserver.unsubscribe;

  public subscribeToDevicesEvents = this.devicesObserver.subscribe;
  public unsubscribeFromDevicesEvents = this.devicesObserver.unsubscribe;

  public subscribeToUserAmountUpdate = this.userAmountUpdateObserver.subscribe;
  public unsubscribeFromUserAmountUpdate = this.userAmountUpdateObserver.unsubscribe;

  public subscribeToUserJoined = this.userJoinedObserver.subscribe;
  public unsubscribeFromUserJoined = this.userJoinedObserver.unsubscribe;

  public subscribeToUserLeft = this.userLeftObserver.subscribe;
  public unsubscribeFromUserLeft = this.userLeftObserver.unsubscribe;

  public subscribeToUserListUpdate = this.userListObserver.subscribe;
  public unsubscribeFromUserListUpdate = this.userListObserver.unsubscribe;
}
