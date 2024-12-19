import { SORT_ORDER } from '../constants/contacts.js';

const parseSortOrder = (sortOrder) => {
  const isKnown = [SORT_ORDER.ASC, SORT_ORDER.DESC].includes(sortOrder);
  if (isKnown) return sortOrder;

  return SORT_ORDER.ASC;
};

const parseSortBy = (sortBy) => {
  const contactKeys = [
    '_id',
    'name',
    'phoneNumber',
    'email',
    'isFavourite',
    'contactType',
    'createdAt',
    'updatedAt',
  ];

  const isKnown = contactKeys.includes(sortBy);
  if (isKnown) return sortBy;

  return '_id';
};

export const parseSortParams = (query) => {
  const { sortOrder, sortBy } = query;

  const parsedSortOrder = parseSortOrder(sortOrder);
  const parsedSortBy = parseSortBy(sortBy);

  return {
    sortBy: parsedSortBy,
    sortOrder: parsedSortOrder,
  };
};
