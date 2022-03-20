
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
    console.log(clc.cyan(`--start`), `Start the HTTP server`);
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
const web = http.createServer((request, response) => {
    console.log(`${clc.green('HTTP:')} Client ${clc.cyanBright(request.socket.remoteAddress)} requested URL: ${clc.greenBright(request.url)}`);
    // Get relative and absolute paths
    let cleanPath = request.url.split('?')[0].replace('..', '.');
    let fullPath = path.join(rootDir, cleanPath);
    // Add index.html to the path if it exists and is a directory
    if (fs.existsSync(fullPath)) {
        if (fs.lstatSync(fullPath).isDirectory()) fullPath = path.join(fullPath, 'index.html');
    }
    // If the path still exists, send the file
    if (fs.existsSync(fullPath)) {
        response.setHeader('Content-Type', mime.getType(fullPath));
        response.end(fs.readFileSync(fullPath));
    // Otherwise, respond with 404
    } else {
        response.statusCode = 404;
        response.end();
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