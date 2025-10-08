import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import AlertaMens from './AlertaMens';
import MensajeError from '../utils/MensajeError';
import { obtenerInfoVencimiento } from '../utils/registroSinDocumentacion';
import '../estilos/verificadorRegistro.css';
import '../estilos/botones.css';

const VerificadorRegistroPendiente = ({ dni, onRegistroCompleto, onSinRegistro }) => {
  const [registroPendiente, setRegistroPendiente] = useState(null);
  const [infoVencimiento, setInfoVencimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ text: '', variant: '' });
  const [completandoRegistro, setCompletandoRegistro] = useState(false);

  // Nueva función: buscar registro pendiente solo en el backend
  const verificarEstadoRegistro = useCallback(async () => {
    try {
      setLoading(true);
      if (!dni) {
        setLoading(false);
        return;
      }
      // Buscar en el backend si existe el registro pendiente
      const resp = await fetch(`/api/registros-pendientes/${dni}`);
      if (resp.ok) {
        const registro = await resp.json();
        if (registro && registro.dni) {
          setRegistroPendiente(registro);
          const info = obtenerInfoVencimiento(registro);
          setInfoVencimiento(info);
          // Si está vencido, no mostrar y notificar
          if (info.vencido) {
            setRegistroPendiente(null);
            setInfoVencimiento(null);
            onSinRegistro && onSinRegistro();
          }
        } else {
          onSinRegistro && onSinRegistro();
        }
      } else {
        onSinRegistro && onSinRegistro();
      }
    } catch (error) {
      console.error('Error al verificar estado de registro:', error);
      const mensajeError = MensajeError(error);
      setAlert({ 
        text: `❌ Error: ${mensajeError}`, 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [dni, onSinRegistro]);

  useEffect(() => {
    verificarEstadoRegistro();
  }, [verificarEstadoRegistro]);

  const handleCompletarRegistro = async () => {
    try {
      setCompletandoRegistro(true);
      
      // Eliminar el registro pendiente en el backend
      const resp = await fetch(`/api/registros-pendientes/${dni}`, { method: 'DELETE' });
      if (resp.ok) {
        setAlert({ 
          text: '✅ Continuando con el registro completo...', 
          variant: 'success' 
        });
        setTimeout(() => {
          onRegistroCompleto && onRegistroCompleto(registroPendiente);
        }, 1500);
      } else {
        throw new Error('No se pudo eliminar el registro pendiente');
      }
      
    } catch (error) {
      console.error('Error al completar registro:', error);
      const mensajeError = MensajeError(error);
      setAlert({ 
        text: `❌ Error: ${mensajeError}`, 
        variant: 'error' 
      });
      setCompletandoRegistro(false);
    }
  };

  const handleCancelar = () => {
    setRegistroPendiente(null);
    setInfoVencimiento(null);
    onSinRegistro && onSinRegistro();
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'SIN_DOCUMENTACION': return '📋';
      case 'DOCUMENTACION_INCOMPLETA': return '📄';
      default: return '📝';
    }
  };

  const formatearTipo = (tipo) => {
    switch (tipo) {
      case 'SIN_DOCUMENTACION': return 'Sin Documentación';
      case 'DOCUMENTACION_INCOMPLETA': return 'Documentación Incompleta';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <div className="verificador-registro loading">
        <div className="loading-spinner"></div>
        <p>Verificando estado del registro...</p>
      </div>
    );
  }

  if (!registroPendiente) {
    return null; // No mostrar nada si no hay registro pendiente
  }

  return (
    <div className="verificador-registro">
      <div className="registro-card">
        <div className="registro-header">
          <h3>
            🕒 Registro Pendiente Encontrado
          </h3>
          <div className={`tiempo-badge ${infoVencimiento?.vencido ? 'vencido' : 
            infoVencimiento?.diasRestantes <= 1 ? 'critico' : 
            infoVencimiento?.diasRestantes <= 3 ? 'advertencia' : 'normal'}`}>
            {infoVencimiento?.vencido ? '🔴 VENCIDO' : `⏰ ${infoVencimiento?.mensaje}`}
          </div>
        </div>

        <div className="registro-content">
          <div className="registro-info">
            <div className="info-item">
              <strong>👤 Estudiante:</strong>
              <span>{registroPendiente.datos?.nombre || registroPendiente.nombre} {registroPendiente.datos?.apellido || registroPendiente.apellido}</span>
            </div>
            <div className="info-item">
              <strong>📄 DNI:</strong>
              <span>{registroPendiente.datos?.dni || registroPendiente.dni}</span>
            </div>
            <div className="info-item">
              <strong>✉️ Email:</strong>
              <span>{registroPendiente.datos?.email || registroPendiente.email || <span style={{color:'red'}}>Sin email</span>}</span>
            </div>
            <div className="info-item">
              <strong>{getTipoIcon(registroPendiente.tipoRegistro)} Tipo:</strong>
              <span>{formatearTipo(registroPendiente.tipoRegistro)}</span>
            </div>
            {registroPendiente.cantidadDocumentosSubidos !== undefined && (
              <div className="info-item">
                <strong>📎 Documentos:</strong>
                <span>{registroPendiente.cantidadDocumentosSubidos}/8</span>
              </div>
            )}
            {(registroPendiente.datos?.modalidad || registroPendiente.modalidad) && (
              <div className="info-item">
                <strong>📚 Modalidad:</strong>
                <span>{registroPendiente.datos?.modalidad || registroPendiente.modalidad}</span>
              </div>
            )}
            {!infoVencimiento?.vencido && (
              <div className="info-item vencimiento">
                <strong>📅 Vence:</strong>
                <span>{infoVencimiento?.fechaVencimiento}</span>
              </div>
            )}
          </div>

          {!infoVencimiento?.vencido ? (
            <div className="registro-mensaje">
              <p>
                📝 Tienes un registro pendiente que puedes completar ahora. 
                Al continuar, podrás subir la documentación faltante y completar tu inscripción.
              </p>
            </div>
          ) : (
            <div className="registro-mensaje vencido">
              <p>
                ⚠️ Este registro ha vencido y será eliminado automáticamente. 
                Deberás crear un nuevo registro de inscripción.
              </p>
            </div>
          )}
        </div>

        <div className="registro-actions">
          {!infoVencimiento?.vencido ? (
            <>
              <button 
                className="boton-principal"
                onClick={handleCompletarRegistro}
                disabled={completandoRegistro}
                style={{
                  backgroundColor: completandoRegistro ? '#ccc' : '#28a745',
                  borderColor: completandoRegistro ? '#ccc' : '#28a745'
                }}
              >
                {completandoRegistro ? '⏳ Procesando...' : '✅ Completar Registro'}
              </button>
              <button 
                className="boton-principal"
                onClick={handleCancelar}
                style={{
                  backgroundColor: '#6c757d',
                  borderColor: '#6c757d'
                }}
              >
                ↩️ Crear Nuevo Registro
              </button>
            </>
          ) : (
            <button 
              className="boton-principal"
              onClick={handleCancelar}
              style={{
                backgroundColor: '#dc3545',
                borderColor: '#dc3545'
              }}
            >
              🗑️ Eliminar y Crear Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Componente de alertas */}
      {alert.text && (
        <AlertaMens 
          text={alert.text} 
          variant={alert.variant} 
          onClose={() => setAlert({ text: '', variant: '' })}
          duration={4000} 
        />
      )}
    </div>
  );
};

VerificadorRegistroPendiente.propTypes = {
  dni: PropTypes.string,
  onRegistroCompleto: PropTypes.func,
  onSinRegistro: PropTypes.func,
};

export default VerificadorRegistroPendiente;