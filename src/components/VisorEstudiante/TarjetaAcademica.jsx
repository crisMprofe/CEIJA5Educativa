import PropTypes from 'prop-types';
import { useState } from 'react';
import ModalidadSelection from '../ModalidadSelection';
import CursoPlanSelector from './CursoPlanSelector';  // corregido nombre

import Input from '../Input';
import { formatearFecha } from '../../utils/fecha';
import { useModulosYEstados } from '../../hooks/useModulosYEstados'; // asegúrate que exista

const TarjetaAcademica = ({
  estudiante,
  editMode,
  setEditMode,
  handleInputChange,
  isConsulta,
  modalidad: modalidadProp,
  modalidadId: modalidadIdProp,
  modulosId: modulosIdProp,
}) => {

  const [formData] = useState({
    ...estudiante,
    cursoPlan: estudiante.planAnio || estudiante.cursoPlan || '',
    cursoPlanId: estudiante.planAnioId || estudiante.cursoPlanId || '',
  });

  // Calculo modalidad y otros a partir de props y estado local
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

  const [modulos, estadosInscripcion] = useModulosYEstados(
    editMode.academica,
    formData.cursoPlanId || formData.planAnioId,
    modalidad
  );

  return (
    <div className="tarjeta" style={{ padding: '1rem' }}>
      <div className="tarjeta-header">
        <h3>Información Académica</h3>
        {!isConsulta && (
          <button onClick={() => setEditMode(prev => ({ ...prev, academica: true }))}>✏️</button>
        )}
      </div>

      <div className="tarjeta-contenido">
        {editMode.academica ? (
          <div>
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

            <CursoPlanSelector
              modalidadId={modalidadId}
              value={{
                cursoPlanId: formData.cursoPlanId || '',
                cursoPlan: formData.cursoPlan || ''
              }}
              setFieldValue={(campo, valor) => handleInputChange(campo, valor)}
            />

            {/* Selector de módulos */}
            <Input
              label="Módulo"
              name="modulosId"
              type="select"
              options={[{ value: '', label: 'Seleccionar módulo' }, ...modulos.map(m => ({ value: m.id, label: m.modulo }))]}
              registro={{
                value: formData.modulosId || '',
                onChange: (e) => handleInputChange('modulosId', e.target.value)
              }}
            />

            {/* Selector de estados de inscripción */}
            <Input
              label="Estado de Inscripción"
              name="estadoInscripcionId"
              type="select"
              options={[{ value: '', label: 'Seleccionar estado' }, ...estadosInscripcion.map(ei => ({ value: ei.id, label: ei.descripcionEstado }))]}
              registro={{
                value: formData.estadoInscripcionId !== undefined
                  ? formData.estadoInscripcionId
                  : (estudiante?.estadoInscripcionId || ''),
                onChange: (e) => handleInputChange('estadoInscripcionId', e.target.value)
              }}
            />

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
          <div className="tarjeta-academica">
            <p>Modalidad: {modalidad || 'Sin datos'}</p>
            <p>Curso/Plan: {estudiante?.cursoPlan || formData?.cursoPlan || 'Sin datos'}</p>
            <p>Módulo: {estudiante?.modulo || formData?.modulo || 'Sin datos'}</p>
            <p>Estado de Inscripción: {estudiante?.estadoInscripcion || formData?.estadoInscripcion || 'Sin datos'}</p>
            <p>Fecha de Inscripción: {
              estudiante?.fechaInscripcion
                ? formatearFecha(estudiante.fechaInscripcion)
                : formData?.fechaInscripcion
                  ? formatearFecha(formData.fechaInscripcion)
                  : 'No registrada'
            }</p>
          </div>
        )}
      </div>
    </div>
  );
};

TarjetaAcademica.propTypes = {
  estudiante: PropTypes.object.isRequired,
  editMode: PropTypes.object,
  isConsulta: PropTypes.bool,
  handleInputChange: PropTypes.func,
  setEditMode: PropTypes.func,
  modalidad: PropTypes.string,
  modalidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  modulosId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
export default TarjetaAcademica;
