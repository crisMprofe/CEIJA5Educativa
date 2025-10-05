import { useEffect, useState, useCallback, useRef } from 'react';
import service from '../services/serviceInscripcion';
import serviceEstados from '../services/serviceObtenerAcad'; // Debes tener este servicio
import BotonCargando from '../components/BotonCargando';
import FormatError from '../utils/MensajeError';
import ComprobanteGenerator from '../components/ComprobanteGenerator';
import BuscadorDNI from '../components/BuscadorDNI';
import '../estilos/listaEstudiantes.css';
import '../estilos/estilosInscripcion.css'; // Importa los estilos para modal-header-buttons
import CloseButton from '../components/CloseButton'; // Importa el componente CloseButton
import VolverButton from '../components/VolverButton'; // Importa el componente VolverButton
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAlerts } from '../hooks/useAlerts';
import GraficoInscriptos from '../components/GraficoInscriptos';

const ListaEstudiantes = ({ onClose, onVolver, refreshKey = 0, modalidad }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(1); // Total de páginas
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'activos', 'desactivados', 'todos'
  const [isTransitioning, setIsTransitioning] = useState(false); // Estado de transición
  const [estudianteBuscado, setEstudianteBuscado] = useState(null); // Estudiante encontrado por DNI
  const [modoBusqueda, setModoBusqueda] = useState(false); // Si está en modo búsqueda
  const [estadosInscripcion, setEstadosInscripcion] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState(''); // id del estado seleccionado
  const { 
      showSuccess, 
      showError
  } = useAlerts();
  const [mostrarGrafico, setMostrarGrafico] = useState(false); // Estado para mostrar gráfico
  const timeoutRef = useRef(null);
  const limit = 10; // Cantidad de estudiantes por página

  const cargarEstudiantes = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      console.log('🔍 Cargando estudiantes:', { 
        page: currentPage, 
        limit, 
        filtroActivo,
        isTransitioning 
      });
      
      const response = await service.getPaginatedEstudiantes(currentPage, limit, filtroActivo);
      console.log('📊 Respuesta del servidor:', response);
      
      if (response.success) {
        // Usar requestAnimationFrame para asegurar que el DOM se actualice correctamente
        requestAnimationFrame(() => {
          console.log('✅ Actualizando estado con:', {
            estudiantes: response.estudiantes?.length || 0,
            totalPages: response.totalPages,
            total: response.total
          });
          
          setEstudiantes(response.estudiantes || []);
          setTotalPages(response.totalPages || 1);
          setError('');
          setLoading(false);
        });
      } else {
        console.error('❌ Error en respuesta:', response.error);
        const errorMessage = FormatError({ mensaje: response.error });
        setError(errorMessage || 'Error al cargar estudiantes');
        setEstudiantes([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('💥 Error al cargar estudiantes:', err);
      const errorMessage = FormatError(err);
      setError(errorMessage);
      setEstudiantes([]);
      setLoading(false);
    }
  }, [filtroActivo, limit, isTransitioning]);

  useEffect(() => {
    cargarEstudiantes(page);
  }, [page, cargarEstudiantes, refreshKey]); // Agregar refreshKey como dependencia

  // Efecto para limpiar y recargar cuando cambia el filtro
  useEffect(() => {
    if (filtroActivo && !isTransitioning) {
      cargarEstudiantes(1);
    }
  }, [filtroActivo, cargarEstudiantes, isTransitioning]);

  // Cargar estados de inscripción al montar
  useEffect(() => {
    const fetchEstados = async () => {
      const data = await serviceEstados.getEstadosInscripcion();
      setEstadosInscripcion(Array.isArray(data) ? data : []);
    };
    fetchEstados();
  }, []);

  // Cleanup del timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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
      
      // Obtener documentos faltantes del estudiante
      const documentosFaltantes = await service.getDocumentosFaltantes(estudiante.dni);
      
      // Generar el comprobante usando el componente independiente
      ComprobanteGenerator.generar(estudiante, documentosFaltantes);
      
      setLoading(false);
    } catch (error) {
      console.error('Error al emitir comprobante:', error);
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
      
      console.log('🔍 Buscando estudiante por DNI:', dni);
      
      // Llamar al servicio para buscar por DNI
      const response = await service.getEstudiantePorDNI(dni);
      
      if (response.success && response.estudiante) {
        // Filtrar por modalidad antes de mostrar
        const modalidadEstudiante = response.inscripcion?.modalidad || response.estudiante?.modalidad || '';
        if (typeof modalidad !== 'undefined' && modalidad && modalidad !== 'todas' && modalidadEstudiante !== modalidad) {
          setError('El estudiante no pertenece a la modalidad seleccionada.');
          setEstudianteBuscado(null);
          setEstudiantes([]);
          setLoading(false);
          return;
        }
        // Formatear el estudiante para que coincida con la estructura de la tabla
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
          estadoInscripcion: 'Inscripto' // Asumimos que si está en el sistema está inscripto
        };
        setEstudianteBuscado(estudianteFormateado);
        setModoBusqueda(true);
        setEstudiantes([estudianteFormateado]);
        setTotalPages(1);
        setPage(1);
        console.log('✅ Estudiante encontrado:', estudianteFormateado);
      } else {
        setError('No se encontró ningún estudiante con ese DNI');
        setEstudianteBuscado(null);
        setEstudiantes([]);
            // Eliminado porque no existe este estado
      }
      setLoading(false);
    } catch (error) {
      console.error('Error al buscar estudiante:', error);
      setError('Error al buscar el estudiante. Por favor, intenta nuevamente.');
      setEstudianteBuscado(null);
      setEstudiantes([]);
        // Eliminado porque no existe este estado
      setLoading(false);
    }
  };

  const handleLimpiarBusqueda = () => {
    setEstudianteBuscado(null);
    setModoBusqueda(false);
    setError('');
    setPage(1);
    
    // Volver a cargar la lista normal
    cargarEstudiantes(1);
  };

  const handleFiltroChange = async (nuevoFiltro) => {
    if (nuevoFiltro === filtroActivo || isTransitioning) return; // Evitar cambios durante transición
    
    try {
      setIsTransitioning(true);
      setLoading(true);
      setError('');
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Limpiar completamente el estado antes del cambio
      setEstudiantes([]);
      setTotalPages(1);
      // Delay para asegurar que el DOM se limpie
      timeoutRef.current = setTimeout(() => {
        setFiltroActivo(nuevoFiltro);
        setPage(1);
        setIsTransitioning(false);
      }, 100);
      
    } catch (error) {
      console.error('Error en handleFiltroChange:', error);
      setIsTransitioning(false);
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!estudiantesFiltrados || estudiantesFiltrados.length === 0) {
        showError('No hay estudiantes para exportar.');
        return;
    }
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Listado de estudiantes - Estado: ${estadoFiltro || 'Todos'} - Modalidad: ${modalidad || 'todas'}`, 14, 18);

    const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'DNI', dataKey: 'dni' },
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Apellido', dataKey: 'apellido' },
        { header: 'Modalidad', dataKey: 'modalidad' },
        { header: 'Curso/Plan', dataKey: 'cursoPlan' },
        { header: 'Estado Inscripción', dataKey: 'estadoInscripcion' },
        { header: 'Fecha Inscripción', dataKey: 'fechaInscripcion' }
    ];

    const rows = estudiantesFiltrados.map(e => ({
        id: e.id,
        dni: e.dni,
        nombre: e.nombre,
        apellido: e.apellido,
        modalidad: e.modalidad,
        cursoPlan: e.cursoPlan || '',
        estadoInscripcion: e.estadoInscripcion || '',
        fechaInscripcion: e.fechaInscripcion || ''
    }));

    try {
        autoTable(doc, {
            startY: 24,
            columns,
            body: rows,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] }
        });
        doc.save(`Listado_estudiantes_${estadoFiltro || 'todos'}_${modalidad || 'todas'}.pdf`);
        showSuccess('📄 PDF generado y descargado');
    } catch {
        showError('No se pudo generar el PDF. Verifica que jspdf-autotable esté instalado.');
    }
  };

  const getTituloLista = () => {
    const loadingText = isTransitioning ? ' (Cargando...)' : '';
    
    if (modoBusqueda && estudianteBuscado) {
      return `Resultado de Búsqueda - DNI: ${estudianteBuscado.dni}${loadingText}`;
    }
    
    switch (filtroActivo) {
      case 'activos':
        return `Lista de Estudiantes Activos${loadingText}`;
      case 'desactivados':
        return `Lista de Estudiantes Desactivados${loadingText}`;
      case 'todos':
        return `Lista de Todos los Estudiantes${loadingText}`;
      default:
        return `Lista de Todos los Estudiantes${loadingText}`;
    }
  };

  if (loading) {
    return (
      <div className="lista-estudiantes-container">
        {/* Contenedor de botones superior */}
        <div className="modal-header-buttons">
          {onVolver && (
            <VolverButton onClick={onVolver} />
          )}
          {onClose && (
            <CloseButton onClose={onClose} variant="modal" />
          )}
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

  // Filtra los estudiantes según modalidad y estado de inscripción
  const estudiantesFiltrados = estudiantes.filter(e => {
    // Filtrar por modalidad
    if (modalidad && modalidad !== 'todas') {
      const mod = (e.modalidad || '').trim().toLowerCase();
      if (!mod) return false;
      if (mod !== modalidad.trim().toLowerCase()) return false;
    }
    // Filtrar por estado de inscripción si está seleccionado (por id)
    if (estadoFiltro) {
      // Puede que el campo sea idEstadoInscripcion o estadoInscripcion
      if (
        String(e.idEstadoInscripcion || e.estadoInscripcion || '') !== String(estadoFiltro)
      ) {
        return false;
      }
    }
    // Filtrar por activos/desactivados
    if (filtroActivo === 'activos') {
      if (!e.activo) return false;
    } else if (filtroActivo === 'desactivados') {
      if (e.activo) return false;
    }
    return true;
  });

  return (
    <div className="lista-estudiantes-container">
      {/* Contenedor de botones superior */}
      <div className="modal-header-buttons" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', minWidth: '120px' }}>
          <button
            className="btn-exportar-pdf chic compact"
            onClick={handleExportPDF}
            disabled={loading || estudiantesFiltrados.length === 0}
            style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '6px', background: '#f7f7f7', border: '1px solid #d1d1d1', color: '#333', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }}
          >
            📄 PDF listado
          </button>
          <button
            className="btn-exportar-pdf chic compact"
            onClick={() => {
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.text('Reporte de cantidad de inscriptos', 14, 18);
              doc.setFontSize(12);
              doc.text(`Total de inscriptos: ${estudiantesFiltrados.length}`, 14, 30);
              doc.text(`Filtro actual: ${filtroActivo}`, 14, 38);
              if (modalidad && modalidad !== 'todas') {
                doc.text(`Modalidad: ${modalidad}`, 14, 46);
              }
              if (estadoFiltro) {
                const estadoObj = estadosInscripcion.find(e => String(e.id) === String(estadoFiltro));
                doc.text(`Estado de inscripción: ${estadoObj ? estadoObj.descripcionEstado : estadoFiltro}`, 14, 54);
              }
              doc.save('Reporte_cantidad_inscriptos.pdf');
            }}
            disabled={loading}
            style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '6px', background: '#f7f7f7', border: '1px solid #d1d1d1', color: '#333', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }}
          >
            🧮 PDF cantidad
          </button>
          <button
            className="btn-grafico chic compact"
            onClick={() => setMostrarGrafico(v => !v)}
            style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '6px', background: mostrarGrafico ? '#e8f8f5' : '#f7f7f7', border: '1px solid #d1d1d1', color: '#168063', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }}
          >
            {mostrarGrafico ? '🔽 Ocultar gráfico' : '📊 Ver gráfico'}
          </button>
          <select
            className="select-estado-inscripcion"
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #d1d1d1', color: '#333', background: '#fff', width: '100%' }}
          >
            <option value="">Todos los estados</option>
            {estadosInscripcion.map(est => (
              <option key={est.id} value={est.id}>
                {est.descripcionEstado}
              </option>
            ))}
          </select>
        </div>
        {/* Botones de navegación y cierre */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          {onVolver && (
            <VolverButton onClick={onVolver} />
          )}
          {onClose && (
            <CloseButton onClose={onClose} variant="modal" />
          )}
        </div>
      </div>

      {/* Mostrar gráfico arriba de la tabla si está activado */}
      {mostrarGrafico && (
        <GraficoInscriptos estudiantes={estudiantesFiltrados} estadosInscripcion={estadosInscripcion} />
      )}

      {/* Título delicado más arriba */}
      <div className="lista-header">
        <h2 className="lista-titulo">{getTituloLista()}</h2>
        <p className="lista-subtitulo">Total: {estudiantesFiltrados.length} estudiantes</p>
      </div>

      {/* Botones de filtro */}
      <div className="filtros-container">
        <button 
          className={`btn-filtro compact ${filtroActivo === 'todos' ? 'activo' : ''} ${isTransitioning ? 'disabled' : ''}`}
          onClick={() => handleFiltroChange('todos')}
          disabled={isTransitioning || loading || modoBusqueda}
        >
          📋 Todos
        </button>
        <button 
          className={`btn-filtro compact ${filtroActivo === 'activos' ? 'activo' : ''} ${isTransitioning ? 'disabled' : ''}`}
          onClick={() => handleFiltroChange('activos')}
          disabled={isTransitioning || loading || modoBusqueda}
        >
          ✅ Activos
        </button>
        <button 
          className={`btn-filtro compact ${filtroActivo === 'desactivados' ? 'activo' : ''} ${isTransitioning ? 'disabled' : ''}`}
          onClick={() => handleFiltroChange('desactivados')}
          disabled={isTransitioning || loading || modoBusqueda}
        >
          ❌ Inactivos
        </button>
      </div>

      {/* Buscador por DNI */}
      <BuscadorDNI
        onBuscar={handleBuscarPorDNI}
        onLimpiar={handleLimpiarBusqueda}
        loading={loading}
        disabled={isTransitioning}
        modoBusqueda={modoBusqueda}
        placeholder="Buscar estudiante por DNI (ej: 12345678)"
      />

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="btn-reintentar" 
            onClick={() => cargarEstudiantes(page)}
          >
            Reintentar
          </button>
        </div>
      )}



      {/* Mostrar tabla SIEMPRE, aunque esté vacía */}
      <div className="tabla-container">
        <table className="tabla-estudiantes">
          <thead>
            <tr>
              <th>ID</th>
              <th>DNI</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Modalidad</th>
              <th>Curso/Plan</th>
              <th>Estado de Inscripción</th>
              <th>Fecha Inscripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estudiantesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: '#888' }}>
                  No se encontraron estudiantes inscriptos.
                </td>
              </tr>
            ) : (
              estudiantesFiltrados.map((estudiante) => (
                <tr key={estudiante.id}>
                  <td>{estudiante.id}</td>
                  <td>{estudiante.dni}</td>
                  <td>{`${estudiante.nombre} ${estudiante.apellido}`}</td>
                  <td>
                    <span className="email-estudiante" title={estudiante.email || 'Sin email'}>
                      {estudiante.email || 'Sin email'}
                    </span>
                  </td>
                  <td>
                    <span className={`estado-estudiante ${estudiante.activo ? 'activo' : 'inactivo'}`}>
                      {estudiante.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td>{estudiante.modalidad}</td>
                  <td>{estudiante.cursoPlan || 'Sin asignar'}</td>
                  <td>
                    <span className={`estado estado-${estudiante.estadoInscripcion?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {estudiante.estadoInscripcion || 'Sin estado'}
                    </span>
                  </td>
                  <td>{formatearFecha(estudiante.fechaInscripcion)}</td>
                  <td>
                    <div className="acciones-grupo">
                      {estudiante.activo && (
                        <button
                          className="btn-accion btn-comprobante compact"
                          onClick={() => handleEmitirComprobante(estudiante)}
                          title="Emitir comprobante de inscripción"
                        >
                          <span className="icono-comprobante">�</span>
                          <span className="texto-comprobante">Comprobante</span>
                        </button>
                      )}
                      {!estudiante.activo && (
                        <span className="sin-acciones">Sin acciones disponibles</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación - mostrar siempre que haya estudiantes y más de una página */}
      {estudiantesFiltrados.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className="pagination-info">
            Página {page} de {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};
ListaEstudiantes.propTypes = {
  onClose: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  refreshKey: PropTypes.number, // Agregar refreshKey
  modalidad: PropTypes.string,
};

export default ListaEstudiantes;