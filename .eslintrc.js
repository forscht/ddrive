module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "jest": true
    },
    "extends": [
        "airbnb-base",
    ],
    "plugins": [
        "import",
    ],
    "rules": {
        "newline-before-return": "error",
        "consistent-return": "error",
        "no-else-return": ["error", {"allowElseIf": false}],
        "class-methods-use-this": "off",
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "semi": ["error", "never"],
        "no-multiple-empty-lines": ["error", {"max": 1}],
        "max-len": "off",
        'new-cap': ["error", {
            "newIsCap": false,
            "capIsNew": false,
            "properties": true
        }],
        "padded-blocks": ["error","never", {"allowSingleLineBlocks": true}],
        "quotes": ["error", "single", {
            "avoidEscape" : true,
            "allowTemplateLiterals": true
        } ],
        "prefer-const": "error",
    }
}
