/**
 * Utilidades para manejo de registros sin documentación
 * Sistema de 7 días - Los registros se eliminan automáticamente después de 1 semana
 */

// Inicializar limpieza automática al cargar el módulo
let sistemaInicializado = false;

export const inicializarSistemaLimpieza = () => {
    if (!sistemaInicializado) {
        programarLimpiezaAutomatica();
        limpiarRegistrosVencidos(); // Limpieza inicial
        sistemaInicializado = true;
        console.log('🚀 Sistema de registros sin documentación inicializado (7 días)');
    }
};

// Función para obtener información sobre el estado de documentación
export const obtenerEstadoDocumentacion = (files = {}, previews = {}) => {
    const documentos = [
        "foto", "archivo_dni", "archivo_cuil", "archivo_fichaMedica", 
        "archivo_partidaNacimiento", "archivo_solicitudPase", 
        "archivo_analiticoParcial", "archivo_certificadoNivelPrimario"
    ];
    
    const documentosSubidos = documentos.filter(doc => 
        files[doc] || previews[doc]?.url
    );
    
    const cantidadSubidos = documentosSubidos.length;
    const totalDocumentos = documentos.length;
    const MINIMO_DOCUMENTOS = 4;
    
    if (cantidadSubidos === 0) {
        return {
            completo: false,
            tipo: 'SIN_DOCUMENTACION',
            mensaje: 'Sin documentación - pendiente de registro por 7 días. Pasado el plazo se eliminan los datos.',
            cantidadSubidos: 0,
            documentosSubidos: []
        };
    } else if (cantidadSubidos < MINIMO_DOCUMENTOS) {
        return {
            completo: false,
            tipo: 'DOCUMENTACION_INCOMPLETA',
            mensaje: `Documentación incompleta (${cantidadSubidos}/${totalDocumentos}) - pendiente de registro por 7 días. Pasado el plazo se eliminan los datos.`,
            cantidadSubidos,
            documentosSubidos
        };
    } else {
        return {
            completo: true,
            tipo: 'DOCUMENTACION_COMPLETA',
            mensaje: 'Registro completo con documentación.',
            cantidadSubidos,
            documentosSubidos
        };
    }
};

// Función para verificar si hay documentos adjuntados SUFICIENTES
export const tieneDocumentosAdjuntados = (files = {}, previews = {}) => {
    const documentos = [
        "foto", "archivo_dni", "archivo_cuil", "archivo_fichaMedica", 
        "archivo_partidaNacimiento", "archivo_solicitudPase", 
        "archivo_analiticoParcial", "archivo_certificadoNivelPrimario"
    ];
    
    // Contar documentos adjuntados
    const documentosSubidos = documentos.filter(doc => 
        files[doc] || previews[doc]?.url
    );
    
    const cantidadSubidos = documentosSubidos.length;
    console.log(`📄 Documentos subidos: ${cantidadSubidos}/${documentos.length}`, documentosSubidos);
    
    // Requerir al menos 4 documentos para considerarlo "completo"
    // (esto es configurable según los requerimientos del sistema)
    const MINIMO_DOCUMENTOS = 4;
    
    return cantidadSubidos >= MINIMO_DOCUMENTOS;
};

// Función para guardar datos en archivo JSON local (sin documentación o incompleta)
export const guardarRegistroSinDocumentacion = (datosEstudiante, estadoDocumentacion = null) => {
    try {
        const ahora = new Date();
        const fechaVencimiento = new Date(ahora.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 días (1 semana)
        
        const registro = {
            ...datosEstudiante,
            fechaRegistroSinDocumentacion: ahora.toISOString(),
            fechaVencimiento: fechaVencimiento.toISOString(),
            estado: estadoDocumentacion?.tipo || 'PENDIENTE_7D',
            tipoRegistro: estadoDocumentacion?.tipo || 'SIN_DOCUMENTACION',
            cantidadDocumentosSubidos: estadoDocumentacion?.cantidadSubidos || 0,
            documentosSubidos: estadoDocumentacion?.documentosSubidos || [],
            diasRestantes: 7,
            id: Date.now() // ID único basado en timestamp
        };

        // Obtener registros existentes del localStorage
        const registrosExistentes = JSON.parse(
            localStorage.getItem('registrosSinDocumentacion') || '[]'
        );

        // Limpiar registros vencidos automáticamente antes de agregar el nuevo
        const registrosVigentes = limpiarRegistrosVencidos(registrosExistentes);

        // Agregar nuevo registro
        registrosVigentes.push(registro);

        // Guardar de vuelta en localStorage
        localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosVigentes, null, 2));

        // También crear/actualizar un archivo JSON descargable
        crearArchivoJSONDescargable(registrosVigentes);

        console.log('✅ Registro pendiente guardado (válido por 7 días):', {
            tipo: registro.tipoRegistro,
            documentos: `${registro.cantidadDocumentosSubidos}/8`,
            vencimiento: fechaVencimiento.toLocaleString()
        });
        
        // Programar verificación periódica
        programarLimpiezaAutomatica();
        
        return registro;

    } catch (error) {
        console.error('❌ Error al guardar registro pendiente:', error);
        throw error;
    }
};

// Función para crear un archivo JSON descargable
const crearArchivoJSONDescargable = (registros) => {
    try {
        const contenidoJSON = JSON.stringify(registros, null, 2);
        const blob = new Blob([contenidoJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Crear un enlace temporal para descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `registros-sin-documentacion-${new Date().toISOString().split('T')[0]}.json`;
        
        // Agregar al DOM temporalmente y hacer clic
        document.body.appendChild(link);
        // No descargar automáticamente, solo preparar para descarga manual si se desea
        document.body.removeChild(link);
        
        // Limpiar la URL
        URL.revokeObjectURL(url);
        
        console.log('📄 Archivo JSON preparado para descarga');
    } catch (error) {
        console.error('❌ Error al crear archivo JSON:', error);
    }
};

// Función para limpiar registros vencidos (más de 7 días)
export const limpiarRegistrosVencidos = (registros = null) => {
    try {
        const registrosActuales = registros || obtenerRegistrosSinDocumentacion();
        const ahora = new Date();
        
        const registrosVigentes = registrosActuales.filter(registro => {
            const fechaVencimiento = new Date(registro.fechaVencimiento);
            const estaVigente = ahora < fechaVencimiento;
            
            if (!estaVigente) {
                console.log(`🗑️ Eliminando registro vencido: ${registro.nombre} ${registro.apellido} (DNI: ${registro.dni})`);
            }
            
            return estaVigente;
        });

        // Actualizar localStorage solo si hubo cambios
        if (registrosVigentes.length !== registrosActuales.length) {
            localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosVigentes, null, 2));
            const eliminados = registrosActuales.length - registrosVigentes.length;
            console.log(`🧹 Limpieza automática: ${eliminados} registro(s) vencido(s) eliminado(s)`);
        }

        return registrosVigentes;
    } catch (error) {
        console.error('❌ Error al limpiar registros vencidos:', error);
        return registros || [];
    }
};

// Función para programar limpieza automática
let intervaloLimpieza = null;

export const programarLimpiezaAutomatica = () => {
    // Evitar múltiples intervalos
    if (intervaloLimpieza) {
        clearInterval(intervaloLimpieza);
    }
    
    // Limpiar una vez al día (86400000 ms = 24 horas) - más apropiado para registros de 7 días
    intervaloLimpieza = setInterval(() => {
        limpiarRegistrosVencidos();
    }, 86400000); // 24 horas
    
    console.log('⏲️ Limpieza automática programada cada 24 horas');
};

// Función para detener la limpieza automática
export const detenerLimpiezaAutomatica = () => {
    if (intervaloLimpieza) {
        clearInterval(intervaloLimpieza);
        intervaloLimpieza = null;
        console.log('⏹️ Limpieza automática detenida');
    }
};

// Función para obtener información de vencimiento
export const obtenerInfoVencimiento = (registro) => {
    const ahora = new Date();
    const vencimiento = new Date(registro.fechaVencimiento);
    const msRestantes = vencimiento.getTime() - ahora.getTime();
    
    if (msRestantes <= 0) {
        return { vencido: true, diasRestantes: 0, mensaje: 'VENCIDO' };
    }
    
    const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
    const horasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60));
    
    let mensaje;
    if (diasRestantes > 1) {
        mensaje = `${diasRestantes} días restantes`;
    } else if (diasRestantes === 1) {
        mensaje = `1 día restante`;
    } else {
        mensaje = `${horasRestantes}h restantes`;
    }
    
    return { 
        vencido: false, 
        diasRestantes, 
        horasRestantes,
        mensaje,
        fechaVencimiento: vencimiento.toLocaleString()
    };
};

// Función para descargar manualmente el archivo JSON
export const descargarRegistrosJSON = () => {
    try {
        const registros = obtenerRegistrosSinDocumentacion();
        
        if (registros.length === 0) {
            alert('No hay registros sin documentación para descargar.');
            return;
        }

        const contenidoJSON = JSON.stringify(registros, null, 2);
        const blob = new Blob([contenidoJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `registros-sin-documentacion-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        console.log(`📥 Descargado archivo con ${registros.length} registros`);
        return true;
    } catch (error) {
        console.error('❌ Error al descargar archivo JSON:', error);
        return false;
    }
};

// Función para obtener todos los registros sin documentación (con limpieza automática)
export const obtenerRegistrosSinDocumentacion = () => {
    try {
        const registros = JSON.parse(localStorage.getItem('registrosSinDocumentacion') || '[]');
        // Automáticamente limpiar vencidos cada vez que se consulte
        return limpiarRegistrosVencidos(registros);
    } catch (error) {
        console.error('❌ Error al obtener registros sin documentación:', error);
        return [];
    }
};

// Función para limpiar registros antiguos (opcional)
export const limpiarRegistrosAntiguos = (diasAntigüedad = 7) => {
    try {
        const registros = obtenerRegistrosSinDocumentacion();
        const fechaCorte = new Date();
        fechaCorte.setDate(fechaCorte.getDate() - diasAntigüedad);

        const registrosFiltrados = registros.filter(registro => {
            const fechaRegistro = new Date(registro.fechaRegistroSinDocumentacion);
            return fechaRegistro >= fechaCorte;
        });

        localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosFiltrados, null, 2));
        console.log(`🧹 Limpieza completada. Registros mantenidos: ${registrosFiltrados.length}`);
        
        return registrosFiltrados;
    } catch (error) {
        console.error('❌ Error al limpiar registros antiguos:', error);
        return [];
    }
};

// Función para verificar si existe un registro pendiente para un DNI específico
export const verificarRegistroPendiente = (dni) => {
    try {
        if (!dni) return null;
        
        const registros = obtenerRegistrosSinDocumentacion();
        const registro = registros.find(r => r.dni === dni);
        
        if (registro) {
            console.log(`🔍 Registro pendiente encontrado para DNI ${dni}:`, {
                tipo: registro.tipoRegistro,
                vencimiento: new Date(registro.fechaVencimiento).toLocaleString()
            });
        }
        
        return registro || null;
    } catch (error) {
        console.error('❌ Error al verificar registro pendiente:', error);
        return null;
    }
};

// Función para eliminar un registro pendiente específico por DNI
export const eliminarRegistroPendiente = (dni) => {
    try {
        if (!dni) return false;
        
        const registros = obtenerRegistrosSinDocumentacion();
        const registrosFiltrados = registros.filter(r => r.dni !== dni);
        
        if (registrosFiltrados.length < registros.length) {
            localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosFiltrados, null, 2));
            console.log(`🗑️ Registro pendiente eliminado para DNI ${dni}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error al eliminar registro pendiente:', error);
        return false;
    }
};

// Función para actualizar un registro pendiente con nueva información
export const actualizarRegistroPendiente = (dni, nuevosDatos) => {
    try {
        if (!dni) return null;
        
        const registros = obtenerRegistrosSinDocumentacion();
        const indiceRegistro = registros.findIndex(r => r.dni === dni);
        
        if (indiceRegistro !== -1) {
            // Mantener datos importantes del registro original
            const registroOriginal = registros[indiceRegistro];
            const registroActualizado = {
                ...registroOriginal,
                ...nuevosDatos,
                fechaActualizacion: new Date().toISOString(),
                // Mantener fechas originales de vencimiento
                fechaRegistroSinDocumentacion: registroOriginal.fechaRegistroSinDocumentacion,
                fechaVencimiento: registroOriginal.fechaVencimiento
            };
            
            registros[indiceRegistro] = registroActualizado;
            localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registros, null, 2));
            
            console.log(`✅ Registro pendiente actualizado para DNI ${dni}`);
            return registroActualizado;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error al actualizar registro pendiente:', error);
        return null;
    }
};