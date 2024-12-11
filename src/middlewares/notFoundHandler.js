import createHttpError from 'http-errors';

export const notFoundHandler = (req, res, next) => {
  throw new createHttpError(404, 'Route not found');
};
