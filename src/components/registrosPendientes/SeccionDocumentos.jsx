import PropTypes from 'prop-types';

const SeccionDocumentos = ({ estadoDoc, mapeoDocumentos }) => {
    return (
        <div className="documentos-container">
            {/* Documentos subidos */}
            {estadoDoc.subidos.length > 0 && (
                <div className="seccion-documentos documentos-subidos">
                    <strong>✅ Documentos subidos:</strong>
                    <ul>
                        {estadoDoc.subidos.map(doc => (
                            <li key={doc}>
                                {mapeoDocumentos[doc] || doc}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Documentos faltantes */}
            {estadoDoc.faltantes.length > 0 && (
                <div className="seccion-documentos documentos-faltantes">
                    <strong>⚠️ Documentos faltantes:</strong>
                    <ul>
                        {estadoDoc.faltantes.map(doc => (
                            <li key={doc}>
                                {estadoDoc.documentosAlternativos && doc === estadoDoc.documentosAlternativos.preferido ? 
                                    `${mapeoDocumentos[doc] || doc} (o alternativamente: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa] || estadoDoc.documentosAlternativos.alternativa})` :
                                    mapeoDocumentos[doc] || doc
                                }
                            </li>
                        ))}
                    </ul>
                    {/* Información sobre documentos alternativos */}
                    {estadoDoc.documentosAlternativos && estadoDoc.faltantes.includes(estadoDoc.documentosAlternativos.preferido) && (
                        <div className="info-alternativos">
                            ℹ️ {estadoDoc.documentosAlternativos.descripcion}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

SeccionDocumentos.propTypes = {
    estadoDoc: PropTypes.object.isRequired,
    mapeoDocumentos: PropTypes.object.isRequired
};

export default SeccionDocumentos;