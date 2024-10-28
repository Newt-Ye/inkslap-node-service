const categoryController = {};
const {
  sequelize,
  Category,
} = require('../db/sequelize');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../helpers/helper');

categoryController.get = async (req, res, next) => {
  const { q, offset = 0, limit } = req.query;
  try {
    // 構建查詢條件
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } }, // name 欄位模糊搜尋
      ];
    }

    const queryOptions = {
      where,
      offset: parseInt(offset)
    };
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const categories = await Category.findAndCountAll(queryOptions);

    // 分頁參數
    const parsedLimit = parseInt(limit) || categories.count;

    const rangeStart = parseInt(offset);
    const rangeEnd = parseInt(offset) + parsedLimit;
    const totalItems = categories.count;

    // 設置 Content-Range 標頭，格式為 resource_name start-end/total
    res.set('Content-Range', `posts ${rangeStart}-${rangeEnd - 1}/${totalItems}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range'); // 允許 CORS 暴露此標頭

    let statusCode = 200;
    // if (categories.rows.length == 0) {
    //   statusCode = 404;
    // }
    successResponse(res, categories, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

categoryController.getInfo = async (req, res, next) => {
  const id = req.params.categoryId;
  try {
    const category = await Category.findOne({
      where: { 
        id: id 
      },
    });

    let statusCode = 200;
    if (!category) {
      statusCode = 404;
    }
    successResponse(res, category, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

categoryController.create = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const body = req.body;
  try {
    const allowedFields = ['parent_id', 'name']; // 只允許插入的欄位

    const data = {};
    allowedFields.forEach(field => {
      if (body[field]) {
        data[field] = body[field];
      }
    });

    // 創建 Category
    const category = await Category.create(data, { transaction: t });

    // 提交事務，確認創建成功
    await t.commit();

    // 返回創建的 Member
    successResponse(res, category, '類別建立成功', 201);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '類別建立失敗', 500, error.message);
  }
};

categoryController.edit = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const body = req.body;
  const id = req.params.categoryId;
  try {
    const allowedFields = ['parent_id', 'name']; // 只允許插入的欄位

    const data = {};
    allowedFields.forEach(field => {
      if (body[field]) {
        data[field] = body[field];
      } else {
        data[field] = null;
      }
    });

    const category = await Category.findOne({
      where: { 
        id: id 
      },
      transaction: t // 使用事務
    });
    if (!category) {
      await t.rollback();
      return errorResponse(res, '會員修改失敗', 404, "Category not found");
    }
    await category.update(data,{ transaction: t });

    // 提交事務，確認更新成功
    await t.commit();
    
    // 返回修改的 Member
    successResponse(res, category, '類別修改成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '類別修改失敗', 500, error.message);
  }
};

categoryController.delete = async (req, res, next) => {
  const t = await sequelize.transaction(); // 使用 Sequelize 事務來確保兩個模型的創建要麼都成功，要麼都失敗

  const id = req.params.categoryId;
  try {
    const category = await Category.findOne({
      where: { 
        id: id
      },
      transaction: t // 使用事務
    });
    if (!category) {
      await t.rollback();
      return errorResponse(res, '類別刪除失敗', 404, "Category not found");
    }
    await category.destroy();

    // 提交事務，確認更新成功
    await t.commit();

    successResponse(res, {id: id}, '類別刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '類別刪除失敗', 500, error.message);
  }
};

categoryController.deleteMany = async (req, res, next) => {
  const t = await sequelize.transaction();

  const data = req.body;
  try {    
    await Category.destroy({
      where: {
        id: {
          [Op.in]: data.ids, // 使用 Op.in 運算子來匹配多個 ID
        },
      },
      transaction: t // 使用事務
    });

    // 提交事務，確認創建成功
    await t.commit();

    successResponse(res, {ids: data.ids}, '類別刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '類別刪除失敗', 500, error.message);
  }
};

module.exports = categoryController;