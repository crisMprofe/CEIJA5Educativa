import PropTypes from 'prop-types';
import BuscadorDNI from '../BuscadorDNI';

const PanelControles = ({
  filtroActivo,
  setFiltroActivo,
  estadosInscripcion,
  estadoFiltro,
  setEstadoFiltro,
  onBuscarDNI,
  onLimpiarBusqueda,
  modoBusqueda,
  setMostrarModalReportes,
  loading
}) => {
  const handleFiltroChange = (nuevoFiltro) => {
    if (nuevoFiltro !== filtroActivo) {
      setFiltroActivo(nuevoFiltro);
    }
  };

  return (
    <div className="panel-controles">
      {/* Filtros de Estado */}
      <div className="grupo-filtros-estado">
        <button
          className={`btn-filtro-small ${filtroActivo === 'todos' ? 'activo' : ''}`}
          onClick={() => handleFiltroChange('todos')}
          disabled={loading}
        >
          📋 Todos
        </button>
        <button
          className={`btn-filtro-small ${filtroActivo === 'activos' ? 'activo' : ''}`}
          onClick={() => handleFiltroChange('activos')}
          disabled={loading}
        >
          ✅ Activos
        </button>
        <button
          className={`btn-filtro-small ${filtroActivo === 'desactivados' ? 'activo' : ''}`}
          onClick={() => handleFiltroChange('desactivados')}
          disabled={loading}
        >
          ❌ Inactivos
        </button>
      </div>

      {/* Filtro por Estado de Inscripción */}
      <div className="grupo-select-estado">
        <label className="select-label">Estado:</label>
        <select
          className="select-estado-inscripcion"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          disabled={loading}
        >
          <option value="">Todos los estados</option>
          {estadosInscripcion && estadosInscripcion.length > 0 ? (
            estadosInscripcion.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.descripcionEstado}
              </option>
            ))
          ) : (
            <>
              <option value="1">Pendiente</option>
              <option value="2">Aprobado</option>
              <option value="3">Anulado</option>
            </>
          )}
        </select>
      </div>

      {/* Buscador DNI */}
      <div className="grupo-buscador">
        <BuscadorDNI
          onBuscar={onBuscarDNI}
          placeholder="Buscar por DNI..."
          disabled={loading}
        />
        {modoBusqueda && (
          <button
            className="btn-limpiar-busqueda"
            onClick={onLimpiarBusqueda}
            disabled={loading}
          >
            🗑️ Limpiar
          </button>
        )}
      </div>

      {/* Botón de Reportes */}
      <div className="grupo-reportes">
        <button
          className="btn-reportes"
          onClick={() => setMostrarModalReportes(true)}
          disabled={loading}
        >
          📊 Reportes
        </button>
      </div>
    </div>
  );
};

PanelControles.propTypes = {
  filtroActivo: PropTypes.string.isRequired,
  setFiltroActivo: PropTypes.func.isRequired,
  estadosInscripcion: PropTypes.array.isRequired,
  estadoFiltro: PropTypes.string.isRequired,
  setEstadoFiltro: PropTypes.func.isRequired,
  onBuscarDNI: PropTypes.func.isRequired,
  onLimpiarBusqueda: PropTypes.func.isRequired,
  modoBusqueda: PropTypes.bool.isRequired,
  setMostrarModalReportes: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

export default PanelControles;