require('dotenv').config();
const AppConfig = require('../config').app;
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const logger = require('debug')('SERVER:app:info');
const error = require('debug')('SERVER:app:error');
const helmet = require('helmet');
const cors = require("cors");
const app = express();

logger(`Server init`);

/**
 * Routes.
 */
const usersRouter = require('./routes/users');
const membersRouter = require('./routes/members');
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');

// Secret key for signing JWT
const JWT_SECRET = 'your_jwt_secret';  // 這個應該存放在環境變量中

/**
 * Express middleware.
 */
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: AppConfig.clientHost
}));

app.set('trust proxy', true); // 信任代理設置

// 設定靜態文件路徑
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', usersRouter);
app.use('/api', membersRouter);
app.use('/api', categoriesRouter);
app.use('/api', productsRouter);

// app.use(errorHandler);
// function errorHandler(err, req, res, next) {
//     error(err);
//     res.status(500)
// }

// 健康檢查路由
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

function onStart(){
  logger(`Server running on port ${AppConfig.port}`);
}

app.listen(AppConfig.port, '0.0.0.0', onStart);

module.exports = app;