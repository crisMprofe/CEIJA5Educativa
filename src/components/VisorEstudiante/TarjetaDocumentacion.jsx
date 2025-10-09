import PropTypes from 'prop-types';
import { useState, useEffect, useContext, useMemo } from 'react';
import useGestionDocumentacion from '../../hooks/useGestionDocumentacion';
import { useAlertContext } from '../../context/AlertContext';
import '../../estilos/estilosInscripcion.css';
import '../../estilos/tarjetas.css';


const TarjetaDocumentacion = ({ estudiante, editMode, setEditMode, isConsulta, isEliminacion, onGuardar, onCancelar }) => {
    const [archivosSubidos, setArchivosSubidos] = useState({});
    
    // Memoizar la documentación para evitar renders innecesarios
    const documentacion = useMemo(() => {
        return estudiante?.documentacion || [];
    }, [estudiante?.documentacion]);
    
    // Usar el sistema unificado de alertas
    const { showSuccess, showWarning } = useContext(useAlertContext);

    const {
        files,
        previews,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
        setPreviews
    } = useGestionDocumentacion();

// Solo inicializar previews una vez cuando cambie la documentación
useEffect(() => {
    if (documentacion.length > 0) {
        const inicialPreviews = {};
        documentacion.forEach(doc => {
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
        setPreviews(inicialPreviews);
    }
}, [documentacion, setPreviews]);

    const handleSubirArchivo = (desc) => {
        if (previews[desc]?.file) {
            setArchivosSubidos(prev => ({ ...prev, [desc]: true }));
        }
    };

    return (
        <div className="tarjeta tarjeta-documentacion">
            <div className="tarjeta-header">
                <h3>Documentación Presentada</h3>
                {!isConsulta && !isEliminacion && (
                    <button onClick={() => setEditMode(true)} title="Editar documentación">✏️</button>
                )}
            </div>
            <div className="tarjeta-contenido">
                <div className="documentacion-lista-tarjeta">
                    {documentacion.map((doc, idx) => {
                        const desc = doc.descripcionDocumentacion;
                        const fileSelected = previews[desc]?.file;
                        const tieneArchivo = !!(doc.archivoDocumentacion && doc.archivoDocumentacion !== null);
                        const fileUploaded = archivosSubidos[desc] || tieneArchivo;
                        const fileUrl = tieneArchivo
                            ? (doc.archivoDocumentacion.startsWith('http')
                                ? doc.archivoDocumentacion
                                : `http://localhost:5000${doc.archivoDocumentacion}`)
                            : null;
                        return (
                            <div key={doc.idDocumentaciones || idx} className={`documento-item-tarjeta ${!fileUploaded ? 'faltante' : ''}`}>
                                <div className="documento-info">
                                    <span className="documento-icono" data-estado={fileUploaded ? 'entregado' : 'faltante'}>
                                        {fileUploaded ? '✓' : '✗'}
                                    </span>
                                    <span className="documento-nombre-corto">{desc}</span>
                                </div>
                                <div className="documento-acciones">
                                    {fileUrl && (
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ver-archivo-mini"
                                            title="Ver documento"
                                        >👁️ Ver archivo</a>
                                    )}
                                    {!fileUrl && fileUploaded && (
                                        <span className="documento-entregado" title="Archivo subido" style={{ color: 'green', fontSize: '1.3em', marginLeft: 8 }}>✔️</span>
                                    )}
                                    {!fileUploaded && (
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
                            showSuccess('¡Documentación modificada con éxito!');
                            setEditMode(false);
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
                            showWarning('Modificación cancelada.');
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
