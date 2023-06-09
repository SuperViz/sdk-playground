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
  MeetingControlsEvent,
  FrameEvent,
} from '../../common/types/events.types';
import { StartMeetingOptions } from '../../common/types/meeting.types';
import { Participant, Avatar } from '../../common/types/participant.types';
import { logger } from '../../common/utils';
import { BrowserService } from '../browser';

import {
  VideoFrameState,
  VideoManagerOptions,
  Offset,
  FrameLocale,
  FrameConfig,
  ColorsVariables,
} from './types';

const FRAME_ID = 'sv-video-frame';

export default class VideoConfereceManager {
  private messageBridge: MessageBridge;
  private bricklayer: FrameBricklayer;
  private browserService: BrowserService;

  private frameOffset: Offset;
  private frameLocale: FrameLocale;

  private meetingAvatars: Avatar[];

  private readonly frameConfig: FrameConfig;
  private readonly customColors: ColorsVariables;

  public readonly frameStateObserver = new ObserverHelper({ logger });
  public readonly frameSizeObserver = new ObserverHelper({ logger });

  public readonly realtimeObserver = new ObserverHelper({ logger });
  public readonly hostChangeObserver = new ObserverHelper({ logger });
  public readonly gridModeChangeObserver = new ObserverHelper({ logger });
  public readonly followParticipantObserver = new ObserverHelper({ logger });
  public readonly goToParticipantObserver = new ObserverHelper({ logger });
  public readonly gatherParticipantsObserver = new ObserverHelper({ logger });

  public readonly sameAccountErrorObserver = new ObserverHelper({ logger });
  public readonly devicesObserver = new ObserverHelper({ logger });
  public readonly meetingStateObserver = new ObserverHelper({ logger });
  public readonly meetingConnectionObserver = new ObserverHelper({ logger });

  public readonly participantAmountUpdateObserver = new ObserverHelper({ logger });
  public readonly participantJoinedObserver = new ObserverHelper({ logger });
  public readonly participantAvatarObserver = new ObserverHelper({ logger });
  public readonly participantLeftObserver = new ObserverHelper({ logger });
  public readonly participantListObserver = new ObserverHelper({ logger });

  frameState = VideoFrameState.UNINITIALIZED;

  constructor(options: VideoManagerOptions) {
    const {
      conferenceLayerUrl,
      ablyKey,
      apiKey,
      apiUrl,
      debug,
      language,
      roomId,
      canUseCams,
      canUseChat,
      canUseScreenshare,
      canUseDefaultAvatars,
      canUseFollow,
      canUseGoTo,
      canUseGather,
      position,
      browserService,
      offset,
      canUseDefaultToolbar,
      locales,
      avatars,
      devices,
      customColors,
    } = options;

    this.browserService = browserService;

    const wrapper = document.createElement('div');

    /**
     * @TODO - add full horizontal view support on desktop, currently only works on mobile.
     * request: https://github.com/SuperViz/sdk/issues/33
     */
    const camerasOrientation =
      ['right', 'left'].includes(position) && !this.browserService.isMobileDevice
        ? 'vertical'
        : 'horizontal';

    this.frameConfig = {
      apiKey,
      apiUrl,
      ablyKey,
      debug,
      canUseFollow,
      canUseGoTo,
      canUseCams,
      canUseChat,
      canUseGather,
      canUseScreenshare,
      canUseDefaultAvatars,
      camerasOrientation,
      canUseDefaultToolbar,
      roomId,
      devices: {
        audioInput: devices?.audioInput ?? true,
        audioOutput: devices?.audioOutput ?? true,
        videoInput: devices?.videoInput ?? true,
      },
    };

    this.customColors = customColors;

    wrapper.classList.add('sv_video_wrapper');
    wrapper.id = 'sv-video-wrapper';

    document.body.appendChild(wrapper);

    this.updateFrameState(VideoFrameState.INITIALIZING);

    this.bricklayer = new FrameBricklayer();
    this.bricklayer.build(wrapper.id, conferenceLayerUrl, FRAME_ID, undefined, {
      allow: 'camera *;microphone *; display-capture *;',
    });

    this.setFrameOffset(offset);
    this.setFrameStyle(position);
    this.bricklayer.element.addEventListener('load', this.onFrameLoad);
    this.frameLocale = {
      language,
      locales,
    };
    this.meetingAvatars = avatars;
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
  }

  /**
   * @function onFrameLoad
   * @returns {void}
   */
  private onFrameLoad = (): void => {
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
    this.messageBridge.listen(
      MeetingEvent.MEETING_PARTICIPANT_AMOUNT_UPDATE,
      this.onParticipantAmountUpdate,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_PARTICIPANT_LEFT, this.onParticipantLeft);
    this.messageBridge.listen(
      MeetingEvent.MEETING_PARTICIPANT_LIST_UPDATE,
      this.onParticipantListUpdate,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_HOST_CHANGE, this.onMeetingHostChange);
    this.messageBridge.listen(MeetingEvent.MEETING_GRID_MODE_CHANGE, this.onGridModeChange);
    this.messageBridge.listen(MeetingEvent.MEETING_SAME_PARTICIPANT_ERROR, this.onSameAccountError);
    this.messageBridge.listen(MeetingEvent.MEETING_STATE_UPDATE, this.meetingStateUpdate);
    this.messageBridge.listen(
      MeetingEvent.MEETING_CONNECTION_STATUS_CHANGE,
      this.onConnectionStatusChange,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_DEVICES_CHANGE, this.onDevicesChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_JOIN, this.realtimeJoin);
    this.messageBridge.listen(FrameEvent.FRAME_DIMENSIONS_UPDATE, this.onFrameDimensionsUpdate);
    this.messageBridge.listen(
      RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
      this.onFollowParticipantDidChange,
    );
    this.messageBridge.listen(RealtimeEvent.REALTIME_SET_AVATAR, this.onParticipantAvatarChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.onGoToDidChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_GATHER, this.onGather);

    this.updateFrameState(VideoFrameState.INITIALIZED);
    this.updateFrameLocale();
    this.updateMeetingAvatars();

    this.onWindowResize();

    this.setCustomColors();
  };

  /**
   * @function setFrameOffset
   * @description adds the offset to aid frame positioning.
   * @param {Offset} customOffset
   * @returns {void}
   */
  private setFrameOffset = (customOffset: Offset): void => {
    const offset = customOffset ?? {};

    // add the keys that were not set
    ['top', 'bottom', 'left', 'right'].forEach((key) => {
      const usedKeys = Object.keys(offset);

      if (usedKeys.includes(key)) return;

      offset[key] = 0;
    });

    this.frameOffset = offset as Offset;
  };

  private setCustomColors = (): void => {
    if (!this.customColors) return;

    this.messageBridge.publish(FrameEvent.FRAME_COLOR_LIST_UPDATE, this.customColors);
  };

  /**
   * @function setFrameStyle
   * @description injects the style and positions the frame container.
   * @param {string} position
   * @returns {void}
   */
  private setFrameStyle = (position: string): void => {
    const style = document.createElement('style');
    const { bottom, left, right, top } = this.frameOffset;

    style.innerHTML = `
    :root {
      --superviz-offset-top: ${top}px;
      --superviz-offset-right: ${right}px;
      --superviz-offset-left: ${left}px;
      --superviz-offset-bottom: ${bottom}px;
    } 
    ${videoConferenceStyle}    
    `;

    document.head.appendChild(style);

    if (this.browserService.isMobileDevice) {
      this.bricklayer.element.classList.add('sv-video-frame--bottom');
      return;
    }

    this.bricklayer.element.classList.add(`sv-video-frame--${position}`);
  };

  /**
   * @function onFrameDimensionsUpdate
   * @param {Dimensions} params
   * @description callback that updates the frame size according to the size of the inner content
   * @returns {void}
   */
  private onFrameDimensionsUpdate = ({ width, height }: Dimensions): void => {
    const frame = document.getElementById(FRAME_ID);
    const {
      bottom: offsetBottom,
      right: offsetRight,
      left: offsetLeft,
      top: offsetTop,
    } = this.frameOffset;

    let frameWidth: string = `${width}px`;
    let frameHeight: string = `${height}px`;

    if (width >= window.innerWidth) {
      frameWidth = `calc(100% - ${offsetRight}px - ${offsetLeft}px)`;
    }

    if (height >= window.innerHeight) {
      frameHeight = `calc(100% - ${offsetTop}px - ${offsetBottom}px)`;
    }

    frame.style.width = frameWidth;
    frame.style.height = frameHeight;

    this.frameSizeObserver.publish({ width: frameWidth, height: frameHeight });
  };

  /**
   * @function onWindowResize
   * @description update window-host size to iframe
   * @returns {void}
   */
  private onWindowResize = (): void => {
    const { innerHeight: height, innerWidth: width } = window;

    this.messageBridge.publish(FrameEvent.FRAME_PARENT_SIZE_UPDATE, { height, width });
  };

  /**
   * @function updateFrameLocale
   * @description update default language and locales
   * @returns {void}
   */
  private updateFrameLocale = (): void => {
    const { language, locales } = this.frameLocale;
    const languages = locales.map((locale) => locale?.language);
    const availableLanguages = ['en', ...languages];

    if (language && !availableLanguages.includes(language)) {
      throw new Error('The default language is not available in the language listing.');
    }

    this.messageBridge.publish(FrameEvent.FRAME_LOCALE_UPDATE, this.frameLocale);
  };

  /**
   * @function updateMeetingAvatar
   * @description update list of avatars
   * @returns {void}
   */
  private updateMeetingAvatars = (): void => {
    this.messageBridge.publish(FrameEvent.FRAME_AVATAR_LIST_UPDATE, this.meetingAvatars);
  };

  /**
   * @function onParticipantAmountUpdate
   * @param {Array<Participant>} participants
   * @description updates the number of participants within the meeting
   * @returns {void}
   */
  private onParticipantAmountUpdate = (participants: Array<Participant>): void => {
    this.participantAmountUpdateObserver.publish(participants);
  };

  /**
   * @function onParticipantLeft
   * @param {Participant} participant
   * @description callback that is triggered whenever a participant left the meeting room
   * @returns {void}
   */
  private onParticipantLeft = (participant: Participant): void => {
    this.participantLeftObserver.publish(participant);
  };

  /**
   * @function onParticipantListUpdate
   * @param {Array<Participant>} participants
   * @description callback that is called whenever the list of participants is updated
   * @returns {void}
   */
  private onParticipantListUpdate = (participants: Array<Participant>): void => {
    this.participantListObserver.publish(participants);
  };

  /**
   * @function onParticipantAvatarChange
   * @description update participant avatar
   * @returns {void}
   * @param avatarLink
   */
  private onParticipantAvatarChange = (avatarLink: string): void => {
    this.participantAvatarObserver.publish(avatarLink);
  };

  /**
   * @function updateFrameState
   * @description updates frame state
   * @param {VideoFrameState} state
   * @retruns {void}
   */
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

  /**
   * @function realtimeJoin
   * @param participantInfo
   * @returns {void}
   */
  private realtimeJoin = (participantInfo = {}): void => {
    this.realtimeObserver.publish(participantInfo);
  };

  /**
   * @function onMeetingHostChange
   * @param {string} hostId
   * @returns {void}
   */
  private onMeetingHostChange = (hostId: string): void => {
    this.hostChangeObserver.publish(hostId);
  };

  /**
   * @function onFollowParticipantDidChange
   * @param {string} participantId
   * @returns {void}
   */
  private onFollowParticipantDidChange = (participantId?: string): void => {
    this.followParticipantObserver.publish(participantId);
  };

  /**
   * @function onGoToDidChange
   * @param {string} participantId
   * @returns {void}
   */
  public onGoToDidChange = (participantId: string): void => {
    this.goToParticipantObserver.publish(participantId);
  };

  /**
   * @function onGather
   * @returns {void}
   */
  private onGather = (): void => {
    this.gatherParticipantsObserver.publish();
  };

  /**
   * @function onGridModeChange
   * @param {boolean} isGridModeEnable
   * @returns {void}
   */
  private onGridModeChange = (isGridModeEnable: boolean): void => {
    this.gridModeChangeObserver.publish(isGridModeEnable);
  };

  /**
   * @function onSameAccountError
   * @param {string} error
   * @returns {void}
   */
  private onSameAccountError = (error: string): void => {
    this.sameAccountErrorObserver.publish(error);
  };

  /**
   * @function onDevicesChange
   * @param {DeviceEvent} state
   * @returns {void}
   */
  private onDevicesChange = (state: DeviceEvent): void => {
    this.devicesObserver.publish(state);
  };

  /**
   * @function meetingStateUpdate
   * @param {MeetingState} newState
   * @returns {void}
   */
  private meetingStateUpdate = (newState: MeetingState): void => {
    this.meetingStateObserver.publish(newState);
  };

  /**
   * @function onConnectionStatusChange
   * @param {MeetingConnectionStatus} newStatus
   * @returns {void}
   */
  private onConnectionStatusChange = (newStatus: MeetingConnectionStatus): void => {
    this.meetingConnectionObserver.publish(newStatus);
  };

  /**
   * @function waitForHostDidChange
   * @param {boolean} isWating
   * @returns {void}
   */
  public waitForHostDidChange = (isWating: boolean): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_WAIT_FOR_HOST, isWating);
  };

  /**
   * @function gridModeDidChange
   * @param {boolean} isGridModeEnable
   * @returns {void}
   */
  public gridModeDidChange = (isGridModeEnable: boolean): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_GRID_MODE_CHANGE, isGridModeEnable);
  };

  /**
   * @function participantsListDidChange
   * @param {} participantsList
   * @returns {void}
   */
  public participantsListDidChange = (participantsList): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_PARTICIPANT_LIST_UPDATE, participantsList);
  };

  /**
   * @function onMasterParticipantDidChange
   * @param {string} hostId
   * @returns {void}
   */
  public onMasterParticipantDidChange = (hostId: string): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_HOST_CHANGE, hostId);
  };

  /**
   * @function followParticipantDidChange
   * @param {string} participantId
   * @returns {void}
   */
  public followParticipantDidChange = (participantId?: string): void => {
    this.messageBridge.publish(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, participantId);
  };

  /**
   * @function start
   * @param {StartMeetingOptions} options
   * @returns {void}
   */
  public start(options: StartMeetingOptions): void {
    this.messageBridge.publish(MeetingEvent.MEETING_START, {
      ...options,
      config: this.frameConfig,
    });
  }

  /**
   * @function leave
   * @returns {void}
   */
  public leave(): void {
    this.messageBridge.publish(MeetingEvent.MEETING_LEAVE, {});

    this.destroy();
  }

  /**
   * @function destroy
   * @returns {void}
   */
  public destroy(): void {
    this.messageBridge.destroy();
    this.bricklayer.destroy();
    this.frameStateObserver.destroy();
    this.realtimeObserver.destroy();
    this.hostChangeObserver.destroy();
    this.gridModeChangeObserver.destroy();
    this.followParticipantObserver.destroy();

    this.bricklayer = null;
    this.frameState = null;
  }

  /**
   * @funciton toggleChat
   * @returns {void}
   */
  public toggleChat(): void {
    this.messageBridge.publish(MeetingControlsEvent.TOGGLE_MEETING_CHAT);
  }

  /**
   * @funciton toggleMeetingSetup
   * @returns {void}
   */
  public toggleMeetingSetup(): void {
    this.messageBridge.publish(MeetingControlsEvent.TOGGLE_MEETING_SETUP);
  }

  /**
   * @funciton toggleMicrophone
   * @returns {void}
   */
  public toggleMicrophone(): void {
    this.messageBridge.publish(MeetingControlsEvent.TOGGLE_MICROPHONE);
  }

  /**
   * @funciton toggleScreenShare
   * @returns {void}
   */
  public toggleScreenShare(): void {
    this.messageBridge.publish(MeetingControlsEvent.TOGGLE_SCREENSHARE);
  }

  /**
   * @funciton hangUp
   * @returns {void}
   */
  public hangUp(): void {
    this.messageBridge.publish(MeetingControlsEvent.HANG_UP);
  }

  /**
   * @funciton toggleCam
   * @returns {void}
   */
  public toggleCam(): void {
    this.messageBridge.publish(MeetingControlsEvent.TOGGLE_CAM);
  }
}
