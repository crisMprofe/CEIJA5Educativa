# 📧 Configuración del Sistema de Emails

## 🔧 Variables de Entorno Requeridas

Edita el archivo `.env` y configura las siguientes variables:

### Configuración SMTP (Gmail ejemplo)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

### Configuración Institucional

```env
INSTITUCION_NOMBRE=CEIJA
INSTITUCION_EMAIL=info@ceija.edu.ar
INSTITUCION_TELEFONO=+54-351-XXXXXXX
INSTITUCION_DIRECCION=Córdoba, Argentina
```

## 🛠️ Configuración por Proveedor

### Gmail:

1. Activar autenticación de 2 factores
2. Generar contraseña de aplicación en: https://myaccount.google.com/apppasswords
3. Usar la contraseña generada en `EMAIL_PASS`

### Outlook/Hotmail:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_USER=tu_email@outlook.com
EMAIL_PASS=tu_password
```

### Yahoo:

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
EMAIL_USER=tu_email@yahoo.com
EMAIL_PASS=tu_password
```

## 🧪 Prueba de Configuración

1. Configurar las variables en `.env`
2. Reiniciar el servidor backend
3. Desde el dashboard, ir a "Registros Pendientes"
4. Probar enviando un email individual
5. Verificar los logs del servidor para errores

## 📋 Tipos de Notificaciones

- **📧 Individual**: Envía a un estudiante específico
- **📧 Todos**: Envía a todos los estudiantes pendientes
- **⚡ Urgentes**: Solo a estudiantes próximos a vencer (menos de 3 días)

## 🚨 Solución de Problemas

### Error "Authentication failed":

- Verificar credenciales SMTP
- Para Gmail: usar contraseña de aplicación, no la contraseña normal

### Error "Connection timeout":

- Verificar SMTP_HOST y SMTP_PORT
- Revisar firewall/antivirus

### Emails no llegan:

- Revisar carpeta de spam
- Verificar que EMAIL_USER tenga permisos para enviar
