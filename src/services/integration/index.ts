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
    avatarUrl,
    localUser,
    userList,
  }: DefaultIntegrationManagerOptions) {
    console.log('IntegrationManager');
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
      localUser,
      avatarUrl,
    });

    this.RealtimeService.actorJoinedObserver.subscribe(this.onActorJoined);
    this.RealtimeService.actorLeaveObserver.subscribe(this.onActorLeave);

    const localUserWithAvatar = localUser;
    localUserWithAvatar.avatarUrl = avatarUrl;
    // Users on 3D space service
    this.IntegrationUsersService = new IntegrationUsersManager();
    this.createUserList(userList);
    this.createLocalUser(localUserWithAvatar);
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

    console.log('subscribe to actor updated', userOn3D.id);
    this.RealtimeService.subscribeToActorUpdate(userOn3D.id, this.onActorUpdated);

    this.IntegrationUsersService.setUserList([...this.users, userOn3D]);

    this.createAvatar(userOn3D);
    this.createPointer(userOn3D);
  };

  /**
   * @function removeUser
   * @description remove user from list
   * @param {UserOn3D} user
   * @returns {void}
   */
  public removeUser = (user: UserOn3D, unsubscribe): void => {
    this.IntegrationUsersService.removeUser(user);

    this.destroyAvatar(user);
    this.destroyPointer(user);
    if (unsubscribe) {
      console.log('I UNSUBSCRIBED!');
      this.RealtimeService.unsubscribeFromActorUpdate(user.id, this.onActorUpdated);
    }
  };

  /**
   * @function updateUser
   * @description update user
   * @param {UserOn3D} user
   * @returns {void}
   */
  public updateUser = (user: UserOn3D): void => {
    const userToBeUpdated = this.IntegrationUsersService.users.find((oldUser) => oldUser.id ===
    user.id);

    if (userToBeUpdated && userToBeUpdated.avatarUrl !== user.avatarUrl) {
      console.log('user updated their avatar', user);
      this.removeUser(user, false);
      const userOn3D = this.IntegrationUsersService.createUserOn3D(user);
      this.IntegrationUsersService.setUserList([...this.users, userOn3D]);

      this.createAvatar(userOn3D);
      this.createPointer(userOn3D);
    } else {
      console.log('updateUser', userToBeUpdated);
      // this.removeUser(user, false);
      // const userOn3D = this.IntegrationUsersService.createUserOn3D(user);
      // this.IntegrationUsersService.setUserList([...this.users, userOn3D]);
    }
  };

  /**
   * @function createLocalUser
   * @description creates the user list with what is needed for the 3D environment
   * @param {UserTo3D} localUser
   * @returns {void}
   */
  private createLocalUser = (localUser: UserTo3D): void => {
    console.log('localUser', localUser);
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
    console.log('createUserList', userList);
    const userOn3DList = userList.map((user) => this.IntegrationUsersService.createUserOn3D(user));
    console.log('userOn3DList', userOn3DList);
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
    console.log('joined', actor);
    const { userId, name, avatarUrl } = actor.data;

    this.addUser({
      id: userId,
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
    const user = this.users.find((user) => user.id === actor.clientId);

    if (!user) {
      return;
    }

    this.removeUser(user, true);
  };

  /**
   * @function onActorUpdated
   * @description update user
   * @param {} actor
   * @returns {void}
   */
  private onActorUpdated = (actor): void => {
    console.log('updated actor', actor);
    const { userId, name, avatarUrl, position, rotation } = actor.data;
    this.updateUser({
      position,
      rotation,
      id: userId,
      name,
      avatarUrl,
    });
  };
}
