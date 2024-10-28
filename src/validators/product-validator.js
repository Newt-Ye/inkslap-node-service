const { body } = require('express-validator');

const createRequest = [
  body('name').notEmpty().withMessage('name 為必填'),
  body('categoryId').notEmpty().withMessage('categoryId 為必填'),
  body('files').custom((value, { req }) => {
    // 主要圖片
    if (!req.files.mainImage) {
      throw new Error('mainImage 為必填');
    }
    return true;
  }),
];

const editRequest = [
  body('name').notEmpty().withMessage('name 為必填'),
  body('categoryId').notEmpty().withMessage('categoryId 為必填'),
];

const deleteRequest = [
  body('ids').notEmpty().withMessage('ids為必填'),
];

module.exports = {
  createRequest,
  editRequest,
  deleteRequest
};