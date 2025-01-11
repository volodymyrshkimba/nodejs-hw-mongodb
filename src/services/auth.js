import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import { usersCollection } from '../db/models/user.js';
import { sessionsCollection } from '../db/models/session.js';
import { FIFTEEN_MINUTES, SMTP, THIRTY_DAYS } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { sendMail } from '../utils/sendMail.js';

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

  await sessionsCollection.deleteOne({ userId: user._id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  const session = await sessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });

  return session;
};

export const refreshUserSession = async ({ refreshToken, sessionId }) => {
  const session = await sessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isRefreshTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  await sessionsCollection.deleteOne({
    _id: sessionId,
    refreshToken,
  });

  const newAccessToken = randomBytes(30).toString('base64');
  const newRefreshToken = randomBytes(30).toString('base64');

  const newSession = await sessionsCollection.create({
    userId: session.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });

  return newSession;
};

export const logoutUser = async (sessionId) => {
  await sessionsCollection.deleteOne({ _id: sessionId });
};

export const requestResetToken = async (email) => {
  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar('JWT_SECRET'),
    {
      expiresIn: '5m',
    },
  );

  await sendMail({
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${getEnvVar(
      'APP_DOMAIN',
    )}/reset-password?token=${resetToken}">here</a> to reset your password!</p>`,
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch {
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await usersCollection.findOne({
    _id: entries.sub,
    email: entries.email,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await usersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};
