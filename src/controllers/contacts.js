import createHttpError from 'http-errors';

import {
  addContact,
  deleteContact,
  getAllContacts,
  getContactById,
  updateContact,
} from '../services/contacts.js';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getAllContactsController = async (req, res) => {
  const userId = req.user._id;
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortOrder, sortBy } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const contacts = await getAllContacts({
    userId,
    page,
    perPage,
    sortOrder,
    sortBy,
    filter,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const contact = await getContactById(contactId, userId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  res.json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const addContactController = async (req, res) => {
  const userId = req.user._id;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    photoUrl = await saveFileToCloudinary(photo);
  }

  const addedContact = await addContact(req.body, photoUrl, userId);

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: addedContact,
  });
};

export const patchContactController = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const body = req.body;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    photoUrl = await saveFileToCloudinary(photo);
  }
  const patchedContact = await updateContact(contactId, userId, body, photoUrl);

  if (!patchedContact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: patchedContact.contact,
  });
};

export const deleteContactController = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const deletedContact = await deleteContact(contactId, userId);

  if (!deletedContact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};
