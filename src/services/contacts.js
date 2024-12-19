import { SORT_ORDER } from '../constants/contacts.js';
import { contactsCollection } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = contactsCollection.find();
  ç;
  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  if (filter.isFavourite !== undefined) {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }

  const countContacts = await contactsCollection
    .find()
    .merge(contactsQuery)
    .countDocuments();

  const contacts = await contactsQuery
    .find()
    .limit(limit)
    .skip(skip)
    .sort({ [sortBy]: sortOrder })
    .exec();

  const paginationData = calculatePaginationData(countContacts, page, perPage);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = async (contactId) => {
  const contact = await contactsCollection.findById(contactId);
  return contact;
};

export const addContact = async (contact) => {
  const addedContact = await contactsCollection.create(contact);
  return addedContact;
};

export const updateContact = async (contactId, contact, options = {}) => {
  const result = await contactsCollection.findOneAndUpdate(
    { _id: contactId },
    contact,
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

export const deleteContact = async (contactId) => {
  const deletedContact = await contactsCollection.findOneAndDelete({
    _id: contactId,
  });
  return deletedContact;
};
