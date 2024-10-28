const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const ProductInventory = sequelize.define('ProductInventory', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    stock: {
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    attributesCombination: {
      type: type.JSON,
      allowNull: false,
    },
  }, {
    timestamps: true,
    underscored: true,
  })

  ProductInventory.associate = (models) => {
    ProductInventory.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return ProductInventory;
};