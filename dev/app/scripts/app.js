'use strict';

/**
 * @ngdoc overview
 * @name johnPettigrewApp
 * @description
 * # johnPettigrewApp
 *
 * Main module of the application.
 */
angular
  .module('johnPettigrewApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/work', {
        templateUrl: 'views/work.html',
        controller: 'WorkCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/style', {
        templateUrl: 'views/style.html',
        controller: 'StyleCtrl'
      })
      .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
