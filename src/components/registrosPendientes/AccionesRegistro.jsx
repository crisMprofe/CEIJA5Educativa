import PropTypes from 'prop-types';

const AccionesRegistro = ({ 
    registro, 
    info, 
    enviandoEmail, 
    onCompletar, 
    onEliminar, 
    onEnviarEmail 
}) => {
    // Log eliminado para evitar spam en console

    // Si el registro está procesado, solo mostrar el botón de eliminar
    if (info.esProcesado) {
        return (
            <div className="registro-acciones" style={{
                display: 'flex',
                gap: '8px',
                marginTop: '15px',
                padding: '15px 10px 10px 10px',
                borderTop: '2px solid #2d4177',
                flexWrap: 'wrap',
                alignItems: 'center',
                backgroundColor: '#f8f9fd',
                borderRadius: '0 0 8px 8px',
                minHeight: '50px',
                zIndex: 999,
                position: 'relative'
            }}>
                <span style={{ fontSize: '1rem', color: '#28a745', fontWeight: 'bold', marginRight: '10px' }}>
                    ✅ Registro Procesado y Aprobado
                </span>
                <button
                    onClick={() => onEliminar(registro)}
                    className="btn-eliminar"
                    title="Eliminar este registro del listado de pendientes (usar después de que el estudiante esté registrado y aprobado)"
                    disabled={enviandoEmail}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        margin: '2px',
                        visibility: 'visible',
                        opacity: 1,
                        whiteSpace: 'nowrap'
                    }}
                >
                    🗑️ Eliminar del Listado
                </button>
            </div>
        );
    }
    // Resto de acciones para registros NO procesados
    return (
        <div className="registro-acciones" style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '15px', 
            padding: '15px 10px 10px 10px',
            borderTop: '2px solid #2d4177',
            flexWrap: 'wrap',
            alignItems: 'center',
            backgroundColor: '#f8f9fd',
            borderRadius: '0 0 8px 8px',
            minHeight: '50px',
            zIndex: 999,
            position: 'relative'
        }}>
            <div style={{ fontSize: '10px', color: '#666', marginRight: '10px' }}>
                🔧 Botones de acción:
            </div>
            {/* Botón para completar/editar registro */}
            {!info.vencido && (
                <button
                    onClick={() => onCompletar(registro)}
                    className="btn-completar"
                    title="Abrir formulario para completar la documentación y editar datos"
                    disabled={enviandoEmail}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        margin: '2px',
                        visibility: 'visible',
                        opacity: 1,
                        whiteSpace: 'nowrap'
                    }}
                >
                    📝 Completar
                </button>
            )}
            {/* Botón para enviar email individual */}
            {(registro.datos?.email || registro.email) && (
                <button
                    onClick={() => onEnviarEmail(registro)}
                    className="btn-notificar"
                    disabled={enviandoEmail}
                    title={`Enviar notificación por email a ${registro.datos?.email || registro.email}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: info.vencido ? '#6c757d' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: enviandoEmail ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        margin: '2px',
                        opacity: info.vencido ? 0.6 : 1,
                        visibility: 'visible',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {enviandoEmail ? '📧 Enviando...' : `📧 ${info.vencido ? 'Vencido' : 'Notificar'}`}
                </button>
            )}
            {/* Botón para eliminar registro */}
            <button
                onClick={() => onEliminar(registro)}
                className="btn-eliminar"
                title="Eliminar este registro del listado de pendientes (usar después de que el estudiante esté registrado y aprobado)"
                disabled={enviandoEmail}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    margin: '2px',
                    visibility: 'visible',
                    opacity: 1,
                    whiteSpace: 'nowrap'
                }}
            >
                🗑️ Eliminar del Listado
            </button>
        </div>
    );
};

AccionesRegistro.propTypes = {
    registro: PropTypes.object.isRequired,
    info: PropTypes.object.isRequired,
    enviandoEmail: PropTypes.bool.isRequired,
    onCompletar: PropTypes.func.isRequired,
    onEliminar: PropTypes.func.isRequired,
    onEnviarEmail: PropTypes.func.isRequired
};

export default AccionesRegistro;