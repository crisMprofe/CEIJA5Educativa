import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/useUserContext';
/*import { NavLink } from 'react-router-dom';*/
import Modalidad from '../components/Modalidad';
import BotonCargando from '../components/BotonCargando';
import AlertaMens from '../components/AlertaMens';
import ModalRegistrosPendientes from '../components/ModalRegistrosPendientes';
import GestorRegistrosWeb from '../components/GestorRegistrosWeb';
import MensajeError from '../utils/MensajeError';
import { descargarRegistrosJSON, obtenerRegistrosSinDocumentacion, inicializarSistemaLimpieza } from '../utils/registroSinDocumentacion';
import '../estilos/dashboard.css';


const Dashboard = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState({ text: '', variant: '' }); // Estado para AlertaMens
  const [showModalRegistros, setShowModalRegistros] = useState(false); // Estado para modal de registros
  const [registrosPendientes, setRegistrosPendientes] = useState([]); // Estado para los registros
  const [showGestorRegistrosWeb, setShowGestorRegistrosWeb] = useState(false); // Estado para gestor de registros web


  // Manejar navegación contextual desde formularios
  useEffect(() => {
    if (location.state?.openRegistrosWeb) {
      console.log('🔙 Abriendo Registros Web desde navegación contextual');
      handleRegistrosWeb();
      // Limpiar el estado para evitar que se vuelva a abrir
      navigate('/dashboard', { replace: true });
    } else if (location.state?.openRegistrosPendientes) {
      console.log('🔙 Abriendo Registros Pendientes desde navegación contextual');
      handleRegistrosSinDocumentacion();
      // Limpiar el estado para evitar que se vuelva a abrir
      navigate('/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

  if (!user) {
    return <BotonCargando loading={true} />;
  }


  // Handler para Gestión Estudiante
  const handleGestionEstudiante = () => {
    if (user.rol === 'admDirector') {
        console.log('🔄 Navegando a formulario-inscripcion-adm para admin'); // Registro para depuración
      navigate('/dashboard/formulario-inscripcion-adm');
    } else {
        console.log('🔄 Abriendo modal para seleccionar modalidad'); // Registro para depuración
      setIsModalOpen(true);
    }
  };

  // Handler para Estudio de Equivalencias (puedes ajustar la ruta si es diferente)
  const handleEquivalencias = () => {
    if (user.rol === 'admDirector') {
        console.log('🔄 Navegando a formulario-inscripcion-adm para admin'); // Registro para depuración
      navigate('/dashboard/formulario-inscripcion-adm');
    } else {
        console.log('🔄 Abriendo modal para seleccionar modalidad'); // Registro para depuración
      setIsModalOpen(true);
    }
  };

const handleCloseModal = () => {
  setIsModalOpen(false);
};

// Handler para gestionar registros sin documentación
const handleRegistrosSinDocumentacion = async () => {
  try {
    // Inicializar sistema si no está ya inicializado
    inicializarSistemaLimpieza();
    
    const registros = obtenerRegistrosSinDocumentacion();
    const cantidad = registros.length;
    
    if (cantidad === 0) {
      setAlert({ 
        text: 'No hay registros pendientes (sin documentación o incompletos).', 
        variant: 'info' 
      });
      return;
    }
    
    // Cargar registros en el estado y mostrar el modal
    setRegistrosPendientes(registros);
    setShowModalRegistros(true);
    
  } catch (error) {
    console.error('Error al gestionar registros pendientes:', error);
    const mensajeError = MensajeError(error);
    setAlert({ 
      text: `❌ Error: ${mensajeError}`, 
      variant: 'error' 
    });
  }
};

// Handler para cerrar modal de registros pendientes
const handleCloseModalRegistros = () => {
  setShowModalRegistros(false);
  setRegistrosPendientes([]);
};

// Handler para gestionar registros web
const handleRegistrosWeb = () => {
  setShowGestorRegistrosWeb(true);
};

// Handler para cerrar gestor de registros web
const handleCloseGestorRegistrosWeb = () => {
  setShowGestorRegistrosWeb(false);
};

// Handler para completar un registro web
const handleCompletarRegistroWeb = (registroCompleto) => {
  try {
    const datosRegistro = registroCompleto.datos;
    const idRegistro = registroCompleto.id;
    const archivosAdjuntos = registroCompleto.archivos || {};
    
    console.log('🚀 Iniciando completación de registro web:', datosRegistro);
    console.log('📎 Archivos adjuntos:', archivosAdjuntos);
    
    // Cerrar el modal de registros web
    handleCloseGestorRegistrosWeb();
    
    // Mostrar mensaje informativo
    setAlert({ 
      text: `📝 Completando registro web de ${datosRegistro.nombre} ${datosRegistro.apellido} (DNI: ${datosRegistro.dni})...`, 
      variant: 'info' 
    });
    
    // Navegar al formulario de inscripción con los datos pre-cargados
    if (user.rol === 'admDirector') {
      // Preparar todos los datos del registro web para el formulario
      const datosCompletos = JSON.stringify({
        // Datos personales
        nombre: datosRegistro.nombre || '',
        apellido: datosRegistro.apellido || '',
        dni: datosRegistro.dni || '',
        cuil: datosRegistro.cuil || '',
        email: datosRegistro.email || '',
        telefono: datosRegistro.telefono || '',
        fechaNacimiento: datosRegistro.fechaNacimiento || '',
        tipoDocumento: datosRegistro.tipoDocumento || 'DNI',
        paisEmision: datosRegistro.paisEmision || 'Argentina',
        
        // Domicilio
        calle: datosRegistro.calle || '',
        numero: datosRegistro.numero || '',
        barrio: datosRegistro.barrio || '',
        localidad: datosRegistro.localidad || '',
        provincia: datosRegistro.provincia || '',
        codigoPostal: datosRegistro.codigoPostal || '',
        
        // Información académica
        modalidad: datosRegistro.modalidad || '',
        modalidadId: datosRegistro.modalidadId || '',
        planAnio: datosRegistro.planAnio || '',
        modulos: datosRegistro.modulos || '',
        idModulo: datosRegistro.idModulo || null,
        
        // Información del registro web original
        idRegistroWeb: idRegistro,
        fechaRegistroWeb: registroCompleto.timestamp || new Date().toISOString(),
        usuarioWeb: datosRegistro.usuario || 'usuario_web',
        
        // Archivos adjuntos del registro web
        archivosAdjuntos: Object.keys(archivosAdjuntos).map(tipo => {
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
          
          return {
            tipo: tipo,
            nombre: nombreDocumento,
            ruta: archivosAdjuntos[tipo],
            archivo: archivosAdjuntos[tipo].split('/').pop()
          };
        }),
        archivosOriginales: archivosAdjuntos // Mantener la estructura original también
      });
      
      // Construir URL con parámetros esenciales
      const params = new URLSearchParams({
        completarWeb: idRegistro,
        dni: datosRegistro.dni,
        modalidad: datosRegistro.modalidad || '',
        datosWeb: encodeURIComponent(datosCompletos),
        origen: 'registros-web' // Añadir origen para navegación contextual
      });
      
      navigate(`/dashboard/formulario-inscripcion-adm?${params.toString()}`);
    } else {
      // Para usuarios normales, pasar por el selector de modalidad si es necesario
      if (datosRegistro.modalidad) {
        const params = new URLSearchParams({
          completarWeb: idRegistro,
          dni: datosRegistro.dni,
          modalidad: datosRegistro.modalidad,
          nombre: datosRegistro.nombre || '',
          apellido: datosRegistro.apellido || '',
          email: datosRegistro.email || '',
          telefono: datosRegistro.telefono || ''
        });
        navigate(`/dashboard/formulario-inscripcion-adm?${params.toString()}`);
      } else {
        // Abrir modal de modalidad y almacenar temporalmente los datos
        setIsModalOpen(true);
        sessionStorage.setItem('registroWebACompletar', JSON.stringify({
          id: idRegistro,
          datos: datosRegistro
        }));
      }
    }
    
  } catch (error) {
    console.error('Error al completar registro web:', error);
    const mensajeError = MensajeError(error);
    setAlert({ 
      text: `❌ Error: ${mensajeError}`, 
      variant: 'error' 
    });
  }
};

// Handler para descargar JSON desde el modal
const handleDescargarFromModal = async () => {
  try {
    const exito = descargarRegistrosJSON();
    if (exito) {
      setAlert({ 
        text: `✅ Archivo descargado exitosamente con ${registrosPendientes.length} registros pendientes.`, 
        variant: 'success' 
      });
      handleCloseModalRegistros();
    } else {
      setAlert({ 
        text: 'Error al descargar el archivo JSON. Inténtelo nuevamente.', 
        variant: 'error' 
      });
    }
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    const mensajeError = MensajeError(error);
    setAlert({ 
      text: `❌ Error: ${mensajeError}`, 
      variant: 'error' 
    });
  }
};

// Handler para completar un registro pendiente
const handleCompletarRegistro = (registro) => {
  try {
    console.log('🚀 Iniciando completación de registro:', registro);
    
    // Cerrar el modal
    handleCloseModalRegistros();
    
    // Mostrar mensaje informativo
    setAlert({ 
      text: `📝 Completando registro de ${registro.nombre} ${registro.apellido} (DNI: ${registro.dni})...`, 
      variant: 'info' 
    });
    
    // Navegar al formulario de inscripción con el DNI pre-cargado
    if (user.rol === 'admDirector') {
      navigate(`/dashboard/formulario-inscripcion-adm?completar=${registro.dni}&modalidad=${encodeURIComponent(registro.modalidad || '')}&origen=registros-pendientes`);
    } else {
      // Para usuarios normales, pasar por el selector de modalidad si es necesario
      if (registro.modalidad) {
        navigate(`/dashboard/formulario-inscripcion-adm?completar=${registro.dni}&modalidad=${encodeURIComponent(registro.modalidad)}&origen=registros-pendientes`);
      } else {
        // Abrir modal de modalidad
        setIsModalOpen(true);
        // Almacenar temporalmente el registro a completar
        sessionStorage.setItem('registroACompletar', JSON.stringify(registro));
      }
    }
    
  } catch (error) {
    console.error('Error al completar registro:', error);
    const mensajeError = MensajeError(error);
    setAlert({ 
      text: `❌ Error: ${mensajeError}`, 
      variant: 'error' 
    });
  }
};  // Renderizar botones según el rol
  return (
    <div className="dashboard-container" style={{ backgroundColor: '#ffffff' }}>
      <div className="dashboard-header">
        <h1>Bienvenido, {user.nombre}</h1>
        <p>Rol: {user.rol}</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-buttons">
          <button onClick={handleGestionEstudiante}>Gestión Estudiante</button>
          <button onClick={handleEquivalencias}>Estudio de Equivalencias</button>
          <button>Plan A - B - C</button>
          {/* Solo mostrar para administradores */}
          {(user.rol === 'admDirector' || user.rol === 'administrador') && (
            <>
              <button onClick={handleRegistrosSinDocumentacion}>
                📅 Registros Pendientes (7 días)
              </button>
              <button onClick={handleRegistrosWeb}>
                🌐 Registros Web
              </button>
            </>
          )}
          {/*<NavLink to="/plan-a-b-c" className="dashboard-link">Plan A - B - C</NavLink>*/}
        </div>
      </div>
      {/* Modalidad solo para roles que no sean admDirector */}
      {user.rol !== 'admDirector' && (
        <Modalidad
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelectModalidad={(mod) => {
            setIsModalOpen(false);
            // Navegar a Preinscripcion con modalidad seleccionada
            navigate(`/dashboard/formulario-inscripcion-adm?modalidad=${encodeURIComponent(mod)}`);
          }}
        />
      )}
      
      {/* Componente de alertas */}
      {alert.text && (
        <AlertaMens 
          text={alert.text} 
          variant={alert.variant} 
          onClose={() => setAlert({ text: '', variant: '' })}
          duration={5000} 
        />
      )}

      {/* Modal para mostrar registros pendientes */}
      {showModalRegistros && (
        <ModalRegistrosPendientes 
          registros={registrosPendientes}
          onClose={handleCloseModalRegistros}
          onDescargar={handleDescargarFromModal}
          onCompletarRegistro={handleCompletarRegistro}
        />
      )}

      {/* Gestor de registros web */}
      {showGestorRegistrosWeb && (
        <GestorRegistrosWeb 
          onClose={handleCloseGestorRegistrosWeb}
          onRegistroSeleccionado={handleCompletarRegistroWeb}
          isAdmin={true}
          key={showGestorRegistrosWeb} // Forzar re-render cuando se abre
        />
      )}
    </div>
  );
};

export default Dashboard;