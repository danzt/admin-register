const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, "..", "docs", "crear-tabla-users.sql");
const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

// Crear un archivo HTML con el contenido SQL
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>SQL para crear tabla users</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    h1 {
      color: #333;
    }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 10px 0;
      cursor: pointer;
      border-radius: 5px;
    }
    button:hover {
      background-color: #45a049;
    }
    .instructions {
      background-color: #e9f7ef;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .instructions ol {
      margin: 0;
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <h1>SQL para crear la tabla "users" en Supabase</h1>
  
  <div class="instructions">
    <h2>Instrucciones:</h2>
    <ol>
      <li>Copia el siguiente código SQL haciendo clic en el botón "Copiar SQL"</li>
      <li>Abre el <a href="https://app.supabase.com" target="_blank">Dashboard de Supabase</a></li>
      <li>Selecciona tu proyecto</li>
      <li>Ve a SQL Editor en el menú lateral</li>
      <li>Haz clic en "New Query"</li>
      <li>Pega el código SQL que copiaste</li>
      <li>Haz clic en "Run" para ejecutar el código</li>
    </ol>
  </div>

  <button onclick="copyToClipboard()">Copiar SQL</button>
  
  <h3>Código SQL:</h3>
  <pre id="sqlCode">${sqlContent
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>

  <script>
    function copyToClipboard() {
      const sqlCode = document.getElementById('sqlCode').innerText;
      navigator.clipboard.writeText(sqlCode).then(function() {
        alert('SQL copiado al portapapeles!');
      }, function() {
        alert('Error al copiar');
      });
    }
  </script>
</body>
</html>
`;

// Guardar el archivo HTML
const htmlFilePath = path.join(__dirname, "..", "sql-helper.html");
fs.writeFileSync(htmlFilePath, htmlContent);

console.log(
  "Se ha creado un archivo HTML con el SQL para crear la tabla users."
);
console.log(`Ruta del archivo: ${htmlFilePath}`);
console.log("Abriendo el archivo en el navegador...");

// Intentar abrir el archivo en el navegador
try {
  // Detectar el sistema operativo y abrir el archivo según corresponda
  const platform = process.platform;
  if (platform === "darwin") {
    // macOS
    exec(`open "${htmlFilePath}"`);
  } else if (platform === "win32") {
    // Windows
    exec(`start "" "${htmlFilePath}"`);
  } else if (platform === "linux") {
    // Linux
    exec(`xdg-open "${htmlFilePath}"`);
  }

  console.log(
    "Si el archivo no se abre automáticamente, puedes abrirlo manualmente con tu navegador."
  );
} catch (error) {
  console.error("Error al abrir el archivo:", error);
  console.log("Por favor, abre el archivo manualmente en tu navegador.");
}

console.log("\n");
console.log(
  "Después de ejecutar el SQL en Supabase, reinicia tu aplicación e intenta iniciar sesión nuevamente."
);
