// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { join } from 'path';
import { readFileSync } from 'fs';

import { enableProdMode } from '@angular/core';
import * as Fastify from 'fastify';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

const t = require('tap');
const test = t.test;

const DIST_FOLDER = join(process.cwd(), 'dist');

const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main.bundle');
const { provideModuleMap } = require('@nguniversal/module-map-ngfactory-loader');
const template = readFileSync(join(DIST_FOLDER, 'browser', 'index.html')).toString();

test('should return an html document', t => {
  t.plan(6);

  const fastify = Fastify();

  // just for the sake of preventing errors associated with static assets like css and js
  fastify.register(require('fastify-static'), {
    root: join(DIST_FOLDER, 'browser'),
    prefix: '/static/'
  });

  fastify.register(require('fastify-angular-universal'), {
    serverModule: AppServerModuleNgFactory,
    document: template,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  });

  // Declare a route
  fastify.get('/*', function (request, reply) {
    (reply as any).renderNg(request.req.url);
  });

  // retrieve the homepage
  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.equal(res.statusCode, 200);
    t.equal(res.headers['content-type'], 'text/html');
  });

  // retrieve the about page
  fastify.inject({
    url: '/about',
    method: 'GET'
  }, (err, res) => {
    t.equal(res.statusCode, 200);
    t.equal(res.headers['content-type'], 'text/html');
  });

  // retrieve the contact-us page
  fastify.inject({
    url: '/contact-us',
    method: 'GET'
  }, (err, res) => {
    t.equal(res.statusCode, 200);
    t.equal(res.headers['content-type'], 'text/html');
  });
});

test('should throw if serverModule option is not provided', t => {
  t.plan(3);

  const fastify = Fastify();

  // just for the sake of preventing errors associated with static assets like css and js
  fastify.register(require('fastify-static'), {
    root: join(DIST_FOLDER, 'browser'),
    prefix: '/static/'
  });

  fastify.register(require('fastify-angular-universal'), {
    document: template,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  });

  // Declare a route
  fastify.get('/*', function (request, reply) {
    (reply as any).renderNg(request.req.url);
  });

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    const payload = JSON.parse(res.payload);

    t.equal(res.statusCode, 500);
    t.equal(res.statusMessage, 'Internal Server Error');
    t.equal(payload.message, 'Missing Angular Server module to render.');
  });
});

test('should throw if document option is not provided', t => {
  t.plan(3);

  const fastify = Fastify();

  // just for the sake of preventing errors associated with static assets like css and js
  fastify.register(require('fastify-static'), {
    root: join(DIST_FOLDER, 'browser'),
    prefix: '/static/'
  });

  fastify.register(require('fastify-angular-universal'), {
    serverModule: AppServerModuleNgFactory,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  });

  // Declare a route
  fastify.get('/*', function (request, reply) {
    (reply as any).renderNg(request.req.url);
  });

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    const payload = JSON.parse(res.payload);

    t.equal(res.statusCode, 500);
    t.equal(res.statusMessage, 'Internal Server Error');
    t.equal(payload.message, 'Missing template where the Angular app will be rendered.');
  });
});


