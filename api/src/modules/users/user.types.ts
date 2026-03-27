export type updateAccountDetailsInput = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  bio?: string;
  country?: string;
};

export type updateUserAvatarInput = {
  avatarBuffer: Buffer;
};
