const path = require('node:path');
const ejs = require('ejs');

function render(res, viewName, data = {}, statusCode = 200) {
    const filePath = path.join(__dirname, '..', '..', 'view', 'pages', '${viewName}.ejs')

    ejs.renderFile(filePath, data, (err, html) => {
        if (err) {
            console.error('Erreur lors du rendu EJS :', err);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - Erreur interne du serveur</h1>');
            return;
        }
        res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    })
}
module.exports = { render };
