const config = {
    db: {
        host: process.env.DB_HOST || 'db',
        name: process.env.DB_NAME || 'printing_gift',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '12345678',
        port: process.env.DB_PORT || '3306',
        dialect: process.env.DB_DIALECT || 'mysql'
    },
    app: {
        port: process.env.port || '3005',
        clientHost: process.env.CLIENT_HOST || 'http://localhost:3000',
    },
};

module.exports = config;