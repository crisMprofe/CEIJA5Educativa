import { Field, ErrorMessage, useFormikContext } from 'formik';
import { useState, useEffect } from 'react';

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
    }, []);

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
        // Reset campos dependientes
        setFieldValue('localidad', '');
        setFieldValue('barrio', '');
    }, [values.provincia, setFieldValue]);

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
        // Reset barrio
        setFieldValue('barrio', '');
    }, [values.localidad, setFieldValue]);

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        console.log(`🔄 Cambiando ${name} a:`, value);
        setFieldValue(name, value);
    };

    const handleAddNew = (tipo) => {
        // TODO: Implementar modales para agregar nueva ubicación
        console.log(`➕ [ADMIN] Agregar nueva ${tipo}`);
        alert(`Funcionalidad "Agregar ${tipo}" en desarrollo`);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                            name="provincia"
                            value={values.provincia || ''}
                            onChange={handleSelectChange}
                            className="form-control"
                            disabled={loading}
                            style={{ flex: 1 }}
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
                                className="btn-add-location"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                            name="localidad"
                            value={values.localidad || ''}
                            onChange={handleSelectChange}
                            className="form-control"
                            disabled={!values.provincia || loading}
                            style={{ flex: 1 }}
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
                                className="btn-add-location"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                        name="barrio"
                        value={values.barrio || ''}
                        onChange={handleSelectChange}
                        className="form-control"
                        disabled={!values.localidad || loading}
                        style={{ flex: 1 }}
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
                            className="btn-add-location"
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#ffc107',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
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
        </div>
    );
};