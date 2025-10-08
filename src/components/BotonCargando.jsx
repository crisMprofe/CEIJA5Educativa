// Importamos los módulos necesarios
import '../estilos/modal.css';
import '../estilos/botonCargando.css';
import PropTypes from 'prop-types';
import { ClimbingBoxLoader } from 'react-spinners'; // Asegúrate de que este paquete esté instalado


const BotonCargando = ({ loading, children = "Cargando..." }) => {
    return (
        <button
            type="submit"
            className={`boton-cargando ${loading ? 'disabled' : ''}`} // Usa la clase buttonF
            disabled={loading} // Desactiva el botón mientras está cargando
        >
            {loading ? (
                <div className="spinner-overlay">
                    <ClimbingBoxLoader color="#2d4177" size={15} /> {/* Spinner ClimbingBoxLoader */}
                </div>
            ) : (
                children
            )}
        </button>
    );
};

BotonCargando.propTypes = {
    loading: PropTypes.bool.isRequired,
    children: PropTypes.node,
};

export default BotonCargando;