import { useState } from 'react';
import PropTypes from 'prop-types';
import CloseButton from './CloseButton';
import '../estilos/modalM.css';
import '../estilos/botones.css';

const ModalRegistrosPendientes = ({ registros, onClose, onDescargar, onCompletarRegistro }) => {
    const [descargando, setDescargando] = useState(false);

    const obtenerInfoVencimiento = (registro) => {
        const ahora = new Date();
        const vencimiento = new Date(registro.fechaVencimiento);
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

    const handleDescargar = async () => {
        setDescargando(true);
        try {
            await onDescargar();
        } finally {
            setDescargando(false);
        }
    };

    // Función para generar reporte administrativo legible
    const generarReporteAdministrativo = () => {
        try {
            const fechaActual = new Date().toLocaleDateString('es-AR');
            const horaActual = new Date().toLocaleTimeString('es-AR');
            
            let contenidoReporte = `REPORTE DE REGISTROS PENDIENTES DE DOCUMENTACIÓN
================================================================================
Fecha del reporte: ${fechaActual} - ${horaActual}
Total de registros pendientes: ${registros.length}
================================================================================

`;

            registros.forEach((registro, index) => {
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacion(registro);
                
                contenidoReporte += `${index + 1}. ${registro.nombre.toUpperCase()} ${registro.apellido.toUpperCase()}
   DNI: ${registro.dni}
   Email: ${registro.email || 'No proporcionado'}
   Modalidad: ${registro.modalidad}
   Tipo de registro: ${formatearTipo(registro.tipoRegistro)}
   Estado: ${info.vencido ? 'VENCIDO ❌' : `⏳ ${info.mensaje}`}
   ${!info.vencido ? `Fecha límite: ${info.fechaVencimiento}` : 'Registro vencido - será eliminado automáticamente'}
   
   📋 DOCUMENTACIÓN (${estadoDoc.totalSubidos}/${estadoDoc.totalRequeridos} documentos):
   
   ✅ DOCUMENTOS YA PRESENTADOS:`;
   
                if (estadoDoc.subidos.length > 0) {
                    estadoDoc.subidos.forEach(doc => {
                        contenidoReporte += `\n      • ${mapeoDocumentos[doc] || doc}`;
                    });
                } else {
                    contenidoReporte += `\n      • Ningún documento presentado aún`;
                }
                
                contenidoReporte += `\n   
   ⚠️  DOCUMENTOS FALTANTES:`;
                
                if (estadoDoc.faltantes.length > 0) {
                    estadoDoc.faltantes.forEach(doc => {
                        contenidoReporte += `\n      • ${mapeoDocumentos[doc] || doc}`;
                    });
                } else {
                    contenidoReporte += `\n      • Documentación completa`;
                }
                
                contenidoReporte += `\n\n${'─'.repeat(80)}\n\n`;
            });

            contenidoReporte += `RESUMEN:
• Registros sin documentación: ${registros.filter(r => r.tipoRegistro === 'SIN_DOCUMENTACION').length}
• Registros con documentación incompleta: ${registros.filter(r => r.tipoRegistro === 'DOCUMENTACION_INCOMPLETA').length}
• Registros vencidos: ${registros.filter(r => obtenerInfoVencimiento(r).vencido).length}

NOTA IMPORTANTE:
- Los registros se eliminan automáticamente después de 7 días desde su creación
- Los estudiantes pueden completar su documentación desde el sistema web
- Para consultas técnicas, contactar al administrador del sistema
`;

            // Crear y descargar el archivo
            const blob = new Blob([contenidoReporte], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `Reporte-Registros-Pendientes-${new Date().toISOString().split('T')[0]}.txt`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('📄 Reporte administrativo descargado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al generar reporte administrativo:', error);
            return false;
        }
    };

    // Función para generar archivo CSV para Excel
    const generarReporteCSV = () => {
        try {
            const headers = [
                'Apellido',
                'Nombre', 
                'DNI',
                'Email',
                'Modalidad',
                'Tipo de Registro',
                'Estado',
                'Días Restantes',
                'Fecha Límite',
                'Documentos Subidos',
                'Total Documentos',
                'Documentos Faltantes',
                'Lista de Documentos Subidos',
                'Lista de Documentos Faltantes'
            ];

            let contenidoCSV = headers.join(',') + '\n';

            registros.forEach(registro => {
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacion(registro);
                
                const docsSubidos = estadoDoc.subidos.map(doc => mapeoDocumentos[doc] || doc).join('; ');
                const docsFaltantes = estadoDoc.faltantes.map(doc => mapeoDocumentos[doc] || doc).join('; ');
                
                const fila = [
                    `"${registro.apellido || ''}"`,
                    `"${registro.nombre || ''}"`,
                    `"${registro.dni || ''}"`,
                    `"${registro.email || ''}"`,
                    `"${registro.modalidad || ''}"`,
                    `"${formatearTipo(registro.tipoRegistro)}"`,
                    `"${info.vencido ? 'VENCIDO' : 'VIGENTE'}"`,
                    `"${info.vencido ? '0' : info.diasRestantes}"`,
                    `"${info.vencido ? 'VENCIDO' : info.fechaVencimiento}"`,
                    `"${estadoDoc.totalSubidos}"`,
                    `"${estadoDoc.totalRequeridos}"`,
                    `"${estadoDoc.faltantes.length}"`,
                    `"${docsSubidos}"`,
                    `"${docsFaltantes}"`
                ];
                
                contenidoCSV += fila.join(',') + '\n';
            });

            // Crear y descargar el archivo CSV
            const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `Registros-Pendientes-${new Date().toISOString().split('T')[0]}.csv`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('📊 Archivo CSV descargado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al generar archivo CSV:', error);
            return false;
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

    // Lista completa de documentos requeridos
    const documentosRequeridos = [
        "foto", "archivo_dni", "archivo_cuil", "archivo_fichaMedica", 
        "archivo_partidaNacimiento", "archivo_solicitudPase", 
        "archivo_analiticoParcial", "archivo_certificadoNivelPrimario"
    ];

    // Función para obtener el estado de documentación de un registro
    const obtenerEstadoDocumentacion = (registro) => {
        const documentosSubidos = registro.documentosSubidos || [];
        const documentosFaltantes = documentosRequeridos.filter(doc => 
            !documentosSubidos.includes(doc)
        );
        
        return {
            subidos: documentosSubidos,
            faltantes: documentosFaltantes,
            totalSubidos: documentosSubidos.length,
            totalRequeridos: documentosRequeridos.length
        };
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container registros-pendientes">
                {/* Header del modal */}
                <div style={{
                    borderBottom: '2px solid #2d4177',
                    paddingBottom: '15px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        color: '#2d4177',
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: '600'
                    }}>
                        📅 Registros Pendientes ({registros.length})
                    </h2>
                    <div style={{ position: 'relative' }}>
                        <CloseButton onClose={onClose} variant="modal" />
                    </div>
                </div>

                {/* Lista de registros */}
                <div className="lista-registros" style={{
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '20px'
                }}>
                    {registros.map((registro, index) => {
                        const info = obtenerInfoVencimiento(registro);
                        const estadoDoc = obtenerEstadoDocumentacion(registro);
                        
                        return (
                            <div key={registro.id || index} className="registro-item" style={{
                                border: '1px solid #e1e8ed',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '12px',
                                backgroundColor: info.vencido ? '#fff5f5' : '#f8fafc',
                                borderLeft: `4px solid ${info.color}`
                            }}>
                                <div className="registro-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px',
                                    alignItems: 'start'
                                }}>
                                    {/* Columna izquierda */}
                                    <div>
                                        <h4 style={{
                                            margin: '0 0 8px 0',
                                            color: '#2d4177',
                                            fontSize: '1.1rem'
                                        }}>
                                            {registro.nombre} {registro.apellido}
                                        </h4>
                                        <p style={{
                                            margin: '4px 0',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>📄 DNI:</strong> {registro.dni}
                                        </p>
                                        <p style={{
                                            margin: '4px 0',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>{getTipoIcon(registro.tipoRegistro)} Tipo:</strong> {formatearTipo(registro.tipoRegistro)}
                                        </p>
                                        <p style={{
                                            margin: '4px 0',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>📎 Documentos:</strong> {estadoDoc.totalSubidos}/{estadoDoc.totalRequeridos}
                                        </p>

                                        {/* Sección de documentos subidos */}
                                        {estadoDoc.subidos.length > 0 && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                backgroundColor: '#e8f5e8',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <strong style={{ color: '#2e7d32' }}>✅ Documentos subidos:</strong>
                                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                                    {estadoDoc.subidos.map(doc => (
                                                        <li key={doc} style={{ color: '#2e7d32' }}>
                                                            {mapeoDocumentos[doc] || doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Sección de documentos faltantes */}
                                        {estadoDoc.faltantes.length > 0 && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                backgroundColor: '#fff3e0',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <strong style={{ color: '#f57c00' }}>⚠️ Documentos faltantes:</strong>
                                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                                    {estadoDoc.faltantes.map(doc => (
                                                        <li key={doc} style={{ color: '#f57c00' }}>
                                                            {mapeoDocumentos[doc] || doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Columna derecha */}
                                    <div className="registro-info-derecha" style={{ textAlign: 'right' }}>
                                        <div style={{
                                            color: info.color,
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            marginBottom: '4px'
                                        }}>
                                            {info.vencido ? '🔴 VENCIDO' : `🕒 ${info.mensaje}`}
                                        </div>
                                        {!info.vencido && (
                                            <div style={{
                                                color: '#6c757d',
                                                fontSize: '0.8rem',
                                                fontStyle: 'italic'
                                            }}>
                                                Vence: {info.fechaVencimiento}
                                            </div>
                                        )}
                                        {registro.modalidad && (
                                            <div style={{
                                                color: '#6c757d',
                                                fontSize: '0.8rem',
                                                marginTop: '4px'
                                            }}>
                                                📚 {registro.modalidad}
                                            </div>
                                        )}
                                        {/* Botón para completar registro */}
                                        {!info.vencido && onCompletarRegistro && (
                                            <button
                                                onClick={() => onCompletarRegistro(registro)}
                                                className="boton-principal"
                                                style={{
                                                    backgroundColor: '#007bff',
                                                    borderColor: '#007bff',
                                                    fontSize: '0.8rem',
                                                    padding: '4px 8px',
                                                    marginTop: '8px',
                                                    minWidth: '120px'
                                                }}
                                                title="Completar este registro con documentación"
                                            >
                                                ✅ Completar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer con botones */}
                <div style={{
                    borderTop: '1px solid #e1e8ed',
                    paddingTop: '15px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    <button 
                        onClick={generarReporteAdministrativo}
                        className="boton-principal"
                        style={{
                            backgroundColor: '#007bff',
                            borderColor: '#007bff',
                            fontSize: '0.9rem'
                        }}
                        title="Generar reporte legible para administración escolar"
                    >
                        📋 Reporte TXT
                    </button>
                    <button 
                        onClick={generarReporteCSV}
                        className="boton-principal"
                        style={{
                            backgroundColor: '#17a2b8',
                            borderColor: '#17a2b8',
                            fontSize: '0.9rem'
                        }}
                        title="Generar archivo Excel (CSV) para análisis de datos"
                    >
                        📊 Excel (CSV)
                    </button>
                    <button 
                        onClick={handleDescargar}
                        className="boton-principal"
                        disabled={descargando}
                        style={{
                            backgroundColor: descargando ? '#ccc' : '#28a745',
                            borderColor: descargando ? '#ccc' : '#28a745',
                            cursor: descargando ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                        }}
                        title="Descargar archivo JSON técnico (para programadores)"
                    >
                        {descargando ? '⏳ Descargando...' : '💾 JSON Técnico'}
                    </button>
                </div>
            </div>
        </div>
    );
};

ModalRegistrosPendientes.propTypes = {
    registros: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired,
    onDescargar: PropTypes.func.isRequired,
    onCompletarRegistro: PropTypes.func,
};

export default ModalRegistrosPendientes;