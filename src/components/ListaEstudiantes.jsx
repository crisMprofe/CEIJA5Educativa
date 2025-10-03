import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import serviceInscripcion from '../services/serviceInscripcion';
import BotonCargando from './BotonCargando';
import CloseButton from './CloseButton';
import VolverButton from './VolverButton'; // Importa el componente VolverButton
import AlertaMens from './AlertaMens'; // Importa el componente AlertaMens
import '../estilos/listaEstudiantes.css';
import '../estilos/estilosInscripcion.css'; // Importa los estilos para modal-header-buttons

const ListaEstudiantes = ({ onAccion, onClose, onVolver, soloParaEliminacion = false, refreshKey = 0, modalidadId }) => {
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEstudiantes, setTotalEstudiantes] = useState(0);
    const [estudianteAEliminar, setEstudianteAEliminar] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmDeleteDefinitivo, setShowConfirmDeleteDefinitivo] = useState(false);
    const [alerta, setAlerta] = useState({ text: '', variant: 'info' });
    // Filtrar por modalidadId (número) si está definido
    const cargarEstudiantes = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            // Cargar solo estudiantes activos y filtrados por modalidadId desde el backend
            const response = await serviceInscripcion.getPaginatedEstudiantes(currentPage, 10, 'activos', modalidadId);
            const estudiantesFiltrados = response.success && response.estudiantes ? response.estudiantes : [];
            // Debug: mostrar modalidadIds encontrados
            if (typeof modalidadId === 'number' && !isNaN(modalidadId)) {
                console.log('ModalidadIds en la lista:', estudiantesFiltrados.map(e => e.modalidadId));
            }
            setEstudiantes(estudiantesFiltrados);
            setTotalPages(response.totalPages || 1);
            setTotalEstudiantes(estudiantesFiltrados.length);
            setError('');
        } catch (err) {
            console.error('Error al cargar estudiantes:', err);
            setError('Error de conexión al cargar estudiantes');
            setEstudiantes([]);
        } finally {
            setLoading(false);
        }
    }, [modalidadId]); // modalidadId como dependencia para cumplir reglas de hooks
    useEffect(() => {
        cargarEstudiantes(page);
    }, [page, refreshKey, cargarEstudiantes]); // Incluir cargarEstudiantes como dependencia

    const handlePaginaAnterior = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handlePaginaSiguiente = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'No disponible';
        try {
            return new Date(fecha).toLocaleDateString('es-AR');
        } catch {
            return 'Fecha inválida';
        }
    };

    const handleEliminarClick = (estudiante) => {
        setEstudianteAEliminar(estudiante);
        setShowConfirmDelete(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (!estudianteAEliminar) return;
        try {
            // Realizar eliminación lógica (desactivar estudiante)
            const response = await fetch(`http://localhost:5000/api/eliminar-estudiante/desactivar/${estudianteAEliminar.dni}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activo: 0 })
            });
            const data = await response.json();
            if (data.success) {
                setEstudiantes(prevEstudiantes => prevEstudiantes.filter(est => est.dni !== estudianteAEliminar.dni));
                setTotalEstudiantes(prevTotal => prevTotal - 1);
                setShowConfirmDelete(false);
                setEstudianteAEliminar(null);
                setAlerta({ text: 'Estudiante desactivado correctamente.', variant: 'success' });
                if (estudiantes.length === 1 && page > 1) {
                    setPage(page - 1);
                }
            } else {
                setError(data.message || 'Error al desactivar estudiante');
            }
        } catch (error) {
            console.error('Error al desactivar estudiante:', error);
            setError('Error de conexión al desactivar estudiante');
        }
    };

    const handleCancelarEliminacion = () => {
        setShowConfirmDelete(false);
        setEstudianteAEliminar(null);
        setShowConfirmDeleteDefinitivo(false);
    };

    const getTituloLista = () => {
        return 'Lista de estudiantes';
    };

    const handleAccion = async (accion, estudiante) => {
        try {
            // Usar el servicio centralizado para obtener datos completos del estudiante
            const data = await serviceInscripcion.getEstudiantePorDNI(estudiante.dni);
            if (data && data.success) {
                // Estructura igual a la consulta por DNI
                const estudianteCompleto = {
                    ...data.estudiante,
                    domicilio: data.domicilio || {},
                    inscripcion: data.inscripcion || {},
                    documentacion: data.documentacion || [],
                };
                onAccion(accion, estudianteCompleto);
            } else {
                setError(data?.message || 'Error de conexión o ruta incorrecta');
                onAccion(accion, estudiante); // Fallback con datos básicos
            }
        } catch {
            setError('Error al procesar respuesta del servidor');
            onAccion(accion, estudiante); // Fallback con datos básicos
        }
    };

    if (loading) {
        return (
            <div className="lista-estudiantes-container">
                {/* Contenedor de botones superior */}
                <div className="modal-header-buttons">
                    {onVolver && <VolverButton onClick={onVolver} />}
                    {onClose && <CloseButton onClose={onClose} variant="modal" />}
                </div>
                
                {/* Título delicado más arriba */}
                <div className="lista-header">
                    <h2 className="lista-titulo">{getTituloLista()}</h2>
                    <p className="lista-subtitulo">Cargando estudiantes...</p>
                </div>
                
                <div className="loading-container">
                    <BotonCargando loading={true}>Cargando estudiantes...</BotonCargando>
                </div>
            </div>
        );
    }

    return (
        <div className="lista-estudiantes-container">
            <div className="modal-header-buttons">
                {onVolver && <VolverButton onClick={onVolver} />}
                {onClose && <CloseButton onClose={onClose} variant="modal" />}
            </div>
            <div className="lista-header">
                <h2 className="lista-titulo">{getTituloLista()}</h2>
                <p className="lista-subtitulo">Total: {totalEstudiantes} estudiantes</p>
            </div>
            {alerta.text && (
                <AlertaMens text={alerta.text} variant={alerta.variant} duration={4000} onClose={() => setAlerta({ text: '', variant: 'info' })} />
            )}
            {error && (
                <AlertaMens text={error} variant="error" duration={4000} onClose={() => setError('')} />
            )}
            {!error && estudiantes.length === 0 && (
                <div className="no-data"><p>No se encontraron estudiantes inscriptos.</p></div>
            )}
            {!error && estudiantes.length > 0 && (
                <>
                    <div className="tabla-container">
                        <table className="tabla-estudiantes">
                            <thead>
                                <tr>
                                    <th>ID</th><th>DNI</th><th>Nombre Completo</th><th>Email</th><th>Modalidad</th><th>Curso/Plan</th><th>Estado de Inscripción</th><th>Fecha Inscripción</th><th>Fecha Nacimiento</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estudiantes.map((estudiante, index) => (
                                    <tr key={`${estudiante.dni}-${estudiante.id}-${index}`}>
                                        <td>{estudiante.id}</td><td>{estudiante.dni}</td><td>{`${estudiante.nombre} ${estudiante.apellido}`}</td><td>{estudiante.email || 'No registrado'}</td><td>{estudiante.modalidad}</td><td>{estudiante.cursoPlan || 'Sin asignar'}</td><td><span className={`estado estado-${estudiante.estadoInscripcion?.toLowerCase().replace(/\s+/g, '-')}`}>{estudiante.estadoInscripcion || 'Sin estado'}</span></td><td>{formatearFecha(estudiante.fechaInscripcion)}</td><td>{formatearFecha(estudiante.fechaNacimiento)}</td><td><div className="acciones-grupo">{soloParaEliminacion ? (
                                            <>
                                                <button className="btn-accion btn-eliminar" onClick={() => { setShowConfirmDeleteDefinitivo(true); setEstudianteAEliminar(estudiante); }} title="Seleccionar para eliminar de la base de datos">⚠️ Eliminar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn-accion btn-modificar" onClick={() => handleAccion('Modificar', estudiante)} title="Modificar estudiante">✏️</button>
                                                <button className="btn-accion btn-eliminar" onClick={() => handleEliminarClick(estudiante)} title="Desactivar estudiante (eliminación lógica)">❌</button>
                                                <button className="btn-accion btn-ver" onClick={() => handleAccion('Ver', estudiante)} title="Ver detalles">👁️</button>
                                            </>
                                        )}
                                            </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {estudiantes.length > 0 && totalPages > 1 && (
                        <div className="pagination">
                            <button className="pagination-btn" onClick={handlePaginaAnterior} disabled={page === 1}>Anterior</button>
                            <span className="pagination-info">Página {page} de {totalPages}</span>
                            <button className="pagination-btn" onClick={handlePaginaSiguiente} disabled={page >= totalPages}>Siguiente</button>
                        </div>
                    )}
                </>
            )}
            {showConfirmDelete && estudianteAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-confirm-delete">
                        <h3>⚠️ Confirmar Desactivación</h3>
                        <div className="confirm-delete-info">
                            <p><strong>ID:</strong> {estudianteAEliminar.id}</p>
                            <p><strong>DNI:</strong> {estudianteAEliminar.dni}</p>
                            <p><strong>Nombre:</strong> {estudianteAEliminar.nombre}</p>
                            <p><strong>Apellido:</strong> {estudianteAEliminar.apellido}</p>
                        </div>
                        <p className="confirm-delete-message">¿Está seguro que desea desactivar este estudiante? El estudiante se ocultará de la lista pero sus datos se conservarán en la base de datos.</p>
                        <div className="confirm-delete-buttons">
                            <button className="btn-cancelar-delete" onClick={handleCancelarEliminacion}>Cancelar</button>
                            <button className="btn-confirmar-delete" onClick={handleConfirmarEliminacion}>Desactivar Estudiante</button>
                        </div>
                    </div>
                </div>
            )}
            {showConfirmDeleteDefinitivo && estudianteAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-confirm-delete">
                        <h3>⚠️ Confirmar Eliminación Definitiva</h3>
                        <div className="confirm-delete-info">
                            <p><strong>ID:</strong> {estudianteAEliminar.id}</p>
                            <p><strong>DNI:</strong> {estudianteAEliminar.dni}</p>
                            <p><strong>Nombre:</strong> {estudianteAEliminar.nombre}</p>
                            <p><strong>Apellido:</strong> {estudianteAEliminar.apellido}</p>
                        </div>
                        <p className="confirm-delete-message">¿Está seguro que desea eliminar definitivamente este estudiante? Esta acción no se puede deshacer y eliminará todos los datos de la base de datos.</p>
                        <div className="confirm-delete-buttons">
                            <button className="btn-cancelar-delete" onClick={handleCancelarEliminacion}>Cancelar</button>
                            <button className="btn-confirmar-delete" onClick={async () => {
                                try {
                                    const response = await fetch(`http://localhost:5000/api/eliminar-estudiante/${estudianteAEliminar.dni}`, {
                                        method: 'DELETE',
                                    });
                                    if (response.status === 204) {
                                        setEstudiantes(prevEstudiantes => prevEstudiantes.filter(est => est.dni !== estudianteAEliminar.dni));
                                        setTotalEstudiantes(prevTotal => prevTotal - 1);
                                        setShowConfirmDeleteDefinitivo(false);
                                        setEstudianteAEliminar(null);
                                        setAlerta({ text: 'Estudiante eliminado definitivamente.', variant: 'success' });
                                        if (estudiantes.length === 1 && page > 1) {
                                            setPage(page - 1);
                                        }
                                    } else {
                                        setError('Error al eliminar estudiante');
                                    }
                                } catch {
                                    setError('Error de conexión al eliminar estudiante');
                                }
                            }}>Eliminar Definitivamente</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


ListaEstudiantes.propTypes = {
    onAccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onVolver: PropTypes.func, // Callback para el botón "Volver"
    soloParaEliminacion: PropTypes.bool,
    refreshKey: PropTypes.number, // Clave para forzar recarga de datos
    modalidadId: PropTypes.number, // modalidadId numérico
};
export default ListaEstudiantes;