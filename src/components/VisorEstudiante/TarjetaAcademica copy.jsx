import PropTypes from 'prop-types';
import { useState } from 'react';
import ModalidadSelection from '../ModalidadSelection';
import CursoPlanSelector from './CursoPlanSlector';
import EstadoInscripcion from '../EstadoInscripcion';
import Input from '../Input';
import { formatearFecha } from '../../utils/fecha';

const TarjetaAcademica = ({
    estudiante,
    formData,
    editMode,
    setEditMode,
    handleInputChange,
    
    isConsulta,
    modalidad: modalidadProp,
    modalidadId: modalidadIdProp,
    modulosId: modulosIdProp
}) => {
    // const [alerta, setAlerta] = useState(null);
    const [modulos, estadosInscripcion] = useModulosYEstados(
    editMode.academica,
    formData.planAnioId,
    formData.modalidad
);
const [formData, setFormData] = useState({
    ...estudiante,
    cursoPlan: estudiante.planAnio || estudiante.cursoPlan || '',
    cursoPlanId: estudiante.planAnioId || estudiante.cursoPlanId || '',
    // Calcular modalidad y modalidadId antes del return, priorizando los props explícitos
    const modalidad = modalidadProp || formData.modalidad || estudiante?.modalidad || '';
    const modalidadId = modalidadIdProp !== undefined
        ? Number(modalidadIdProp)
        : formData.modalidadId
            ? Number(formData.modalidadId)
            : modalidad === 'Presencial'
                ? 1
                : modalidad === 'Semipresencial'
                    ? 2
                    : 0;
    const modulosId = modulosIdProp !== undefined
        ? modulosIdProp
        : formData.modulosId !== undefined
            ? formData.modulosId
            : estudiante?.modulosId || '';

    /*const handleGuardarLocal = () => {
        const modalidadMap = { 'Presencial': 1, 'Semipresencial': 2 };
        // Combina todos los datos originales y modificados, sin perder campos
        const datosNormalizados = {
            ...estudiante,
            ...formData,
            modalidadId: formData.modalidadId 
                ? Number(formData.modalidadId) 
                : modalidadMap[formData.modalidad] || estudiante.modalidadId || null,
            planAnioId: formData.planAnioId ? Number(formData.planAnioId) : estudiante.planAnioId || null,
            modulosId: formData.modulosId ? Number(formData.modulosId) : estudiante.modulosId || null,
            estadoInscripcionId: formData.estadoInscripcionId 
                ? Number(formData.estadoInscripcionId) 
                : estudiante.estadoInscripcionId || null
        };
      /*  handleGuardar('academica', datosNormalizados);
        setAlerta({ text: '¡Información académica modificada!', variant: 'success' });
        setTimeout(() => setAlerta(null), 2500);
    };

    const handleCancelarLocal = () => {
        handleCancelar('academica');
        setAlerta({ text: 'Modificación cancelada.', variant: 'warning' });
        setTimeout(() => setAlerta(null), 2000);
    };*/

    return (
        <div className="tarjeta" style={{ padding: '1rem' }}>
            {/*{alerta && <div className={`alerta alerta-${alerta.variant}`}>{alerta.text}</div>}*/}
            <div className="tarjeta-header">
                <h3>Información Académica</h3>
                {!isConsulta && (
                    <button onClick={() => setEditMode(prev => ({ ...prev, academica: true }))}>✏️</button>
                )}
            </div>

            <div className="tarjeta-contenido">
                {editMode.academica ? (
    <div>
        {/* Modalidad */}
        <ModalidadSelection
            modalidad={modalidad}
            modalidadId={modalidadId}
            handleChange={(e) => handleInputChange(e.target.name, e.target.value)}
            setFieldValue={(campo, valor) => handleInputChange(campo, valor)}
            values={{
                cursoPlan: formData.cursoPlanId || estudiante?.cursoPlanId || '',
                modulos: modulosId
            }}
            showMateriasList={true}
        />

        {/* Curso/Plan */}
        <CursoPlanSelector
            modalidadId={modalidadId}
            value={{
                cursoPlanId: formData.cursoPlanId || '',
                cursoPlan: formData.cursoPlan || ''
            }}
            setFieldValue={(campo, valor) => handleInputChange(campo, valor)}
        />

        {/* Estado de Inscripción */}
        <EstadoInscripcion
            value={formData.estadoInscripcionId !== undefined
                ? formData.estadoInscripcionId
                : (estudiante?.estadoInscripcionId || '')}
            handleChange={(e) => handleInputChange('estadoInscripcionId', e.target.value)}
            errors={{}}
        />

        {/* Fecha de Inscripción */}
        <Input
            label="Fecha de Inscripción"
            name="fechaInscripcion"
            type="date"
            registro={{
                value: formData.fechaInscripcion || estudiante?.fechaInscripcion || '',
                onChange: (e) => handleInputChange('fechaInscripcion', e.target.value),
            }}
        />
    </div>
) : (
    // Vista solo lectura
    <div className="tarjeta-academica">
        <p>Modalidad: {modalidad || 'Sin datos'}</p>
        <p>Curso/Plan: {estudiante?.cursoPlan || formData?.cursoPlan || 'Sin datos'}</p>
        <p>Módulo: {estudiante?.modulo || formData?.modulo || 'Sin datos'}</p>
        <p>Estado de Inscripción: {estudiante?.estadoInscripcion || formData?.estadoInscripcion || 'Sin datos'}</p>
        <p>Fecha de Inscripción: 
            {estudiante?.fechaInscripcion
                ? formatearFecha(estudiante.fechaInscripcion)
                : formData?.fechaInscripcion
                    ? formatearFecha(formData.fechaInscripcion)
                    : 'No registrada'}
        </p>
    </div>
)}

            
TarjetaAcademica.propTypes = {
     estudiante: PropTypes.object.isRequired,
  formData: PropTypes.object,
  editMode: PropTypes.object,
  isConsulta: PropTypes.bool,
  isEliminacion: PropTypes.bool,
  handleInputChange: PropTypes.func,
  setEditMode: PropTypes.func,
  formatearFecha: PropTypes.func,
   
    modalidad: PropTypes.string, // Added prop validation for modalidad
    modalidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    modulosId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TarjetaAcademica;
