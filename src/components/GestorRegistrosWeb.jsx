import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import registrosWebService from '../services/serviceRegistrosWeb';
import { useAlerts } from '../hooks/useAlerts';
import BotonCargando from './BotonCargando';
import CloseButton from './CloseButton';
import FormatError from '../utils/MensajeError';
import '../estilos/RegistrosPendientes.css';

const GestorRegistrosWeb = ({ onClose, onRegistroSeleccionado, isAdmin = false }) => {
    const navigate = useNavigate();
    const {
        showSuccess, 
        showError
    } = useAlerts();
    const [registros, setRegistros] = useState([]);
    const [stats, setStats] = useState({ total: 0, pendientes: 0, procesados: 0, anulados: 0 });
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState('');
    const [filtro, setFiltro] = useState('TODOS'); // TODOS, PENDIENTE, PROCESADO, ANULADO
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [registroAEliminar, setRegistroAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    // Cargar registros web al montar el componente
    useEffect(() => {
        const inicializar = async () => {
            await cargarRegistrosWeb();
            await cargarEstadisticas();
        };
        inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarRegistrosWeb = async () => {
        try {
            setLoading(true);
            const data = await registrosWebService.obtenerRegistrosWeb();
            setRegistros(data);
        } catch (error) {
            console.error('Error al cargar registros web:', error);
            showError('Error al cargar los registros web: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const estadisticas = await registrosWebService.obtenerEstadisticas();
            setStats(estadisticas);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const manejarProcesarRegistro = async (registro) => {
        setProcesando(registro.id);
        try {
            // Llamar la función del componente padre para completar registro
            if (onRegistroSeleccionado) {
                // Navegar usando React Router para evitar error 404
                // Pasar el registro completo (incluyendo archivos) al formulario
                const registroCompleto = {
                    ...registro,
                    archivos: registro.archivos || {} // Asegurar que archivos existe
                };
                const datosWebEncoded = encodeURIComponent(JSON.stringify(registroCompleto));
                
                // Navegar a la ruta correcta según si es admin o no
                const rutaDestino = isAdmin 
                    ? `/dashboard/formulario-inscripcion-adm?accion=Registrar&modalidad=${registro.datos.modalidad || ''}&completarWeb=${registro.id}&datosWeb=${datosWebEncoded}&origen=registros-web`
                    : `/preinscripcion-estd?accion=Registrar&modalidad=${registro.datos.modalidad || ''}&completarWeb=${registro.id}&datosWeb=${datosWebEncoded}&origen=registros-web`;
                
                navigate(rutaDestino);
            }
            // Actualizar el estado local del registro a PROCESADO si corresponde
            if (registro.estado === 'PENDIENTE') {
                // Simular cambio de estado localmente para el contador
                setRegistros(prev => prev.map(r => r.id === registro.id ? { ...r, estado: 'PROCESADO' } : r));
                setStats(prev => ({
                    ...prev,
                    pendientes: prev.pendientes > 0 ? prev.pendientes - 1 : 0,
                    procesados: prev.procesados + 1
                }));
            }
            const mensajeSegunEstado = {
                'PENDIENTE': '✅ Registro cargado para completar inscripción',
                'PROCESADO': '🔍 Registro cargado para revisar y completar inscripción presencial',
                'ANULADO': '🔄 Registro reactivado para completar inscripción'
            };
            showSuccess(mensajeSegunEstado[registro.estado] || '📋 Registro cargado para gestionar');
        } catch (error) {
            console.error('Error al procesar registro:', error);
            showError('❌ Error al procesar el registro: ' + error.message);
        } finally {
            setProcesando('');
        }
    };

    // Función para iniciar el proceso de eliminación
    const iniciarEliminar = (registro) => {
        setRegistroAEliminar(registro);
        setMostrarConfirmacion(true);
    };

    // Función para confirmar y ejecutar la eliminación
    const confirmarEliminacion = async () => {
        if (!registroAEliminar) return;

        setEliminando(true);
        setMostrarConfirmacion(false);

        try {
            await registrosWebService.eliminarRegistroWeb(registroAEliminar.id);
            showSuccess(`🗑️ Registro de ${registroAEliminar.datos.apellido}, ${registroAEliminar.datos.nombre} eliminado`);
            cargarRegistrosWeb();
            cargarEstadisticas();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            showError('❌ Error al eliminar registro: ' + FormatError(error));
        } finally {
            setEliminando(false);
            setRegistroAEliminar(null);
        }
    };

    // Función para cancelar la eliminación
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setRegistroAEliminar(null);
    };

    const filtrarRegistros = () => {
        if (filtro === 'TODOS') return registros;
        return registros.filter(registro => registro.estado === filtro);
    };

    const formatearFecha = (timestamp) => {
        const fecha = new Date(timestamp);
        return fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const registrosFiltrados = filtrarRegistros();

    if (loading) {
        return (
            <div className="gestor-registros-web">
                <div className="gestor-modal-container">
                    <div className="gestor-header">
                        <h2>🌐 Gestión de Registros Web</h2>
                        <CloseButton onClose={onClose} variant="modal" />
                    </div>
                    <div className="gestor-content">
                        <div className="loading-container">
                            <BotonCargando loading={true}>Cargando registros web...</BotonCargando>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Actualizar el estado visual en la lista si el registro fue procesado localmente
    const registrosVisuales = registrosFiltrados.map(r => {
        // Si el registro fue procesado localmente, reflejar el cambio visual
        const registroLocal = registros.find(reg => reg.id === r.id);
        return registroLocal ? { ...r, estado: registroLocal.estado } : r;
    });

    return (
        <div className="gestor-registros-web">
            <div className="gestor-modal-container">
                <div className="gestor-header">
                    <h2>🌐 Gestión de Registros Web</h2>
                    <CloseButton onClose={onClose} variant="modal" />
                </div>

                <div className="gestor-content">
                    {/* Primera fila: Estadísticas en horizontal */}
                    <div className="stats-container-horizontal">
                        <div className="stat-card">
                            <div className="stat-number">{stats.total || 0}</div>
                            <div className="stat-label">Total</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{stats.pendientes || 0}</div>
                            <div className="stat-label">Pendientes</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{stats.procesados || 0}</div>
                            <div className="stat-label">Procesados</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{stats.anulados || 0}</div>
                            <div className="stat-label">Anulados</div>
                        </div>
                    </div>

                    {/* Segunda fila: Controles y filtros */}
                    <div className="controles-container">
                        <div className="filtros-container">
                            <label htmlFor="filtro-estado">Filtrar por estado:</label>
                            <select 
                                id="filtro-estado"
                                value={filtro} 
                                onChange={(e) => setFiltro(e.target.value)}
                            >
                                <option value="TODOS">Todos los registros</option>
                                <option value="PENDIENTE">Solo pendientes</option>
                                <option value="PROCESADO">Solo procesados</option>
                                <option value="ANULADO">Solo anulados</option>
                            </select>
                        </div>

                        <button 
                            className="refresh-button"
                            onClick={() => {
                                cargarRegistrosWeb();
                                cargarEstadisticas();
                            }}
                        >
                            🔄 Actualizar
                        </button>
                    </div>

                    {/* Tercera fila: Lista de registros */}
                    <div className="registros-container">
                        {registrosVisuales.length === 0 ? (
                            <div className="sin-registros">
                                <h3>📭 No hay registros web {filtro === 'TODOS' ? '' : filtro.toLowerCase()}</h3>
                                <p>Los registros aparecerán aquí cuando los usuarios completen el formulario web.</p>
                            </div>
                        ) : (
                            <div className="registros-lista">
                                {registrosVisuales.map((registro) => {
                                    // Debug: verificar datos del registro
                                    console.log('Registro datos:', registro.datos.nombre, registro.datos.apellido, registro.datos.dni);
                                    return (
                                        <div key={registro.id} className="registro-item">
                                        <div className="registro-header">
                                            <div className="registro-datos">
                                                <h3 className="registro-nombre">
                                                    {registro.datos.apellido}, {registro.datos.nombre}
                                                </h3>
                                                <div className="registro-info-principal">
                                                    <strong>DNI: {registro.datos.dni}</strong>
                                                </div>
                                                <div className="registro-info">Email: {registro.datos.email}</div>
                                                <div className="registro-info">Teléfono: {registro.datos.telefono}</div>
                                                <div className="registro-info">Modalidad: {registro.datos.modalidad}</div>
                                                <div className="registro-info">
                                                    Domicilio: {registro.datos.calle} {registro.datos.numero}, {registro.datos.localidad}
                                                </div>
                                                {/* Mostrar documentos adjuntos */}
                                                {registro.archivos && Object.keys(registro.archivos).length > 0 && (
                                                    <div className="registro-documentos">
                                                        <strong style={{ color: '#2e7d32' }}>📎 Documentos adjuntos ({Object.keys(registro.archivos).length}):</strong>
                                                        <ul style={{ 
                                                            margin: '5px 0 0 15px', 
                                                            padding: 0, 
                                                            fontSize: '0.85rem',
                                                            color: '#666'
                                                        }}>
                                                            {Object.entries(registro.archivos).map(([tipo, ruta]) => {
                                                                const nombreDocumento = {
                                                                    'foto': '📷 Foto',
                                                                    'archivo_dni': '📄 DNI',
                                                                    'archivo_cuil': '📄 CUIL',
                                                                    'archivo_fichaMedica': '🏥 Ficha Médica',
                                                                    'archivo_partidaNacimiento': '📜 Partida de Nacimiento',
                                                                    'archivo_solicitudPase': '📝 Solicitud de Pase',
                                                                    'archivo_analiticoParcial': '📊 Analítico Parcial',
                                                                    'archivo_certificadoNivelPrimario': '🎓 Certificado Primario'
                                                                }[tipo] || `📎 ${tipo}`;
                                                                
                                                                return (
                                                                    <li key={tipo} style={{ marginBottom: '2px' }}>
                                                                        <span style={{ color: '#4caf50' }}>✅ {nombreDocumento}</span>
                                                                        <small style={{ color: '#999', marginLeft: '5px' }}>
                                                                            ({ruta.split('/').pop()})
                                                                        </small>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                        <div style={{ 
                                                            fontSize: '0.8rem', 
                                                            color: '#ff9800', 
                                                            marginTop: '5px',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            💡 Al completar inscripción se mostrarán estos documentos para verificar
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Mensaje si no hay documentos */}
                                                {(!registro.archivos || Object.keys(registro.archivos).length === 0) && (
                                                    <div className="registro-documentos">
                                                        <span style={{ color: '#f44336', fontSize: '0.85rem' }}>
                                                            ⚠️ Sin documentos adjuntos - Deberá completar toda la documentación
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="registro-info">
                                                    <small>Fecha: {formatearFecha(registro.timestamp)}</small>
                                                </div>
                                                {registro.observaciones && (
                                                    <div className="registro-info">
                                                        <strong>Observaciones:</strong> {registro.observaciones}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="registro-acciones">
                                                <span 
                                                    className={`estado-badge estado-${registro.estado.toLowerCase()}`}
                                                >
                                                    {registro.estado}
                                                </span>

                                                {/* TODOS los registros web deben permitir completar inscripción */}
                                                <button
                                                    className="btn-procesar"
                                                    onClick={() => manejarProcesarRegistro(registro)}
                                                    disabled={procesando === registro.id}
                                                    title={
                                                        registro.estado === 'PENDIENTE' 
                                                        ? 'Completar inscripción del registro web'
                                                        : registro.estado === 'PROCESADO'
                                                        ? 'Revisar y completar inscripción presencial'
                                                        : 'Gestionar registro web'
                                                    }
                                                >
                                                    {procesando === registro.id ? (
                                                        <BotonCargando loading={true} size="small">
                                                            Procesando...
                                                        </BotonCargando>
                                                    ) : registro.estado === 'PENDIENTE' ? (
                                                        '✅ Completar Inscripción'
                                                    ) : registro.estado === 'PROCESADO' ? (
                                                        '🔍 Revisar & Completar'
                                                    ) : registro.estado === 'ANULADO' ? (
                                                        '🔄 Reactivar Registro'
                                                    ) : (
                                                        '📝 Gestionar Registro'
                                                    )}
                                                </button>
                                                
                                                <button
                                                    className="btn-eliminar"
                                                    onClick={() => iniciarEliminar(registro)}
                                                    title="Eliminar registro"
                                                    disabled={eliminando}
                                                >
                                                    {eliminando && registroAEliminar?.id === registro.id ? (
                                                        <BotonCargando loading={true} size="small">
                                                            Eliminando...
                                                        </BotonCargando>
                                                    ) : (
                                                        '🗑️ Eliminar'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>



                    {/* Modal de confirmación para eliminar */}
                    {mostrarConfirmacion && registroAEliminar && (
                        <div className="modal-confirmacion-overlay">
                            <div className="modal-confirmacion">
                                <h3>Confirmar Eliminación</h3>
                                <p>
                                    ¿Está seguro de que desea eliminar el registro de{' '}
                                    <strong>
                                        {registroAEliminar.datos.apellido}, {registroAEliminar.datos.nombre}
                                    </strong>?
                                </p>
                                <p className="dni-info">DNI: {registroAEliminar.datos.dni}</p>
                                <div className="modal-botones">
                                    <button 
                                        className="btn-confirmar-eliminar"
                                        onClick={confirmarEliminacion}
                                        disabled={eliminando}
                                    >
                                        {eliminando ? (
                                            <BotonCargando loading={true} size="small">
                                                Eliminando...
                                            </BotonCargando>
                                        ) : (
                                            'Aceptar'
                                        )}
                                    </button>
                                    <button 
                                        className="btn-cancelar-eliminar"
                                        onClick={cancelarEliminacion}
                                        disabled={eliminando}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

GestorRegistrosWeb.propTypes = {
    onClose: PropTypes.func.isRequired,
    onRegistroSeleccionado: PropTypes.func, // Función para manejar cuando se selecciona un registro
    isAdmin: PropTypes.bool, // Indica si el usuario actual es administrador
};

export default GestorRegistrosWeb;