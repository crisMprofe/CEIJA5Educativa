import TarjetaAcademica from './VisorEstudiante/TarjetaAcademica';
import TarjetaDomicilio from './VisorEstudiante/TarjetaDomicilio';
import TarjetaPersonales from './VisorEstudiante/TarjetaPersonales';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useModulosYEstados } from '../hooks/useModulosYEstados';
import { usePlanesPorModalidad } from '../hooks/usePlanesPorModalidad';
import TarjetaDocumentacion from './VisorEstudiante/TarjetaDocumentacion.jsx';
import VolverButton from './VolverButton.jsx';
import CloseButton from './CloseButton.jsx';
import { formatearFecha } from '../utils/fecha.jsx';
import { useEffect } from 'react';



const VisorEstudiante = ({ estudiante, onClose, onModificar, onVolver, isConsulta = false, isEliminacion = false }) => {
    // Usar los datos completos que llegan de la consulta por DNI (incluye foto, inscripción y documentación)
    const [formData, setFormData] = useState(() => {
        // Mapear todos los campos posibles del estudiante para asegurar que las tarjetas reciban los datos correctos
        return {
            ...estudiante,
            provincia: estudiante.provincia || '',
            foto: estudiante.foto || '',
            modalidad: estudiante.modalidad || estudiante.modalidadNombre || estudiante.modalidad_id || '',
            modalidadId: Number(estudiante.modalidadId) || Number(estudiante.idModalidad) || (estudiante.modalidad === 'Presencial' ? 1 : estudiante.modalidad === 'Semipresencial' ? 2 : ''),
            planAnio: estudiante.planAnio || estudiante.cursoPlan || estudiante.plan || '',
            planAnioId: Number(estudiante.planAnioId) || Number(estudiante.cursoPlanId) || Number(estudiante.idPlanAnio) || 1,
            modulos: estudiante.modulo || estudiante.modulos || '',
            modulosId: Number(estudiante.modulosId) || Number(estudiante.idModulo) || '',
            estadoInscripcion: estudiante.estadoInscripcion || estudiante.estado || '',
            estadoInscripcionId: Number(estudiante.estadoInscripcionId) || Number(estudiante.idEstadoInscripcion) || '',
            fechaInscripcion: estudiante.fechaInscripcion || estudiante.fecha || '',
            documentacion: Array.isArray(estudiante.documentacion) ? estudiante.documentacion : [],
            email: estudiante.email || '',
        };
    });

    // Obtener lista de planes según modalidad
    const planes = usePlanesPorModalidad(formData.modalidadId);
    const [editMode, setEditMode] = useState({
        personales: false,
        domicilio: false,
        academica: false,
        documentacion: false
    });
    // Estado para saber si hubo cambios globales
    const [formChanged, setFormChanged] = useState(false);
    // const [editMode, setEditMode] = useState({
    

// ✅ Colocar los logs acá:
console.log('🔄 Render:', { editMode, formData });

// Actualizar planAnioId automáticamente cuando cambian planAnio o modalidadId
useEffect(() => {
    if (!formData.planAnio || !formData.modalidadId || planes.length === 0) return;
    const plan = planes.find(p => p.plan === formData.planAnio);
    if (plan && plan.id && formData.planAnioId !== plan.id) {
        setFormData(prev => ({ ...prev, planAnioId: plan.id }));
    }
}, [formData.planAnio, formData.modalidadId, formData.planAnioId, planes]);

useEffect(() => {
  console.log('✏️ editMode cambió:', editMode);
}, [editMode]);

useEffect(() => {
  console.log('📦 formData cambió:', formData);
}, [formData]);
    
    // Usar custom hook para módulos y estados de inscripción
    const [modulos, estadosInscripcion] = useModulosYEstados(
        editMode.academica,
        formData.planAnioId,
        formData.modalidad
    );


    const handleInputChange = (field, value) => {
        // Si el campo es uno de los selects numéricos, forzar a número salvo string vacío
        if (["planAnioId", "modulosId", "estadoInscripcionId"].includes(field)) {
            setFormData(prev => {
                const nuevo = { ...prev, [field]: value === '' ? '' : Number(value) };
                setFormChanged(true);
                return nuevo;
            });
        } else {
            setFormData(prev => {
                const nuevo = { ...prev, [field]: value };
                setFormChanged(true);
                return nuevo;
            });
        }
    };

   
    // ...existing code...

    // Eliminar handleGuardar por sección

    // Nuevo: Guardar todos los cambios juntos
    const handleGuardarTodo = () => {
        // Validar cambios
        if (!formChanged) {
            alert('No hay cambios para guardar.');
            return;
        }
        // Validar planAnioId antes de enviar
        let datos = {
            ...formData,
            planAnioId: formData.planAnioId && !isNaN(formData.planAnioId) ? Number(formData.planAnioId) : (estudiante.planAnioId ? Number(estudiante.planAnioId) : 1),
            modalidadId: formData.modalidadId && !isNaN(formData.modalidadId) ? Number(formData.modalidadId) : (estudiante.modalidadId ? Number(estudiante.modalidadId) : 1),
            modulosId: formData.modulosId && !isNaN(formData.modulosId) ? Number(formData.modulosId) : (estudiante.modulosId ? Number(estudiante.modulosId) : ''),
            estadoInscripcionId: formData.estadoInscripcionId && !isNaN(formData.estadoInscripcionId) ? Number(formData.estadoInscripcionId) : (estudiante.estadoInscripcionId ? Number(estudiante.estadoInscripcionId) : ''),
        };
        if (onModificar) {
            try {
                onModificar('todo', datos); // 'todo' indica que se envía todo
                setFormChanged(false);
                alert('Cambios guardados correctamente.');
            } catch (error) {
                alert('Error al guardar cambios.');
                console.error('🚨 Error al guardar todo:', error);
            }
        }
    };

    // Cancelar todos los cambios
    const handleCancelarTodo = () => {
        setFormData({
            ...estudiante,
            provincia: estudiante.provincia || estudiante.provincia || '',
            modalidadId: Number(estudiante.modalidadId) ||
                (estudiante.modalidad === 'Presencial' ? 1 :
                 estudiante.modalidad === 'Semipresencial' ? 2 : ''),
            planAnioId: estudiante.planAnioId ? Number(estudiante.planAnioId) : '',
            modulosId: estudiante.modulosId ? Number(estudiante.modulosId) : '',
            estadoInscripcionId: estudiante.estadoInscripcionId ? Number(estudiante.estadoInscripcionId) : '',
        });
        setEditMode({
            personales: false,
            domicilio: false,
            academica: false,
            documentacion: false
        });
        setFormChanged(false);
    };

    console.log('Estudiante recibido en visor:', estudiante);
  

    return (
                    <div className={`visor-estudiante-container ${isConsulta ? 'modo-consulta' : 'modo-gestion'}`}>
                    <div className="modal-header-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        {onVolver && (
                            <VolverButton onClick={onVolver} />
                        )}
                        {onClose && (
                            <CloseButton onClose={onClose} variant="simple" />
                        )}
                    </div>
                    <div className="visor-header" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2>
                            {isEliminacion ? 'Eliminar Estudiante' :
                                isConsulta ? 'Consulta de Estudiante' :
                                'Detalles del Estudiante'}
                        </h2>
                    </div>
                    <div className="visor-contenido layout-tarjetas-2x2">
                        <div className="tarjetas-grid-2x2">
                            <TarjetaPersonales
                                estudiante={estudiante}
                                formData={formData}
                                editMode={editMode}
                                isConsulta={isConsulta}
                                isEliminacion={isEliminacion}
                                handleInputChange={handleInputChange}
                                setEditMode={setEditMode}
                                formatearFecha={formatearFecha}
                            />
                            <TarjetaDomicilio
                                formData={formData}
                                editMode={editMode}
                                setEditMode={setEditMode}
                                handleInputChange={handleInputChange}
                                isConsulta={isConsulta || isEliminacion}
                            />
                            <TarjetaAcademica
                                estudiante={estudiante}
                                formData={formData}
                                editMode={editMode}
                                setEditMode={setEditMode}
                                handleInputChange={handleInputChange}
                                isConsulta={isConsulta || isEliminacion}
                                modulos={modulos}
                                estadosInscripcion={estadosInscripcion}
                                formatearFecha={formatearFecha}
                                modalidadId={formData.modalidadId}
                                modulosId={formData.modulosId}
                            />
                            {/* ✅ Aquí la versión actualizada de TarjetaDocumentacion */}
                            <TarjetaDocumentacion
                                estudiante={formData}
                                editMode={editMode.documentacion}
                                setEditMode={estado => setEditMode(prev => ({ ...prev, documentacion: estado }))}
                                isConsulta={isConsulta || isEliminacion}
                                onGuardar={({ detalleDocumentacion, archivos }) => {
                                    setFormData(prev => ({ ...prev, documentacion: detalleDocumentacion, archivos }));
                                    setFormChanged(true);
                                }}
                            />
                        </div>
                        {/* Botón único para guardar todos los cambios */}
                        {!isConsulta && !isEliminacion && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button className="btn-guardar-todo" onClick={handleGuardarTodo} disabled={!formChanged}>
                                    Guardar cambios
                                </button>
                                <button className="btn-cancelar-todo" onClick={handleCancelarTodo} style={{ marginLeft: '1rem' }}>
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
};

VisorEstudiante.propTypes = {
    estudiante: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onModificar: PropTypes.func,
    onVolver: PropTypes.func,
    isConsulta: PropTypes.bool,
    isEliminacion: PropTypes.bool,
};

export default VisorEstudiante;

