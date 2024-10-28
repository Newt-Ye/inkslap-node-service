const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const Member = sequelize.define('Member', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: type.STRING(100),
    },
    lastName: {
      type: type.STRING(100),
      allowNull: true,
    },
    gender: {
      type: type.ENUM('male', 'female', 'other'),
      defaultValue: 'male',
    },
    dob: {
      type: type.DATEONLY,
      allowNull: true,
    },
    phone: {
      type: type.STRING(20),
      allowNull: true,
    },
    mobile: {
      type: type.STRING(20),
      allowNull: true,
    },
    address: {
      type: type.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
  })

  Member.associate = (models) => {
    Member.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Member;
};