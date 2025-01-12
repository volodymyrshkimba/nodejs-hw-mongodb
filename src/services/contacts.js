import { SORT_ORDER } from '../constants/contacts.js';
import { contactsCollection } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const getAllContacts = async ({
  userId,
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = contactsCollection.find({ userId });

  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  if (filter.isFavourite !== undefined) {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }

  const [countContacts, contacts] = await Promise.all([
    contactsCollection.find().merge(contactsQuery).countDocuments(),
    contactsQuery
      .find()
      .limit(limit)
      .skip(skip)
      .sort({ [sortBy]: sortOrder })
      .exec(),
  ]);

  const paginationData = calculatePaginationData(countContacts, page, perPage);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = async (contactId, userId) => {
  const contact = await contactsCollection.findOne({ _id: contactId, userId });
  return contact;
};

export const addContact = async (contactData, photo, userId) => {
  const addedContact = await contactsCollection.create({
    ...contactData,
    photo,
    userId,
  });
  return addedContact;
};

export const updateContact = async (
  contactId,
  userId,
  contact,
  photo,
  options = {},
) => {
  const result = await contactsCollection.findOneAndUpdate(
    {
      _id: contactId,
      userId,
    },
    {
      ...contact,
      photo,
    },
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );

  if (!result || !result.value) return null;

  return {
    contact: result.value,
    isNew: Boolean(result?.lastErrorObject?.upserted),
  };
};

export const deleteContact = async (contactId, userId) => {
  const deletedContact = await contactsCollection.findOneAndDelete({
    _id: contactId,
    userId,
  });
  return deletedContact;
};
