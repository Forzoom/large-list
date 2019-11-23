const rollup = require('rollup');
const builds = require('./config.js');

function build(builds) {
    let built = 0;
    const total = builds.length;
    const next = () => {
        buildEntry(builds[built]).then(() => {
            built++;
            if (built < total) {
                next();
            }
        }).catch(logError);
    }

    next();
}

function buildEntry(config) {
    const output = config.output;
    return rollup.rollup(config)
        .then(bundle => bundle.write(output));
}

function logError (e) {
    console.log(e);
}

build(builds);