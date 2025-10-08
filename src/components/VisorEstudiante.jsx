import '../estilos/tarjetas.css';
import '../estilos/modalUniforme.css';
import '../estilos/botones.css';
import TarjetaAcademica from './VisorEstudiante/TarjetaAcademica';
import TarjetaDomicilio from './VisorEstudiante/TarjetaDomicilio';
import TarjetaPersonales from './VisorEstudiante/TarjetaPersonales';
import AlertaMens from './AlertaMens';
import FormatError from '../utils/MensajeError';
import serviceInscripcion from '../services/serviceInscripcion';
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
        // Desanidar datos si vienen en inscripcion, domicilio, etc.
        const insc = estudiante.inscripcion || {};
        const dom = estudiante.domicilio || {};
        return {
            ...estudiante,
            // Datos personales
            provincia: estudiante.provincia || dom.provincia || '',
            localidad: estudiante.localidad || dom.localidad || '',
            barrio: estudiante.barrio || dom.barrio || '',
            calle: estudiante.calle || dom.calle || '',
            numero: estudiante.numero || dom.numero || '',
            foto: estudiante.foto || '',
            // Datos académicos
            modalidad: estudiante.modalidad || insc.modalidad || estudiante.modalidadNombre || '',
            modalidadId: Number(estudiante.modalidadId) || Number(insc.modalidadId) || Number(estudiante.idModalidad) || (estudiante.modalidad === 'PRESENCIAL' ? 1 : estudiante.modalidad === 'SEMIPRESENCIAL' ? 2 : ''),
            planAnio: estudiante.planAnio || insc.plan || estudiante.cursoPlan || estudiante.plan || '',
            planAnioId: (() => {
                const planId = Number(estudiante.planAnioId) || Number(insc.planAnioId) || Number(estudiante.cursoPlanId) || Number(estudiante.idPlanAnio) || Number(estudiante.idAnioPlan) || '';
                console.log('🎯 [PLAN DEBUG] Mapeando planAnioId:', JSON.stringify({
                    estudiante_planAnioId: estudiante.planAnioId,
                    insc_planAnioId: insc.planAnioId,
                    estudiante_cursoPlanId: estudiante.cursoPlanId,
                    estudiante_idPlanAnio: estudiante.idPlanAnio,
                    estudiante_idAnioPlan: estudiante.idAnioPlan,
                    resultado: planId,
                    tipos: {
                        estudiante_planAnioId: typeof estudiante.planAnioId,
                        estudiante_cursoPlanId: typeof estudiante.cursoPlanId,
                        resultado: typeof planId
                    }
                }, null, 2));
                return planId;
            })(),
            modulos: estudiante.modulo || insc.modulo || estudiante.modulos || '',
            modulosId: Number(estudiante.modulosId) || Number(insc.modulosId) || Number(estudiante.idModulo) || '',
            estadoInscripcion: estudiante.estadoInscripcion || insc.estado || estudiante.estado || '',
            estadoInscripcionId: estudiante.estadoInscripcionId ? Number(estudiante.estadoInscripcionId) : 
                                 insc.estadoInscripcionId ? Number(insc.estadoInscripcionId) : 
                                 estudiante.idEstadoInscripcion ? Number(estudiante.idEstadoInscripcion) : 1,
            fechaInscripcion: estudiante.fechaInscripcion || insc.fechaInscripcion || estudiante.fecha || '',
            // Documentación
            documentacion: Array.isArray(estudiante.documentacion) ? estudiante.documentacion : (Array.isArray(insc.documentacion) ? insc.documentacion : []),
            email: estudiante.email || '',
            telefono: estudiante.telefono || '',
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
    const [alerta, setAlerta] = useState({ text: '', variant: '' });
    // const [editMode, setEditMode] = useState({
    

// Actualizar planAnioId automáticamente cuando cambian planAnio o modalidadId
useEffect(() => {
    if (!formData.planAnio || !formData.modalidadId || planes.length === 0) return;
    const plan = planes.find(p => p.plan === formData.planAnio);
    if (plan && plan.id && formData.planAnioId !== plan.id) {
        setFormData(prev => ({ ...prev, planAnioId: plan.id }));
    }
}, [formData.planAnio, formData.modalidadId, formData.planAnioId, planes]);
    
    // Usar custom hook para módulos y estados de inscripción
    const [modulos, estadosInscripcion] = useModulosYEstados(
        editMode.academica,
        formData.planAnioId,
        formData.modalidad
    );


    const handleInputChange = (field, value) => {
        // Log específico para estadoInscripcionId
        if (field === 'estadoInscripcionId') {
            console.log('🔄 [HANDLE INPUT CHANGE] estadoInscripcionId:', {
                valorRecibido: value,
                valorAnterior: formData.estadoInscripcionId,
                estudianteNombre: estudiante?.nombre,
                estudianteApellido: estudiante?.apellido
            });
        }
        
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

    // Función específica para actualizar solo el estado de inscripción
    const handleActualizarSoloEstado = async () => {
        console.log('🎯 Actualizando solo estado de inscripción');
        if (!formData.estadoInscripcionId || formData.estadoInscripcionId === '') {
            setAlerta({ text: 'El estado de inscripción es obligatorio.', variant: 'error' });
            return;
        }

        try {
            const resultado = await serviceInscripcion.updateEstadoInscripcion(
                estudiante.dni,
                Number(formData.estadoInscripcionId),
                estudiante.estadoInscripcionId
            );

            if (resultado.success) {
                setAlerta({ text: `Estado actualizado correctamente`, variant: 'success' });
                // Actualizar el estado local sin recargar toda la página
                setFormChanged(false);
            } else {
                setAlerta({ text: resultado.error || 'Error al actualizar el estado', variant: 'error' });
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            setAlerta({ text: 'Error al actualizar el estado de inscripción', variant: 'error' });
        }
    };

    // Nuevo: Guardar todos los cambios juntos
    const handleGuardarTodo = () => {
        // Validar cambios
        if (!formChanged) {
            setAlerta({ text: 'No hay cambios para guardar.', variant: 'warning' });
            return;
        }
        // Validar planAnioId antes de enviar
        let datos = {
            ...formData,
            planAnioId: formData.planAnioId && !isNaN(formData.planAnioId) ? Number(formData.planAnioId) : (estudiante.planAnioId ? Number(estudiante.planAnioId) : 1),
            modalidadId: formData.modalidadId && !isNaN(formData.modalidadId) ? Number(formData.modalidadId) : (estudiante.modalidadId ? Number(estudiante.modalidadId) : 1),
            modulosId: formData.modulosId && !isNaN(formData.modulosId) ? Number(formData.modulosId) : (estudiante.modulosId ? Number(estudiante.modulosId) : ''),
            estadoInscripcionId: formData.estadoInscripcionId && !isNaN(formData.estadoInscripcionId) ? Number(formData.estadoInscripcionId) : (estudiante.estadoInscripcionId ? Number(estudiante.estadoInscripcionId) : 1),
        };
        
        console.log('📤 [ENVIANDO DATOS] Estudiante:', estudiante.nombre, estudiante.apellido, 'DNI:', estudiante.dni);
        console.log('📤 [ENVIANDO DATOS] Estado inscripción:', {
            formData: formData.estadoInscripcionId,
            estudiante: estudiante.estadoInscripcionId,
            final: datos.estadoInscripcionId
        });
        if (onModificar) {
            try {
                onModificar('todo', datos); // 'todo' indica que se envía todo
                setFormChanged(false);
                setAlerta({ text: 'Cambios guardados correctamente.', variant: 'success' });
            } catch (error) {
                setAlerta({ text: `Error al guardar cambios: ${FormatError(error)}`, variant: 'error' });
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


  

    return (
        <div className={`visor-estudiante-container ${isConsulta ? 'modo-consulta' : 'modo-gestion'}`}> 
            <div className="modal-header-buttons-uniforme modal-header-buttons-small">
                {onVolver && (
                    <VolverButton onClick={onVolver} className="boton-principal boton-small" />
                )}
                {onClose && (
                    <CloseButton onClose={onClose} className="boton-principal boton-small" />
                )}
            </div>
            <div className="modal-header-uniforme">
                <h2 className="modal-title-uniforme">
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
                                estudiante={{...estudiante, ...formData}}
                                formData={formData}
                                editMode={editMode}
                                setEditMode={setEditMode}
                                handleInputChange={handleInputChange}
                                isConsulta={isConsulta || isEliminacion}
                                modulos={modulos}
                                estadosInscripcion={estadosInscripcion}
                                formatearFecha={formatearFecha}
                                modalidad={formData.modalidad}
                                modalidadId={formData.modalidadId}
                                modulosId={formData.modulosId}
                                planAnioId={formData.planAnioId}
                                planes={planes}
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
                        {/* Botones para guardar cambios */}
                        {!isConsulta && !isEliminacion && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                {/* Botón específico para estado de inscripción si solo cambió eso */}
                                {formChanged && 
                                 formData.estadoInscripcionId !== estudiante.estadoInscripcionId && 
                                 Object.keys(formData).filter(key => formData[key] !== estudiante[key]).length === 1 && (
                                    <button 
                                        className="boton-tarjeta-pill" 
                                        style={{ backgroundColor: '#28a745', color: 'white', marginRight: '10px' }}
                                        onClick={handleActualizarSoloEstado}
                                    >
                                        Actualizar Estado
                                    </button>
                                )}
                                
                                <button className="boton-tarjeta-pill boton-guardar-pill" onClick={handleGuardarTodo} disabled={!formChanged}>
                                    Guardar todos los cambios
                                </button>
                                <button className="boton-tarjeta-pill boton-cancelar-pill" onClick={handleCancelarTodo}>
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Alertas */}
                    {alerta.text && (
                        <AlertaMens 
                            text={alerta.text} 
                            variant={alerta.variant}
                            onClose={() => setAlerta({ text: '', variant: '' })}
                        />
                    )}
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

