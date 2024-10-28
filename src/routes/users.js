const router = require('express').Router();
const userController = require('../controllers/user-controller');
const authenticateJWT = require('../middlewares/authenticate-jwt');
const { createRequest, editRequest, deleteRequest } = require('../validators/user-validator');
const validateRequest = require('../middlewares/validate-request');

router.route('/users/login').post(userController.login);

// router.use('/users', authenticateJWT);

router.route('/users')
  .post(createRequest, validateRequest, userController.create) // to create new subordinate resources
  .get(userController.get) // to retrieve resource representation/information only
  .delete(deleteRequest, validateRequest, userController.deleteMany);  // to delete many resources

router.route('/users/:userId')
  .get(userController.getInfo) // to retrieve resource representation/information only
  .put(editRequest, validateRequest, userController.edit) // to update existing resource
  .delete(userController.delete);  // to delete resources

module.exports = router;