const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const Category = sequelize.define('Category', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: type.STRING(100),
      allowNull: false,
    },
    parentId: {
      type: type.INTEGER,
    }
  }, {
    timestamps: true,
    underscored: true,
  })

  return Category;
};