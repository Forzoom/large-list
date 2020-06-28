module.exports = {
    presets: [
        [ "@babel/preset-env", {
            useBuiltIns: "usage",
            corejs: 3
        } ],
        "@babel/preset-typescript"
    ],
    plugins: [
        [ "@babel/plugin-proposal-decorators", { legacy: true } ],
        [ "@babel/plugin-proposal-class-properties" ]
    ]
}