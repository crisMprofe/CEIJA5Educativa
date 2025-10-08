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
    
    // Solo mostrar el badge si el registro está aprobado y registrado (no en pendientes)
    const mostrarBadgeAprobado = !!estaRegistrado;

    return (
        <div 
            key={registro.id || index} 
            className={`registro-item ${info.vencido ? 'registro-vencido' : 'registro-vigente'}`} 
            style={{ borderLeftColor: info.color }}
        >
            <div className="registro-grid">
                {/* Información principal del registro */}
                <div className="registro-info-principal">
                    <div className="registro-info-estudiante">
                        <h4>
                            {registro.datos?.nombre || registro.nombre} {registro.datos?.apellido || registro.apellido}
                            {mostrarBadgeAprobado && (
                                <span 
                                    className="badge-estudiante-registrado" 
                                    style={{
                                        display: 'inline-block !important',
                                        visibility: 'visible !important',
                                        opacity: '1 !important',
                                        backgroundColor: '#28a745 !important',
                                        color: 'white !important',
                                        padding: '6px 12px !important',
                                        borderRadius: '12px !important',
                                        marginLeft: '10px !important',
                                        fontSize: '0.8rem !important',
                                        fontWeight: 'bold !important',
                                        zIndex: '9999 !important'
                                    }}
                                >
                                    ✅ Estudiante Aprobado y Registrado
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
                        {/* Mostrar alarma/vencimiento solo si NO está registrado */}
                        {!mostrarBadgeAprobado && (
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
                    info={info}
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