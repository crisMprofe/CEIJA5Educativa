import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../estilos/estilosDocumentacion.css';
import AlertaMens from './AlertaMens';
import Input from './Input';
import service from '../services/serviceObtenerAcad'; // Asegúrate de que la ruta es correcta
import AreaEstudioSelector from './AreaEstudioSelector';

const PlanAnioSelector = ({ modalidad, handleChange, value, modalidadId, setFieldValue }) => {
    const [alerta, setAlerta] = useState(false);
    const [idModulo, setIdModulo] = useState('');
    const [modulos, setModulos] = useState([]); // Aquí almacenamos los módulos
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSelection = (event) => {
        const newValue = event.target.value;
        setFieldValue('planAnio', newValue); // Actualiza Formik
         if (typeof handleChange === 'function') { // ← defensa extra
                    handleChange(event);
                } // Actualiza el valor en Formik
        setAlerta(newValue === ""); // Muestra la alerta si no selecciona nada
        setIdModulo(''); // Limpia módulo si cambia plan
        setFieldValue('modulos', ''); // Limpia módulo en Formik
    };

   const handleModuloChange = (event) => {
    setIdModulo(event.target.value);
    setFieldValue('modulos', event.target.value);
    // Actualiza el campo "modulos" en Formik
    if (typeof setFieldValue === 'function') {
        setFieldValue('modulos', event.target.value);
    }
};

    // Efecto para obtener los módulos cuando la modalidad cambia
    useEffect(() => {
        if (modalidad !== "Semipresencial" && modalidadId !== 2) return;
        // Si value es un objeto (Formik), extraer el id numérico
        let planId = value;
        if (value && typeof value === 'object') {
            planId = value.planAnio || value.planAnioId || '';
        }
        if (!planId) return;
        const fetchModulos = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await service.getModulos(planId);
                if (response && Array.isArray(response)) {
                    setModulos(response);
                } else if (response.data && Array.isArray(response.data)) {
                    setModulos(response.data);
                } else {
                    setError('La respuesta no es un array de módulos');
                }
            } catch (error) {
                console.error("Error en la carga de módulos:", error);
                setError('Error al cargar los módulos');
            } finally {
                setLoading(false);
            }
        };
        fetchModulos();
    }, [modalidadId, modalidad, value]);

    return (
        <div>
            {modalidad === 'Presencial' && (
                <div className="form-group">
                    <Input
                        className="selectPlanAnio"
                        label="Año"
                        name="planAnio"
                        type="select"
                        options={[
                            { value: '', label: 'Seleccionar Año' },
                            { value: 1, label: '1er Año' },
                            { value: 2, label: '2do Año' },
                            { value: 3, label: '3er Año' },
                        ]}
                        registro={{
                            value: typeof value === 'object' ? value.planAnio || '' : value,
                            onChange: handleSelection
                        }}
                        error={alerta && <AlertaMens text="Por favor, selecciona un año." variant="error" />}
                    />
                </div>
            )}
            {modalidad === 'Semipresencial' && (
                <div className="form-group">
                    <Input
                        className="selectPlanAnio"
                        label="Plan"
                        name="planAnio"
                        type="select"
                        options={[
                            { value: '', label: 'Seleccionar Plan' },
                            { value: 4, label: 'Plan A' },
                            { value: 5, label: 'Plan B' },
                            { value: 6, label: 'Plan C' },
                        ]}
                        registro={{
                            value: typeof value === 'object' ? value.planAnio || '' : value,
                            onChange: handleSelection
                        }}
                        error={alerta && <AlertaMens text="Por favor, selecciona un plan." variant="error" />}
                    />
                </div>
            )}
            {modalidadId === 2 && value && (
                <div className="form-group">
                    <label htmlFor="modulo">Seleccionar Módulo:</label>
                    {loading ? (
                        <p>Cargando módulos...</p> // Muestra un mensaje mientras carga
                    ) : error ? (
                        <p>{error}</p> // Muestra un mensaje de error si ocurre un problema
                    ) : (
                        
                <select
                    className="selectPlanAnio"
                    name="modulos"
                    id="modulo"
                    value={idModulo}
                    onChange={e => {
                        setFieldValue('modulos', e.target.value);
                        setIdModulo(e.target.value);
                    }}
                >
                    <option value="">Seleccionar Módulo</option>
                    {modulos && Array.isArray(modulos) && modulos.length > 0 ? (
                        modulos.map((modulo) => (
                            <option key={modulo.id} value={modulo.id}>
                                {modulo.modulo}
                            </option>
                        ))
                    ) : (
                        <option value="">No hay módulos disponibles</option>
                    )}
                </select>

                    )}
                </div>
                
            )}
            {idModulo && (
                <AreaEstudioSelector
                    idModulo={idModulo}
                    modalidadId={modalidadId}
                    handleAreaEstudioChange={handleModuloChange}
                    value={value.planAnio} 
                />
            )}
        </div>
    );
};

PlanAnioSelector.propTypes = {
    modalidad: PropTypes.string.isRequired,
    handleChange: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]).isRequired,
    modalidadId: PropTypes.number.isRequired,
    setFieldValue: PropTypes.func.isRequired,
};

export default PlanAnioSelector;