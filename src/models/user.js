const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  const User = sequelize.define('User', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: type.STRING,
      allowNull: false,
    },
    email: {
      type: type.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    account: {
      type: type.STRING,
    },
    password: {
      type: type.STRING,
      allowNull: false,  // 不允許為空
      validate: {
        len: [8, 128],  // 密碼必須在 8 到 128 字元之間
      }
    },
    status: {
      type: type.BOOLEAN,
      defaultValue: true,
    },
  }, {
    hooks: {
      // 在儲存密碼之前進行加密
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.password && user.changed('password')) {
          console.log(user.password);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    timestamps: true,
    underscored: true,
  })

  User.associate = (models) => {
    User.hasOne(models.Member, {
      foreignKey: 'userId',
      as: 'member',
      onDelete: 'CASCADE'
    });
  };

  return User;
};

