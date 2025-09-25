import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../estilos/estilosInscripcion.css';
import '../estilos/preinscripcionHeader.css';

import AccionesFormulario from '../components/AccionesFormulario';
import OpcionesAccion from '../components/OpcionesAccion';
import GestionCRUD from '../components/GestionCRUD';
import GestionEstudiante from './GestionEstudiante';
import { Logo } from '../components/Logo';
import RegistroEstudiante from './RegistroEstd';
import ListaEstudiantes from './ListaEstudiantes';

const Preinscripcion = ({ isAdmin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const estudianteParam = searchParams.get('estudiante'); //No trae nada
    const modalidadFromUrl = searchParams.get('modalidad'); // Capturar modalidad desde URL
    const completarParam = searchParams.get('completar'); // Nuevo: DNI para completar registro pendiente
    const completarWebParam = searchParams.get('completarWeb'); // Nuevo: ID del registro web a completar
    const webParam = searchParams.get('web'); // Detectar si viene desde web
    const [accion, setAccion] = useState(null);
    const [modalidadSeleccionada, setModalidadSeleccionada] = useState(modalidadFromUrl || 'Presencial'); // Valor por defecto

    // DEBUG: Verifica que modalidadSeleccionada tenga valor
    // Puedes quitar este log luego de depurar
    console.log('-------modalidadSeleccionada----:', modalidadSeleccionada, estudianteParam, '-----');
    console.log('🔍 Parámetro completar:', completarParam);
    console.log('🌐 Parámetro completarWeb:', completarWebParam);
    console.log('🌐 Parámetro web:', webParam);

    // Efecto para manejar registro pendiente a completar o acceso web directo
    useEffect(() => {
        if (completarParam) {
            console.log('🚀 Iniciando modo completar registro para DNI:', completarParam);
            setAccion('Registrar'); // Establecer acción automáticamente
        } else if (completarWebParam) {
            console.log('🚀 Iniciando modo completar registro web para ID:', completarWebParam);
            setAccion('Registrar'); // Establecer acción automáticamente
        } else if (webParam === 'true') {
            console.log('🌐 Acceso desde web, iniciando registro directo');
            setAccion('Registrar'); // Ir directo al formulario de registro
        }
    }, [completarParam, completarWebParam, webParam]);

    // Si modalidadSeleccionada es null o undefined, muestra un mensaje y no renderiza nada más
    if (!modalidadSeleccionada) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
                Error: No se pudo determinar la modalidad. <br />
                Intenta recargar la página o selecciona una modalidad.
            </div>
        );
    }

    const handleModalidadChange = (nuevaModalidad) => {
        setModalidadSeleccionada(nuevaModalidad);
        setAccion(null); // Reinicia la acción para refrescar la vista principal
    };

    const renderHeader = () => {
        // Si es usuario web, mostrar un header más compacto y limpio
        if (webParam === 'true') {
            return (
                <div className="header-inscripcion web-professional">
                    {/* Header compacto sin duplicaciones */}
                    <div className="web-header-simple">
                        <div className="web-logo-left">
                            <Logo className="logo-web-small" />
                        </div>
                        <div className="web-title-center">
                            <h1 className="web-titulo-compacto">Formulario de Preinscripción</h1>
                            <span className="web-modalidad-simple">
                                {modalidadSeleccionada === 'Presencial' ? '📚' : '💻'} {modalidadSeleccionada}
                            </span>
                        </div>
                        <div className="web-simple-nav">
                            <button 
                                onClick={() => {
                                    // Cerrar debe ir al menú hamburguesa (Home)
                                    navigate('/');
                                }}
                                className="web-inicio-button"
                                title="Ir al menú principal"
                            >
                                🏠 Menú
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Header normal para administradores
        return (
            <div className="header-inscripcion mejorado">
                <div className="header-inscripcion-row">
                    <div className="header-logo">
                        <Logo className="logo-inscripcion" />
                    </div>
                    <div className="header-titulos">
                        <h1 className="titulo-principal">SISTEMA DE GESTIÓN DE ESTUDIANTES</h1>
                        <p className="subtitulo">Inscripción de Estudiantes - CEIJA 5</p>
                    </div>
                </div>
                {/* Botones de modalidad tipo pill */}
                <div className="header-modalidad-selector">
                    <button
                        className={`boton-principal-pill${modalidadSeleccionada === 'Presencial' ? ' selected' : ''}`}
                        onClick={() => handleModalidadChange('Presencial')}
                    >
                        Presencial
                    </button>
                    <button
                        className={`boton-principal-pill${modalidadSeleccionada === 'Semipresencial' ? ' selected' : ''}`}
                        onClick={() => handleModalidadChange('Semipresencial')}
                    >
                        Semipresencial
                    </button>
                </div>
                {/* Modalidad info y cambiar eliminados por pedido del usuario */}
            </div>
        );
    };

    const renderContent = () => {
        if (estudianteParam) {
            return (
                <GestionEstudiante 
                    estudianteData={JSON.parse(decodeURIComponent(estudianteParam))}
                    modalidad={modalidadSeleccionada}
                />
            );
        }

        if (!accion) {
            return (
                <AccionesFormulario
                    setAccion={setAccion}
                    isAdmin={isAdmin}
                    modalidad={modalidadSeleccionada}
                />
            );
        }

        switch (accion) {
            case 'Listar':
                return (
                    <ListaEstudiantes
                        modalidad={modalidadSeleccionada}
                        onClose={() => setAccion(null)}
                    />
                );
            case 'Consultar':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="opciones"
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'Modificar':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="opcionesModificar"
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'ModificarPorDNI':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="busquedaDNI"
                        esModificacion={true}
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'ModificarLista':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="listaModificar"
                        esModificacion={true}
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'Eliminar':
                return (
                    <OpcionesAccion
                        accion="Eliminar"
                        onSeleccion={(opcion) => {
                            if (opcion === 'dni') {
                                setAccion('EliminarPorDNI');
                            } else if (opcion === 'lista') {
                                setAccion('EliminarLista');
                            }
                        }}
                        onClose={() => setAccion(null)}
                    />
                );
            case 'EliminarPorDNI':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="opcionesEliminar"
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'EliminarLista':
                return (
                    <GestionCRUD
                        isAdmin={isAdmin}
                        onClose={() => setAccion(null)}
                        vistaInicial="listaEliminar"
                        modalidad={modalidadSeleccionada}
                    />
                );
            case 'Registrar':
                if (!modalidadSeleccionada) {
                    return ( 
                    <RegistroEstudiante
                        modalidad={modalidadSeleccionada}
                     onClose={() => setAccion(null)}/>

                    );
                       
                   
                }
                return (
                    <GestionEstudiante
                        modalidad={modalidadSeleccionada}
                        accion="Registrar"
                        isAdmin={isAdmin}
                        isWebUser={webParam === 'true'} // Nuevo: indicar si es usuario web
                        completarRegistro={completarParam} // Nuevo: pasar DNI para completar
                        onClose={() => {
                            // Si es usuario web, volver a Home (menú hamburguesa)
                            if (webParam === 'true') {
                                navigate('/');
                            } else {
                                // Si es admin, volver al menú de modalidad
                                setAccion(null);
                                if (!modalidadFromUrl) {
                                    setModalidadSeleccionada('Presencial');
                                }
                            }
                        }}
                        onBack={() => {
                            // Botón "Volver" debe regresar al selector de modalidad
                            if (webParam === 'true') {
                                // Para usuarios web, ir al componente Modalidad
                                navigate('/?modalidad=selector');
                            } else {
                                // Para admin, volver al menú de modalidad
                                setAccion(null);
                            }
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container-preinscripcion">
            {renderHeader()}
            <div className="contenido-principal">
                {renderContent()}
            </div>
        </div>
    );
};

Preinscripcion.propTypes = {
    isAdmin: PropTypes.bool.isRequired,
};

export default Preinscripcion;
