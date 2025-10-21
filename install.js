#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Instalador del Sistema de Muebles con IA\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function installDependencies() {
  console.log('📦 Instalando dependencias del backend...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias del backend instaladas\n');
  } catch (error) {
    console.error('❌ Error instalando dependencias del backend:', error.message);
    process.exit(1);
  }

  console.log('📦 Instalando dependencias del frontend...');
  try {
    execSync('cd frontend && npm install', { stdio: 'inherit', shell: true });
    console.log('✅ Dependencias del frontend instaladas\n');
  } catch (error) {
    console.error('❌ Error instalando dependencias del frontend:', error.message);
    process.exit(1);
  }
}

async function setupEnvironment() {
  console.log('⚙️  Configurando variables de entorno...\n');

  // Backend environment
  const backendEnv = await setupBackendEnv();
  fs.writeFileSync('.env', backendEnv);
  console.log('✅ Archivo .env del backend creado\n');

  // Frontend environment
  const frontendEnv = await setupFrontendEnv();
  fs.writeFileSync('frontend/.env.local', frontendEnv);
  console.log('✅ Archivo .env.local del frontend creado\n');
}

async function setupBackendEnv() {
  console.log('🔧 Configuración del Backend:\n');

  const port = await question('Puerto del servidor (3000): ') || '3000';
  const nodeEnv = await question('Entorno (development/production) [development]: ') || 'development';
  
  console.log('\n📡 Configuración de Xano:');
  const xanoUrl = await question('URL de Xano API: ');
  const xanoKey = await question('Clave API de Xano: ');
  
  console.log('\n🔐 Configuración JWT:');
  const jwtSecret = await question('JWT Secret (generado automáticamente si se deja vacío): ') || generateRandomString(64);
  const jwtRefreshSecret = await question('JWT Refresh Secret (generado automáticamente si se deja vacío): ') || generateRandomString(64);
  
  console.log('\n📧 Configuración de Email:');
  const smtpHost = await question('SMTP Host (smtp.gmail.com): ') || 'smtp.gmail.com';
  const smtpPort = await question('SMTP Port (587): ') || '587';
  const smtpUser = await question('SMTP User (email): ');
  const smtpPass = await question('SMTP Password: ');
  const smtpFromName = await question('Nombre del remitente (Sistema de Muebles): ') || 'Sistema de Muebles';
  const smtpFromEmail = await question('Email del remitente: ') || smtpUser;
  
  console.log('\n🤖 Configuración de IA (opcional):');
  const iaProvider = await question('Proveedor de IA (openai/huggingface/replicate) [openai]: ') || 'openai';
  const iaApiKey = await question('Clave API de IA (opcional): ');
  const iaApiUrl = await question('URL API de IA [https://api.openai.com/v1]: ') || 'https://api.openai.com/v1';
  
  const frontendUrl = await question('URL del frontend [http://localhost:8080]: ') || 'http://localhost:8080';

  return `# Configuración del servidor
PORT=${port}
NODE_ENV=${nodeEnv}

# Configuración de Xano API
XANO_API_URL=${xanoUrl}
XANO_API_KEY=${xanoKey}

# Configuración JWT
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_REFRESH_EXPIRES_IN=7d

# Configuración CORS
CORS_ORIGIN=${frontendUrl}

# Configuración de correo electrónico (SMTP)
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_SECURE=false
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
SMTP_FROM_NAME=${smtpFromName}
SMTP_FROM_EMAIL=${smtpFromEmail}

# Configuración de IA
IA_API_KEY=${iaApiKey}
IA_API_URL=${iaApiUrl}
IA_PROVIDER=${iaProvider}

# URL del frontend
FRONTEND_URL=${frontendUrl}

# Configuración de archivos
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Configuración de logs
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;
}

async function setupFrontendEnv() {
  console.log('\n🎨 Configuración del Frontend:\n');

  const apiUrl = await question('URL de la API [http://localhost:3000/api]: ') || 'http://localhost:3000/api';
  const appName = await question('Nombre de la aplicación [Sistema de Muebles]: ') || 'Sistema de Muebles';
  const appUrl = await question('URL de la aplicación [http://localhost:8080]: ') || 'http://localhost:8080';

  return `# URL base de la API del backend
VITE_API_BASE_URL=${apiUrl}

# Nombre de la aplicación
VITE_APP_NAME=${appName}

# Descripción de la aplicación
VITE_APP_DESCRIPTION=Sistema de venta de muebles con recomendaciones de IA

# Versión de la aplicación
VITE_APP_VERSION=1.0.0

# URL del sitio web
VITE_APP_URL=${appUrl}

# Configuración de desarrollo
VITE_DEV_MODE=true

# Configuración de logs en desarrollo
VITE_LOG_LEVEL=debug

# Configuración de cache
VITE_CACHE_ENABLED=true
VITE_CACHE_DURATION=300000

# Configuración de paginación
VITE_DEFAULT_PAGE_SIZE=12
VITE_MAX_PAGE_SIZE=50

# Configuración de archivos
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Configuración de notificaciones
VITE_TOAST_DURATION=5000
VITE_TOAST_POSITION=top-right

# Configuración de la IA
VITE_AI_ENABLED=true
VITE_AI_MAX_RECOMMENDATIONS=10
`;
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createDirectories() {
  console.log('📁 Creando directorios necesarios...');
  
  const directories = [
    'uploads',
    'logs',
    'frontend/dist'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Directorio creado: ${dir}`);
    }
  });
  
  console.log('');
}

async function buildFrontend() {
  const shouldBuild = await question('¿Construir el frontend para producción? (y/N): ');
  
  if (shouldBuild.toLowerCase() === 'y' || shouldBuild.toLowerCase() === 'yes') {
    console.log('🏗️  Construyendo frontend...');
    try {
      execSync('cd frontend && npm run build', { stdio: 'inherit', shell: true });
      console.log('✅ Frontend construido exitosamente\n');
    } catch (error) {
      console.error('❌ Error construyendo el frontend:', error.message);
    }
  }
}

async function showNextSteps() {
  console.log('🎉 ¡Instalación completada!\n');
  console.log('📋 Próximos pasos:\n');
  console.log('1. Configura tu instancia de Xano con las tablas necesarias');
  console.log('2. Verifica las variables de entorno en .env y frontend/.env.local');
  console.log('3. Para desarrollo:');
  console.log('   - Backend: npm run dev');
  console.log('   - Frontend: cd frontend && npm run dev');
  console.log('4. Para producción:');
  console.log('   - npm start (backend)');
  console.log('   - Servir frontend/dist con un servidor web\n');
  console.log('📚 Documentación disponible en:');
  console.log('   - README.md');
  console.log('   - docs/API.md\n');
  console.log('🆘 Soporte: contacto@muebles.com\n');
}

async function main() {
  try {
    await installDependencies();
    await setupEnvironment();
    await createDirectories();
    await buildFrontend();
    await showNextSteps();
  } catch (error) {
    console.error('❌ Error durante la instalación:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Verificar Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Este proyecto requiere Node.js 16 o superior');
  console.error(`   Versión actual: ${nodeVersion}`);
  console.error('   Descarga la última versión desde: https://nodejs.org/');
  process.exit(1);
}

main();