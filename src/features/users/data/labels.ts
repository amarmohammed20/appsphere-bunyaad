export const usersLabels = {
  confirmRemoveTitle: 'Remove',
  confirmRemoveBody:
    'They lose access immediately. Their sign-in still exists, so an admin can restore them later.',
  cancel: 'Cancel',
  heading: 'Team',
  lead: 'Everyone with an account, and what they may do.',
  nameField: 'Full name',
  emailField: 'Email address',
  roleField: 'Role',
  delete: 'Remove',
  you: 'you',
  empty: 'No members yet.',
  failure: 'Something went wrong. Please try again.',
  validationFailure: 'Please check the form and try again.',
  cannotChangeSelf: 'You cannot change your own account.',
  lastAdmin: 'There must always be at least one admin.',
} as const;

export const roleLabels = {
  admin: 'Admin',
  member: 'Member',
} as const;
