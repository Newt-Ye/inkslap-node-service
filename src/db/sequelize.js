const DbConfig = require('../../config').db;
const { Sequelize } = require('sequelize');
const logger = require('debug')('SERVER:sequelize');
const UserModel = require('../models/user');
const LoginAttemptModel = require('../models/login-attempt');
const MemberModel = require('../models/member');
const CategoryModel = require('../models/category');
const ProductModel = require('../models/product');
const ProductImageModel = require('../models/product-image');
const ProductAttributeModel = require('../models/product-attribute');
const ProductInventoryModel = require('../models/product-inventory');


/**
 * DB connection setup
 */
const sequelize = new Sequelize(DbConfig.name, DbConfig.user, DbConfig.password, {
  host: DbConfig.host,
  port: DbConfig.port,
  dialect: DbConfig.dialect,
  define: {
    timestamps: false
  },
  logging: msg => logger(msg)
});


// Initialize models
const models = {
  User: UserModel(sequelize, Sequelize),
  LoginAttempt: LoginAttemptModel(sequelize, Sequelize),
  Member: MemberModel(sequelize, Sequelize),
  Category: CategoryModel(sequelize, Sequelize),
  Product: ProductModel(sequelize, Sequelize),
  ProductImage: ProductImageModel(sequelize, Sequelize),
  ProductAttribute: ProductAttributeModel(sequelize, Sequelize),
  ProductInventory: ProductInventoryModel(sequelize, Sequelize)
};

// Execute associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

/**
 * Uncomment this in order to generate table
 */
// sequelize.sync().then(logger('DB is synced'));

module.exports = {
  ...models,
  sequelize
};