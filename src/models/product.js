const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const Product = sequelize.define('Product', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: type.STRING(20),
      allowNull: false,
    },
    name: {
      type: type.STRING(100),
      allowNull: false,
    },
    sku: {
      type: type.STRING(100),
    },
    categoryId: {
      type: type.INTEGER,
    },
    stock: {
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: type.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: type.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: type.TEXT
    },
  }, {
    timestamps: true,
    underscored: true,
  })

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    Product.hasOne(models.ProductImage, { 
      foreignKey: 'productId',
      as: 'mainImage', 
      scope: { isPrimary: true },
      onDelete: 'CASCADE'
    }); // 主圖片
    Product.hasMany(models.ProductImage, {
      foreignKey: 'productId',
      as: 'images',
      scope: { isPrimary: false },
      onDelete: 'CASCADE' 
    });
    Product.hasMany(models.ProductAttribute, {
      foreignKey: 'productId',
      as: 'attributes',
      scope: { isPrimary: false },
      onDelete: 'CASCADE'
    });
    Product.hasMany(models.ProductInventory, {
      foreignKey: 'productId',
      as: 'inventory',
      scope: { isPrimary: false },
      onDelete: 'CASCADE'
    });
  };

  return Product;
};