import PropTypes from 'prop-types';
import RegistroPendienteItem from './RegistroPendienteItem';

const ListaRegistrosPendientes = ({ 
    registros,
    cargandoRegistros,
    estudiantesRegistrados,
    mapeoDocumentos,
    enviandoEmail,
    onCompletar,
    onEliminar,
    onEnviarEmail,
    obtenerInfoVencimiento,
    getTipoIcon,
    formatearTipo
}) => {
    if (cargandoRegistros) {
        return (
            <div className="estado-cargando">
                <div>⏳</div>
                <div>Cargando registros pendientes...</div>
            </div>
        );
    }

    if (registros.length === 0) {
        return (
            <div className="estado-vacio">
                <div>📋</div>
                <div>No hay registros pendientes</div>
            </div>
        );
    }

    return (
        <>
            {registros.map((registro, index) => (
                <RegistroPendienteItem
                    key={registro.id || index}
                    registro={registro}
                    index={index}
                    estaRegistrado={estudiantesRegistrados && estudiantesRegistrados.has(registro.datos?.dni)}
                    mapeoDocumentos={mapeoDocumentos}
                    enviandoEmail={enviandoEmail}
                    onCompletar={onCompletar}
                    onEliminar={onEliminar}
                    onEnviarEmail={onEnviarEmail}
                    obtenerInfoVencimiento={obtenerInfoVencimiento}
                    getTipoIcon={getTipoIcon}
                    formatearTipo={formatearTipo}
                />
            ))}
        </>
    );
};

ListaRegistrosPendientes.propTypes = {
    registros: PropTypes.array.isRequired,
    cargandoRegistros: PropTypes.bool.isRequired,
    estudiantesRegistrados: PropTypes.instanceOf(Set),
    mapeoDocumentos: PropTypes.object.isRequired,
    enviandoEmail: PropTypes.bool.isRequired,
    onCompletar: PropTypes.func.isRequired,
    onEliminar: PropTypes.func.isRequired,
    onEnviarEmail: PropTypes.func.isRequired,
    obtenerInfoVencimiento: PropTypes.func.isRequired,
    getTipoIcon: PropTypes.func.isRequired,
    formatearTipo: PropTypes.func.isRequired
};

export default ListaRegistrosPendientes;