import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';

import { usersCollection } from '../db/models/user.js';

export const registerUser = async (userData) => {
  const user = await usersCollection.findOne({ email: userData.email });
  if (user) {
    throw createHttpError(409, 'Email in use');
  }
  const encryptedPassword = await bcrypt.hash(userData.password, 10);
  const createdUser = await usersCollection.create({
    ...userData,
    password: encryptedPassword,
  });

  return createdUser;
};

export const loginUser = async (userData) => {
  const user = await usersCollection.findOne({ email: userData.email });

  if (!user) {
    throw createHttpError(401, 'Wrong email or password');
  }

  const isValidPassword = await bcrypt.compare(
    userData.password,
    user.password,
  );

  if (!isValidPassword) {
    throw createHttpError(401, 'Wrong email or password');
  }
};
