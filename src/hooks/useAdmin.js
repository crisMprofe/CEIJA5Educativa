import { useState, useEffect } from 'react';

// Hook personalizado para manejar el estado de administrador
export const useAdmin = () => {
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        // Método 1: Verificar desde localStorage (para testing)
        const adminFlag = localStorage.getItem('esAdmin') === 'true';
        
        // Método 2: Verificar desde sessionStorage (más seguro)
        const sessionAdmin = sessionStorage.getItem('userRole') === 'admin';
        
        // Método 3: Verificar desde token JWT (recomendado para producción)
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //   try {
        //     const response = await fetch('/api/auth/verify-admin', {
        //       headers: { 
        //         'Authorization': `Bearer ${token}`,
        //         'Content-Type': 'application/json'
        //       }
        //     });
        //     const userData = await response.json();
        //     setEsAdmin(userData.success && userData.isAdmin);
        //   } catch (apiError) {
        //     console.error('Error verificando permisos:', apiError);
        //     setEsAdmin(false);
        //   }
        // } else {
        //   setEsAdmin(false);
        // }
        
        // Por ahora usar localStorage y sessionStorage
        setEsAdmin(adminFlag || sessionAdmin);
        
      } catch (error) {
        console.error('Error verificando permisos de admin:', error);
        setEsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verificarAdmin();
  }, []);

  const toggleAdmin = () => {
    const newAdminState = !esAdmin;
    setEsAdmin(newAdminState);
    localStorage.setItem('esAdmin', newAdminState.toString());
    sessionStorage.setItem('userRole', newAdminState ? 'admin' : 'user');
  };

  return { 
    esAdmin, 
    setEsAdmin, 
    loading, 
    toggleAdmin 
  };
};

// Función helper para testing - eliminar en producción
export const toggleAdminMode = () => {
  const current = localStorage.getItem('esAdmin') === 'true';
  const newState = !current;
  localStorage.setItem('esAdmin', newState.toString());
  sessionStorage.setItem('userRole', newState ? 'admin' : 'user');
  
  // Dispara evento personalizado para que los componentes se actualicen
  window.dispatchEvent(new CustomEvent('adminToggle', { detail: { esAdmin: newState } }));
  
  return newState;
};

// Hook para escuchar cambios de admin en tiempo real
export const useAdminListener = () => {
  const [esAdmin, setEsAdmin] = useState(localStorage.getItem('esAdmin') === 'true');

  useEffect(() => {
    const handleAdminToggle = (event) => {
      setEsAdmin(event.detail.esAdmin);
    };

    window.addEventListener('adminToggle', handleAdminToggle);
    
    return () => {
      window.removeEventListener('adminToggle', handleAdminToggle);
    };
  }, []);

  return esAdmin;
};