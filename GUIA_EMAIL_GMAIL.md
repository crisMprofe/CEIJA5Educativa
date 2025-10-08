# 🔧 Guía Rápida: Configuración Email Gmail

## ⚡ CONFIGURACIÓN INMEDIATA

1. **Abrir Gmail**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

2. **Generar Contraseña de App**:

   - Aplicación: "Correo"
   - Dispositivo: "Otro" → escribir "CEIJA"
   - **COPIAR** la contraseña de 16 caracteres

3. **Editar `.env`**:

   ```env
   EMAIL_USER=cbmaia@gmail.com
   EMAIL_PASS=tu_contraseña_de_16_caracteres
   ```

4. **Reiniciar Servidor**:
   - Detener servidor (Ctrl+C)
   - `npm run dev`

## 🚨 PROBLEMAS COMUNES:

- **"Acceso menos seguro"**: Ya no funciona, DEBES usar contraseña de aplicación
- **"Verificación en 2 pasos"**: Requerida para contraseñas de aplicación
- **Email incorrecto**: Usar la misma cuenta que genera la contraseña

## 📧 TESTING:

Una vez configurado:

1. Dashboard → Registros Pendientes
2. Clic "📧 Notificar" en cualquier estudiante
3. Revisar logs del servidor para confirmar envío
4. Verificar bandeja de entrada del estudiante

## 🔄 ALTERNATIVA - MODO DEMO:

Si no quieres configurar Gmail ahora, puedo crear un "modo demo" que simule envíos sin servidor real.
