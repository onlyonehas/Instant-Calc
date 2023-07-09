const withPWA = require('next-pwa');

/**
 * @type {import('next-pwa').PWAConfig}
 */
const nextConfig = {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    sw: 'service-worker.js',
};

module.exports = withPWA(nextConfig);
