import { useMemo } from 'react';
import PropTypes from 'prop-types';
import SeccionDocumentos from './SeccionDocumentos';
import AccionesRegistro from './AccionesRegistro';
import { obtenerDocumentosRequeridos } from '../../utils/registroSinDocumentacion';

const RegistroPendienteItem = ({ 
    registro, 
    index,
    estaRegistrado,
    mapeoDocumentos,
    enviandoEmail,
    onCompletar,
    onEliminar,
    onEnviarEmail,
    obtenerInfoVencimiento
}) => {
    const info = obtenerInfoVencimiento(registro);
    
    // Debug log solo una vez por componente
    // if (estaRegistrado) {
    //     console.log('🏷️ Badge visible para:', registro.datos?.nombre, registro.datos?.apellido, 'DNI:', registro.datos?.dni);
    // }
    
    // Memoizar el estado de documentación para evitar cálculos innecesarios
    const estadoDoc = useMemo(() => {
        const modalidad = registro.datos?.modalidad || registro.modalidad || '';
        const planAnio = registro.datos?.planAnio || registro.planAnio || '';
        const modulos = registro.datos?.modulos || registro.modulos || '';
        console.log('[DEBUG] Llamando a obtenerDocumentosRequeridos desde RegistroPendienteItem.jsx con:', {
            modalidad, planAnio, modulos
        });
        const requerimientos = obtenerDocumentosRequeridos(modalidad, planAnio, modulos);
        const documentosRequeridosDinamicos = requerimientos.documentos || [];
        const documentosAlternativos = requerimientos.alternativos;
        
        let documentosSubidos = [];
        
        if (Array.isArray(registro.documentosSubidos)) {
            documentosSubidos = registro.documentosSubidos;
        } else if (registro.archivos && typeof registro.archivos === 'object') {
            documentosSubidos = Object.keys(registro.archivos).filter(key => 
                registro.archivos[key] && registro.archivos[key] !== null && registro.archivos[key] !== ''
            );
        } else {
            // No documentos subidos encontrados
        }
        
        let documentosFaltantes = [];
        let documentosValidosSubidos = [];
        
        if (documentosAlternativos) {
            const tienePreferido = documentosSubidos.includes(documentosAlternativos.preferido);
            const tieneAlternativa = documentosSubidos.includes(documentosAlternativos.alternativa);
            
            if (tienePreferido || tieneAlternativa) {
                documentosValidosSubidos = documentosSubidos;
                documentosFaltantes = documentosRequeridosDinamicos.filter(doc => 
                    doc !== documentosAlternativos.preferido && 
                    doc !== documentosAlternativos.alternativa && 
                    !documentosSubidos.includes(doc)
                );
            } else {
                documentosValidosSubidos = documentosSubidos.filter(doc => 
                    doc !== documentosAlternativos.preferido && 
                    doc !== documentosAlternativos.alternativa
                );
                documentosFaltantes = documentosRequeridosDinamicos.filter(doc => !documentosSubidos.includes(doc));
            }
        } else {
            documentosValidosSubidos = documentosSubidos.filter(doc => documentosRequeridosDinamicos.includes(doc));
            documentosFaltantes = documentosRequeridosDinamicos.filter(doc => !documentosSubidos.includes(doc));
        }
        
        const totalRequeridos = documentosRequeridosDinamicos.length - (documentosAlternativos ? 1 : 0);
        
        return {
            subidos: documentosValidosSubidos,
            faltantes: documentosFaltantes,
            totalSubidos: documentosValidosSubidos.length,
            totalRequeridos: totalRequeridos,
            modalidad: modalidad,
            plan: planAnio || modulos,
            documentosAlternativos: documentosAlternativos
        };
    }, [registro.datos, registro.modalidad, registro.planAnio, registro.modulos, registro.documentosSubidos, registro.archivos]);
    

    // Mostrar cartel de procesado si el estado es PROCESADO
    const esProcesado = registro.estado === 'PROCESADO' || registro.estado === 'APROBADO_Y_PROCESADO';
    const mostrarBadgeAprobado = !!estaRegistrado || esProcesado;

    return (
        <div 
            key={registro.id || index} 
            className={`registro-item ${esProcesado ? 'registro-procesado' : (info.vencido ? 'registro-vencido' : 'registro-vigente')}`} 
            style={{ borderLeftColor: esProcesado ? '#28a745' : info.color }}
        >
            <div className="registro-grid">
                {/* Información principal del registro */}
                <div className="registro-info-principal">
                    <div className="registro-info-estudiante">
                        <h4>
                            {registro.datos?.nombre || registro.nombre} {registro.datos?.apellido || registro.apellido}
                            {esProcesado && (
                                <span 
                                    className="badge-estudiante-registrado" 
                                    style={{
                                        display: 'inline-block',
                                        visibility: 'visible',
                                        opacity: 1,
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        marginLeft: '10px',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        zIndex: 9999
                                    }}
                                >
                                    ✅ Registro Procesado y Aprobado
                                </span>
                            )}
                            {!esProcesado && mostrarBadgeAprobado && (
                                <span 
                                    className="badge-estudiante-registrado" 
                                    style={{
                                        display: 'inline-block',
                                        visibility: 'visible',
                                        opacity: 1,
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        marginLeft: '10px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        zIndex: 9999
                                    }}
                                >
                                    ✅ Registro Procesado y Aprobado
                                </span>
                            )}
                        </h4>
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
                            <strong>📎 Documentos:</strong> {estadoDoc.totalSubidos}/{estadoDoc.totalRequeridos}
                        </p>
                    </div>
                    {/* Información de la derecha */}
                    <div className="registro-info-derecha">
                        {/* Mostrar alarma/vencimiento solo si NO está registrado NI procesado */}
                        {!mostrarBadgeAprobado && !esProcesado && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                {/* Sección de documentos */}
                <SeccionDocumentos estadoDoc={estadoDoc} mapeoDocumentos={mapeoDocumentos} />

                {/* Información sobre documentos alternativos */}
                {estadoDoc.documentosAlternativos && estadoDoc.faltantes.length === 0 && (
                    <div className="info-documento-usado">
                        {estadoDoc.subidos.includes(estadoDoc.documentosAlternativos.preferido) ? 
                            `✨ Presenta documento preferido: ${mapeoDocumentos[estadoDoc.documentosAlternativos.preferido]}` :
                            `📝 Presenta alternativa: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa]}`
                        }
                    </div>
                )}

                {/* Acciones del registro */}
                <AccionesRegistro
                    registro={registro}
                    info={{...info, esProcesado}}
                    enviandoEmail={enviandoEmail}
                    onCompletar={onCompletar}
                    onEliminar={onEliminar}
                    onEnviarEmail={onEnviarEmail}
                />
            </div>
        </div>
    );
};

RegistroPendienteItem.propTypes = {
    registro: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    estaRegistrado: PropTypes.bool,
    mapeoDocumentos: PropTypes.object.isRequired,
    enviandoEmail: PropTypes.bool.isRequired,
    onCompletar: PropTypes.func.isRequired,
    onEliminar: PropTypes.func.isRequired,
    onEnviarEmail: PropTypes.func.isRequired,
    obtenerInfoVencimiento: PropTypes.func.isRequired
};

export default RegistroPendienteItem;