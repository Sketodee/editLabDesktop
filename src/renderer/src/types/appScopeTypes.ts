export enum UserType {
    ADMIN = 0,
    USER = 1,
  }


  export type User = {
  id: string;
  email: string;
  userType: UserType;
};


export enum AllowedProviders {
  GOOGLE = 'google',
  APPLE = 'apple',
  CUSTOM = 'custom',
}