const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const ProductImage = sequelize.define('ProductImage', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sorting: {
      type: type.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    fileName: {
      type: type.STRING,
      allowNull: false,
    },
    isPrimary: {
      type: type.BOOLEAN,
      defaultValue: false,
    }
  }, {
    timestamps: true,
    underscored: true,
  })

  ProductImage.associate = (models) => {
    ProductImage.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return ProductImage;
};