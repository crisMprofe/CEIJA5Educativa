import { useState } from 'react';
import PropTypes from 'prop-types';
import '../estilos/buscadorDNI.css';

const BuscadorDNI = ({ 
  onBuscar, 
  onLimpiar, 
  loading = false, 
  disabled = false, 
  modoBusqueda = false,
  placeholder = "Ingresa el DNI del estudiante (ej: 12345678)"
}) => {
  const [dniBusqueda, setDniBusqueda] = useState('');

  const handleBuscar = () => {
    if (!dniBusqueda.trim()) {
      return;
    }
    onBuscar(dniBusqueda.trim());
  };

  const handleLimpiar = () => {
    setDniBusqueda('');
    onLimpiar();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBuscar();
    }
  };

  const handleInputChange = (e) => {
    // Solo permite números y máximo 8 dígitos
    const valor = e.target.value.replace(/\D/g, '').slice(0, 8);
    setDniBusqueda(valor);
  };

  return (
    <div className="buscador-dni-container">
      <div className="buscador-dni-input-group">
        <input
          type="text"
          className="buscador-dni-input"
          placeholder={placeholder}
          value={dniBusqueda}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={loading || disabled}
          maxLength="8"
        />
        <button
          className="btn-buscar-dni"
          onClick={handleBuscar}
          disabled={loading || disabled || !dniBusqueda.trim()}
          title="Buscar estudiante por DNI"
        >
          {loading ? (
            <span className="loading-spinner">⟳</span>
          ) : (
            '🔍'
          )}
        </button>
      </div>
      
      {modoBusqueda && (
        <button
          className="btn-limpiar-busqueda-dni"
          onClick={handleLimpiar}
          disabled={loading || disabled}
          title="Limpiar búsqueda y volver a la lista"
        >
          🗑️ Limpiar Búsqueda
        </button>
      )}
    </div>
  );
};

BuscadorDNI.propTypes = {
  onBuscar: PropTypes.func.isRequired,
  onLimpiar: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  modoBusqueda: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default BuscadorDNI;
