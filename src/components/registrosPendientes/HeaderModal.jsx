import PropTypes from 'prop-types';

const HeaderModal = ({ 
    cantidadTotal, 
    fechaActualizacion, 
    onCerrar 
}) => {
    return (
        <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '1px solid #e0e0e0'
        }}>
            <div>
                <h2 style={{ margin: 0, color: '#333' }}>
                    📋 Registros Pendientes
                </h2>
                <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#fafbfc;', 
                    marginTop: '5px' 
                }}>
                    Total: <strong>{cantidadTotal}</strong> registros
                    {fechaActualizacion && (
                        <span style={{ marginLeft: '15px' }}>
                            📅 Actualizado: {fechaActualizacion}
                        </span>
                    )}
                </div>
            </div>
            <button
                onClick={onCerrar}
                style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Cerrar modal"
            >
                ✕
            </button>
        </div>
    );
};

HeaderModal.propTypes = {
    cantidadTotal: PropTypes.number.isRequired,
    fechaActualizacion: PropTypes.string,
    onCerrar: PropTypes.func.isRequired
};

export default HeaderModal;