const router = require('express').Router();
const memberController = require('../controllers/member-controller');
const authenticateJWT = require('../middlewares/authenticate-jwt');
const { createRequest, editRequest, deleteRequest } = require('../validators/member-validator');
const validateRequest = require('../middlewares/validate-request');

router.route('/members/register').post(memberController.register);
router.route('/members/login').post(memberController.login);

// router.use('/members', authenticateJWT);

router.route('/members')
  .post(createRequest, validateRequest, memberController.create) // to create new subordinate resources
  .get(memberController.get) // to retrieve resource representation/information only
  .delete(deleteRequest, validateRequest, memberController.deleteMany);  // to delete many resources

router.route('/members/:memberId')
  .get(memberController.getInfo) // to retrieve resource representation/information only
  .put(editRequest, validateRequest, memberController.edit) // to update existing resource
  .delete(memberController.delete);  // to delete resources

module.exports = router;