const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const LoginAttempt = sequelize.define('LoginAttempt', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ipAddress: {
      type: type.STRING(45),
      allowNull: false,
    },
    status: {
      type: type.ENUM('success', 'failure'),
      allowNull: false,
    },
  }, {
    timestamps: true,
    underscored: true,
  })

  return LoginAttempt;
};