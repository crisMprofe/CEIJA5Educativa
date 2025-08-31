import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import useGestionDocumentacion from '../hooks/useGestionDocumentacion';
import GestionEstudianteView from './GestionEstudianteView';
import serviceRegInscripcion from '../services/serviceRegInscripcion';
import serviceInscripcion from '../services/serviceInscripcion';

const GestionEstudiante = ({ modalidad, accion, isAdmin, onClose }) => {
    const navigate = useNavigate();
    const {
        files,
        previews,
        alert,
        setAlert,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
    } = useGestionDocumentacion();

    const handleSubmit = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            setAlert({ text: '', variant: '' });

            const camposObligatorios = ['nombre', 'apellido', 'dni', 'cuil', 'fechaNacimiento', 'calle', 'numero', 'barrio', 'localidad', 'provincia'];
            const camposFaltantes = camposObligatorios.filter((campo) => !values[campo]);

            if (camposFaltantes.length > 0) {
                setAlert({ text: `Faltan completar: ${camposFaltantes.join(', ')}`, variant: 'error' });
                return;
            }

            const detalleDocumentacion = buildDetalleDocumentacion();
            const formDataToSend = new FormData();
          
            for (let pair of formDataToSend.entries()) {
                         console.log(pair[0], pair[1]);
                }

            // Solo iterar los values, no agregar modalidad manualmente para evitar duplicados
            Object.entries(values).forEach(([key, value]) => {
                // Excluir campos de archivos para evitar conflictos
                const archivosFields = ['archivo_dni', 'archivo_cuil', 'archivo_partidaNacimiento', 'archivo_fichaMedica', 
                                       'archivo_solicitudPase', 'archivo_analiticoParcial', 'archivo_certificadoNivelPrimario', 'foto'];
                if (!archivosFields.includes(key)) {
                    const campo = key === 'modulos' ? 'idModulo' : key;
                    formDataToSend.append(campo, value);
                }
            });

            Object.entries(files).forEach(([key, file]) => {
                if (file) formDataToSend.append(key, file);
            });

            formDataToSend.append('detalleDocumentacion', JSON.stringify(detalleDocumentacion));

            let response;
            if (accion === "Registrar") {
                response = isAdmin
                    ? await serviceRegInscripcion.createEstd(formDataToSend)
                    : await serviceRegInscripcion.createWebInscription(formDataToSend);
            } else if (accion === "Modificar" && isAdmin) {
                response = await serviceInscripcion.updateEstd(formDataToSend, values.dni);
            }

            if (response?.message) {
                setAlert({ text: response.message, variant: 'success' });
            } else {
                setAlert({ text: 'El formulario se envió, pero no hubo respuesta.', variant: 'warning' });
            }
        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Ocurrió un error al enviar los datos.';
            setAlert({ text: mensajeError, variant: 'error' });
        } finally {
            setTimeout(() => setAlert({ text: '', variant: '' }), 10000);
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={{
                nombre: '',
                    apellido: '',
                    tipoDocumento: '',        // asegurate que esté en el formulario y tenga opciones válidas
                    dni: '',
                    paisEmision: '',          // lo mismo
                    cuil: '',
                    fechaNacimiento: '',      // debe estar en formato 'YYYY-MM-DD' para que sea válido
                    calle: '',
                    numero: '',               // si es numérico en backend, convertí luego
                    barrio: '',
                    localidad: '',
                    provincia: '',

                    modalidad: modalidad || '',  // viene como prop
                    modalidadId: modalidad === 'Presencial' ? 1 : modalidad === 'Semipresencial' ? 2 : '',

                    planAnio: '',              // asegurate de que esté presente en el formulario (input o select)
                    modulos: '',               // idem arriba
                    idEstadoInscripcion: '',  
                    // Campos de documentación (archivos)
                    archivo_dni: null,
                    archivo_cuil: null,
                    archivo_partidaNacimiento: null,
                    archivo_fichaMedica: null,
                    archivo_solicitudPase: null,
                    archivo_analiticoParcial: null,
                    archivo_certificadoNivelPrimario: null,
                    foto: null, 
            }}
            onSubmit={handleSubmit}
        >
            {(formikProps) => (
                <GestionEstudianteView
                    onClose={onClose}
                    navigate={navigate}
                    previews={previews}
                    alert={alert}
                    setAlert={setAlert}
                    accion={accion}
                    isAdmin={isAdmin}
                    resetArchivos={resetArchivos}
                    handleFileChange={handleFileChange}
                    {...formikProps}
                />
            )}
        </Formik>
    );
};

GestionEstudiante.propTypes = {
    modalidad: PropTypes.string.isRequired,
    accion: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default GestionEstudiante;
