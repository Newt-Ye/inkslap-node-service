const { faker } = require('@faker-js/faker');
const {
  sequelize,
  User
} = require('./db/sequelize');

// 生成並插入測試資料
async function createTestData() {
  try {
    // 同步資料庫，這會清空並重新建立表格
    // await sequelize.sync({ force: true });
    // console.log('Database synchronized successfully.');

    const users = [];
    // 生成 100 筆假資料
    for (let i = 0; i < 100; i++) {
      const email = faker.internet.email();
      users.push({
        name: faker.person.firstName(),
        email: email,
        account: email,
        password: "12345678"
      });
    }

    // 批次插入資料到資料庫
    await User.bulkCreate(users, {
      validate: true,
      individualHooks: true,
    });
    console.log('Test data inserted successfully.');
  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    // 關閉資料庫連接
    // await sequelize.close();
    console.log('Database connection closed.');
  }
}

createTestData();
