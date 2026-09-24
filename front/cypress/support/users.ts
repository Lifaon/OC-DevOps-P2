// Every user created by the e2e tests has a login starting with this prefix,
// so they can be told apart from real data and deleted after the run
export const E2E_PREFIX = 'e2e-';

export interface E2eUser {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
}

export function newUser(label: string): E2eUser {
  const suffix = `${Date.now()}-${Cypress._.random(0, 1e6)}`;
  return {
    firstName: 'John',
    lastName: 'Doe',
    login: `${E2E_PREFIX}${label}-${suffix}`,
    password: 'password'
  };
}
