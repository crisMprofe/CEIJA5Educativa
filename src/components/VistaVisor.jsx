import VisorEstudiante from './VisorEstudiante';
import serviceModificarEstudiante from '../services/serviceModificarEstudiante'; // ✅ Importa el servicio unificado
import { useState } from 'react';
import PropTypes from 'prop-types';
import "../estilos/Modal.css";
import '../estilos/visorEstudiante.css';


// ✅ Componente principal
const VistaVisor = ({ estudiante, onClose, onVolver, isConsulta, isEliminacion, modalidadId, modalidadFiltrada }) => {
    const [alerta, setAlerta] = useState(null);

    const handleModificar = async (accion, datos) => {
        try {
            let res;
            if (accion === 'todo') {
                const formData = new FormData();

            // Datos generales
            Object.entries(datos).forEach(([key, value]) => {
                if (key === 'archivos' || key === 'detalleDocumentacion') return; // Los manejamos aparte
                formData.append(key, value ?? '');
            });

            // Documentación
            formData.append('detalleDocumentacion', JSON.stringify(datos.detalleDocumentacion || []));
            if (datos.archivos) {
                Object.entries(datos.archivos).forEach(([desc, archivo]) => {
                    if (archivo) {
                        const clave = `archivo_${desc.replace(/\s+/g, '').toLowerCase()}`;
                        formData.append(clave, archivo, archivo.name);
                    }
                });
            }

            // Llamar al servicio unificado
            res = await serviceModificarEstudiante.modificarEstudiante(datos.dni, formData);
        }

        setAlerta({
            tipo: res?.success ? 'success' : 'error',
            mensaje: res?.message || 'Estudiante actualizado correctamente.',
        });
    } catch (err) {
        setAlerta({ tipo: 'error', mensaje: err.message || 'Error inesperado al guardar todo.' });
    }
};


    return (
        <div>
            {alerta && <div className={`alerta alerta-${alerta.tipo}`}>{alerta.mensaje}</div>}
            <VisorEstudiante
                estudiante={estudiante}
                onClose={onClose}
                onVolver={onVolver}
                onModificar={handleModificar}
                isConsulta={isConsulta}
                isEliminacion={isEliminacion}
                modalidadId={modalidadId}
                modalidadFiltrada={modalidadFiltrada}
            />
        </div>
    );
};

VistaVisor.propTypes = {
    estudiante: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onVolver: PropTypes.func.isRequired,
    isConsulta: PropTypes.bool,
    isEliminacion: PropTypes.bool,
    modalidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    modalidadFiltrada: PropTypes.string
};

export default VistaVisor;
