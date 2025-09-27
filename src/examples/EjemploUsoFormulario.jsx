import React from 'react';
import { Formik, Form } from 'formik';
import { Domicilio } from '../components/Domicilio';
import { useAdmin } from '../hooks/useAdmin';
import '../estilos/SelectUbicacion.css';

const EjemploUsoFormulario = () => {
  const { esAdmin, loading } = useAdmin();

  if (loading) {
    return <div>Cargando permisos...</div>;
  }

  return (
    <div>
      <h2>Ejemplo de Formulario con Ubicaciones</h2>
      
      {/* Botón para testing - eliminar en producción */}
      <button onClick={() => window.toggleAdminMode?.()}>
        {esAdmin ? 'Cambiar a Usuario Normal' : 'Cambiar a Admin'}
      </button>
      
      <p>Modo actual: {esAdmin ? 'Administrador' : 'Usuario Normal'}</p>
      
      <Formik
        initialValues={{
          calle: '',
          numero: '',
          barrio: '',
          localidad: '',
          provincia: ''
        }}
        onSubmit={(values) => {
          console.log('Valores del formulario:', values);
          // Aquí procesar el formulario
        }}
      >
        <Form>
          <Domicilio esAdmin={esAdmin} />
          
          <button type="submit" className="btn-submit">
            Enviar Formulario
          </button>
        </Form>
      </Formik>
    </div>
  );
};

export default EjemploUsoFormulario;