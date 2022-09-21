import { DefaultUsersOn3DManager, UserOn3D, UserTo3D } from './types';

export class IntegrationUsersManager implements DefaultUsersOn3DManager {
  private _user: UserOn3D;
  private _users: UserOn3D[];

  public get user(): UserOn3D {
    return this._user;
  }

  public get users(): UserOn3D[] {
    return this._users;
  }

  /**
   * @function setUserList
   * @description add user list in 3D space
   * @param {UserOn3D[]} users
   * @returns {void}
   */
  public setUserList = (users: UserOn3D[]): void => {
    this._users = users;
  };

  /**
   * @function setLocalUser
   * @description set current user
   * @param {UserOn3D} user
   * @returns {void}
   */
  public setLocalUser = (user: UserOn3D): void => {
    this._user = user;
  };

  /**
   * @function createUserOn3D
   * @description Creates a user object with properties for 3D space
   * @param {UserTo3D} user
   * @returns {UserOn3D}
   */
  public createUserOn3D = (user: UserTo3D): UserOn3D => {
    // @TODO - Create user with 3D properties
    const userOn3D: UserOn3D = { ...user, color: 'yellow' };

    return userOn3D;
  };

  /**
   * @function removeUser
   * @description remove user from list
   * @param {string} userId
   * @returns {void}
   */
  public removeUser = (userId: string): void => {
    this._users = this._users.filter((user) => user.id !== userId);
  };
}
