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

import { DocumentacionDescripcionToName } from '../utils/DocumentacionMap.jsx';
import { formatearFecha } from '../utils/fecha.jsx';

import { useEffect } from 'react';



const VisorEstudiante = ({ estudiante, onClose, onModificar, onVolver, isConsulta = false, isEliminacion = false }) => {
    const [formData, setFormData] = useState({
        ...estudiante,
        provincia: estudiante.provincia || estudiante.provincia || '',
        modalidadId: Number(estudiante.modalidadId) ||
            (estudiante.modalidad === 'Presencial' ? 1 :
             estudiante.modalidad === 'Semipresencial' ? 2 : ''),
        planAnioId: Number(estudiante.planAnioId) || 1,
        modulosId: Number(estudiante.modulosId) || '',
        estadoInscripcionId: Number(estudiante.estadoInscripcionId) || '',
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

    const isFormDataChanged = (seccion) => {
        if (!estudiante) return false;
        switch (seccion) {
            case 'personales':
                return (
                    formData.id !== estudiante.id ||
                    formData.apellido !== estudiante.apellido ||
                    formData.nombre !== estudiante.nombre ||
                    formData.dni !== estudiante.dni ||
                    formData.cuil !== estudiante.cuil ||
                    formData.fechaNacimiento !== estudiante.fechaNacimiento ||
                    formData.email !== estudiante.email ||
                    formData.tipoDocumento !== estudiante.tipoDocumento ||
                    formData.paisEmision !== estudiante.paisEmision
                );
            case 'domicilio':
                return (
                    formData.calle !== estudiante.calle ||
                    formData.numero !== estudiante.numero ||
                    formData.barrio !== estudiante.barrio ||
                    formData.localidad !== estudiante.localidad ||
                    formData.provincia !== (estudiante.provincia || estudiante.provincia)
                );
            case 'academica':
                return (
                    formData.modalidad !== estudiante.modalidad ||
                    formData.planAnio !== estudiante.planAnio ||
                    formData.modulo !== estudiante.modulo ||
                    formData.estadoInscripcion !== estudiante.estadoInscripcion ||
                    formData.fechaInscripcion !== estudiante.fechaInscripcion
                );
            case 'documentacion': {
                // Compara si la documentación fue modificada (por idDocumentaciones y campos)
                const originalDocs = Array.isArray(estudiante.documentacion) ? estudiante.documentacion : [];
                const currentDocs = Array.isArray(formData.documentacion) ? formData.documentacion : [];

                // Crear mapas por idDocumentaciones
                const mapaOriginal = {};
                originalDocs.forEach(doc => {
                    if (doc.idDocumentaciones) mapaOriginal[doc.idDocumentaciones] = doc;
                });
                const mapaActual = {};
                currentDocs.forEach(doc => {
                    if (doc.idDocumentaciones) mapaActual[doc.idDocumentaciones] = doc;
                });

                const idsOriginal = Object.keys(mapaOriginal);
                const idsActual = Object.keys(mapaActual);

                // Si hay diferente cantidad de documentos o algún id falta, hay cambios
                if (idsOriginal.length !== idsActual.length) return true;
                if (!idsOriginal.every(id => mapaActual[id]) || !idsActual.every(id => mapaOriginal[id])) return true;

                // Comparar campos relevantes de cada documento
                for (const id of idsOriginal) {
                    const docOrig = mapaOriginal[id];
                    const docAct = mapaActual[id];
                    if (
                        docOrig.estadoDocumentacion !== docAct.estadoDocumentacion ||
                        docOrig.fechaEntrega !== docAct.fechaEntrega ||
                        docOrig.archivoDocumentacion !== docAct.archivoDocumentacion
                    ) {
                        return true;
                    }
                }
                return false;
            }
            default:
                return false;
        }
    };

    // Siempre enviar todos los datos requeridos por el backend, sin importar la sección
    const getDatosSeccion = (seccion) => {
        // Documentación especial
        if (seccion === 'documentacion') {
            const detalle = (formData.documentacion || []).map(doc => ({
                idDocumentaciones: doc.idDocumentaciones,
                estadoDocumentacion: doc.estadoDocumentacion,
                fechaEntrega: doc.fechaEntrega,
                nombreArchivo: DocumentacionDescripcionToName[doc.descripcionDocumentacion] || doc.descripcionDocumentacion,
            }));
            const archivos = formData.archivos || {};
            return {
                // Datos personales
                nombre: formData.nombre,
                apellido: formData.apellido,
                cuil: formData.cuil,
                fechaNacimiento: formData.fechaNacimiento,
                dni: formData.dni,
                tipoDocumento: formData.tipoDocumento,
                paisEmision: formData.paisEmision,
                email: formData.email,
                // Domicilio
                calle: formData.calle,
                    numero: formData.numero,
                    barrio: formData.barrio,
                    localidad: formData.localidad,
                    provincia: formData.provincia || formData.provincia,

                // Datos de inscripción
                // Académica
                modalidad: formData.modalidad,
                planAnio: formData.planAnio,
                modulo: formData.modulo,
                estadoInscripcion: formData.estadoInscripcion,
                modalidadId: formData.modalidadId,
                planAnioId: formData.planAnioId,
                modulosId: formData.modulosId,
                estadoInscripcionId: formData.estadoInscripcionId,
                // Documentación
                detalleDocumentacion: detalle,  // ✅ Sin stringify aquí

                archivos,
            };
        }
        // Para todas las demás secciones, enviar todos los datos relevantes
        const datosBase = {
            id: formData.id,
            activo: formData.activo !== undefined ? formData.activo : true,
            // Datos personales
            nombre: formData.nombre,
            apellido: formData.apellido,
            cuil: formData.cuil,
            fechaNacimiento: formData.fechaNacimiento,
            dni: formData.dni,
            tipoDocumento: formData.tipoDocumento,
            paisEmision: formData.paisEmision,
            email: formData.email,
            // Domicilio
            calle: formData.calle,
            numero: formData.numero,
            barrio: formData.barrio,
            localidad: formData.localidad,
            provincia: formData.provincia,
            // Académica
            modalidad: formData.modalidad,
            planAnio: formData.planAnio,
            modulo: formData.modulo,
            estadoInscripcion: formData.estadoInscripcion,
            modalidadId: formData.modalidadId,
            planAnioId: formData.planAnioId,
            modulosId: formData.modulosId,
            estadoInscripcionId: formData.estadoInscripcionId,
        };
        // Si la sección es académica, asegúrate de enviar id y activo
        if (seccion === 'academica') {
            return {
                id: formData.id,
                activo: formData.activo !== undefined ? formData.activo : true,
                modalidad: formData.modalidad,
                planAnio: formData.planAnio,
                modulo: formData.modulo,
                estadoInscripcion: formData.estadoInscripcion,
                modalidadId: Number(formData.modalidadId) || 1,
                planAnioId: Number(formData.planAnioId) || 1,
                modulosId: Number(formData.modulosId) || '',
                estadoInscripcionId: Number(formData.estadoInscripcionId) || '',
            };
        }
        return datosBase;
    };

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

