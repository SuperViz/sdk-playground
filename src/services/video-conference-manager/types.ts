import { FramePosition } from '../../common/types/sdk-options.types';
import { BrowserService } from '../browser';
import { Language } from '../communicator/types';

export interface VideoManagerOptions {
  apiKey: string;
  debug: boolean;
  language: Language;
  roomId: string;
  canUseCams: boolean;
  canUseScreenshare: boolean;
  position: FramePosition;
  browserService: BrowserService;
}

export interface WindowSize {
  height: number;
  width: number;
}

export enum VideoFrameState {
  UNINITIALIZED,
  INITIALIZING,
  INITIALIZED,
}

export enum FrameSize {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}
