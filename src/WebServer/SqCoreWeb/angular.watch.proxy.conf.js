const PROXY_CONFIG = [
    {
        context: [
            "/hub/",
            "/UserAccount/"
        ],
        target: "http://localhost:5000",
        secure: false,
        "ws": true,
        changeOrigin: true,
        logLevel: "debug"
    }
]

module.exports = PROXY_CONFIG;