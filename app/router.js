'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const adminauth = app.middlewares.adminauth({},app);
  router.get('/api/getActList', controller.home.getActList);
  router.get('/api/getCurrentActTags', controller.home.getCurrentActTags);
  router.get('/api/getActReviewList', controller.home.getActReviewList);
  router.get('/api/getVolInformation', controller.home.getVolInformation);
  router.get('/api/getOrgList', controller.home.getOrgList);
  router.post('/api/registry', controller.user.registry);
  router.post('/api/login', controller.user.login);
  router.post('/api/uploadPhoto', controller.user.uploadPhoto);
  router.get('/api/getActivityById', controller.home.getActivityById);
  router.get('/api/getOrgById', controller.home.getOrgById);
  router.get('/api/getUser', controller.user.getUser);
  router.get('/api/getOrgTags', controller.home.getOrgTags);
  router.get('/api/getMyActs', controller.user.getMyActs);
  router.get('/api/getMyOrgById', controller.user.getMyOrgById);
  
  router.get('/api/getActListBelongToOrg',adminauth, controller.admin.getActListBelongToOrg);
  router.post('/api/createAct', controller.admin.createAct);
  router.get('/api/getTodos', controller.admin.getTodos);
  router.get('/api/getVolList', controller.admin.getVolList);
  router.get('/api/getAllTags', controller.admin.getAllTags);
  router.get('/api/getOrgProfileById', controller.admin.getOrgProfileById);
  router.post('/api/updateOrgProfile', controller.admin.updateOrg);
  router.post('/api/updateActProfile', controller.admin.updateAct);
  router.post('/api/updateApplication', controller.admin.updateApplication);
  router.get('/api/getNotice', controller.user.getNotice);
  router.post('/api/applyAct', controller.user.applyAct);
  router.get('/api/getActByIdInAdmin', controller.admin.getActById);
  router.post('/api/quitAct', controller.user.quitAct);
  router.post('/api/cancelAct', adminauth,controller.admin.cancelAct);
  router.post('/api/sponsor', controller.home.sponsor);
  router.post('/api/score', controller.user.score);
  router.get('/api/logout', controller.user.logout);
  router.post('/api/createOrg', controller.user.createOrg);
};
