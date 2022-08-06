
const http = require('http');
const fs = require('fs');
const mime = require('mime');
const clc = require('cli-color');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const setTitle = require('node-bash-title');
setTitle('PortableHTTP');

// Returns the executable directory depending on if we're running the
// executable or source JS file
function execDir() {
    if (typeof process.pkg === 'undefined')
        return __dirname;
    else
        return process.cwd();
}

if (args.help) {
    console.log(clc.white(`PortableHTTP Help:`));
    console.log(clc.cyan(`--help`), `Display this message`);
    console.log(clc.cyan(`--port`), clc.cyanBright(`<port>`), `Listen on this port (defaults to 8080)`);
    console.log(clc.cyan(`--dir`), clc.cyanBright(`<directory>`), `Use this directory as the server's document root (defaults to the executable's directory)`);
    process.exit();
}

// Get port
let port = 8080;
let isCustomPort = false;
if (args.port) {
    if (args.port > 0 && args.port < 65535) {
        port = args.port;
        isCustomPort = true;
    } else {
        console.log(clc.redBright(`Your port needs to be between 0 and 65535`));
        process.exit();
    }
}

// Get root directory
let rootDir = execDir();
if (args.dir) {
    if (fs.existsSync(args.dir) && fs.lstatSync(args.dir).isDirectory()) {
        rootDir = args.dir;
    } else {
        console.log(clc.redBright(`That directory either doesn't exist or isn't a directory`));
        process.exit();
    }
}
console.log(`Document root: ${clc.greenBright(rootDir)}`);

// Create the webserver
const web = http.createServer((req, res) => {
    // Log the request
    console.log(clc.cyanBright(req.socket.remoteAddress), clc.yellowBright(req.method), clc.greenBright(req.url));
    // Get relative and absolute paths
    const reqPath = path.normalize(req.url.split('?')[0]);
    const reqPathFull = path.join(rootDir, reqPath);
    // Add index.html to the path if it exists and is a directory
    if (fs.existsSync(reqPathFull)) {
        if (fs.lstatSync(reqPathFull).isDirectory()) reqPathFull = path.join(reqPathFull, 'index.html');
    }
    // If the path still exists, send the file
    if (fs.existsSync(reqPathFull)) {
        res.setHeader('Content-Type', mime.getType(reqPathFull));
        res.end(fs.readFileSync(reqPathFull));
    // Otherwise, respond with 404
    } else {
        res.statusCode = 404;
        res.end();
    }
});

web.listen(port);
web.on('listening', () => {
    console.log(`HTTP server is listening on port ${clc.cyanBright(port)}`);
    setTitle(`PortableHTTP - Listening on port ${port}`);
});
web.on('error', (err) => {
    console.log(clc.redBright(err.message));
    console.log(`See ${clc.cyan(`--help`)} for command help`);
    process.exit();
});