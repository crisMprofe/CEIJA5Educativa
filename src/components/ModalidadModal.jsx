// src/components/ModalidadModal.jsx
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import '../estilos/modalM.css';


const ModalidadModal = ({ modalidad, onClose }) => {
    const renderContent = () => {
        if (modalidad === 'Presencial') {
            return (
                <>
                    <h2 className="subH2"> Modalidad Presencial</h2>
                    <p>&quot;Inscripciones desde el 20 de febrero del ciclo lectivo.</p>
                    <p> Horario para inscripciones: 19 a 22 hs.</p>
                   
                    <div className="modal-doc">
                        <fieldset>
                            <legend>Documentación completa a presentar:</legend>
                             <ul>
                            <li>Fotocopia DNI</li>
                            <li>Fotocopia Partida Nacimiento</li>
                            <li>Foto 4x4 (dos) / Ficha Médica CUS</li>
                            <li>1er Año: Título nivel primario / Pase escuela Secundaria hasta 3er año incompleto.</li>
                            <li>2do Año: Pase escuela Secundaria CBU completo / 4to año incompleto.</li>
                            <li>3er Año: Pase escuela Secundaria 4to año completo.</li>
                            </ul>
                        </fieldset>
                   
                    </div>
                    
                </>
            );
        } else if (modalidad === 'Semipresencial') {
            return (
                <>
                    <h2>Modalidad Semipresencial</h2>
                    <p>Inscripciones desde el 20 de febrero del ciclo lectivo.</p>
                    <p>Horario para inscripciones: 19 a 22 hs.</p>
                   
                    <div className="modal-doc">
                    <fieldset>
                    <legend>Documentación completa a presentar:</legend>
                    <ul>
                        <li>Fotocopia DNI</li>
                        <li>Fotocopia Partida Nacimiento</li>
                        <li>Foto 4x4 (dos) / Ficha Médica CUS</li>
                        <li>Plan A: Título nivel primario / Pase escuela Secundaria hasta 3er año incompleto.</li>
                        <li>Plan B: Pase escuela Secundaria CBU completo / 4to año incompleto.</li>
                        <li>Plan C: Pase escuela Secundaria 4to año completo.</li>
                    </ul>
                    </fieldset>
                    </div>
                </>
            );
        }
        return null;
    };


    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <button className="modal-close" onClick={onClose}>✖</button>
                {renderContent()}
                <Link to={`/preinscripcion-estd?modalidad=${modalidad}`}>
                    <button type="button" className="modal-button">
                        Ir al Formulario de Preinscripción
                    </button>
                </Link>
            </div>
        </div>
    );
};
ModalidadModal.propTypes = {
    modalidad: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default ModalidadModal;