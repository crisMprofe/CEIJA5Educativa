// src/components/ModalidadModal.jsx
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import CloseButton from './CloseButton';
import VolverButton from './VolverButton';
import '../estilos/modalM.css';
import '../estilos/botones.css';


const ModalidadModal = ({ modalidad, onClose, onBackToSelector }) => {
    const navigate = useNavigate();

    const goHome = () => {
        // Cerrar todo y navegar a Home
        onClose();
        navigate('/');
    };

    const handleBack = () => {
        // Si hay callback para volver al selector, lo usa, sino cierra todo
        if (onBackToSelector) {
            onBackToSelector();
        } else {
            onClose();
        }
    };

    const renderContent = () => {
        if (modalidad === 'Presencial') {
            return (
                <>
                    <div className="modalidad-header">
                        <div className="modalidad-icon">📚</div>
                        <h2 className="modalidad-title">Modalidad Presencial</h2>
                        <p className="modalidad-subtitle">Educación tradicional con clases diarias</p>
                    </div>
                    
                    <div className="modalidad-info">
                        <div className="info-card">
                            <h4>📅 Período de Inscripciones</h4>
                            <p>Desde el 20 de febrero del ciclo lectivo</p>
                        </div>
                        
                        <div className="info-card">
                            <h4>🕐 Horarios de Atención</h4>
                            <p>Lunes a Viernes: 19:00 a 22:00 hs</p>
                        </div>
                    </div>
                   
                    <div className="documentacion-section">
                        <h4 className="doc-title">📋 Documentación Requerida</h4>
                        <div className="doc-list">
                            <div className="doc-item">📄 Fotocopia de DNI</div>
                            <div className="doc-item">📜 Fotocopia Partida de Nacimiento</div>
                            <div className="doc-item">📷 Foto 4x4 (dos unidades)</div>
                            <div className="doc-item">🏥 Ficha Médica CUS</div>
                        </div>
                        
                        <div className="plan-requirements">
                            <div className="plan-item">
                                <strong>1er Año:</strong> Título nivel primario / Pase escuela Secundaria hasta 3er año incompleto
                            </div>
                            <div className="plan-item">
                                <strong>2do Año:</strong> Pase escuela Secundaria CBU completo / 4to año incompleto
                            </div>
                            <div className="plan-item">
                                <strong>3er Año:</strong> Pase escuela Secundaria 4to año completo
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (modalidad === 'Semipresencial') {
            return (
                <>
                    <div className="modalidad-header">
                        <div className="modalidad-icon">💻</div>
                        <h2 className="modalidad-title">Modalidad Semipresencial</h2>
                        <p className="modalidad-subtitle">Flexibilidad y autonomía en tu aprendizaje</p>
                    </div>
                    
                    <div className="modalidad-info">
                        <div className="info-card">
                            <h4>📅 Período de Inscripciones</h4>
                            <p>Desde el 20 de febrero del ciclo lectivo</p>
                        </div>
                        
                        <div className="info-card">
                            <h4>🕐 Horarios de Atención</h4>
                            <p>Lunes a Viernes: 19:00 a 22:00 hs</p>
                        </div>
                    </div>
                   
                    <div className="documentacion-section">
                        <h4 className="doc-title">📋 Documentación Requerida</h4>
                        <div className="doc-list">
                            <div className="doc-item">📄 Fotocopia de DNI</div>
                            <div className="doc-item">📜 Fotocopia Partida de Nacimiento</div>
                            <div className="doc-item">📷 Foto 4x4 (dos unidades)</div>
                            <div className="doc-item">🏥 Ficha Médica CUS</div>
                        </div>
                        
                        <div className="plan-requirements">
                            <div className="plan-item">
                                <strong>Plan A:</strong> Título nivel primario / Pase escuela Secundaria hasta 3er año incompleto
                            </div>
                            <div className="plan-item">
                                <strong>Plan B:</strong> Pase escuela Secundaria CBU completo / 4to año incompleto
                            </div>
                            <div className="plan-item">
                                <strong>Plan C:</strong> Pase escuela Secundaria 4to año completo
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        return null;
    };
    return (
        <div className="modal-overlay">
            <div className="modal-container modal-modalidad-info">
                {/* Header con navegación limpia */}
                <div className="modalidad-modal-header">
                    <div className="modalidad-nav-left">
                        <VolverButton onClick={handleBack} />
                    </div>
                    <div className="modalidad-nav-center">
                        <span className="modal-logo-text">CEIJA 5</span>
                        <button 
                            onClick={goHome}
                            className="inicio-button-center"
                            title="Ir al inicio"
                        >
                            🏠 Inicio
                        </button>
                    </div>
                    <div className="modalidad-nav-right">
                        <CloseButton onClose={onClose} variant="modal" />
                    </div>
                </div>

                {/* Contenido del modal */}
                <div className="modal-content-body">
                    {renderContent()}
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 32 }}>
                        <Link to={`/preinscripcion-estd?modalidad=${modalidad}&web=true`}>
                            <button type="button" className="boton-principal modal-cta-button">
                                ✨ Iniciar Preinscripción
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
ModalidadModal.propTypes = {
    modalidad: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onBackToSelector: PropTypes.func, // Función opcional para volver al selector
};

export default ModalidadModal;