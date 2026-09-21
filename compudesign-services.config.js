module.exports = {
  apps: [
    {
      name        : 'compudesign-productos',
      script      : './services/productos/server.js',
      instances   : 1,
      autorestart : true,
      watch       : false,
      max_memory_restart: '200M',
      env: {
        PRODUCTS_PORT: 3001,
        NODE_ENV     : 'production'
      }
    },
    {
      name        : 'compudesign-usuarios',
      script      : './services/usuarios/server.js',
      instances   : 1,
      autorestart : true,
      watch       : false,
      max_memory_restart: '200M',
      env: {
        USERS_PORT   : 3002,
        NODE_ENV     : 'production'
      }
    },
    {
      name        : 'compudesign-pedidos',
      script      : './services/pedidos/server.js',
      instances   : 1,
      autorestart : true,
      watch       : false,
      max_memory_restart: '200M',
      env: {
        ORDERS_PORT         : 3003,
        PRODUCTS_SERVICE_URL: 'http://localhost:3001',
        NODE_ENV            : 'production'
      }
    },
    {
      name        : 'compudesign-soporte',
      script      : './services/soporte/server.js',
      instances   : 1,
      autorestart : true,
      watch       : false,
      max_memory_restart: '200M',
      env: {
        SUPPORT_PORT: 3004,
        NODE_ENV    : 'production'
      }
    }
  ]
};
