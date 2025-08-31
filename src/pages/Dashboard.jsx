import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/useUserContext';
/*import { NavLink } from 'react-router-dom';*/
import Modalidad from '../components/Modalidad';
import BotonCargando from '../components/BotonCargando';
import '../estilos/dashboard.css';


const Dashboard = () => {
  const { user } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null);
  const navigate = useNavigate();

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

  // Renderizar botones según el rol
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Bienvenido, {user.nombre}</h1>
        <p>Rol: {user.rol}</p>
        {/* Mostrar modalidad seleccionada solo si no es admDirector */}
        {user.rol !== 'admDirector' && (
          <p>Modalidad: {modalidadSeleccionada || 'No seleccionada'}</p>
        )}
      </div>
      <div className="dashboard-content">
        <div className="dashboard-buttons">
          <button onClick={handleGestionEstudiante}>Gestión Estudiante</button>
          <button onClick={handleEquivalencias}>Estudio de Equivalencias</button>
          <button>Plan A - B - C</button>
          {/*<NavLink to="/plan-a-b-c" className="dashboard-link">Plan A - B - C</NavLink>*/}
        </div>
      </div>
      {/* Modalidad solo para roles que no sean admDirector */}
      {user.rol !== 'admDirector' && (
        <Modalidad
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelectModalidad={(mod) => {
            setModalidadSeleccionada(mod);
            setIsModalOpen(false);
            // Navegar a Preinscripcion con modalidad seleccionada
            navigate(`/dashboard/formulario-inscripcion-adm?modalidad=${encodeURIComponent(mod)}`);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;