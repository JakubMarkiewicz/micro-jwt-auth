'use strict'

const url = require('url')
const jwt = require('jsonwebtoken')

module.exports = exports = (secret, whitelist, config = {}) => fn => {
    if (!secret) {
        throw Error('micro-jwt-auth must be initialized passing a secret to decode incoming JWT token')
    }

    if (!Array.isArray(whitelist)) {
        config = whitelist || {}
    }

    return (req, res) => {
        const bearerToken = req.headers.authorization
        const pathname = url.parse(req.url).pathname
        const whiteList = Array.isArray(whitelist)
            ? whitelist.find(v => (Array.isArray(v) ? v[0] === pathname : v === pathname)) || []
            : []
        const pathConfig = Array.isArray(whiteList[0]) ? whiteList[0][1] : {}
        const method = pathConfig.method ? pathConfig.method === req.method : true
        if (!bearerToken && (!whiteList[0] || !method)) {
            res.writeHead(401)
            res.end(config.resAuthMissing || 'missing Authorization header')
            return
        }

        try {
            const token = bearerToken.replace('Bearer ', '')
            req.jwt = jwt.verify(token, secret)
        } catch (err) {
            if (!whiteList[0] || !method) {
                res.writeHead(401)
                res.end(config.resAuthInvalid || 'invalid token in Authorization header')
                return
            }
        }

        return fn(req, res)
    }
}
