module.exports = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') { return new Error('The server refused the connection'); }
        if (options.total_retry_time > 1000 * 60 * 60) { return new Error('Retry time exhausted'); }
        if (options.attempt > 10) { return new Error('Retry failed'); }
        return Math.min(options.attempt * 100, 3000);
    }
}