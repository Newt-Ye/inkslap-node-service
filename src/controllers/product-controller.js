const productController = {};
const {
  sequelize,
  Product,
  ProductImage,
  ProductAttribute,
  ProductInventory,
  Category,
} = require('../db/sequelize');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../helpers/helper');
const fs = require('fs');
const path = require('path');
const { connectRedis } = require('../redis/redis-connect');

const removeFile = async (fileName) => {
  try {
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`文件 ${fileName} 已刪除`);
    } else {
      console.log(`文件 ${fileName} 不存在`);
    }
  } catch (error) {
    console.error(`刪除文件時發生錯誤: ${error.message}`);
  }
};

productController.get = async (req, res, next) => {
  const { q, categoryId, offset = 0, limit } = req.query;
  try {
    // 構建查詢條件
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } }, // name 欄位模糊搜尋
        { sku: { [Op.like]: `%${q}%` } }, // sku 欄位模糊搜尋
      ];
    }

    // 如果有提供 categoryId AND 條件
    if (categoryId) {
      where.category_id = categoryId;
    }

    const queryOptions = {
      where,
      offset: parseInt(offset)
    };
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const products = await Product.findAndCountAll(queryOptions);

    // 分頁參數
    const parsedLimit = parseInt(limit) || products.count;

    const rangeStart = parseInt(offset);
    const rangeEnd = parseInt(offset) + parsedLimit;
    const totalItems = products.count;

    // 設置 Content-Range 標頭，格式為 resource_name start-end/total
    res.set('Content-Range', `posts ${rangeStart}-${rangeEnd - 1}/${totalItems}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range'); // 允許 CORS 暴露此標頭

    let statusCode = 200;
    // if (categories.rows.length == 0) {
    //   statusCode = 404;
    // }
    successResponse(res, products, '資料獲取成功',statusCode);
  } catch (error) {
    console.error(error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

productController.getInfo = async (req, res, next) => {
  const id = req.params.productId;

  const redisClient = await connectRedis();
  if (redisClient) {
    const redisProduct = await redisClient.get(`product:${id}`);
    if (redisProduct) {
      console.log('Get product info by redis.');
      return successResponse(res, JSON.parse(redisProduct), '資料獲取成功',200);
    }
  }

  try {
    const product = await Product.findOne({
      where: { 
        id: id 
      },
      include: [
        {
          model: Category,  // 包含 Category 模型
          as: 'category',   // 使用 'category' 作為別名
          attributes: ['name'] // 選擇要返回的 Category 欄位
        },
        {
          model: ProductImage,  // 包含 ProductImage 模型
          as: 'mainImage',   // 使用 'mainImage' 作為別名
          attributes: ['fileName'] // 選擇要返回的 ProductImage 欄位
        },
        {
          model: ProductImage,  // 包含 ProductImage 模型
          as: 'images',   // 使用 'images' 作為別名
          attributes: ['fileName'] // 選擇要返回的 ProductImage 欄位
        }
      ]
    });
    if (!product) {
      console.log(`Product with ID ${id} not found.`);
      return errorResponse(res, '資料獲取失敗', 404, `Product with ID ${id} not found.`);
    }

    const formatImageUrl = (image, baseUrl) => image ? { url: baseUrl + image.fileName } : null;
    const formatImageUrls = (images, baseUrl) => images.map(image => ({ url: baseUrl + image.fileName }));

    // 將 product 轉換為純物件
    const productJson = product.get({ plain: true });

    const baseUrl = 'http://localhost:3005/uploads/';
    productJson.mainImage = formatImageUrl(productJson.mainImage, baseUrl);
    productJson.images = formatImageUrls(productJson.images, baseUrl);
    
    if (redisClient) {
      await redisClient.set(`product:${id}`, JSON.stringify(productJson), {
        EX: 3600  // 設置 3600 秒的過期時間（1 小時）
      });
    }

    successResponse(res, productJson, '資料獲取成功',200);
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    errorResponse(res, '資料獲取失敗', 500, error.message);
  }
};

productController.create = async (req, res, next) => {
  const t = await sequelize.transaction();

  const body = req.body;
  const mainImage = req.files?.mainImage[0]?.filename; // 主要圖片
  const secondaryImages = req.files.images || []; // 次要圖片

  try {
    const allowedFields = ['code', 'sku', 'name', 'categoryId', 'price', 'status', 'description', 'stock']; // 只允許插入的欄位

    const data = allowedFields.reduce((acc, field) => {
      if (body[field]) {
        acc[field] = body[field];
      }
      return acc;
    }, {});

    // 創建 Product
    const product = await Product.create(data, { transaction: t });
    const productId = product.id;

    if (mainImage) {
      await ProductImage.create({
        productId: productId, 
        sorting: 1, 
        fileName: mainImage,
        isPrimary: true,
      }, { transaction: t });
    }

    if (secondaryImages.length > 0) {
      const imageRecords = secondaryImages.map((file, index) => {
        return { productId: productId, sorting: index+2, fileName: file.filename };
      });

      await ProductImage.bulkCreate(imageRecords, { transaction: t });
    }

    if (body.attributes) {
      const attributeRecords = body.attributes.flatMap(item =>
        item.values.map(value => ({
            productId: productId,
            attributeName: item.name,
            attributeValue: value
        }))
      );

      await ProductAttribute.bulkCreate(attributeRecords, { transaction: t });
    }

    if (body.inventory) {
      const inventoryRecords = body.inventory.map((item, index) => {
        return { productId: productId, stock: item.stock, attributesCombination: item.attributesCombination };
      });
      await ProductInventory.bulkCreate(inventoryRecords, { transaction: t });

      const totalStock = inventoryRecords.reduce((sum, record) => sum + parseInt(record.stock), 0);
      product.stock = totalStock;
      await product.save({ transaction: t });
    }

    // 提交事務，確認創建成功
    await t.commit();

    const createdProduct = {
      ...product.get({ plain: true }),
      mainImage: { url: `http://localhost:3005/uploads/${mainImage}` },
      images: secondaryImages.map(img => ({ url: `http://localhost:3005/uploads/${img.filename}` }))
    };

    // 返回創建的 Product
    successResponse(res, createdProduct, '商品建立成功', 201);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '商品建立失敗', 500, error.message);
  }
};

productController.edit = async (req, res, next) => {
  const t = await sequelize.transaction();

  const { body, params: { productId } } = req;
  const mainImage = req.files?.mainImage[0]?.filename;// 主要圖片
  const secondaryImages = req.files.images || [];// 次要圖片

  try {
    const allowedFields = ['code', 'sku', 'name', 'categoryId', 'price', 'status', 'description', 'stock']; // 只允許插入的欄位

    const data = allowedFields.reduce((acc, field) => {
      acc[field] = body[field] || (['quantity', 'price'].includes(field) ? 0 : field === 'status' ? 'active' : null);
      return acc;
    }, {});

    const product = await Product.findOne({
      where: { 
        id: productId 
      },
      include: [
        {
          model: ProductImage,  // 包含 ProductImage 模型
          as: 'mainImage',   // 使用 'mainImage' 作為別名
          attributes: ['fileName'] // 選擇要返回的 ProductImage 欄位
        },
        {
          model: ProductImage,  // 包含 ProductImage 模型
          as: 'images',   // 使用 'images' 作為別名
          attributes: ['fileName'] // 選擇要返回的 ProductImage 欄位
        }
      ],
      transaction: t // 使用事務
    });
    if (!product) {
      await t.rollback();
      return errorResponse(res, '商品修改失敗', 404, "Product not found");
    }
    await product.update(data,{ transaction: t });

    if (req.files && req.files.mainImage && mainImage) {
      // 刪除對應的檔案
      await removeFile(product.mainImage?.fileName);

      await ProductImage.upsert({
        productId: productId,
        sorting: 1,
        fileName: mainImage,
        isPrimary: true
      }, { transaction: t });
    }

    if (secondaryImages.length > 0) {
      // 刪除對應的檔案
      await Promise.all(product.images.map(image => removeFile(image.fileName)));

      await ProductImage.destroy({
        where: {
          productId: productId,
          isPrimary: false
        },
        transaction: t // 使用事務
      });

      const imageRecords = secondaryImages.map((file, index) => {
        return { productId: productId, sorting: index+2, fileName: file.filename };
      });

      await ProductImage.bulkCreate(imageRecords, { transaction: t });
    }

    // 提交事務，確認更新成功
    await t.commit();

    const updatedProduct = {
      ...product.get({ plain: true }),
      mainImage: mainImage ? { url: `http://localhost:3005/uploads/${mainImage}` } : product.mainImage,
      images: secondaryImages.length > 0
        ? secondaryImages.map(img => ({ url: `http://localhost:3005/uploads/${img.filename}` }))
        : product.images.map(img => ({ url: `http://localhost:3005/uploads/${img.fileName}` }))
    };
    
    // 返回修改的 Product
    successResponse(res, updatedProduct, '商品修改成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '商品修改失敗', 500, error.message);
  }
};

productController.delete = async (req, res, next) => {
  const t = await sequelize.transaction();

  const id = req.params.productId;
  try {
    const product = await Product.findOne({
      where: { 
        id: id
      },
      transaction: t // 使用事務
    });
    if (!product) {
      await t.rollback();
      return errorResponse(res, '商品刪除失敗', 404, "Product not found");
    }

    const images = await ProductImage.findAll({ 
      where: { 
        product_id: id 
      } 
    });

    await product.destroy();
    // 刪除對應的檔案
    await Promise.all(images.map(image => removeFile(image.fileName)));

    // 提交事務，確認更新成功
    await t.commit();

    successResponse(res, {id: id}, '商品刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '商品刪除失敗', 500, error.message);
  }
};

productController.deleteMany = async (req, res, next) => {
  const t = await sequelize.transaction();

  const data = req.body;
  try {    
    const images = await ProductImage.findAll({ 
      where: { 
        product_id: {
          [Op.in]: data.ids, // 使用 Op.in 運算子來匹配多個 ID
        },
      },
      transaction: t // 使用事務
    });
    // 刪除對應的檔案
    await Promise.all(images.map(image => removeFile(image.fileName)));

    await Product.destroy({
      where: {
        id: {
          [Op.in]: data.ids, // 使用 Op.in 運算子來匹配多個 ID
        },
      },
      transaction: t // 使用事務
    });

    // 提交事務，確認創建成功
    await t.commit();

    successResponse(res, {ids: data.ids}, '商品刪除成功', 200);
  } catch (error) {
    // 如果出現錯誤，回朔事務
    if (t) await t.rollback();
    
    console.error(error);
    errorResponse(res, '商品刪除失敗', 500, error.message);
  }
};

module.exports = productController;