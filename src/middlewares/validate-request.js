const { validationResult } = require('express-validator');
const { errorResponse } = require('../helpers/helper');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const info = errors.array().map(error => ({
      msg: error.msg,
    }))

    return errorResponse(res, '參數不正確', 400, info);
  }
  next();
};

module.exports = validateRequest;