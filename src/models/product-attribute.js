const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const ProductAttribute = sequelize.define('ProductAttribute', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    attributeName: {
      type: type.STRING,
      allowNull: false,
    },
    attributeValue: {
      type: type.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    underscored: true,
  })

  ProductAttribute.associate = (models) => {
    ProductAttribute.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return ProductAttribute;
};