import { Field, ErrorMessage, useFormikContext } from 'formik';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AlertaMens from './AlertaMens';
import FormatError from '../utils/MensajeError';
import '../estilos/ModalAgregarBarrio.css';

export const Domicilio = ({ esAdmin = false }) => {
    const { values, setFieldValue } = useFormikContext();
    
    console.log('🏠 [Domicilio] Renderizando - esAdmin:', esAdmin);
    
    // Estados para selects dinámicos (TODOS los usuarios los ven)
    console.log('🌍 [Domicilio] Cargando selects dinámicos para:', esAdmin ? 'Administrador' : 'Usuario Web');
    
    const [provincias, setProvincias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [barrios, setBarrios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModalBarrio, setShowModalBarrio] = useState(false);
    const [nuevoBarrio, setNuevoBarrio] = useState('');
    const [guardandoBarrio, setGuardandoBarrio] = useState(false);
    const [alerta, setAlerta] = useState({ text: '', variant: '' });

    const API_BASE = 'http://localhost:5000/api/ubicaciones';

    // Cargar provincias al montar el componente
    useEffect(() => {
        const cargarProvincias = async () => {
            try {
                setLoading(true);
                setError('');
                console.log('🌍 Cargando provincias...');
                
                const response = await fetch(`${API_BASE}/provincias`);
                const data = await response.json();
                console.log('📍 Provincias recibidas:', data);
                
                if (data.success && data.data) {
                    setProvincias(data.data);
                    console.log(`✅ ${data.data.length} provincias cargadas`);
                    
                    // Si tenemos provincia pre-seleccionada desde registro pendiente, cargar localidades
                    if (values.provincia && values.provincia !== '') {
                        console.log('🏘️ Provincia pre-seleccionada desde registro pendiente:', values.provincia);
                        // Las localidades se cargarán automáticamente por el useEffect de provincia
                    }
                } else {
                    setError('Error cargando provincias');
                    console.error('❌ Error en respuesta de provincias:', data);
                }
            } catch (error) {
                setError('Error de conexión con provincias');
                console.error('🚨 Error al cargar provincias:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarProvincias();
    }, [values.provincia]);    
    
    // Efecto especial para manejar valores pre-cargados desde registros pendientes
    useEffect(() => {
        // Solo ejecutar si tenemos localidades cargadas y un valor de localidad desde registro pendiente
        if (localidades.length > 0 && values.localidad && values.localidad !== '') {
            console.log('🏘️ Localidad pre-seleccionada desde registro pendiente:', values.localidad);
            // Los barrios se cargarán automáticamente por el useEffect de localidad
        }
    }, [localidades, values.localidad]);
    
    // Efecto especial para manejar barrios pre-cargados
    useEffect(() => {
        if (barrios.length > 0 && values.barrio && values.barrio !== '') {
            console.log('🏠 Barrio pre-seleccionado desde registro pendiente:', values.barrio);
        }
    }, [barrios, values.barrio]);

    // Cargar localidades cuando cambia la provincia
    useEffect(() => {
        const cargarLocalidades = async () => {
            if (!values.provincia) {
                setLocalidades([]);
                return;
            }

            try {
                setLoading(true);
                console.log('🏘️ Cargando localidades para provincia:', values.provincia);
                
                const response = await fetch(`${API_BASE}/localidades/${values.provincia}`);
                const data = await response.json();
                console.log('🏘️ Localidades recibidas:', data);
                
                if (data.success && data.data) {
                    setLocalidades(data.data);
                    console.log(`✅ ${data.data.length} localidades cargadas`);
                } else {
                    setError('Error cargando localidades');
                    console.error('❌ Error en localidades:', data);
                }
            } catch (error) {
                setError('Error de conexión con localidades');
                console.error('🚨 Error al cargar localidades:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarLocalidades();
        // Reset campos dependientes solo si no vienen de registro pendiente
        if (!values.localidad || values.localidad === '') {
            setFieldValue('localidad', '');
        }
        if (!values.barrio || values.barrio === '') {
            setFieldValue('barrio', '');
        }
    }, [values.provincia, values.localidad, values.barrio, setFieldValue]);

    // Cargar barrios cuando cambia la localidad
    useEffect(() => {
        const cargarBarrios = async () => {
            if (!values.localidad) {
                setBarrios([]);
                return;
            }

            try {
                setLoading(true);
                console.log('🏠 Cargando barrios para localidad:', values.localidad);
                
                const response = await fetch(`${API_BASE}/barrios/${values.localidad}`);
                const data = await response.json();
                console.log('🏠 Barrios recibidos:', data);
                
                if (data.success && data.data) {
                    setBarrios(data.data);
                    console.log(`✅ ${data.data.length} barrios cargados`);
                } else {
                    setError('Error cargando barrios');
                    console.error('❌ Error en barrios:', data);
                }
            } catch (error) {
                setError('Error de conexión con barrios');
                console.error('🚨 Error al cargar barrios:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarBarrios();
        // Reset barrio solo si no viene de registro pendiente
        if (!values.barrio || values.barrio === '') {
            setFieldValue('barrio', '');
        }
    }, [values.localidad, values.barrio, setFieldValue]);

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        console.log(`🔄 Cambiando ${name} a:`, value);
        setFieldValue(name, value);
    };

    const handleAddNew = (tipo) => {
        if (tipo === 'barrio') {
            if (!values.localidad) {
                setAlerta({ text: 'Primero debe seleccionar una localidad', variant: 'error' });
                return;
            }
            setShowModalBarrio(true);
            setNuevoBarrio('');
        } else {
            // TODO: Implementar modales para agregar provincia y localidad
            console.log(`➕ [ADMIN] Agregar nueva ${tipo}`);
            setAlerta({ text: `Funcionalidad "Agregar ${tipo}" en desarrollo`, variant: 'info' });
        }
    };

    // Función para guardar nuevo barrio
    const guardarNuevoBarrio = async () => {
        if (!nuevoBarrio.trim()) {
            setAlerta({ text: 'Por favor ingrese un nombre para el barrio', variant: 'error' });
            return;
        }

        if (!values.localidad) {
            setAlerta({ text: 'Error: No hay localidad seleccionada', variant: 'error' });
            return;
        }

        try {
            setGuardandoBarrio(true);
            console.log('💾 Guardando nuevo barrio:', {
                nombre: nuevoBarrio.trim(),
                idLocalidad: values.localidad
            });

            const response = await fetch(`${API_BASE}/barrios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: nuevoBarrio.trim(),
                    idLocalidad: values.localidad
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Recargar la lista de barrios
                const responseBarrios = await fetch(`${API_BASE}/barrios/${values.localidad}`);
                const dataBarrios = await responseBarrios.json();
                
                if (dataBarrios.success && dataBarrios.data) {
                    setBarrios(dataBarrios.data);
                    
                    // Seleccionar automáticamente el barrio recién creado
                    setFieldValue('barrio', data.data.id);
                    
                    console.log('✅ Barrio creado exitosamente:', data.data);
                    setAlerta({ text: `Barrio "${nuevoBarrio}" creado exitosamente`, variant: 'success' });
                    
                    setShowModalBarrio(false);
                    setNuevoBarrio('');
                } else {
                    throw new Error('Error al recargar lista de barrios');
                }
            } else {
                throw new Error(data.message || 'Error al crear barrio');
            }
            
        } catch (error) {
            console.error('❌ Error al crear barrio:', error);
            setAlerta({ text: `Error al crear barrio: ${FormatError(error)}`, variant: 'error' });
        } finally {
            setGuardandoBarrio(false);
        }
    };

    return (
        <div className="form-domicilio">
            <h3>
                Domicilio {esAdmin ? '(Administrador)' : '(Usuario Web)'}
                {loading && <span style={{color: 'blue', marginLeft: '10px'}}>⏳</span>}
            </h3>
            
            {error && (
                <div style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '14px'
                }}>
                    ❌ {error}
                </div>
            )}

            <div className="form-group">
                <label>Calle:</label>
                <Field type="text" name="calle" placeholder="Calle" className="form-control" />
                <ErrorMessage name="calle" component="div" className="error" />
            </div>
            
            <div className="form-group">
                <label>Número:</label>
                <Field type="number" name="numero" placeholder="Número" className="form-control" />
                <ErrorMessage name="numero" component="div" className="error" />
            </div>
            
            <div className="localprovincia">
                <div className="form-group">
                    <label>Provincia:</label>
                    <div className="domicilio-input-con-boton">
                        <select
                            name="provincia"
                            value={values.provincia || ''}
                            onChange={handleSelectChange}
                            className="form-control domicilio-select-flex"
                            disabled={loading}
                        >
                            <option value="">Seleccione Provincia</option>
                            {provincias.map(provincia => (
                                <option key={provincia.id} value={provincia.id}>
                                    {provincia.nombre}
                                </option>
                            ))}
                        </select>
                        {esAdmin && (
                            <button
                                type="button"
                                onClick={() => handleAddNew('provincia')}
                                className="btn-add-location btn-add-provincia"
                                title="Agregar nueva provincia"
                            >
                                ➕
                            </button>
                        )}
                    </div>
                    <ErrorMessage name="provincia" component="div" className="error" />
                    <small style={{color: 'gray'}}>
                        {provincias.length} provincias disponibles
                    </small>
                </div>
                
                <div className="form-group">
                    <label>Localidad:</label>
                    <div className="domicilio-input-con-boton">
                        <select
                            name="localidad"
                            value={values.localidad || ''}
                            onChange={handleSelectChange}
                            className="form-control domicilio-select-flex"
                            disabled={!values.provincia || loading}
                        >
                            <option value="">
                                {!values.provincia ? 'Primero seleccione provincia' : 'Seleccione Localidad'}
                            </option>
                            {localidades.map(localidad => (
                                <option key={localidad.id} value={localidad.id}>
                                    {localidad.nombre}
                                </option>
                            ))}
                        </select>
                        {esAdmin && values.provincia && (
                            <button
                                type="button"
                                onClick={() => handleAddNew('localidad')}
                                className="btn-add-location btn-add-localidad"
                                title="Agregar nueva localidad"
                            >
                                ➕
                            </button>
                        )}
                    </div>
                    <ErrorMessage name="localidad" component="div" className="error" />
                    <small style={{color: 'gray'}}>
                        {localidades.length} localidades disponibles
                    </small>
                </div>
            </div>
            
            <div className="form-group">
                <label>Barrio:</label>
                <div className="domicilio-input-con-boton">
                    <select
                        name="barrio"
                        value={values.barrio || ''}
                        onChange={handleSelectChange}
                        className="form-control domicilio-select-flex"
                        disabled={!values.localidad || loading}
                    >
                        <option value="">
                            {!values.localidad ? 'Primero seleccione localidad' : 'Seleccione Barrio'}
                        </option>
                        {barrios.map(barrio => (
                            <option key={barrio.id} value={barrio.id}>
                                {barrio.nombre}
                            </option>
                        ))}
                    </select>
                    {esAdmin && values.localidad && (
                        <button
                            type="button"
                            onClick={() => handleAddNew('barrio')}
                            className="btn-add-location btn-add-barrio"
                            title="Agregar nuevo barrio"
                        >
                            ➕
                        </button>
                    )}
                </div>
                <ErrorMessage name="barrio" component="div" className="error" />
                <small style={{color: 'gray'}}>
                    {barrios.length} barrios disponibles
                </small>
            </div>

            {/* Modal para agregar nuevo barrio */}
            {showModalBarrio && (
                <div className="modal-agregar-barrio-overlay">
                    <div className="modal-agregar-barrio-container">
                        <h3 className="modal-agregar-barrio-titulo">
                            🏠 Agregar Nuevo Barrio
                        </h3>
                        
                        <div className="modal-agregar-barrio-grupo">
                            <label className="modal-agregar-barrio-label">
                                Nombre del barrio:
                            </label>
                            <input
                                type="text"
                                value={nuevoBarrio}
                                onChange={(e) => setNuevoBarrio(e.target.value)}
                                placeholder="Ej: Centro, San José, Villa María..."
                                className="modal-agregar-barrio-input"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        guardarNuevoBarrio();
                                    }
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="modal-agregar-barrio-botones">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModalBarrio(false);
                                    setNuevoBarrio('');
                                }}
                                disabled={guardandoBarrio}
                                className="modal-agregar-barrio-btn modal-agregar-barrio-btn-cancelar"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={guardarNuevoBarrio}
                                disabled={guardandoBarrio || !nuevoBarrio.trim()}
                                className={`modal-agregar-barrio-btn modal-agregar-barrio-btn-crear ${
                                    guardandoBarrio ? 'modal-agregar-barrio-guardando' : ''
                                }`}
                            >
                                {guardandoBarrio ? (
                                    <>
                                        <span className="modal-agregar-barrio-spinner"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>✅ Crear Barrio</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Estado informativo */}
            <div style={{
                background: esAdmin ? '#e8f5e8' : '#e3f2fd',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '10px',
                fontSize: '13px',
                color: esAdmin ? '#2e7d2e' : '#1976d2'
            }}>
                {esAdmin ? (
                    <>✅ <strong>Modo Admin:</strong> Selects dinámicos con botones para agregar ubicaciones</>
                ) : (
                    <>🌐 <strong>Usuario Web:</strong> Selects dinámicos cargados desde base de datos</>
                )}
                <br />
                📊 {provincias.length} provincias, {localidades.length} localidades, {barrios.length} barrios
            </div>

            {/* Alertas */}
            {alerta.text && (
                <AlertaMens 
                    text={alerta.text} 
                    variant={alerta.variant}
                    onClose={() => setAlerta({ text: '', variant: '' })}
                />
            )}
        </div>
    );
};

Domicilio.propTypes = {
    esAdmin: PropTypes.bool
};