const router = require('express').Router();
const productController = require('../controllers/product-controller');
const authenticateJWT = require('../middlewares/authenticate-jwt');
const { createRequest, editRequest, deleteRequest } = require('../validators/product-validator');
const validateRequest = require('../middlewares/validate-request');
const multer = require('multer');
const path = require('path');

// 設定上傳目錄和檔案命名
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // 儲存到專案的 uploads 資料夾
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // 確保文件名稱唯一
  }
});

// Multer 設定
const upload = multer({
  storage: storage
});
  
// router.use('/products', authenticateJWT);

router.route('/products')
  .post(upload.fields([
    { name: 'mainImage', maxCount: 1 }, // 主要圖片
    { name: 'images', maxCount: 10 } // 最多 10 張次要圖片
  ]), createRequest, validateRequest, productController.create) // to create new subordinate resources
  .get(productController.get) // to retrieve resource representation/information only
  .delete(deleteRequest, validateRequest, productController.deleteMany);  // to delete many resources

router.route('/products/:productId')
  .get(productController.getInfo) // to retrieve resource representation/information only
  .put(upload.fields([
    { name: 'mainImage', maxCount: 1 }, // 主要圖片
    { name: 'images', maxCount: 10 } // 最多 10 張次要圖片
  ]), editRequest, validateRequest, productController.edit) // to update existing resource
  .delete(productController.delete);  // to delete resources

module.exports = router;