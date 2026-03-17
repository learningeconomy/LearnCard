const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    });
});

server.listen(PORT, () => {
    const baseUrl = process.env.PREVIEW_URL || `http://localhost:${PORT}`;

    console.log(`\n🚀 Test app running at ${baseUrl}\n`);
    console.log('To test:');
    console.log(
        `1. Create an app listing with launch_config_json pointing to ${baseUrl}`
    );
    console.log('2. Add a boost to the listing with a boostId like "test-badge"');
    console.log('3. Open the app in LearnCard and click Initialize SDK');
    console.log('4. Use the Send Credential button to test the API\n');
});
