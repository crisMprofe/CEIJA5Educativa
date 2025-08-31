import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import useGestionDocumentacion from '../../hooks/useGestionDocumentacion';

const TarjetaDocumentacion = ({ estudiante, editMode, setEditMode, isConsulta, isEliminacion, onGuardar, onCancelar }) => {
    const [archivosSubidos, setArchivosSubidos] = useState({});

    const {
        files,
        previews,
        alert,
        setAlert,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
        setPreviews
    } = useGestionDocumentacion();

useEffect(() => {
    if (estudiante?.documentacion) {
        const inicialPreviews = {};
        estudiante.documentacion.forEach(doc => {
            inicialPreviews[doc.descripcionDocumentacion] = {
                url: doc.archivoDocumentacion
                    ? (doc.archivoDocumentacion.startsWith('http')
                        ? doc.archivoDocumentacion
                        : `http://localhost:5000${doc.archivoDocumentacion}`)
                    : null,
                type: 'application/pdf',
                file: null
            };
        });
        // Solo actualiza si realmente cambió
        if (JSON.stringify(previews) !== JSON.stringify(inicialPreviews)) {
            setPreviews(inicialPreviews);
        }
        // El reset de archivos solo se hace si realmente cambió la documentación
        // y nunca dentro del mismo render que setPreviews para evitar bucles
    }
    // Solo depende de estudiante.documentacion
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [estudiante?.documentacion]);

    const handleSubirArchivo = (desc) => {
        if (previews[desc]?.file) {
            setArchivosSubidos(prev => ({ ...prev, [desc]: true }));
        }
    };

    return (
        <div className="tarjeta tarjeta-documentacion">
            {alert.text && <div className={`alerta alerta-${alert.variant}`}>{alert.text}</div>}
            <div className="tarjeta-header">
                <h3>Documentación Presentada</h3>
                {!isConsulta && !isEliminacion && (
                    <button onClick={() => setEditMode(true)} title="Editar documentación">✏️</button>
                )}
            </div>
            <div className="tarjeta-contenido">
                <div className="documentacion-lista-tarjeta">
                    {(estudiante.documentacion || []).map((doc, idx) => {
                        const desc = doc.descripcionDocumentacion;
                        const fileSelected = previews[desc]?.file;
                        const fileUploaded = archivosSubidos[desc] || doc.archivoDocumentacion;

                        return (
                            <div key={doc.idDocumentaciones || idx} className={`documento-item-tarjeta ${!fileUploaded ? 'faltante' : ''}`}>
                                <div className="documento-info">
                                    <span className="documento-icono" data-estado={fileUploaded ? 'entregado' : 'faltante'}>
                                        {fileUploaded ? '✓' : '✗'}
                                    </span>
                                    <span className="documento-nombre-corto">{desc}</span>
                                </div>
                                <div className="documento-acciones">
                                    {doc.archivoDocumentacion && !archivosSubidos[desc] ? (
                                        <a
                                            href={doc.archivoDocumentacion.startsWith('http') ? doc.archivoDocumentacion : `http://localhost:5000${doc.archivoDocumentacion}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ver-archivo-mini"
                                            title="Ver documento"
                                        >👁️ Ver archivo</a>
                                    ) : fileUploaded ? (
                                        <span className="documento-entregado" title="Archivo subido" style={{ color: 'green', fontSize: '1.3em', marginLeft: 8 }}>✔️</span>
                                    ) : (
                                        <span className="documento-faltante" title="Documento faltante">❌</span>
                                    )}
                                    {!isConsulta && editMode && !fileUploaded && (
                                        <>
                                            <input
                                                type="file"
                                                id={`file-input-${doc.idDocumentaciones || idx}`}
                                                className="input-cargar-archivo"
                                                style={{ display: 'none' }}
                                                title="Subir documento"
                                                onChange={e => handleFileChange(e, desc)}
                                            />
                                            <label htmlFor={`file-input-${doc.idDocumentaciones || idx}`} style={{ cursor: 'pointer' }} title="Seleccionar archivo">
                                                <span role="img" aria-label="Seleccionar archivo" style={{ fontSize: '1.3em' }}>📎</span>
                                            </label>
                                            {fileSelected && <span style={{ color: '#1976d2', fontWeight: 500, marginLeft: 6 }}>{fileSelected.name}</span>}
                                            <button
                                                className="btn-subir-archivo-mini"
                                                title="Subir archivo"
                                                style={{ marginLeft: 6, background: fileSelected ? '#e3fbe3' : undefined }}
                                                onClick={() => handleSubirArchivo(desc)}
                                                disabled={!fileSelected}
                                            >📤</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {editMode && (
                <div className="visor-acciones">
                    <button
                        className="btn-guardar-seccion"
                        onClick={() => {
                            const detalle = buildDetalleDocumentacion();
                            if (typeof onGuardar === 'function') {
                                onGuardar({ detalleDocumentacion: detalle, archivos: files });
                            }
                            setAlert({ text: '¡Documentación modificada con éxito!', variant: 'success' });
                            setEditMode(false);
                            setTimeout(() => setAlert({ text: '', variant: '' }), 2500);
                        }}
                    >
                        Guardar cambios
                    </button>
                    <button
                        className="btn-cancelar-seccion"
                        onClick={() => {
                            resetArchivos();
                            if (typeof onCancelar === 'function') onCancelar();
                            setEditMode(false);
                            setAlert({ text: 'Modificación cancelada.', variant: 'warning' });
                            setTimeout(() => setAlert({ text: '', variant: '' }), 2000);
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

TarjetaDocumentacion.propTypes = {
    estudiante: PropTypes.object.isRequired,
    editMode: PropTypes.bool,
    setEditMode: PropTypes.func,
    isConsulta: PropTypes.bool,
    isEliminacion: PropTypes.bool,
    onGuardar: PropTypes.func,
    onCancelar: PropTypes.func
};

export default TarjetaDocumentacion;
