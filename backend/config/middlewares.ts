// config/middlewares.js ou .ts
export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:5173',
        'http://10.0.77.1:3000',
        'http://app2.securityone.ai:3000',
        'http://app2.securityone.ai',
        'http://lab.pod2.securityone.ai',
        'http://lab.pod2.securityone.ai:3000',
        'http://app.pod1.securityone.ai/login',
        'http://app.pod1.securityone.ai:3000',
        'http://app.pod1.securityone.ai'
         // quando usar SSL
        
      ],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
