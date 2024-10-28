const router = require('express').Router();
const categoryController = require('../controllers/category-controller');
const authenticateJWT = require('../middlewares/authenticate-jwt');
const { createRequest, editRequest, deleteRequest } = require('../validators/category-validator');
const validateRequest = require('../middlewares/validate-request');

// router.use('/categories', authenticateJWT);

router.route('/categories')
  .post(createRequest, validateRequest, categoryController.create) // to create new subordinate resources
  .get(categoryController.get) // to retrieve resource representation/information only
  .delete(deleteRequest, validateRequest, categoryController.deleteMany);  // to delete many resources

router.route('/categories/:categoryId')
  .get(categoryController.getInfo) // to retrieve resource representation/information only
  .put(editRequest, validateRequest, categoryController.edit) // to update existing resource
  .delete(categoryController.delete);  // to delete resources

module.exports = router;