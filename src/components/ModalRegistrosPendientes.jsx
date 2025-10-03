import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import CloseButton from './CloseButton';
import { obtenerRegistrosSinDocumentacion, limpiarDuplicadosManualmente, verificarDuplicados, testearSistema7Dias } from '../utils/registroSinDocumentacion';
import registrosPendientesService from '../services/serviceRegistrosPendientes';
import { obtenerDocumentosRequeridos } from '../utils/registroSinDocumentacion';
import { useGlobalAlerts } from '../hooks/useGlobalAlerts';
import '../estilos/modalM.css';
import '../estilos/botones.css';
import '../estilos/ModalRegistrosPendientes.css';

const ModalRegistrosPendientes = ({ onClose }) => {
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning, confirmAction } = useGlobalAlerts();
    const [registros, setRegistros] = useState([]);
    const [mensajeEmail, setMensajeEmail] = useState('');
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [estadoDuplicados, setEstadoDuplicados] = useState(null);
    const [cargandoRegistros, setCargandoRegistros] = useState(false);
    const [limpiandoDuplicados, setLimpiandoDuplicados] = useState(false);

    // Función para recargar registros
    const recargarRegistros = async () => {
        try {
            console.log('🔄 Recargando registros pendientes desde servidor...');
            setMensajeEmail('Actualizando lista de registros...');
            
            // Obtener registros actualizados del servidor
            const registrosActualizados = await registrosPendientesService.obtenerRegistrosPendientes();
            console.log('📋 Registros actualizados:', registrosActualizados);
            
            // Comparar con la lista anterior para detectar cambios
            const registrosAnteriores = registros.length;
            const registrosNuevos = registrosActualizados.length;
            
            setRegistros(registrosActualizados);
            
            if (registrosNuevos < registrosAnteriores) {
                const diferencia = registrosAnteriores - registrosNuevos;
                setMensajeEmail(`✅ Lista actualizada - ${diferencia} registro${diferencia > 1 ? 's' : ''} procesado${diferencia > 1 ? 's' : ''}`);
            } else if (registrosNuevos === registrosAnteriores) {
                setMensajeEmail('✅ Lista actualizada - sin cambios');
            } else {
                setMensajeEmail('✅ Lista actualizada - nuevos registros pendientes');
            }
            
            setTimeout(() => setMensajeEmail(''), 3000);
            
        } catch (error) {
            console.error('❌ Error al recargar registros:', error);
            setMensajeEmail(`❌ Error al actualizar: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función auxiliar para verificar y limpiar registros completados
    const verificarYLimpiarRegistrosCompletados = async () => {
        try {
            // Obtener registros actuales del localStorage
            const registrosActuales = obtenerRegistrosSinDocumentacion();
            const idsActuales = new Set(registrosActuales.map(r => r.id));
            
            // Filtrar registros locales para mantener solo los que siguen pendientes
            setRegistros(prevRegistros => {
                const registrosFiltrados = prevRegistros.filter(r => idsActuales.has(r.id));
                
                if (registrosFiltrados.length !== prevRegistros.length) {
                    const eliminados = prevRegistros.length - registrosFiltrados.length;
                    console.log(`🧹 Limpiados ${eliminados} registro(s) completado(s) de la lista local`);
                }
                
                return registrosFiltrados;
            });
            
        } catch (error) {
            console.error('Error al verificar registros completados:', error);
        }
    };

    // Cargar registros desde el archivo JSON del backend
    useEffect(() => {
        const cargarRegistrosPendientes = async () => {
            try {
                setCargandoRegistros(true);
                console.log('🔄 Cargando registros pendientes desde archivo JSON...');
                
                // Obtener registros del archivo JSON del backend
                const registrosBackend = await registrosPendientesService.obtenerRegistrosPendientes();
                console.log('📋 Registros desde backend:', registrosBackend);
                
                setRegistros(registrosBackend);
                setMensajeEmail('✅ Registros cargados exitosamente desde servidor');
                setTimeout(() => setMensajeEmail(''), 2000);
                
                // Verificación automática de duplicados al cargar
                setTimeout(() => {
                    verificarEstadoDuplicados();
                }, 500);
                
            } catch (error) {
                console.error('❌ Error al cargar registros:', error);
                setMensajeEmail(`❌ Error al cargar registros: ${error.message}`);
                
                // Si falla, establecer array vacío
                setRegistros([]);
                setMensajeEmail('⚠️ No se pudieron cargar registros');
                setTimeout(() => setMensajeEmail(''), 3000);
            } finally {
                setCargandoRegistros(false);
            }
        };

        cargarRegistrosPendientes();

        // Configurar intervalo para verificar registros completados cada 30 segundos
        const intervalo = setInterval(() => {
            verificarYLimpiarRegistrosCompletados();
        }, 30000);

        return () => clearInterval(intervalo);
    }, []);

    const obtenerInfoVencimiento = (registro) => {
        const ahora = new Date();
        
        // Calcular vencimiento: 7 días desde el timestamp
        const fechaRegistro = new Date(registro.timestamp);
        const vencimiento = new Date(fechaRegistro.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 días
        
        const msRestantes = vencimiento.getTime() - ahora.getTime();
        
        if (msRestantes <= 0) {
            return { vencido: true, diasRestantes: 0, mensaje: 'VENCIDO', color: '#dc3545' };
        }
        
        const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
        const horasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60));
        
        let mensaje, color;
        if (diasRestantes > 3) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#28a745'; // Verde
        } else if (diasRestantes > 1) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#ffc107'; // Amarillo
        } else if (diasRestantes === 1) {
            mensaje = `1 día restante`;
            color = '#fd7e14'; // Naranja
        } else {
            mensaje = `${horasRestantes}h restantes`;
            color = '#dc3545'; // Rojo
        }
        
        return { 
            vencido: false, 
            diasRestantes, 
            mensaje,
            color,
            fechaVencimiento: vencimiento.toLocaleString()
        };
    };

    // Función para enviar email a un estudiante individual
    const enviarEmailIndividual = async (registro) => {
        const nombreCompleto = `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`;
        const email = registro.datos?.email || registro.email;
        
        if (!email || !email.includes('@')) {
            setMensajeEmail(`❌ ${nombreCompleto} no tiene email válido registrado`);
            setTimeout(() => setMensajeEmail(''), 5000);
            return;
        }
        
        try {
            setEnviandoEmail(true);
            setMensajeEmail(`📧 Enviando notificación a ${nombreCompleto}...`);
            
            // Usar fetch directo al endpoint de backend
            const response = await fetch('http://localhost:5000/api/notificaciones/enviar-individual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dni: registro.dni })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                setMensajeEmail(`✅ Email enviado exitosamente a ${nombreCompleto} (${email})`);
                setTimeout(() => setMensajeEmail(''), 3000);
            } else {
                setMensajeEmail(`❌ Error: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }
            
        } catch (error) {
            console.error('Error al enviar email:', error);
            setMensajeEmail(`❌ Error al enviar email a ${nombreCompleto}: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función para enviar emails masivos
    const enviarEmailsMasivos = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('📧 Enviando notificaciones masivas a todos los estudiantes...');
            
            const response = await fetch('http://localhost:5000/api/notificaciones/enviar-masivo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                setMensajeEmail(`✅ Emails masivos completados: ${resultado.enviados} enviados${resultado.fallidos > 0 ? `, ${resultado.fallidos} fallidos` : ''}`);
                setTimeout(() => setMensajeEmail(''), 4000);
            } else {
                setMensajeEmail(`❌ Error en envío masivo: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }
            
        } catch (error) {
            console.error('Error al enviar emails masivos:', error);
            setMensajeEmail(`❌ Error al enviar emails masivos: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función para enviar emails urgentes (solo a registros próximos a vencer)
    const enviarEmailsUrgentes = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('⚡ Enviando notificaciones urgentes (≤3 días)...');
            
            const response = await fetch('http://localhost:5000/api/notificaciones/enviar-urgentes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ diasUmbral: 3 })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                setMensajeEmail(`⚡ Emails urgentes completados: ${resultado.enviados} enviados${resultado.fallidos > 0 ? `, ${resultado.fallidos} fallidos` : ''}`);
                setTimeout(() => setMensajeEmail(''), 4000);
            } else {
                setMensajeEmail(`❌ Error en envío urgente: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }
            
        } catch (error) {
            console.error('Error al enviar emails urgentes:', error);
            setMensajeEmail(`❌ Error al enviar emails urgentes: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función eliminada: migrarRegistrosLocalStorage - ya no es necesaria

    // Función para eliminar un registro pendiente
    const eliminarRegistro = async (registro) => {
        const nombreCompleto = `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`;
        
        // Usar confirmación del hook
        const procederEliminacion = () => {
            procesarEliminacion(registro, nombreCompleto);
        };
        
        confirmAction(
            `¿Estás seguro de que quieres eliminar el registro de ${nombreCompleto}?`,
            procederEliminacion
        );
    };

    // Función auxiliar para procesar la eliminación
    const procesarEliminacion = async (registro, nombreCompleto) => {
        try {
            setMensajeEmail(`🗑️ Eliminando registro de ${nombreCompleto}...`);
            
            // Usar el servicio correcto del backend
            await registrosPendientesService.eliminarRegistroPendiente(registro.dni);
            console.log('✅ Registro eliminado del backend exitosamente');
            
            // Eliminar de la lista local inmediatamente
            setRegistros(prevRegistros => 
                prevRegistros.filter(r => r.dni !== registro.dni)
            );
            
            setMensajeEmail(`✅ Registro de ${nombreCompleto} eliminado exitosamente`);
            setTimeout(() => setMensajeEmail(''), 3000);
            
            // También eliminar de localStorage si existe
            try {
                const registrosLocal = obtenerRegistrosSinDocumentacion();
                const registrosFiltrados = registrosLocal.filter(r => r.dni !== registro.dni);
                localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosFiltrados, null, 2));
            } catch (error) {
                console.log('No se pudo eliminar de localStorage (normal si ya no está):', error);
            }
            
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            setMensajeEmail(`❌ Error al eliminar registro: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función para completar un registro pendiente (navegar al formulario de inscripción)
    const completarRegistro = async (registro) => {
        try {
            console.log('🔄 Cargando datos del registro pendiente:', registro);
            setMensajeEmail(`📋 Cargando datos de ${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}...`);
            
            // Obtener datos completos del registro desde el archivo JSON del backend
            const response = await fetch(`http://localhost:5000/api/registros-pendientes/${registro.dni}`);
            const datosCompletos = await response.json();
            console.log('📋 Datos completos obtenidos:', datosCompletos);
            
            // Extraer datos del registro para el formulario
            const datosParaFormulario = {
                // Datos personales
                dni: datosCompletos.dni || registro.dni,
                nombre: datosCompletos.datos?.nombre || registro.datos?.nombre || registro.nombre,
                apellido: datosCompletos.datos?.apellido || registro.datos?.apellido || registro.apellido,
                email: datosCompletos.datos?.email || registro.datos?.email || registro.email,
                telefono: datosCompletos.datos?.telefono || registro.datos?.telefono || registro.telefono,
                fechaNacimiento: datosCompletos.datos?.fechaNacimiento || registro.datos?.fechaNacimiento,
                tipoDocumento: datosCompletos.datos?.tipoDocumento || registro.datos?.tipoDocumento || 'DNI',
                cuil: datosCompletos.datos?.cuil || registro.datos?.cuil,
                paisEmision: datosCompletos.datos?.paisEmision || registro.datos?.paisEmision,
                // Domicilio
                calle: datosCompletos.datos?.calle || registro.datos?.calle,
                numero: datosCompletos.datos?.numero || registro.datos?.numero,
                provincia: datosCompletos.datos?.provincia || registro.datos?.provincia,
                localidad: datosCompletos.datos?.localidad || registro.datos?.localidad,
                barrio: datosCompletos.datos?.barrio || registro.datos?.barrio,
                // Modalidad y plan
                modalidad: datosCompletos.datos?.modalidad || registro.datos?.modalidad || registro.modalidad,
                modalidadId: datosCompletos.datos?.modalidadId || registro.datos?.modalidadId,
                planAnio: datosCompletos.datos?.planAnio || registro.datos?.planAnio,
                modulos: datosCompletos.datos?.modulos || registro.datos?.modulos,
                idModulo: datosCompletos.datos?.idModulo || registro.datos?.idModulo,
                // Información académica adicional
                administrador: datosCompletos.datos?.administrador || registro.datos?.administrador,
                motivoPendiente: datosCompletos.datos?.motivoPendiente || registro.datos?.motivoPendiente,
                // Metadatos del registro
                timestamp: datosCompletos.timestamp || registro.timestamp,
                fechaRegistro: datosCompletos.fechaRegistro || registro.fechaRegistro,
                horaRegistro: datosCompletos.horaRegistro || registro.horaRegistro,
                tipo: datosCompletos.tipo || registro.tipo,
                estado: datosCompletos.estado || registro.estado,
                observaciones: datosCompletos.observaciones || registro.observaciones,
                // AGREGAR: Archivos existentes para mostrar en el modal de documentación
                archivosExistentes: datosCompletos.archivos || registro.archivos || {}
            };
            
            console.log('� Datos preparados para formulario:', datosParaFormulario);
            
            // Guardar datos en sessionStorage para que el formulario los use
            sessionStorage.setItem('datosRegistroPendiente', JSON.stringify(datosParaFormulario));
            
            // Cerrar el modal actual
            onClose();
            
            // Navegar al formulario de inscripción con parámetros y datos completos
            const datosEncoded = encodeURIComponent(JSON.stringify(datosParaFormulario));
            const params = new URLSearchParams({
                completar: registro.dni,
                modalidad: encodeURIComponent(datosParaFormulario.modalidad || ''),
                datosCompletos: datosEncoded,
                origen: 'registros-pendientes'
            });
            
            navigate(`/dashboard/formulario-inscripcion-adm?${params.toString()}`);
            
            setMensajeEmail(`✅ Abriendo formulario para ${datosParaFormulario.nombre} ${datosParaFormulario.apellido}`);
            setTimeout(() => setMensajeEmail(''), 2000);
            
        } catch (error) {
            console.error('Error al completar registro:', error);
            setMensajeEmail(`❌ Error al cargar datos: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función de descarga ya manejada en generarReporteAdministrativo y generarReporteCSV

    // Función para generar reporte administrativo legible
    const generarReporteAdministrativo = () => {
        try {
            if (!registros || registros.length === 0) {
                showWarning('No hay registros pendientes para generar el reporte TXT');
                return false;
            }

            setDescargando(true);
            const fechaActual = new Date().toLocaleDateString('es-AR');
            const horaActual = new Date().toLocaleTimeString('es-AR');
            
            let contenidoReporte = `REPORTE DE REGISTROS PENDIENTES DE DOCUMENTACIÓN
================================================================================
Fecha del reporte: ${fechaActual} - ${horaActual}
Total de registros pendientes: ${registros.length}
================================================================================

`;

            // Mapeo de documentos simplificado para el reporte
            const mapeoDocumentosReporte = {
                'dni': 'DNI',
                'cuil': 'CUIL',
                'foto': 'Fotografía',
                'fichaMedica': 'Ficha Médica',
                'partidaNacimiento': 'Partida de Nacimiento',
                'analiticoParcial': 'Analítico Parcial',
                'certificadoNivelPrimario': 'Certificado Nivel Primario',
                'solicitudPase': 'Solicitud de Pase'
            };

            registros.forEach((registro, index) => {
                const nombre = registro.datos?.nombre || registro.nombre || 'Sin nombre';
                const apellido = registro.datos?.apellido || registro.apellido || 'Sin apellido';
                const dni = registro.datos?.dni || registro.dni || 'Sin DNI';
                const email = registro.datos?.email || registro.email || 'No proporcionado';
                const modalidad = registro.datos?.modalidad || registro.modalidad || 'No especificada';
                
                // Calcular días restantes
                const fechaCreacion = new Date(registro.fechaCreacion || registro.fecha);
                const diasTranscurridos = Math.floor((new Date() - fechaCreacion) / (1000 * 60 * 60 * 24));
                const diasRestantes = Math.max(0, 7 - diasTranscurridos);
                const vencido = diasRestantes === 0;
                
                contenidoReporte += `${index + 1}. ${nombre.toUpperCase()} ${apellido.toUpperCase()}
   DNI: ${dni}
   Email: ${email}
   Modalidad: ${modalidad}
   Estado: ${vencido ? 'VENCIDO ❌' : `⏳ ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`}
   Fecha límite: ${new Date(fechaCreacion.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
   
   📋 DOCUMENTACIÓN REQUERIDA:`;
   
                // Obtener documentos requeridos por modalidad
                const requerimientosDoc = obtenerDocumentosRequeridos(modalidad);
                const docsRequeridos = Array.isArray(requerimientosDoc) ? requerimientosDoc : (requerimientosDoc.documentos || []);
                const archivos = registro.archivos || [];
                
                docsRequeridos.forEach(doc => {
                    const tieneDocumento = Array.isArray(archivos) ? archivos.some(archivo => archivo.includes(doc)) : Object.keys(archivos).includes(doc);
                    const estado = tieneDocumento ? '✅' : '❌';
                    const nombreDoc = mapeoDocumentosReporte[doc] || doc;
                    contenidoReporte += `\n      ${estado} ${nombreDoc}`;
                });
                
                contenidoReporte += `\n\n${'─'.repeat(80)}\n\n`;
            });

            const registrosSinDoc = registros.filter(r => (r.tipoRegistro || 'SIN_DOCUMENTACION') === 'SIN_DOCUMENTACION').length;
            const registrosIncompletos = registros.filter(r => (r.tipoRegistro || 'SIN_DOCUMENTACION') === 'DOCUMENTACION_INCOMPLETA').length;
            const registrosVencidos = registros.filter(r => {
                const fechaCreacion = new Date(r.fechaCreacion || r.fecha);
                const diasTranscurridos = Math.floor((new Date() - fechaCreacion) / (1000 * 60 * 60 * 24));
                return diasTranscurridos >= 7;
            }).length;

            contenidoReporte += `RESUMEN:
• Registros sin documentación: ${registrosSinDoc}
• Registros con documentación incompleta: ${registrosIncompletos}
• Registros vencidos: ${registrosVencidos}

NOTA IMPORTANTE:
- Los registros se eliminan automáticamente después de 7 días desde su creación
- Los estudiantes pueden completar su documentación desde el sistema web
- Para consultas técnicas, contactar al administrador del sistema

================================================================================
Reporte generado por Sistema de Gestión de Estudiantes - CEIJA 5
================================================================================`;

            // Crear y descargar el archivo con codificación UTF-8
            const blob = new Blob([contenidoReporte], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `Reporte-Registros-Pendientes-${new Date().toISOString().split('T')[0]}.txt`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            showSuccess(`Reporte TXT descargado exitosamente (${registros.length} registros)`);
            
            console.log('📄 Reporte administrativo descargado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al generar reporte administrativo:', error);
            showError(`Error al generar reporte TXT: ${error.message}`);
            return false;
        } finally {
            setDescargando(false);
        }
    };

    // Función para generar archivo CSV para Excel - MEJORADA
    const generarReporteCSV = () => {
        try {
            if (!registros || registros.length === 0) {
                showWarning('No hay registros pendientes para generar el archivo Excel');
                return false;
            }

            setDescargando(true);
            
            // Crear encabezados CSV
            const encabezados = [
                'Nombre',
                'Apellido',
                'DNI',
                'Email',
                'Modalidad',
                'Fecha Creación',
                'Días Restantes',
                'Estado',
                'DNI',
                'CUIL',
                'Fotografía',
                'Ficha Médica',
                'Partida Nacimiento',
                'Analítico Parcial',
                'Certificado Primario',
                'Solicitud Pase'
            ];
            
            // Crear filas de datos
            const filas = registros.map(registro => {
                const nombre = registro.datos?.nombre || registro.nombre || '';
                const apellido = registro.datos?.apellido || registro.apellido || '';
                const dni = registro.datos?.dni || registro.dni || '';
                const email = registro.datos?.email || registro.email || '';
                const modalidad = registro.datos?.modalidad || registro.modalidad || '';
                
                // Calcular días restantes
                const fechaCreacion = new Date(registro.fechaCreacion || registro.fecha);
                const diasTranscurridos = Math.floor((new Date() - fechaCreacion) / (1000 * 60 * 60 * 24));
                const diasRestantes = Math.max(0, 7 - diasTranscurridos);
                const estado = diasRestantes === 0 ? 'VENCIDO' : 'PENDIENTE';
                
                // Verificar documentos
                const archivos = registro.archivos || [];
                
                const tieneDoc = (tipoDoc) => {
                    if (Array.isArray(archivos)) {
                        return archivos.some(archivo => archivo.includes(tipoDoc)) ? 'SÍ' : 'NO';
                    } else if (typeof archivos === 'object') {
                        return Object.keys(archivos).includes(tipoDoc) ? 'SÍ' : 'NO';
                    }
                    return 'NO';
                };
                
                return [
                    `"${nombre}"`,
                    `"${apellido}"`,
                    `"${dni}"`,
                    `"${email}"`,
                    `"${modalidad}"`,
                    `"${fechaCreacion.toLocaleDateString('es-AR')}"`,
                    diasRestantes,
                    `"${estado}"`,
                    tieneDoc('dni'),
                    tieneDoc('cuil'),
                    tieneDoc('foto'),
                    tieneDoc('fichaMedica'),
                    tieneDoc('partidaNacimiento'),
                    tieneDoc('analiticoParcial'),
                    tieneDoc('certificadoNivelPrimario'),
                    tieneDoc('solicitudPase')
                ];
            });
            
            // Combinar encabezados y filas
            const csvContent = [
                encabezados.join(','),
                ...filas.map(fila => fila.join(','))
            ].join('\n');
            
            // Agregar BOM para UTF-8 para que Excel lo reconozca correctamente
            const BOM = '\uFEFF';
            const csvWithBOM = BOM + csvContent;
            
            // Crear y descargar el archivo
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `Registros-Pendientes-Excel-${new Date().toISOString().split('T')[0]}.csv`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            showSuccess(`Archivo Excel (CSV) descargado exitosamente (${registros.length} registros)`);
            
            console.log('📊 Archivo CSV descargado exitosamente con formato mejorado');
            return true;
        } catch (error) {
            console.error('❌ Error al generar archivo CSV:', error);
            showError(`Error al generar archivo Excel: ${error.message}`);
            return false;
        } finally {
            setDescargando(false);
        }
    };

    // Función para verificar estado de duplicados
    const verificarEstadoDuplicados = async () => {
        try {
            console.log('🔍 Verificando estado de duplicados...');
            const estado = verificarDuplicados();
            setEstadoDuplicados(estado);
            
            if (estado && estado.cantidadDuplicados > 0) {
                setMensajeEmail(`⚠️ Se encontraron ${estado.cantidadDuplicados} DNI(s) con registros duplicados`);
                setTimeout(() => setMensajeEmail(''), 5000);
            } else {
                setMensajeEmail('✅ No se encontraron registros duplicados');
                setTimeout(() => setMensajeEmail(''), 3000);
            }
            
            return estado;
        } catch (error) {
            console.error('❌ Error al verificar duplicados:', error);
            setMensajeEmail(`❌ Error al verificar duplicados: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
            return null;
        }
    };

    // Función para limpiar duplicados manualmente
    const limpiarDuplicadosManual = async () => {
        setLimpiandoDuplicados(true);
        try {
            console.log('🧹 Iniciando limpieza manual de duplicados...');
            setMensajeEmail('Limpiando registros duplicados...');
            
            const resultado = limpiarDuplicadosManualmente();
            
            if (resultado.success) {
                setMensajeEmail(`✅ ${resultado.mensaje}`);
                
                // Recargar registros después de la limpieza
                setTimeout(async () => {
                    await recargarRegistros();
                    await verificarEstadoDuplicados();
                }, 1000);
            } else {
                setMensajeEmail(`❌ ${resultado.mensaje}`);
            }
            
            setTimeout(() => setMensajeEmail(''), 5000);
            
        } catch (error) {
            console.error('❌ Error al limpiar duplicados:', error);
            setMensajeEmail(`❌ Error al limpiar duplicados: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setLimpiandoDuplicados(false);
        }
    };

    // 🧪 Función para probar el sistema de 7 días
    const probarSistema7Dias = () => {
        try {
            console.log('🧪 Ejecutando prueba del sistema de 7 días desde Modal...');
            setMensajeEmail('🧪 Analizando sistema de 7 días...');
            
            const resultado = testearSistema7Dias();
            
            if (resultado) {
                const mensaje = `🧪 Análisis completado: ${resultado.registrosVigentes} vigentes, ${resultado.registrosVencidos} vencidos, ${resultado.calculosCorrectos}/${resultado.totalRegistros} cálculos correctos`;
                setMensajeEmail(mensaje);
                console.log('📊 Resultado del análisis:', resultado);
            } else {
                setMensajeEmail('❌ Error en el análisis del sistema');
            }
            
            setTimeout(() => setMensajeEmail(''), 8000);
            
        } catch (error) {
            console.error('❌ Error al probar sistema:', error);
            setMensajeEmail(`❌ Error: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return '📋';
            case 'DOCUMENTACION_INCOMPLETA': return '📄';
            default: return '📝';
        }
    };

    const formatearTipo = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return 'Sin Documentación';
            case 'DOCUMENTACION_INCOMPLETA': return 'Documentación Incompleta';
            default: return tipo;
        }
    };

    // Mapeo de nombres técnicos a nombres legibles para documentos
    const mapeoDocumentos = {
        "foto": "📷 Foto 4x4",
        "archivo_dni": "📄 DNI",
        "archivo_cuil": "📄 CUIL",
        "archivo_fichaMedica": "🏥 Ficha Médica",
        "archivo_partidaNacimiento": "📜 Partida de Nacimiento",
        "archivo_solicitudPase": "📝 Solicitud de Pase",
        "archivo_analiticoParcial": "📊 Analítico Parcial",
        "archivo_certificadoNivelPrimario": "🎓 Certificado Nivel Primario"
    };

    // Lista completa de documentos requeridos - YA NO SE USA (se obtiene dinámicamente)
    // const documentosRequeridos = [...] - ELIMINADO para usar la función dinámica

    // Función para obtener el estado de documentación de un registro - CON LÓGICA DE DOCUMENTOS ALTERNATIVOS
    const obtenerEstadoDocumentacionRegistro = (registro) => {
        console.log('🔍 Analizando documentación para registro:', registro.id, registro);
        
        // Obtener modalidad desde datos o desde raíz del registro
        const modalidad = registro.datos?.modalidad || registro.modalidad || '';
        const planAnio = registro.datos?.planAnio || registro.planAnio || '';
        const modulos = registro.datos?.modulos || registro.modulos || '';
        
        console.log('📋 Datos extraídos - Modalidad:', modalidad, 'Plan:', planAnio, 'Módulos:', modulos);
        
        // Obtener documentos requeridos dinámicamente según modalidad del registro
        const requerimientos = obtenerDocumentosRequeridos(modalidad, planAnio, modulos);
        
        const documentosRequeridosDinamicos = requerimientos.documentos || [];
        const documentosAlternativos = requerimientos.alternativos;
        
        console.log(`📋 Documentos requeridos para ${modalidad}:`, documentosRequeridosDinamicos);
        if (documentosAlternativos) {
            console.log(`🔄 Alternativas:`, documentosAlternativos.descripcion);
        }
        
        // Manejar diferentes estructuras de datos
        let documentosSubidos = [];
        
        if (Array.isArray(registro.documentosSubidos)) {
            // Si ya es un array (desde backend)
            documentosSubidos = registro.documentosSubidos;
            console.log('📋 Documentos subidos (array):', documentosSubidos);
        } else if (registro.documentosSubidos && typeof registro.documentosSubidos === 'object') {
            // Si es un objeto, obtener las claves
            documentosSubidos = Object.keys(registro.documentosSubidos);
            console.log('📋 Documentos subidos (objeto keys):', documentosSubidos);
        } else if (registro.archivos && typeof registro.archivos === 'object') {
            // Si hay archivos en el registro
            documentosSubidos = Object.keys(registro.archivos);
            console.log('📋 Documentos subidos (archivos):', documentosSubidos);
        } else {
            // Fallback: array vacío
            documentosSubidos = [];
            console.log('⚠️ No se encontraron documentos, usando array vacío');
        }
        
        // Procesar documentos alternativos si existen
        let documentosFaltantes = [];
        let documentosValidosSubidos = [];
        
        if (documentosAlternativos) {
            // Verificar si tiene el documento preferido o la alternativa
            const tienePreferido = documentosSubidos.includes(documentosAlternativos.preferido);
            const tieneAlternativa = documentosSubidos.includes(documentosAlternativos.alternativa);
            
            // Validar documentos base (excluyendo los alternativos)
            for (const doc of documentosRequeridosDinamicos) {
                if (doc === documentosAlternativos.preferido || doc === documentosAlternativos.alternativa) {
                    // Es parte del grupo alternativo
                    if (tienePreferido) {
                        documentosValidosSubidos.push(documentosAlternativos.preferido);
                    } else if (tieneAlternativa) {
                        documentosValidosSubidos.push(documentosAlternativos.alternativa);
                    } else {
                        documentosFaltantes.push(documentosAlternativos.preferido); // Mostrar el preferido como faltante
                    }
                } else {
                    // Documento regular
                    if (documentosSubidos.includes(doc)) {
                        documentosValidosSubidos.push(doc);
                    } else {
                        documentosFaltantes.push(doc);
                    }
                }
            }
            
            // Evitar duplicados
            documentosValidosSubidos = [...new Set(documentosValidosSubidos)];
            documentosFaltantes = [...new Set(documentosFaltantes)];
            
        } else {
            // Sin documentos alternativos, validación normal
            documentosValidosSubidos = documentosSubidos.filter(doc => 
                documentosRequeridosDinamicos.includes(doc)
            );
            documentosFaltantes = documentosRequeridosDinamicos.filter(doc => 
                !documentosSubidos.includes(doc)
            );
        }
        
        // Calcular totales correctos
        const totalRequeridos = documentosRequeridosDinamicos.length - (documentosAlternativos ? 1 : 0);
        
        const resultado = {
            subidos: documentosValidosSubidos,
            faltantes: documentosFaltantes,
            totalSubidos: documentosValidosSubidos.length,
            totalRequeridos: totalRequeridos,
            modalidad: modalidad,
            plan: planAnio || modulos,
            documentosAlternativos: documentosAlternativos
        };
        
        console.log('📊 Estado de documentación:', resultado);
        return resultado;
    };

    return (
        <div className="modal-registros-pendientes">

            <div className="modal-overlay">
                <div className="modal-container registros-pendientes">
                    {/* Header del modal */}
                    <div className="modal-header">
                        <h2>
                            📅 Registros Pendientes ({registros.length})
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                                onClick={recargarRegistros}
                                className="btn-recargar"
                                title="Actualizar lista de registros"
                                style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                🔄 Actualizar
                            </button>
                            <CloseButton onClose={onClose} variant="modal" />
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="modal-content">
                        {/* Lista de registros */}
                        <div className="lista-registros">
                            {cargandoRegistros ? (
                                <div className="estado-cargando">
                                    <div>⏳</div>
                                    <div>Cargando registros pendientes...</div>
                                </div>
                            ) : registros.length === 0 ? (
                                <div className="estado-vacio">
                                    <div>📋</div>
                                    <div>No hay registros pendientes</div>
                                </div>
                            ) : (
                                registros.map((registro, index) => {
                                const info = obtenerInfoVencimiento(registro);
                                const estadoDoc = obtenerEstadoDocumentacionRegistro(registro);
                                
                                return (
                                    <div key={registro.id || index} 
                                         className={`registro-item ${info.vencido ? 'registro-vencido' : 'registro-vigente'}`} 
                                         style={{ borderLeftColor: info.color }}>
                                        <div className="registro-grid">
                                            {/* Información principal en horizontal */}
                                            <div className="registro-info-principal">
                                                {/* Columna izquierda - Información del estudiante */}
                                                <div className="registro-info-estudiante">
                                                    <h4>{registro.datos?.nombre || registro.nombre} {registro.datos?.apellido || registro.apellido}</h4>
                                                    <p><strong>📄 DNI:</strong> {registro.datos?.dni || registro.dni}</p>
                                                    <p>
                                                        <strong>📧 Email:</strong> {
                                                            (registro.datos?.email || registro.email) || 
                                                            <span style={{color: '#dc3545', fontStyle: 'italic'}}>Sin email</span>
                                                        }
                                                    </p>
                                                    <p>
                                                        <strong>📚 Modalidad:</strong> {registro.datos?.modalidad || registro.modalidad}
                                                    </p>
                                                    <p>
                                                        <strong>{getTipoIcon(registro.tipoRegistro)} Tipo:</strong> {formatearTipo(registro.tipoRegistro)}
                                                    </p>
                                                    <p>
                                                        <strong>📎 Documentos:</strong> {estadoDoc.totalSubidos}/{estadoDoc.totalRequeridos}
                                                    </p>
                                                </div>
                                                
                                                {/* Columna derecha - Estado y tiempos */}
                                                <div className="registro-info-derecha">
                                                    <div className="registro-vencimiento" style={{ color: info.color }}>
                                                        {info.vencido ? '🔴 VENCIDO' : `🕒 ${info.mensaje}`}
                                                    </div>
                                                    {!info.vencido && (
                                                        <div className="registro-fecha-limite">
                                                            Vence: {info.fechaVencimiento}
                                                        </div>
                                                    )}
                                                    {registro.modalidad && (
                                                        <div className="registro-modalidad">
                                                            📚 {registro.modalidad}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Documentos en layout horizontal */}
                                            <div className="documentos-container">
                                                {/* Sección de documentos subidos */}
                                                {estadoDoc.subidos.length > 0 && (
                                                    <div className="seccion-documentos documentos-subidos">
                                                        <strong>✅ Documentos subidos:</strong>
                                                        <ul>
                                                            {estadoDoc.subidos.map(doc => (
                                                                <li key={doc}>
                                                                    {mapeoDocumentos[doc] || doc}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Sección de documentos faltantes */}
                                                {estadoDoc.faltantes.length > 0 && (
                                                    <div className="seccion-documentos documentos-faltantes">
                                                        <strong>⚠️ Documentos faltantes:</strong>
                                                        <ul>
                                                            {estadoDoc.faltantes.map(doc => (
                                                                <li key={doc}>
                                                                    {estadoDoc.documentosAlternativos && doc === estadoDoc.documentosAlternativos.preferido ? 
                                                                        `${mapeoDocumentos[doc] || doc} (o alternativamente: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa] || estadoDoc.documentosAlternativos.alternativa})` :
                                                                        mapeoDocumentos[doc] || doc
                                                                    }
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {/* Información adicional sobre documentos alternativos */}
                                                        {estadoDoc.documentosAlternativos && estadoDoc.faltantes.includes(estadoDoc.documentosAlternativos.preferido) && (
                                                            <div className="info-alternativos">
                                                                ℹ️ {estadoDoc.documentosAlternativos.descripcion}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Información especial cuando hay documentos alternativos pero está completo */}
                                            {estadoDoc.documentosAlternativos && estadoDoc.faltantes.length === 0 && (
                                                <div className="info-documento-usado">
                                                    {estadoDoc.subidos.includes(estadoDoc.documentosAlternativos.preferido) ? 
                                                        `✨ Presenta documento preferido: ${mapeoDocumentos[estadoDoc.documentosAlternativos.preferido]}` :
                                                        `📝 Presenta alternativa: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa]}`
                                                    }
                                                </div>
                                            )}

                                            {/* Botones de acción */}
                                            <div className="registro-acciones">
                                                {/* Botón para completar registro */}
                                                {!info.vencido && (
                                                    <button
                                                        onClick={() => completarRegistro(registro)}
                                                        className="btn-completar"
                                                        title="Marcar este registro como completado y procesado"
                                                        disabled={enviandoEmail}
                                                    >
                                                        ✅ Completar
                                                    </button>
                                                )}

                                                {/* Botón para eliminar registro */}
                                                <button
                                                    onClick={() => eliminarRegistro(registro)}
                                                    className="btn-eliminar"
                                                    title="Eliminar este registro permanentemente"
                                                    disabled={enviandoEmail}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        margin: '2px'
                                                    }}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                                
                                                {/* Botón para enviar email individual */}
                                                {(registro.datos?.email || registro.email) && (
                                                    <button
                                                        onClick={() => enviarEmailIndividual(registro)}
                                                        className="btn-notificar"
                                                        disabled={enviandoEmail}
                                                        title={`Enviar notificación por email a ${registro.datos?.email || registro.email}`}
                                                        style={{
                                                            backgroundColor: info.vencido ? '#6c757d' : '#17a2b8',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 12px',
                                                            borderRadius: '4px',
                                                            cursor: enviandoEmail ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            margin: '2px',
                                                            opacity: info.vencido ? 0.6 : 1
                                                        }}
                                                    >
                                                        {enviandoEmail ? '📧 Enviando...' : `📧 ${info.vencido ? 'Vencido' : 'Notificar'}`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="modal-footer">
                        {/* Mensaje de estado de emails */}
                        {mensajeEmail && (
                            <div className={`mensaje-email ${mensajeEmail.includes('❌') ? 'error' : 'success'}`}>
                                {mensajeEmail}
                            </div>
                        )}
                        
                        {/* Sección de botones de email */}
                        <div className="seccion-emails">
                            <h4>📧 Notificaciones por Email</h4>
                            <div className="botones-emails">
                                <button 
                                    onClick={enviarEmailsUrgentes}
                                    className="btn-urgente"
                                    disabled={enviandoEmail}
                                    title="Enviar emails solo a registros urgentes (próximos a vencer)"
                                >
                                    {enviandoEmail ? '⚡ Enviando...' : '⚡ Urgentes'}
                                </button>
                                <button 
                                    onClick={enviarEmailsMasivos}
                                    className="btn-todos-emails"
                                    disabled={enviandoEmail}
                                    title="Enviar email a todos los estudiantes con registros pendientes"
                                >
                                    {enviandoEmail ? '📧 Enviando...' : '📧 Todos'}
                                </button>

                            </div>
                            <p className="info-emails">
                                📧 <strong>Notificar:</strong> Email individual con documentos presentados/faltantes y días restantes<br/>
                                ⚡ <strong>Urgentes:</strong> Solo estudiantes con ≤3 días para completar<br/>
                                📬 <strong>Todos:</strong> Notificar a todos los estudiantes pendientes
                            </p>
                        </div>
                        
                        {/* Botones de descarga */}
                        <div className="botones-descarga">
                            <button 
                                onClick={generarReporteAdministrativo}
                                className="btn-reporte-txt"
                                title="Generar reporte legible para administración escolar"
                            >
                                📋 Reporte TXT
                            </button>
                            <button 
                                onClick={generarReporteCSV}
                                className="btn-excel-csv"
                                title="Generar archivo Excel (CSV) para análisis de datos"
                            >
                                📊 Excel (CSV)
                            </button>
                            <button 
                                onClick={() => {
                                    try {
                                        const dataStr = JSON.stringify(registros, null, 2);
                                        const blob = new Blob([dataStr], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `registros-pendientes-${new Date().toISOString().split('T')[0]}.json`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                        showSuccess('Archivo JSON descargado exitosamente');
                                    } catch (error) {
                                        showError(`Error al descargar JSON: ${error.message}`);
                                    }
                                }}
                                className="btn-json-tecnico"
                                disabled={descargando}
                                title="Descargar archivo JSON técnico (para programadores)"
                            >
                                {descargando ? '⏳ Descargando...' : '💾 JSON Técnico'}
                            </button>
                        </div>
                        
                        {/* Botones para gestión de duplicados */}
                        <div className="botones-duplicados" style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '1px solid #e0e0e0'
                        }}>
                            <button 
                                onClick={verificarEstadoDuplicados}
                                className="btn-verificar-duplicados"
                                title="Verificar si existen registros duplicados para el mismo DNI"
                                style={{
                                    background: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                🔍 Verificar Duplicados
                            </button>
                            
                            {estadoDuplicados && estadoDuplicados.cantidadDuplicados > 0 && (
                                <button 
                                    onClick={limpiarDuplicadosManual}
                                    disabled={limpiandoDuplicados}
                                    className="btn-limpiar-duplicados"
                                    title={`Encontrados ${estadoDuplicados.cantidadDuplicados} DNI(s) duplicados - Click para limpiar`}
                                    style={{
                                        background: limpiandoDuplicados ? '#6c757d' : '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: limpiandoDuplicados ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {limpiandoDuplicados ? '⏳ Limpiando...' : `🧹 Limpiar ${estadoDuplicados.cantidadDuplicados} Duplicado(s)`}
                                </button>
                            )}
                            
                            {/* Botón para testing del sistema de 7 días (solo en desarrollo) */}
                            {window.location.hostname === 'localhost' && (
                                <button 
                                    onClick={probarSistema7Dias}
                                    className="btn-test-sistema"
                                    title="Probar funcionamiento del sistema de vencimiento de 7 días"
                                    style={{
                                        background: '#6f42c1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    🧪 Test 7 Días
                                </button>
                            )}
                        </div>
                        
                        {/* Información de estado de duplicados */}
                        {estadoDuplicados && (
                            <div style={{
                                marginTop: '10px',
                                padding: '10px',
                                background: estadoDuplicados.cantidadDuplicados > 0 ? '#fff3cd' : '#d4edda',
                                border: `1px solid ${estadoDuplicados.cantidadDuplicados > 0 ? '#ffeaa7' : '#c3e6cb'}`,
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}>
                                📊 <strong>Estado:</strong> {estadoDuplicados.totalRegistros} registros totales, {estadoDuplicados.dnisUnicos} DNI únicos
                                {estadoDuplicados.cantidadDuplicados > 0 && (
                                    <div style={{ marginTop: '5px', color: '#856404' }}>
                                        ⚠️ {estadoDuplicados.cantidadDuplicados} DNI(s) tienen registros duplicados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ModalRegistrosPendientes.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default ModalRegistrosPendientes;