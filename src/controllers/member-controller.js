const memberController = {};
const {
  sequelize,
  Member, 
  User
} = require('../db/sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../helpers/helper');

// Secret key for signing JWT
const JWT_SECRET = 'your_jwt_secret';

memberController.get = async (req, res, next) => {
  const { q, status, offset = 0, limit } = req.query;
  try {
    // 構建查詢條件
    const where = {};
    if (q) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${q}%` } }, // first_name 欄位模糊搜尋
        { phone: { [Op.like]: `%${q}%` } }, // phone 欄位模糊搜尋
        { mobile: { [Op.like]: `%${q}%` } }, // mobile 欄位模糊搜尋
      ];
    }

    const queryOptions = {
      include: [
        {
          model: User,  // 包含 User 模型
          as: 'user',   // 使用 'user' 作為別名
          attributes: ['email', 'account', 'status'], // 選擇要返回的 User 欄位
          ...(status && { where: { status: status === 'true' } })
        }
      ],
      where,
      offset: parseInt(offset)
    };
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const members = await Member.findAndCountAll(queryOptions);

    // 分頁參數
    const parsedLimit = parseInt(limit) || members.count;

    const rangeStart = parseInt(offset);
    const rangeEnd = parseInt(offset) + parsedLimit;
    const totalItems = members.count;

    // 設置 Content-Range 標頭，格式為 resource_name start-end/total
    res.set('Content-Range', `posts ${rangeStart}-${rangeEnd - 1}/${totalItems}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range'); // 允許 CORS 暴露此標頭

    let statusCode = 200;
    // if (members.rows.length == 0) {
    //   statusCode = 404;
    // }
    successResponse(res, members, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

memberController.getInfo = async (req, res, next) => {
  const id = req.params.memberId;
  try {
    const member = await Member.findOne({
      where: { 
        id: id 
      },
      include: [
        {
          model: User,  // 包含 User 模型
          as: 'user',   // 使用 'user' 作為別名
          attributes: ['email', 'account'] // 選擇要返回的 User 欄位
        }
      ]
    });

    let statusCode = 200;
    if (!member) {
      statusCode = 404;
    }
    successResponse(res, member, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

memberController.create = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const data = req.body;
  try {
    const memberAllowedFields = ['firstName', 'lastName', 'gender', 'dob', 'phone', 'mobile', 'address']; // 只允許插入的 Member 欄位
    const userAllowedFields   = ['firstName', 'email', 'account', 'password']; // 只允許插入的 User 欄位

    const memberData = {};
    memberAllowedFields.forEach(field => {
        if (data[field]) {
          memberData[field] = data[field];
        }
    });

    const userData = {};
    userAllowedFields.forEach(field => {
      if (data[field]) {
        if (field === 'firstName') {
          userData['name'] = data[field];
        } else {
          userData[field]  = data[field];
        }
      }
    });

    // 創建 User
    const user = await User.create(userData, { transaction: t });

    // 創建 Member 並關聯到 User (透過 userId 外鍵)
    memberData.userId = user.id;  // 在 Member 中設置外鍵關聯
    const member = await Member.create(memberData, { transaction: t });

    // 提交事務，確認創建成功
    await t.commit();

    // 返回創建的 Member
    successResponse(res, member, '會員建立成功', 201);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '會員建立失敗', 500, error.message);
  }
};

memberController.edit = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const data = req.body;
  const id = req.params.memberId;
  try {
    const memberAllowedFields = ['firstName', 'lastName', 'gender', 'dob', 'phone', 'mobile', 'address']; // 只允許插入的 Member 欄位
    const userAllowedFields   = ['firstName', 'email', 'account', 'password', 'status']; // 只允許插入的 User 欄位

    const memberData = {};
    memberAllowedFields.forEach(field => {
      if (data[field]) {
        memberData[field] = data[field];
      } else {
        memberData[field] = null;
      }
    });

    const userData = {
      name: data.firstName,
      email: data.email,
      account: data.account,
      status: data.status
    };

    const member = await Member.findOne({
      where: { 
        id: id 
      },
      transaction: t // 使用事務
    });
    if (!member) {
      await t.rollback();
      return errorResponse(res, '會員修改失敗', 404, "Member not found");
    }
    await member.update(memberData,{ transaction: t });

    const user = await User.findOne({
      where: { 
        id: member.userId 
      },
      transaction: t // 使用事務
    });
    if (!user) {
      await t.rollback();
      return errorResponse(res, '會員修改失敗', 404, "User not found");
    }

    if (data.password && data.password !== "") {
      userData.password = data.password;
      // 標記 password 為已更改
      user.changed('password', true);
    }

    await user.update(userData, { transaction: t });

    // 提交事務，確認更新成功
    await t.commit();
    
    // 返回修改的 Member
    successResponse(res, member, '會員修改成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '會員修改失敗', 500, error.message);
  }
};

memberController.delete = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const id = req.params.memberId;
  try {
    const member = await Member.findOne({
      where: { 
        id: id 
      },
      transaction: t // 使用事務
    });
    if (!member) {
      await t.rollback();
      return errorResponse(res, '會員刪除失敗', 404, "Member not found");
    }

    const user = await User.findOne({
      where: { 
        id: member.userId 
      },
      transaction: t // 使用事務
    });
    if (!user) {
      await t.rollback();
      return errorResponse(res, '會員刪除失敗', 404, "User not found");
    }
    await user.destroy();

    // 提交事務，確認更新成功
    await t.commit();

    successResponse(res, {id: member.id}, '會員刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '會員資料刪除失敗', 500, error.message);
  }
};

memberController.deleteMany = async (req, res, next) => {
  const t = await sequelize.transaction();

  const data = req.body;
  try {
    const members = await Member.findAll({
      attributes: ['user_id'] // 只撈出 user_id 欄位
    });
    const userIds = members.map(member => member.user_id);
    
    await User.destroy({
      where: {
        id: {
          [Op.in]: userIds, // 使用 Op.in 運算子來匹配多個 ID
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

memberController.register = async (req, res, next) => {
  req.body.firstName = req.body.name;
  req.body.account   = req.body.email;

  return memberController.create(req, res, next);
};

memberController.login = async (req, res, next) => {
  const { account, password } = req.body;
  try {
    // 從資料庫查詢使用者
    const user = await User.findOne({ where: { account } });
    if (!user) {
      return errorResponse(res, '帳號錯誤', 401);
    }

    // 驗證密碼
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return errorResponse(res, '密碼錯誤', 401);
    }

    const member = await Member.findOne({
      where: { 
        user_id: user.id 
      },
    });
    if (!member) {
      return errorResponse(res, '登入失敗', 404, "Member not found");
    }

    let ipAddress = res.ip;
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1';
    }

    // 產生 JWT token
    const token = jwt.sign({ id: member.id, name: member.first_name, ip: ipAddress }, JWT_SECRET, { expiresIn: '1h' });

    // 回傳 token
    successResponse(res, {
      token: token,
      expires_in: 0,
      user: {
        id: member.id,
        name: member.first_name,
      },
    }, '會員登入成功', 200);
  } catch (error) {
    console.error(error);
    errorResponse(res, '登入失敗', 500, error.message);
  }
};

module.exports = memberController;