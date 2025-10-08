import PropTypes from 'prop-types';

const TablaEstudiantes = ({ 
  estudiantes, 
  loading, 
  error, 
  onEmitirComprobante,
  formatearFecha 
}) => {
  if (loading) {
    return (
      <div className="tabla-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tabla-error">
        <div className="error-message">
          <h3>⚠️ Error al cargar datos</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-contenedor">
      <div className="tabla-wrapper">
        <table className="tabla-estudiantes">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th className="col-dni">DNI</th>
              <th className="col-nombre">Nombre Completo</th>
              <th className="col-email">Email</th>
              <th className="col-estado-activo">Estado</th>
              <th className="col-modalidad">Modalidad</th>
              <th className="col-plan">Curso/Plan</th>
              <th className="col-estado-inscripcion">Estado Inscripción</th>
              <th className="col-fecha">Fecha Inscripción</th>
              <th className="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.length === 0 ? (
              <tr>
                <td colSpan="10" className="sin-resultados">
                  <div className="mensaje-sin-resultados">
                    <div className="icono-sin-resultados">📝</div>
                    <h3>No se encontraron registros</h3>
                    <p>No hay estudiantes que coincidan con los filtros aplicados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              estudiantes.map((estudiante, index) => (
                <tr key={estudiante.id} className={`fila-estudiante ${index % 2 === 0 ? 'par' : 'impar'}`}>
                  <td className="col-id">
                    <span className="id-badge">{estudiante.id}</span>
                  </td>
                  <td className="col-dni">
                    <strong>{estudiante.dni}</strong>
                  </td>
                  <td className="col-nombre">
                    <div className="nombre-completo">
                      <span className="nombre">{estudiante.nombre}</span>
                      <span className="apellido">{estudiante.apellido}</span>
                    </div>
                  </td>
                  <td className="col-email">
                    <span className="email-estudiante" title={estudiante.email || 'Sin email registrado'}>
                      {estudiante.email ? (
                        <a href={`mailto:${estudiante.email}`} className="link-email">
                          {estudiante.email}
                        </a>
                      ) : (
                        <span className="sin-email">Sin email</span>
                      )}
                    </span>
                  </td>
                  <td className="col-estado-activo">
                    <span className={`badge-estado ${estudiante.activo ? 'activo' : 'inactivo'}`}>
                      {estudiante.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td className="col-modalidad">
                    <span className="modalidad-tag">
                      {estudiante.modalidad || 'Sin modalidad'}
                    </span>
                  </td>
                  <td className="col-plan">
                    <span className="plan-info">
                      {estudiante.cursoPlan || 'Sin asignar'}
                    </span>
                  </td>
                  <td className="col-estado-inscripcion">
                    <span className={`badge-inscripcion estado-${(estudiante.estadoInscripcion || '').toLowerCase().replace(/\s+/g, '-')}`}>
                      {estudiante.estadoInscripcion || 'Sin estado'}
                    </span>
                  </td>
                  <td className="col-fecha">
                    <span className="fecha-inscripcion">
                      {formatearFecha(estudiante.fechaInscripcion)}
                    </span>
                  </td>
                  <td className="col-acciones">
                    <div className="acciones-contenedor">
                      {estudiante.activo ? (
                        <button
                          className="btn-accion-comprobante"
                          onClick={() => onEmitirComprobante(estudiante)}
                          title="Emitir comprobante de inscripción"
                        >
                          📄 Comprobante
                        </button>
                      ) : (
                        <span className="sin-acciones">Sin acciones</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TablaEstudiantes.propTypes = {
  estudiantes: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onEmitirComprobante: PropTypes.func.isRequired,
  formatearFecha: PropTypes.func.isRequired,
  modoBusqueda: PropTypes.bool,
  onLimpiarBusqueda: PropTypes.func,
  onRecargar: PropTypes.func,
  page: PropTypes.number,
  totalPages: PropTypes.number
};

export default TablaEstudiantes;