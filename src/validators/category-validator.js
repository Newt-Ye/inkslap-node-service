const { body } = require('express-validator');

const createRequest = [
  body('name').notEmpty().withMessage('名稱為必填'),
];

const editRequest = [
  body('name').notEmpty().withMessage('名稱為必填'),
];

const deleteRequest = [
  body('ids').notEmpty().withMessage('ids為必填'),
];

module.exports = {
  createRequest,
  editRequest,
  deleteRequest
};