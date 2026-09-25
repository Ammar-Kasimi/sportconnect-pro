const path = require('node:path');
const ejs = require('ejs');

function render(res, viewName, data = {}, statusCode = 200) {
    const cleanView = viewName.endsWith('.ejs') ? viewName : `${viewName}.ejs`;
const filePath = path.join(__dirname, '..', '..', 'views', cleanView);
    ejs.renderFile(filePath, data, (err, html) => {
        if (err) {
            console.error('Erreur lors du rendu EJS :', err);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - Erreur interne du serveur</h1>');
            return;
        }
        res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    });
}

function sendError(res, statusCode, message = "Une erreur est survenue.") {
    render(res, 'pages/error.ejs', { statusCode, message }, statusCode);
}

module.exports = { render, sendError };