import { useMemo } from 'react';
import PropTypes from 'prop-types';
import '../estilos/estilosFormDocumentacion.css';
import '../estilos/estilosCheckboxDoc.css';
import CloseButton from '../components/CloseButton'; // Importa el componente CloseButton

const FormDocumentacion = ({ previews, handleFileChange, onClose }) => {
    const faltaDocumento = useMemo(() => {
        return !["archivo_solicitudPase", "archivo_analiticoParcial", "archivo_certificadoNivelPrimario"].some(
            (doc) => previews?.[doc]?.url
        );
        }, [previews]);



    return (
        <>
            <div className="form-documentacion">
                {/* Botón "Cerrar" arriba a la derecha */}
                <CloseButton onClose={onClose} />
                <div className="form-h3">
                    <h3>
                        Documentación a presentar <br />
                        <span>Recuerda que debes presentarla al momento de la inscripción presencial</span>
                    </h3>
                </div>
                {faltaDocumento && (
                    <div style={{ color: '#4e53e6', marginBottom: 10 }}>
                        Recordar Documento faltante: Solicitud de Pase, Analítico Parcial/Pase ó Certificado Nivel Primario.
                    </div>
                )}
                <div className="form-doc-table">
                    <div className="doc-table-header">
                        <span>Entregado</span>
                        <span>Documento</span>
                        <span>Adjuntar Archivo</span>
                        <span>Vista Previa</span>
                    </div>
                    {[
                        { label: "Foto", name: "foto" },
                        { label: "DNI", name: "archivo_dni" },
                        { label: "CUIL", name: "archivo_cuil" },
                        { label: "Ficha Médica", name: "archivo_fichaMedica" },
                        { label: "Partida de Nacimiento", name: "archivo_partidaNacimiento" },
                        { label: "Solicitud Pase", name: "archivo_solicitudPase" },
                        { label: "Analítico Parcial/Pase", name: "archivo_analiticoParcial" }, // Corregido
                        { label: "Certificado Nivel Primario", name: "archivo_certificadoNivelPrimario" }, // Corregido
                    ].map(({ label, name }) => (
                        <div className="doc-table-row" key={name}>
                            {/* Checkbox entregado/faltante */}
                            <input
                                type="checkbox"
                                checked={!!previews[name]?.url}
                                readOnly
                                disabled
                                className={previews[name]?.url ? 'archivo-adjunto' : ''}
                                title={previews[name]?.url ? "Entregado" : "Faltante"}
                            />

                            {/* Nombre del documento */}
                            <span>{label}</span>
                            {/* Adjuntar archivo */}
                            <div className="input-container-doc">
                                <input
                                    type="file"
                                    name={name}
                                    className="small-select"
                                    onChange={(e) => handleFileChange(e, name)} // Llama a handleFileChange
                                    accept="image/*,application/pdf"
                                />
                            </div>
                            {/* Vista previa */}
                            <div className="preview-container">
                                {previews[name]?.url ? (
                                    <>
                                        {previews[name].type?.startsWith('image/') ? (
                                            <img src={previews[name].url} alt={`Vista previa de ${label}`} className="image-preview" />
                                        ) : previews[name].type === 'application/pdf' ? (
                                            <embed src={previews[name].url} type="application/pdf" className="pdf-preview" />
                                        ) : (
                                            <span className="archivo-desconocido">Archivo cargado</span>
                                        )}
                                        <div className="archivo-status">
                                            <span className="archivo-subido">✓ Archivo subido</span>
                                            <a
                                                href={previews[name].url}
                                                download={`${label}_${new Date().toISOString().split('T')[0]}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-ver"
                                                title="Ver archivo"
                                            >
                                                Ver
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <span className="sin-archivo">Sin archivo</span>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

// Definir los propTypes
FormDocumentacion.propTypes = {
    previews: PropTypes.shape({
        foto: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_dni: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_cuil: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_partidaNacimiento: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_fichaMedica: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_solicitudPase: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
        archivo_analiticoParcial: PropTypes.shape({
        url: PropTypes.string,
        type: PropTypes.string,
        }),
        archivo_certificadoNivelPrimario: PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
    }),

    handleFileChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default FormDocumentacion;

