import { useEffect, useState, useCallback } from 'react';
import service from '../services/serviceInscripcion';
import serviceEstados from '../services/serviceObtenerAcad';
import FormatError from '../utils/MensajeError';
import ComprobanteGenerator from '../components/ComprobanteGenerator';
import '../estilos/listaEstudiantes.css';
import '../estilos/listaEstudiantesNueva.css';
import '../estilos/estilosInscripcion.css';
import CloseButton from '../components/CloseButton';
import VolverButton from '../components/VolverButton';
import PropTypes from 'prop-types';
import { useContext } from 'react';
import { AlertContext } from '../context/AlertContext';
import DashboardVisual from '../components/DashboardVisual';
import '../estilos/dashboardVisual.css';

// Componentes divididos
import PanelControles from '../components/ListaEstudiantes/PanelControles';
import TablaEstudiantes from '../components/ListaEstudiantes/TablaEstudiantes';
import PaginacionControles from '../components/ListaEstudiantes/PaginacionControles';
import ResumenEstadisticas from '../components/ListaEstudiantes/ResumenEstadisticas';
import ModalReportes from '../components/ListaEstudiantes/ModalReportes';

const ListaEstudiantes = ({ onClose, onVolver, refreshKey = 0, modalidad }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  const [modoBusqueda, setModoBusqueda] = useState(false);
  const [estadosInscripcion, setEstadosInscripcion] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  
  // Usar el contexto de alertas y crear función showAlerta unificada
  const alertContext = useContext(AlertContext);
  const showAlerta = (message, type = 'info') => {
    switch(type) {
      case 'success':
        return alertContext.showSuccess(message);
      case 'error':
        return alertContext.showError(message);
      case 'warning':
        return alertContext.showWarning(message);
      case 'info':
      default:
        return alertContext.showInfo(message);
    }
  };
  
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [mostrarModalReportes, setMostrarModalReportes] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState({ total: 0, activos: 0, inactivos: 0 });
  const limit = 10;

  const cargarEstudiantes = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await service.getPaginatedEstudiantes(currentPage, limit, filtroActivo);
      
      if (response.success) {
        // Cargar también todos los estudiantes para estadísticas
        const responseAll = await service.getAll();
        const allStudents = Array.isArray(responseAll) ? responseAll : (responseAll.estudiantes || []);
        
        // Calcular totales reales
        const totales = {
          total: allStudents.length,
          activos: allStudents.filter(e => e.activo === true || e.activo === 1).length,
          inactivos: allStudents.filter(e => e.activo === false || e.activo === 0).length
        };
        
        setEstudiantes(response.estudiantes || []);
        setTotalRegistros(totales);
        setTotalPages(response.totalPages || 1);
        setError('');
        setLoading(false);
      } else {
        const errorMessage = FormatError({ mensaje: response.error });
        setError(errorMessage || 'Error al cargar estudiantes');
        setEstudiantes([]);
        setTotalRegistros({ total: 0, activos: 0, inactivos: 0 });
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = FormatError(err);
      setError(errorMessage);
      setEstudiantes([]);
      setTotalRegistros({ total: 0, activos: 0, inactivos: 0 });
      setLoading(false);
    }
  }, [filtroActivo, limit]);

  useEffect(() => {
    cargarEstudiantes(page);
  }, [page, cargarEstudiantes, refreshKey]);

  useEffect(() => {
    cargarEstudiantes(1);
  }, [filtroActivo, cargarEstudiantes]);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        console.log('🔍 Cargando estados de inscripción...');
        const data = await serviceEstados.getEstadosInscripcion();
        console.log('📊 Estados recibidos:', data);
        
        if (Array.isArray(data)) {
          setEstadosInscripcion(data);
        } else if (data && data.estados && Array.isArray(data.estados)) {
          setEstadosInscripcion(data.estados);
        } else if (data && data.success && Array.isArray(data.data)) {
          setEstadosInscripcion(data.data);
        } else {
          console.warn('⚠️ Formato de datos de estados no reconocido:', data);
          setEstadosInscripcion([]);
        }
      } catch (error) {
        console.error('❌ Error al cargar estados:', error);
        setEstadosInscripcion([]);
      }
    };
    fetchEstados();
  }, []);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
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

  const handleEmitirComprobante = async (estudiante) => {
    try {
      setLoading(true);
      // Obtener información completa del estudiante con documentación
      const respuestaCompleta = await service.getEstudiantePorDNI(estudiante.dni);
      console.log('📋 Datos completos del estudiante:', respuestaCompleta);
      
      if (respuestaCompleta.success) {
        // La respuesta ya tiene la estructura correcta con estudiante, inscripcion, documentacion
        const estudianteCompleto = {
          // Datos básicos del estudiante actual
          ...estudiante,
          // Datos completos del backend
          ...respuestaCompleta.estudiante,
          // Datos de inscripción
          modalidad: respuestaCompleta.inscripcion?.modalidad || estudiante.modalidad,
          planAnio: respuestaCompleta.inscripcion?.plan || estudiante.planAnio,
          modulo: respuestaCompleta.inscripcion?.modulo || estudiante.modulo,
          fechaInscripcion: respuestaCompleta.inscripcion?.fechaInscripcion || estudiante.fechaInscripcion,
          estadoInscripcion: respuestaCompleta.inscripcion?.estado || estudiante.estadoInscripcion,
          // Documentación completa
          documentacion: respuestaCompleta.documentacion || []
        };
        console.log('🎯 Estudiante completo para comprobante:', estudianteCompleto);
        ComprobanteGenerator.generar(estudianteCompleto);
      } else {
        // Fallback: usar método anterior si falla
        console.warn('⚠️ Fallo al obtener datos completos, usando método fallback');
        const documentosFaltantes = await service.getDocumentosFaltantes(estudiante.dni);
        ComprobanteGenerator.generar(estudiante, documentosFaltantes);
      }
      setLoading(false);
    } catch (error) {
      console.error('🚨 Error en handleEmitirComprobante:', error);
      const errorMessage = error.message || 'Error al generar el comprobante';
  setError(errorMessage);
      setLoading(false);
    }
  };

  const handleBuscarPorDNI = async (dni) => {
    if (!dni || !dni.trim()) {
      setError('Por favor, ingresa un DNI válido');
      return;
    }

    try {
      setLoading(true);
  setError('');
      
      const response = await service.getEstudiantePorDNI(dni);
      
      if (response.success && response.estudiante) {
        const modalidadEstudiante = response.inscripcion?.modalidad || response.estudiante?.modalidad || '';
        if (typeof modalidad !== 'undefined' && modalidad && modalidad !== 'todas' && modalidadEstudiante !== modalidad) {
         setError('El estudiante no pertenece a la modalidad seleccionada.');
          setEstudiantes([]);
          setLoading(false);
          return;
        }

        const estudianteFormateado = {
          id: response.estudiante.id,
          dni: response.estudiante.dni,
          nombre: response.estudiante.nombre,
          apellido: response.estudiante.apellido,
          email: response.estudiante.email || null,
          activo: response.estudiante.activo,
          fechaInscripcion: response.inscripcion?.fechaInscripcion || null,
          modalidad: response.inscripcion?.modalidad || 'Sin modalidad',
          cursoPlan: response.inscripcion?.cursoPlan || 'Sin curso/plan',
          estadoInscripcion: 'Inscripto'
        };
        

        setModoBusqueda(true);
        setEstudiantes([estudianteFormateado]);
        setTotalPages(1);
        setPage(1);
      } else {
  setError('No se encontró ningún estudiante con ese DNI');
        setEstudiantes([]);
      }
      setLoading(false);
    } catch {
      setError('Error al buscar el estudiante. Por favor, intenta nuevamente.');
      setEstudiantes([]);
      setLoading(false);
    }
  };

  const handleLimpiarBusqueda = () => {
  setModoBusqueda(false);
  setError('');
  setPage(1);
  cargarEstudiantes(1);
  };

  const getTituloLista = () => {
    if (modoBusqueda) return 'Resultado de Búsqueda';
    if (modalidad && modalidad !== 'todas') return `Estudiantes - ${modalidad}`;
    return 'Lista de Estudiantes';
  };

  // Filtra los estudiantes según modalidad y estado de inscripción
  const estudiantesFiltrados = estudiantes.filter(e => {
    // Filtrar por modalidad (solo si se especifica una modalidad específica)
    if (modalidad && modalidad !== 'todas') {
      const mod = (e.modalidad || '').trim().toLowerCase();
      const modalidadFiltro = modalidad.trim().toLowerCase();
      if (mod !== modalidadFiltro) {
        return false;
      }
    }
    
    // Filtrar por estado de inscripción si está seleccionado
    if (estadoFiltro) {
      const estadoEstudiante = String(e.idEstadoInscripcion || e.estadoInscripcion || '');
      if (estadoEstudiante !== String(estadoFiltro)) {
        return false;
      }
    }
    
    // Filtrar por activos/desactivados
    if (filtroActivo === 'activos') {
      return e.activo === true || e.activo === 1;
    } else if (filtroActivo === 'desactivados') {
      return e.activo === false || e.activo === 0;
    }
    
    return true;
  });

  return (
    <div className="lista-estudiantes-container">
      {/* Header con título y botones de navegación */}
      <div className="lista-header-superior">
        <div className="titulo-seccion">
          <h2 className="lista-titulo">{getTituloLista()}</h2>
          <p className="lista-subtitulo">
            Total: {estudiantesFiltrados.length} estudiantes
            {modalidad && modalidad !== 'todas' && ` | Modalidad: ${modalidad}`}
          </p>
        </div>
        <div className="botones-navegacion" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onVolver && <VolverButton onClick={onVolver} className="volver-button" />}
          <div style={{ flex: 1 }} />
          {onClose && <CloseButton onClose={onClose} className="cerrar-button" />}
        </div>
      </div>

      <PanelControles
        filtroActivo={filtroActivo}
        setFiltroActivo={setFiltroActivo}
        estadosInscripcion={estadosInscripcion}
        estadoFiltro={estadoFiltro}
        setEstadoFiltro={setEstadoFiltro}
        onBuscarDNI={handleBuscarPorDNI}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        modoBusqueda={modoBusqueda}
        setMostrarModalReportes={setMostrarModalReportes}
        loading={loading}
      />

      {/* Mostrar gráfico si está activado */}
      {mostrarGrafico && (
        <div className="seccion-grafico">
          <DashboardVisual estudiantes={estudiantesFiltrados} estadosInscripcion={estadosInscripcion} />
        </div>
      )}


      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button 
              className="btn-reintentar" 
              onClick={() => cargarEstudiantes(page)}
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      )}

      <TablaEstudiantes
        estudiantes={estudiantesFiltrados}
        loading={loading}
  error={error}
        onEmitirComprobante={handleEmitirComprobante}
        formatearFecha={formatearFecha}
        modoBusqueda={modoBusqueda}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        onRecargar={() => cargarEstudiantes(1)}
        page={page}
        totalPages={totalPages}
      />

      <PaginacionControles
        page={page}
        totalPages={totalPages}
        loading={loading}
        limit={limit}
        totalRegistros={estudiantesFiltrados.length}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />

      <ResumenEstadisticas totalRegistros={totalRegistros} />

      <ModalReportes
        mostrarModal={mostrarModalReportes}
        onCerrar={() => setMostrarModalReportes(false)}
        estudiantes={estudiantesFiltrados}
        showAlerta={showAlerta}
        mostrarGrafico={mostrarGrafico}
        setMostrarGrafico={setMostrarGrafico}
      />
    </div>
  );
};

ListaEstudiantes.propTypes = {
  onClose: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  refreshKey: PropTypes.number,
  modalidad: PropTypes.string,
};

export default ListaEstudiantes;