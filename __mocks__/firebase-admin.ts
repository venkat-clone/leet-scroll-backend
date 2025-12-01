export const apps = [];
export const initializeApp = jest.fn();
export const credential = {
  cert: jest.fn(),
  applicationDefault: jest.fn(),
};
export const auth = jest.fn(() => ({
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
}));
export const fireStore = jest.fn(() => ({
  collection: jest.fn(),
}));

const admin = {
  apps,
  initializeApp,
  credential,
  auth,
  fireStore,
};

export default admin;
