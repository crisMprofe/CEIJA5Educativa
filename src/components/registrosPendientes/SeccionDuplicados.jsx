import PropTypes from 'prop-types';

const SeccionDuplicados = ({ 
    estadoDuplicados, 
    limpiandoDuplicados,
    onVerificarDuplicados, 
    onLimpiarDuplicados, 
    onTestSistema7Dias 
}) => {
    return (
        <>
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
                    onClick={onVerificarDuplicados}
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
                        onClick={onLimpiarDuplicados}
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
                        onClick={onTestSistema7Dias}
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
        </>
    );
};

SeccionDuplicados.propTypes = {
    estadoDuplicados: PropTypes.object,
    limpiandoDuplicados: PropTypes.bool.isRequired,
    onVerificarDuplicados: PropTypes.func.isRequired,
    onLimpiarDuplicados: PropTypes.func.isRequired,
    onTestSistema7Dias: PropTypes.func.isRequired
};

export default SeccionDuplicados;