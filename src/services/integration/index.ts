import { BaseAdapterManager } from './base-adapter';
import { DefaultIntegrationManager, DefaultIntegrationManagerOptions } from './types';
import { IntegrationUsersManager } from './users';
import { UserTo3D, UserOn3D } from './users/types';

export class IntegrationManager extends BaseAdapterManager implements DefaultIntegrationManager {
  private IntegrationUsersService: IntegrationUsersManager;

  constructor({
    isAvatarsEnabled,
    isPointersEnabled,
    isFollowAvailable,
    isGatherAvailable,
    isGoToAvailable,
    adapter,

    RealtimeService,

    localUser,
    userList,
  }: DefaultIntegrationManagerOptions) {
    // Adapter manager
    const avatars = isAvatarsEnabled ?? true;
    const pointers = isPointersEnabled ?? true;

    const canUseFollow = isFollowAvailable ?? true;
    const canUseGather = isGatherAvailable ?? true;
    const canUseGoTo = isGoToAvailable ?? true;

    super({
      adapter,
      RealtimeService,
      isAvatarsEnabled: avatars,
      isPointersEnabled: pointers,
      isGatherAvailable: canUseGather,
      isGoToAvailable: canUseGoTo,
      isFollowAvailable: canUseFollow,
    });

    this.RealtimeService.actorJoinedObserver.subscribe(this.onActorJoined);
    this.RealtimeService.actorLeaveObserver.subscribe(this.onActorLeave);

    // Users on 3D space service
    this.IntegrationUsersService = new IntegrationUsersManager();
    this.createUserList(userList);
    this.createLocalUser(localUser);
  }

  public get users(): UserOn3D[] {
    return this.IntegrationUsersService.users;
  }

  public get localUser(): UserOn3D {
    return this.IntegrationUsersService.user;
  }

  /**
   * @function addUser
   * @description add new user to list
   * @param {UserTo3D} user
   * @returns {void}
   */
  public addUser = (user: UserTo3D): void => {
    const userOn3D = this.IntegrationUsersService.createUserOn3D(user);

    this.IntegrationUsersService.setUserList([...this.users, userOn3D]);

    this.createAvatar(userOn3D, user.avatarUrl);
    this.createPointer(userOn3D);
  };

  /**
   * @function removeUser
   * @description remove user from list
   * @param {UserOn3D} user
   * @returns {void}
   */
  public removeUser = (user: UserOn3D): void => {
    this.IntegrationUsersService.removeUser(user);

    this.destroyAvatar(user);
    this.destroyPointer(user);
  };

  /**
   * @function createLocalUser
   * @description creates the user list with what is needed for the 3D environment
   * @param {UserTo3D} localUser
   * @returns {void}
   */
  private createLocalUser = (localUser: UserTo3D): void => {
    const user = this.IntegrationUsersService.createUserOn3D(localUser);
    this.IntegrationUsersService.setLocalUser(user);
  };

  /**
   * @function createUserList
   * @description creates the local user with what is needed for the 3D environment
   * @param {UserOn3D[]} userList
   * @returns {void}
   */
  private createUserList = (userList: UserTo3D[]): void => {
    const userOn3DList = userList.map((user) => this.IntegrationUsersService.createUserOn3D(user));
    userOn3DList.forEach((user) => {
      this.createAvatar(user);
      this.createPointer(user);
    });

    this.IntegrationUsersService.setUserList(userOn3DList);
  };

  /**
   * @function onActorJoined
   * @description add users as they enter the RealtimeService
   * @param {} actor
   * @returns {void}
   */
  private onActorJoined = (actor): void => {
    const { id, name, avatarUrl } = actor.customProperties;

    this.addUser({
      id,
      name,
      avatarUrl,
    });
  };

  /**
   * @function onActorLeave
   * @description removes users as they leave the RealtimeService
   * @param {} actor
   * @returns {void}
   */
  private onActorLeave = (actor): void => {
    const user = this.users.find((user) => user.id === actor.customProperties.id);

    if (!user) {
      return;
    }

    this.removeUser(user);
  };
}
