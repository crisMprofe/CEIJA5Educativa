import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import serviceRegistrosWeb from '../services/serviceRegistrosWeb';
import { calcularEstadoDocumentacionWeb } from '../utils/calcularEstadoDocumentacionWeb';
import { useAlertContext } from '../context/AlertContext';
import AlertaMens from './AlertaMens';
import BotonCargando from './BotonCargando';
import CloseButton from './CloseButton';

import '../estilos/RegistrosPendientes.css';

const GestorRegistrosWeb = ({ onClose, onRegistroSeleccionado, isAdmin = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        showSuccess,
        showError,
        showWarning,
        alerts,
        removeAlert,
        modal,
        closeModal
    } = useAlertContext();;
    const [registros, setRegistros] = useState([]);
    const [stats, setStats] = useState({ total: 0, pendientes: 0, procesados: 0, anulados: 0 });

    // Usar stats del backend para los contadores
    const contadoresVisuales = stats;
    const [loading, setLoading] = useState(true);
    // const [procesando, setProcesando] = useState('');
    const [filtro, setFiltro] = useState('TODOS'); // TODOS, PENDIENTE, PROCESADO, ANULADO
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [registroAEliminar, setRegistroAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    // Cargar registros web al montar el componente
    // Cargar registros web y estadísticas al montar y al volver del formulario
    useEffect(() => {
        const inicializar = async () => {
            await cargarRegistrosWeb();
            await cargarEstadisticas();
        };
        inicializar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    const cargarRegistrosWeb = async () => {
        try {
            setLoading(true);
            const data = await serviceRegistrosWeb.obtenerRegistrosWeb();
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
            const estadisticas = await serviceRegistrosWeb.obtenerEstadisticas();
            setStats(estadisticas);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };
    // Estado visual amigable para mostrar en la interfaz
function getEstadoVisual(registro) {
    // Mapear los valores válidos de estado a los visuales
    if (registro.estado === 'APROBADO') return 'PROCESADO';
    if (registro.estado === 'ANULADO') return 'ANULADO';
    if (registro.estado === 'PENDIENTE') return 'PENDIENTE';
    if (registro.estado === 'MOVIDO_A_PENDIENTES') return 'PROCESADO A PENDIENTES'; // <--- AÑADIDO
    // Si por alguna razón el backend envía minúsculas
    if (registro.estado === 'aprobado') return 'PROCESADO';
    if (registro.estado === 'anulado') return 'ANULADO';
    if (registro.estado === 'pendiente') return 'PENDIENTE';
    if (registro.estado === 'movido_a_pendientes') return 'PROCESADO A PENDIENTES'; // <--- AÑADIDO
    // Cualquier otro valor, mostrar en mayúsculas
    return (registro.estado || '').toUpperCase();
}
    const manejarProcesarRegistro = async (registro) => {
        // Solo navegar al formulario de edición, NO procesar automáticamente
        if (onRegistroSeleccionado) {
            const registroCompleto = {
                ...registro,
                archivos: registro.archivos || {},
            };
            const datosWebEncoded = encodeURIComponent(JSON.stringify(registroCompleto));
            const rutaDestino = isAdmin 
                ? `/dashboard/formulario-inscripcion-adm?accion=Registrar&modalidad=${registro.datos.modalidad || ''}&completarWeb=${registro.id}&datosWeb=${datosWebEncoded}&origen=registros-web`
                : `/preinscripcion-estd?accion=Registrar&modalidad=${registro.datos.modalidad || ''}&completarWeb=${registro.id}&datosWeb=${datosWebEncoded}&origen=registros-web`;
            navigate(rutaDestino);
        }
        // El procesamiento se hará en el formulario, no aquí
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
            await serviceRegistrosWeb.eliminarRegistroWeb(registroAEliminar.id);
            showSuccess(`🗑️ Registro de ${registroAEliminar.datos.apellido}, ${registroAEliminar.datos.nombre} eliminado`);
            cargarRegistrosWeb();
            await cargarEstadisticas();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            showError('❌ Error al eliminar registro: ' + error.message);
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

    // Filtrar registros según el estado visual, no solo el estado real
    const filtrarRegistros = () => {
        if (filtro === 'TODOS') return registros;
        if (filtro === 'PROCESADO') {
            // Contar como procesados los que son 'aprobado', 'PROCESADO' o 'PROCESADO A PENDIENTES'
            return registros.filter(registro => {
                const estadoVisual = getEstadoVisual(registro);
                return estadoVisual === 'PROCESADO' || estadoVisual === 'PROCESADO A PENDIENTES';
            });
        }
        if (filtro === 'PENDIENTE') {
            // Solo los que nunca fueron procesados: estado visual 'PENDIENTE'
            return registros.filter(registro => {
                const estadoVisual = getEstadoVisual(registro);
                return estadoVisual === 'PENDIENTE';
            });
        }
        // Otros filtros (anulado, etc)
        return registros.filter(registro => {
            const estadoVisual = getEstadoVisual(registro);
            return estadoVisual === filtro;
        });
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
                            <CloseButton onClose={onClose} className="cerrar-button" />
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

    // handleGestionarRegistro eliminado: no se utiliza en el componente

    return (
        <>
        <AlertaMens alerts={alerts} onCloseAlert={removeAlert} modal={modal} onCloseModal={closeModal} mode="floating" />
        <div className="gestor-registros-web">
            <div className="gestor-modal-container">
                <div className="gestor-header">
                    <h2>🌐 Gestión de Registros Web</h2>
                       <CloseButton onClose={onClose} className="cerrar-button" />
                </div>

                <div className="gestor-content">
                    {/* Primera fila: Estadísticas en horizontal */}
                    <div className="stats-container-horizontal">
                        <div className="stat-card">
                            <div className="stat-number">{contadoresVisuales.total}</div>
                            <div className="stat-label">Total</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{contadoresVisuales.pendientes}</div>
                            <div className="stat-label">Pendientes</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{contadoresVisuales.procesados}</div>
                            <div className="stat-label">Procesados</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{contadoresVisuales.anulados}</div>
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
                                // cargarEstadisticas();
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
                                    // Calcular estado real de documentación
                                    const estadoDocReal = calcularEstadoDocumentacionWeb(registro);
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
                                                {/* Mostrar estado real de documentación calculado en tiempo real */}
                                                <div className="registro-info">
                                                    <strong>Estado de Documentación:</strong> 
                                                    <span style={{ 
                                                        color: estadoDocReal.esCompleto ? '#4caf50' : '#ff9800',
                                                        marginLeft: '5px'
                                                    }}>
                                                        {estadoDocReal.mensaje}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="registro-acciones">
                                                <span 
                                                    className={`estado-badge estado-${getEstadoVisual(registro).toLowerCase().replace(/ /g, '-')}`}
                                                >
                                                    {getEstadoVisual(registro)}
                                                </span>

                                                {/* TODOS los registros web deben permitir completar inscripción */}
                                                <button
                                                    className="btn-procesar"
                                                    onClick={() => {
                                                        if (registro.estado === 'MOVIDO_A_PENDIENTES') {
                                                            showWarning('⚠️ REGISTRO PROCESADO A PENDIENTES');
                                                            return;
                                                        }
                                                        manejarProcesarRegistro(registro);
                                                    }}
                                                    disabled={registro.estado === 'MOVIDO_A_PENDIENTES'}
                                                    title={
                                                        registro.estado === 'PENDIENTE' 
                                                        ? 'Completar inscripción del registro web'
                                                        : registro.estado === 'PROCESADO'
                                                        ? 'Revisar y completar inscripción presencial'
                                                        : registro.estado === 'MOVIDO_A_PENDIENTES'
                                                        ? 'REGISTRO PROCESADO A PENDIENTES'
                                                        : 'Gestionar registro web'
                                                    }
                                                >
                                                    {registro.estado === 'PENDIENTE' ? (
                                                        '✅ Completar Inscripción'
                                                    ) : registro.estado === 'PROCESADO' ? (
                                                        '🔍 Revisar & Completar'
                                                    ) : registro.estado === 'ANULADO' ? (
                                                        '🔄 Reactivar Registro'
                                                    ) : registro.estado === 'MOVIDO_A_PENDIENTES' ? (
                                                        '🛑 Procesado a Pendientes'
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
        </>
    );
};

GestorRegistrosWeb.propTypes = {
    onClose: PropTypes.func.isRequired,
    onRegistroSeleccionado: PropTypes.func, // Función para manejar cuando se selecciona un registro
    isAdmin: PropTypes.bool, // Indica si el usuario actual es administrador
};

export default GestorRegistrosWeb;