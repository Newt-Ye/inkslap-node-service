const jwt = require('jsonwebtoken');
const { errorResponse } = require('../helpers/helper');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      let ipAddress = res.ip;
      if (ipAddress === '::1') {
        ipAddress = '127.0.0.1';
      }
      if (err || user.ip !== req.ipAddress) {
        return errorResponse(res, 'Invalid token or IP address mismatch', 403); // Token 無效，禁止存取
      }

      req.user = user;  // 將使用者資訊附加到請求物件上
      next();  // 繼續處理後續請求
    });
  } else {
    return errorResponse(res, 'Unauthorized', 401); // 沒有提供 token，未授權
  }
};

module.exports = authenticateJWT;