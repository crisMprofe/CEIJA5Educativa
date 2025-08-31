import { useState, useEffect } from 'react';
import { useUserContext } from '../context/useUserContext';
// import PropTypes from 'prop-types';
import AlertaMens from './AlertaMens';
import GestionCRUDContenido from './GestionCRUDContenido';
// import BusquedaDNI from './BusquedaDNI';
// Importar PropTypes para GestionCRUDContenido
import PropTypes from 'prop-types';
import '../estilos/gestionCRUD.css';

const GestionCRUD = ({ isAdmin, onClose, vistaInicial = 'opciones', esModificacion = false, soloListar = false, modalidad, modalidadId }) => {
    const { user } = useUserContext();
    const [vistaActual, setVistaActual] = useState(vistaInicial); // Usar vistaInicial como estado inicial
    const [estudiante, setEstudiante] = useState(null);
    const [alert, setAlert] = useState({ text: '', variant: '' });
    const [vistaAnterior, setVistaAnterior] = useState(null); // Para rastrear la vista anterior
    const [refreshKey, setRefreshKey] = useState(0); // Para forzar recarga de la lista
    // Inicializar modoModificacion basado en prop esModificacion o vista inicial
    const [modoModificacion, setModoModificacion] = useState(
        esModificacion || vistaInicial === 'opcionesModificar'
    );
    // Detectar si estamos en modo eliminación basado en la vista inicial
    const [modoEliminacion] = useState(
        vistaInicial === 'opcionesEliminar' || vistaInicial === 'busquedaDNIEliminar' || vistaInicial === 'listaEliminar'
    );

    // Ocultar automáticamente el mensaje flotante después de 4 segundos
    useEffect(() => {
        if (alert.text) {
            const timer = setTimeout(() => {
                setAlert({ text: '', variant: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [alert.text]);



    return (
        <div className="gestion-crud-container">
            {alert.text && (
                <AlertaMens 
                    text={alert.text} 
                    variant={alert.variant}
                    duration={4000}
                    onClose={() => setAlert({ text: '', variant: '' })}
                />
            )}
            <GestionCRUDContenido
                isAdmin={isAdmin}
                onClose={onClose}
                vistaInicial={vistaInicial}
                soloListar={soloListar}
                modalidadId={modalidadId}
                modalidad={modalidad}
                user={user}
                vistaActual={vistaActual}
                setVistaActual={setVistaActual}
                estudiante={estudiante}
                setEstudiante={setEstudiante}
                alert={alert}
                setAlert={setAlert}
                vistaAnterior={vistaAnterior}
                setVistaAnterior={setVistaAnterior}
                refreshKey={refreshKey}
                setRefreshKey={setRefreshKey}
                modoModificacion={modoModificacion}
                setModoModificacion={setModoModificacion}
                modoEliminacion={modoEliminacion}
            />
            {/* El formulario de BusquedaDNI solo debe renderizarse desde GestionCRUDContenido para evitar duplicados */}
        </div>
    );
};


GestionCRUD.propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    vistaInicial: PropTypes.string,
    esModificacion: PropTypes.bool,
    soloListar: PropTypes.bool,
    modalidad: PropTypes.string,
    modalidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Puede ser string o number
};

// La validación de PropTypes para GestionCRUDContenido se movió a su propio archivo para evitar errores y seguir buenas prácticas.

export default GestionCRUD;
