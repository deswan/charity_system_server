'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/api/getActList', controller.home.getActList);
  router.get('/api/getActReviewList', controller.home.getActReviewList);
  router.get('/api/getVolInformation', controller.home.getVolInformation);
  router.get('/api/getOrgList', controller.home.getOrgList);
  router.post('/api/registry', controller.user.registry);
  router.post('/api/login', controller.user.login);
  router.post('/api/uploadPhoto', controller.user.uploadPhoto);
};