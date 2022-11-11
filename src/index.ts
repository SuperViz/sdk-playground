import {
  MeetingEvent,
  RealtimeEvent,
  DeviceEvent,
  MeetingState,
  MeetingConnectionStatus,
} from './common/types/events.types';
import { SuperVizSdkOptions } from './common/types/sdk-options.types';
import { User, UserGroup } from './common/types/user.types';
import { logger } from './common/utils';
import ApiService from './services/api';
import AuthService from './services/auth-service';
import { BrowserService } from './services/browser';
import { BrowserStats } from './services/browser/types';
import Communicator from './services/communicator';
import { SuperVizSdk, AdapterOptions } from './services/communicator/types';
import { AdapterMethods, Adapter } from './services/integration/base-adapter/types';
import { UserOn3D, UserTo3D } from './services/integration/users/types';
import { FrameSize } from './services/video-conference-manager/types';

const validateOptions = ({ userGroup, user, roomId }: SuperVizSdkOptions) => {
  if (!userGroup || !userGroup.name || !userGroup.id) {
    throw new Error('userGroup fields is required');
  }

  if (!user || !user.id) {
    throw new Error('user fields is required');
  }

  if (!roomId) {
    throw new Error('room id is required');
  }
};

const init = async (apiKey: string, options: SuperVizSdkOptions) => {
  validateOptions(options);

  if (options.debug) {
    logger.enable('@superviz/*');
  }

  const isValid = await AuthService(apiKey);

  if (!isValid) {
    throw new Error('Failed to validate API key');
  }

  if (options.isBroadcast) {
    logger.log('Broadcast mode is enabled');
  }

  const environment = await ApiService.fetchConfig(apiKey);

  if (!environment || !environment.ablyKey) {
    throw new Error('Failed to load configuration from server');
  }

  const { ablyKey } = environment;
  return Communicator(Object.assign({}, options, { apiKey, ablyKey }));
};

if (window) {
  window.SuperVizSdk = {
    init,
    MeetingEvent,
    FrameSize,
    DeviceEvent,
    RealtimeEvent,
    MeetingState,
    MeetingConnectionStatus,
  };
}

export default { init };
export {
  MeetingEvent,
  RealtimeEvent,
  FrameSize,
  SuperVizSdkOptions,
  DeviceEvent,
  SuperVizSdk,
  MeetingState,
  User,
  UserGroup,
  MeetingConnectionStatus,
  AdapterMethods,
  AdapterOptions,
  Adapter,
  UserOn3D,
  UserTo3D,
  BrowserService,
  BrowserStats,
};
