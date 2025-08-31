import PropTypes from 'prop-types';


const TarjetaPersonales = ({
    estudiante,
    formData,
    editMode,
    isConsulta,
    isEliminacion,
    handleInputChange,
    setEditMode,
    formatearFecha
}) => {
    const fotoSrc = formData.foto || estudiante.foto;
    const isString = typeof fotoSrc === 'string';

    return (
        <div className="tarjeta tarjeta-personales" style={{ height: '520px' }}>
            <div className="tarjeta-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Datos Personales</h3>
                    <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.1em' }}>ID: {estudiante.id}</span>
                </div>
                {!isConsulta && !isEliminacion && (
                    <button onClick={() => setEditMode(prev => ({ ...prev, personales: true }))}>✏️</button>
                )}
            </div>
            <div className="tarjeta-contenido">
                <div className="dato-item">
                    <label>Apellido:</label>
                    {editMode.personales ? (
                        <input value={formData.apellido || ''} onChange={e => handleInputChange('apellido', e.target.value)} />
                    ) : (
                        <span>{estudiante.apellido}</span>
                    )}
                </div>
                <div className="dato-item">
                    <label>Nombre:</label>
                    {editMode.personales ? (
                        <input value={formData.nombre || ''} onChange={e => handleInputChange('nombre', e.target.value)} />
                    ) : (
                        <span>{estudiante.nombre}</span>
                    )}
                </div>
                <div className="dato-item">
                    <label>Tipo de Documento:</label>
                    {editMode.personales ? (
                        <input value={formData.tipoDocumento || ''} onChange={e => handleInputChange('tipoDocumento', e.target.value)} />
                    ) : (
                        <span>{estudiante.tipoDocumento}</span>
                    )}
                </div>
                <div className="dato-item">
                    <label>DNI:</label>
                    <span>{estudiante.dni}</span>
                </div>
                <div className="dato-item">
                    <label>CUIL:</label>
                    {editMode.personales ? (
                        <input value={formData.cuil || ''} onChange={e => handleInputChange('cuil', e.target.value)} />
                    ) : (
                        <span>{estudiante.cuil}</span>
                    )}
                </div>
                <div className="dato-item">
                    <label>Email:</label>
                    {editMode.personales ? (
                        <input value={formData.email || ''} type="email" onChange={e => handleInputChange('email', e.target.value)} />
                    ) : (
                        <span>{estudiante.email}</span>
                    )}
                </div>
                <div className="dato-item">
                    <label>Fecha de Nacimiento:</label>
                    {editMode.personales ? (
                        <input 
                            type="date" 
                            value={formData.fechaNacimiento || ''} 
                            onChange={e => handleInputChange('fechaNacimiento', e.target.value)} 
                        />
                    ) : (
                        <span>{formatearFecha(estudiante.fechaNacimiento)}</span>
                    )}
                </div>
                
                <div className="dato-item">
                    <label>País de Emisión:</label>
                    {editMode.personales ? (
                        <input value={formData.paisEmision || ''} onChange={e => handleInputChange('paisEmision', e.target.value)} />
                    ) : (
                        <span>{estudiante.paisEmision}</span>
                    )}
                </div>
                {/* FOTO DEL ESTUDIANTE */}
                <div className="foto-container" style={{ textAlign: 'center', marginBottom: '1rem', position: 'relative' }}>
                    {editMode.personales ? (
                        <>
                            <img
                                src={formData.fotoPreview
                                    ? formData.fotoPreview
                                    : (isString
                                        ? (fotoSrc.startsWith('http')
                                            ? fotoSrc
                                            : `http://localhost:5000${fotoSrc}`)
                                        : '/img/default-avatar.png')
                                }
                                alt={`Foto de ${formData.nombre || estudiante.nombre} ${formData.apellido || estudiante.apellido}`}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                            />
                            <input
                                type="file"
                                id="input-cambiar-foto"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => handleInputChange('foto', e.target.files[0])}
                            />
                            <label htmlFor="input-cambiar-foto" style={{ position: 'absolute', right: '10px', top: '10px', cursor: 'pointer', background: '#fff', borderRadius: '50%', padding: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }} title="Cambiar foto">
                                <span role="img" aria-label="Cambiar foto" style={{ fontSize: '1.5em' }}>🖼️</span>
                            </label>
                        </>
                    ) : (
                        isString ? (
                            <img
                                src={
                                    fotoSrc.startsWith('http')
                                        ? fotoSrc
                                        : `http://localhost:5000${fotoSrc}`
                                }
                                alt={`Foto de ${formData.nombre || estudiante.nombre} ${formData.apellido || estudiante.apellido}`}
                                style={{ maxWidth: '120px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                            />
                        ) : (
                            <img
                                src="/img/default-avatar.png"
                                alt="Foto del estudiante"
                                style={{ width: '120px', height: '120px', borderRadius: '50%' }}
                            />
                        )
                    )}
                </div>
               {/*} {editMode.personales && (
                    <div className="visor-acciones">
                        <button className="btn-guardar-seccion" onClick={handleGuardarLocal}>Guardar</button>
                        <button className="btn-cancelar-seccion" onClick={handleCancelarLocal}>Cancelar</button>
                    </div>
                )}*/}
            </div>
        </div>
    );
}
TarjetaPersonales.propTypes = {
    estudiante: PropTypes.object.isRequired,
    formData: PropTypes.object.isRequired,
    editMode: PropTypes.object.isRequired,
    isConsulta: PropTypes.bool,
    isEliminacion: PropTypes.bool,
    handleInputChange: PropTypes.func.isRequired,
    setEditMode: PropTypes.func.isRequired,
    formatearFecha: PropTypes.func.isRequired
};

export default TarjetaPersonales;
