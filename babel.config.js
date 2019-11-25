module.exports = {
    presets: [
        [ "@babel/preset-env", {
            useBuiltIns: "false",
            corejs: 2
        } ],
        "@babel/preset-typescript"
    ],
    plugins: [
        [ "@babel/plugin-proposal-decorators", { legacy: true } ],
        [ "@babel/plugin-proposal-class-properties" ]
    ]
}