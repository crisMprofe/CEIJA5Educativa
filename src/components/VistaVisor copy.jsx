import VisorEstudiante from './VisorEstudiante';
import serviceModificarEstSeccion from '../services/serviceModificarEstSeccion';
import { useState } from 'react';
import PropTypes from 'prop-types';
import "../estilos/Modal.css";
import '../estilos/visorEstudiante.css';


// ✅ Componente principal
const VistaVisor = ({ estudiante, onClose, onVolver, isConsulta, isEliminacion, modalidadId, modalidadFiltrada }) => {
    const [alerta, setAlerta] = useState(null);

    const handleModificar = async (seccion, datos) => {
        try {
            let res;
            if (seccion === 'personales') {
                // Enviar todos los datos personales
                res = await serviceModificarEstSeccion.modificarPersonales(estudiante.idInscripcion, datos);
            }
            else if (seccion === 'domicilio') {
                // Enviar todos los datos de domicilio
                res = await serviceModificarEstSeccion.modificarDomicilio(estudiante.idInscripcion, datos);
            }
            else if (seccion === 'academica') {
                const datosAcademica = {
                    modalidadId: Number(datos.modalidadId || 1),
                    planAnioId: Number(datos.planAnioId || 1),
                    modulosId: datos.modulosId || '',
                    estadoInscripcionId: datos.estadoInscripcionId || '',
                    fechaInscripcion: datos.fechaInscripcion || ''
                };
                res = await serviceModificarEstSeccion.modificarAcademica(estudiante.idInscripcion, datosAcademica);
            }
            else if (seccion === 'documentacion') {
                const formData = new FormData();
                formData.append('detalleDocumentacion', JSON.stringify(datos.detalleDocumentacion));
                formData.append('nombre', estudiante.nombre);
                formData.append('apellido', estudiante.apellido);

                if (datos.archivos) {
                    Object.entries(datos.archivos).forEach(([desc, archivo]) => {
                        if (archivo) {
                            const clave = `archivo_${desc.replace(/\s+/g, '').toLowerCase()}`;
                            formData.append(clave, archivo, archivo.name);
                        }
                    });
                }
                res = await serviceModificarEstSeccion.modificarDocumentacion(estudiante.idInscripcion, formData);
            }

            let nombreSeccion = '';
            switch (String(seccion).toLowerCase()) {
                case 'personales': nombreSeccion = 'Personales'; break;
                case 'domicilio': nombreSeccion = 'Domicilio'; break;
                case 'academica': nombreSeccion = 'Académica'; break;
                case 'documentacion': nombreSeccion = 'Documentación'; break;
                default: nombreSeccion = String(seccion);
            }
            setAlerta({
                tipo: res?.success ? 'success' : 'error',
                mensaje: res?.message || `Sección '${nombreSeccion}' actualizada correctamente.`,
            });

        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message || 'Error inesperado.' });
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
