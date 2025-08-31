import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
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
    const estudianteParam = searchParams.get('estudiante'); //No trae nada
    const modalidadFromUrl = searchParams.get('modalidad'); // Capturar modalidad desde URL
    const [accion, setAccion] = useState(null);
    const [modalidadSeleccionada, setModalidadSeleccionada] = useState(modalidadFromUrl || 'Presencial'); // Valor por defecto

    // DEBUG: Verifica que modalidadSeleccionada tenga valor
    // Puedes quitar este log luego de depurar
    console.log('-------modalidadSeleccionada----:', modalidadSeleccionada, estudianteParam, '-----');

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

    const renderHeader = () => (
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
                    className={`pill-btn ${modalidadSeleccionada === 'Presencial' ? 'selected' : ''}`}
                    onClick={() => handleModalidadChange('Presencial')}
                >
                    Presencial
                </button>
                <button
                    className={`pill-btn ${modalidadSeleccionada === 'Semipresencial' ? 'selected' : ''}`}
                    onClick={() => handleModalidadChange('Semipresencial')}
                >
                    Semipresencial
                </button>
            </div>
            {/* Modalidad info y cambiar eliminados por pedido del usuario */}
        </div>
    );

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
                        onClose={() => {
                            setAccion(null);
                            if (!modalidadFromUrl) {
                                setModalidadSeleccionada('Presencial');
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
