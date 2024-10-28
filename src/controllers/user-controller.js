const userController = {};
const {
  sequelize,
  User,
  LoginAttempt
} = require('../db/sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../helpers/helper');

// Secret key for signing JWT
const JWT_SECRET = 'your_jwt_secret';  // 這個應該存放在環境變量中

const recordLoginAttempt = async (userId, ipAddress, status) => {
  await LoginAttempt.create({
    userId: userId,
    ipAddress: ipAddress,
    status: status,
  });
};


userController.get = async (req, res, next) => {
  const { q, status, offset = 0, limit } = req.query;
  try {
    // 構建查詢條件
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } }, // name 欄位模糊搜尋
        { email: { [Op.like]: `%${q}%` } }, // email 欄位模糊搜尋
        { account: { [Op.like]: `%${q}%` } }, // account 欄位模糊搜尋
      ];
    }
    
    // 如果有提供 status AND 條件
    if (status) {
      where.status = status === 'true';
    }

    const queryOptions = {
      where,
      offset: parseInt(offset)
    };
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const users = await User.findAndCountAll(queryOptions);

    // 分頁參數
    const parsedLimit = parseInt(limit) || users.count;

    const rangeStart = parseInt(offset);
    const rangeEnd = parseInt(offset) + parsedLimit;
    const totalItems = users.count;

    // 設置 Content-Range 標頭，格式為 resource_name start-end/total
    res.set('Content-Range', `users ${rangeStart+1}-${rangeEnd}/${totalItems}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range'); // 允許 CORS 暴露此標頭

    let statusCode = 200;
    // if (users.rows.length == 0) {
    //   statusCode = 404;
    // }
    successResponse(res, users, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

userController.getInfo = async (req, res, next) => {
  const id = req.params.userId;
  try {
    const user = await User.findOne({
      attributes: { exclude: ['password'] }, // 排除欄位
      where: { 
        id: id 
      },
    });

    if (!user) {
      return errorResponse(res, '資料獲取失敗', 404, "User not found");
    }
    successResponse(res, user, '資料獲取成功',200);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

userController.create = async (req, res, next) => {
  const t = await sequelize.transaction();

  const body = req.body;
  try {

    const data = {
      name: body.name,
      email: body.email,
      account: body.account,
      password: body.password,
    };

    const user = await User.create(data, { transaction: t });

    // 提交事務，確認創建成功
    await t.commit();

    // 返回創建的 User
    successResponse(res, user, '帳號建立成功', 201);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '會員資料建立失敗', 500, error.message);
  }
};

userController.edit = async (req, res, next) => {
  const t = await sequelize.transaction();

  const body = req.body;
  const id = req.params.userId;
  try {
    const user = await User.findOne({
      where: { 
        id: id
      },
      transaction: t // 使用事務
    });
    if (!user) {
      await t.rollback();
      return errorResponse(res, '帳號修改失敗', 404, "User not found");
    }
    
    const data = {
      name: body.name,
      email: body.email,
      account: body.account,
      status: data.status
    };
    if (body.password && body.password !== "") {
      data.password = body.password;
      // 標記 password 為已更改
      user.changed('password', true);
    }

    await user.update(data, { transaction: t });

    // 提交事務，確認更新成功
    await t.commit();
    
    // 返回修改的 Member
    successResponse(res, user, '帳號修改成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '帳號修改失敗', 500, error.message);
  }
};

userController.delete = async (req, res, next) => {
  const t = await sequelize.transaction();

  const id = req.params.userId;
  try {
    const user = await User.findOne({
      where: { 
        id: id 
      },
      transaction: t // 使用事務
    });
    if (!user) {
      await t.rollback();
      return errorResponse(res, '帳號刪除失敗', 404, "User not found");
    }
    await user.destroy();

    // 提交事務，確認更新成功
    await t.commit();

    successResponse(res, {id: user.id}, '帳號刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '帳號刪除失敗', 500, error.message);
  }
};

userController.deleteMany = async (req, res, next) => {
  const t = await sequelize.transaction();

  const data = req.body;
  try {
    await User.destroy({
      where: {
        id: {
          [Op.in]: data.ids, // 使用 Op.in 運算子來匹配多個 ID
        },
      },
      transaction: t // 使用事務
    });

    // 提交事務，確認創建成功
    await t.commit();

    successResponse(res, {ids: data.ids}, '帳號刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '帳號刪除失敗', 500, error.message);
  }
};

userController.login = async (req, res, next) => {
  const { account, password } = req.body;
  const ipAddress = req.ip === '::1' ? '127.0.0.1' : req.ip;

  try {
    // 從資料庫查詢使用者
    const user = await User.findOne({ where: { account } });
    if (!user) {
      await recordLoginAttempt(null, ipAddress, 'failure');
      return errorResponse(res, '帳號錯誤', 401);
    }

    // 驗證密碼
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await recordLoginAttempt(user.id, ipAddress, 'failure')
      return errorResponse(res, '密碼錯誤', 401);
    }
    await recordLoginAttempt(user.id, ipAddress, 'success');

    // 產生 JWT token
    const token = jwt.sign({ id: user.id, name: user.name, ip: ipAddress }, JWT_SECRET, { expiresIn: '1h' });

    // 回傳 token
    successResponse(res, {
      token: token,
      expires_in: 0,
      user: {
        id: user.id,
        name: user.name,
      },
    }, '帳號登入成功', 200);
  } catch (error) {
    console.error(error);
    errorResponse(res, '登入失敗', 500, error.message);
  }
};

module.exports = userController;