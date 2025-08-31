import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from './Input';
import AlertaMens from './AlertaMens';
import service from '../services/serviceObtenerAcad'; // Asegúrate de tener este método
import '../estilos/estadoInscripcion.css';

const EstadoInscripcion = ({ value, handleChange, errors = {} }) => {

    const [estados, setEstados] = useState([]);
    const [touched, setTouched] = useState(false);

   
    useEffect(() => {
        // Cargar estados desde la API
        const fetchEstados = async () => {
            const data = await service.getEstadosInscripcion();
            setEstados(data);
        };
        fetchEstados();
    }, []);
    const handleBlur = () => setTouched(true);

    return (
        <div className="estado-inscripcion-container">
            <Input
                className="estadoInscripcion"
                label="Estado de Inscripción"
                name="idEstadoInscripcion" // Usa el nombre correcto para el backend
                type="select"
                options={[
                    { value: '', label: 'Estado' },
                    ...estados.map(e => ({
                        value: e.id, // Aquí va el id
                        label: e.descripcionEstado
                    }))
                ]}
                registro={{ value, onChange: handleChange, onBlur: handleBlur }}
            />
            {touched.idEstadoInscripcion && errors.idEstadoInscripcion && (
            <AlertaMens text={errors.idEstadoInscripcion} variant="error" />
            )}
        </div>
    );
};

EstadoInscripcion.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object
};

export default EstadoInscripcion;