const { body } = require('express-validator');

const createRequest = [
  body('name').notEmpty().withMessage('名稱為必填'),
  body('email')
    .notEmpty().withMessage('Email為必填')
    .isEmail().withMessage('Email格式不正確'),
  body('account').notEmpty().withMessage('帳號為必填'),
  body('password')
    .notEmpty().withMessage('密碼為必填')
    .isLength({ min: 8 }).withMessage('密碼長度必須大於8字元'),
];

const editRequest = [
  body('name').notEmpty().withMessage('名稱為必填'),
  body('email')
    .notEmpty().withMessage('Email為必填')
    .isEmail().withMessage('Email格式不正確'),
  body('account').notEmpty().withMessage('帳號為必填'),
  body('password')
    .optional({ checkFalsy: true }) // / 如果 password 欄位不存在或為空值（例如空字串或 false），跳過驗證
    .isLength({ min: 8 }).withMessage('密碼長度必須大於8字元'),
];

const deleteRequest = [
  body('ids').notEmpty().withMessage('ids為必填'),
];

module.exports = {
  createRequest,
  editRequest,
  deleteRequest
};