import PropTypes from 'prop-types';
import '../estilos/modalUniforme.css';
import CloseButton from '../components/CloseButton';
import { serviceInscripcion } from '../services';

// Función para formatear la fecha
const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const ConsultaEstd = ({ data, onClose }) => {
    // Si por alguna razón el objeto no trae success true, mostramos mensaje genérico
    if (!data?.success) {
        return (
            <div className="modal-overlay-uniforme">
                <div className="modal-container-uniforme">
                    <div className="modal-header-buttons-uniforme modal-header-buttons-small">
                        <CloseButton onClose={onClose} className="boton-principal boton-small" />
                    </div>
                    <p>No se encontraron datos para el estudiante.</p>
                </div>
            </div>
        );
    }

    // Desestructuramos directamente
    const { estudiante, domicilio, inscripcion, documentacion } = data;

    // Generar comprobante de inscripción
    const handleGenerarComprobante = async () => {
        // Obtener estado documental y generar comprobante con toda la info relevante
        const estadoDoc = await serviceInscripcion.getEstadoDocumental(inscripcion.idInscripcion);
        if (!estadoDoc.success) {
            // Manejar error
            return;
        }
        // Unificar todos los datos relevantes para el comprobante
        const comprobanteData = {
            // Datos personales
            nombre: estudiante?.nombre,
            apellido: estudiante?.apellido,
            dni: estudiante?.dni,
            cuil: estudiante?.cuil,
            email: estudiante?.email,
            fechaNacimiento: estudiante?.fechaNacimiento,
            tipoDocumento: estudiante?.tipoDocumento,
            paisEmision: estudiante?.paisEmision,
            activo: estudiante?.activo,
            // Domicilio
            domicilio: domicilio || {},
            // Inscripción
            modalidad: inscripcion?.modalidad,
            planAnio: inscripcion?.planAnio || inscripcion?.plan,
            cursoPlan: inscripcion?.plan,
            modulo: inscripcion?.modulo || inscripcion?.modulos,
            estadoInscripcion: inscripcion?.estado,
            fechaInscripcion: inscripcion?.fechaInscripcion,
            // Documentación
            documentacion: documentacion || [],
            // Estado documental
            requeridos: estadoDoc.requeridos,
            presentados: estadoDoc.presentados || [], // Aseguramos array
            faltantes: estadoDoc.faltantes || [] // Aseguramos array
        };
        // Aseguramos que presentados y faltantes sean solo arrays de nombres
        if (Array.isArray(comprobanteData.presentados)) {
            comprobanteData.presentados = comprobanteData.presentados.map(nombre => typeof nombre === 'string' ? nombre : nombre.descripcionDocumentacion);
        }
        if (Array.isArray(comprobanteData.faltantes)) {
            comprobanteData.faltantes = comprobanteData.faltantes.map(nombre => typeof nombre === 'string' ? nombre : nombre.descripcionDocumentacion);
        }
        // Log para depuración
        console.log('✅ Documentos presentados:', comprobanteData.presentados);
        console.log('❌ Documentos faltantes:', comprobanteData.faltantes);
        import('../components/ComprobanteGenerator').then(mod => {
            mod.default.generar(comprobanteData);
        });
    };

    console.log('DOMICILIO RECIBIDO:', domicilio); // en ConsultaEstd.jsx
    console.log('ESTUDIANTE RECIBIDO:', estudiante); // en VisorEstudiante.jsx

    return (
        <div className="modal-overlay-uniforme">
            <div className="modal-container-uniforme">
                <div className="modal-header-buttons-uniforme modal-header-buttons-small">
                    <CloseButton onClose={onClose} className="boton-principal boton-small" />
                </div>
                <div className="modal-header-uniforme">
                    <div>
                        <h2 className="modal-title-uniforme">Consulta Completa del Estudiante</h2>
                        <p className="modal-subtitle-uniforme">Información detallada del registro académico</p>
                    </div>
                    <button className="btn-uniforme btn-secondary-uniforme" onClick={handleGenerarComprobante}>
                       📄 Emitir Comprobante
                    </button>
                </div>
                <div className="modal-content-uniforme">
                    <div className="consultaEstdRow tarjetas-container">
                        {/* Datos Personales */}
                        <div className="tarjeta-uniforme">
                            <div className="tarjeta-header-uniforme"><h3>Datos Personales</h3></div>
                            <div className="tarjeta-contenido-uniforme">
                                <div className="dato-item-uniforme">
                                    <label>Nombre:</label> 
                                    <span>{estudiante?.nombre || 'No especificado'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>Apellido:</label> 
                                    <span>{estudiante?.apellido || 'No especificado'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>DNI:</label> 
                                    <span>{estudiante?.dni || 'No especificado'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>CUIL:</label> 
                                    <span>{estudiante?.cuil || 'No especificado'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>Email:</label> 
                                    <span>{estudiante?.email || 'Sin email registrado'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>Fecha de Nacimiento:</label> 
                                    <span>{formatDate(estudiante?.fechaNacimiento)}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>Tipo de Documento:</label> 
                                    <span>{estudiante?.tipoDocumento || 'DNI'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>País de Emisión:</label> 
                                    <span>{estudiante?.paisEmision || 'Argentina'}</span>
                                </div>
                                <div className="dato-item-uniforme">
                                    <label>Estado:</label> 
                                    <span className={`estado-badge-uniforme estado-${estudiante?.activo ? 'activo' : 'inactivo'}-uniforme`}>
                                        {estudiante?.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Domicilio */}
                        <div className="tarjeta-uniforme">
                            <div className="tarjeta-header-uniforme"><h3>Domicilio</h3></div>
                            <div className="tarjeta-contenido-uniforme">
                                {domicilio ? (
                                    <>
                                        <div className="dato-item-uniforme">
                                            <label>Calle:</label> 
                                            <span>{domicilio.calle || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Número:</label> 
                                            <span>{domicilio.numero || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Barrio:</label> 
                                            <span>{domicilio.barrio || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Localidad:</label> 
                                            <span>{domicilio.localidad || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Provincia:</label> 
                                            <span>{domicilio.provincia || 'No especificado'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="dato-item-uniforme">
                                        <span>No se encontraron datos de domicilio.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Información Académica */}
                        <div className="tarjeta-uniforme">
                            <div className="tarjeta-header-uniforme"><h3>Información Académica</h3></div>
                            <div className="tarjeta-contenido-uniforme">
                                {inscripcion ? (
                                    <>
                                        <div className="dato-item-uniforme">
                                            <label>Modalidad:</label> 
                                            <span>{inscripcion.modalidad || 'No especificada'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Curso / Plan:</label> 
                                            <span>{inscripcion.plan || inscripcion.planAnio || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Módulo:</label> 
                                            <span>{inscripcion.modulo || inscripcion.modulos || 'No especificado'}</span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Estado de Inscripción:</label> 
                                            <span className={`estado-badge-uniforme estado-${inscripcion.estado?.toLowerCase().replace(/\s+/g, '-') || 'sin-estado'}-uniforme`}>
                                                {inscripcion.estado || 'No especificado'}
                                            </span>
                                        </div>
                                        <div className="dato-item-uniforme">
                                            <label>Fecha de Inscripción:</label> 
                                            <span>{formatDate(inscripcion?.fechaInscripcion)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="dato-item-uniforme">
                                        <span>No se encontraron datos de inscripción.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Documentación */}
                    <div className="tarjeta-uniforme documentacion-section">
                        <div className="tarjeta-header-uniforme"><h3>Documentación Presentada</h3></div>
                        <div className="tarjeta-contenido-uniforme">
                            {documentacion && Array.isArray(documentacion) && documentacion.length > 0 ? (
                                <div className="documentacion-lista-uniforme">
                                    <div className="documentacion-header-uniforme">
                                        <span className="doc-nombre-uniforme">Documento</span>
                                        <span className="doc-estado-uniforme">Estado</span>
                                        <span className="doc-fecha-uniforme">Fecha de Entrega</span>
                                        <span className="doc-archivo-uniforme">Archivo</span>
                                    </div>
                                    {documentacion.map((doc, index) => (
                                        <div key={index} className="documentacion-item-uniforme">
                                            <span className="doc-nombre-uniforme">
                                                {doc.descripcionDocumentacion || 'Documento sin nombre'}
                                            </span>
                                            <span className={`doc-estado-uniforme estado-${doc.estadoDocumentacion?.toLowerCase() || 'faltante'}-uniforme`}>
                                                {doc.estadoDocumentacion || 'Faltante'}
                                            </span>
                                            <span className="doc-fecha-uniforme">
                                                {doc.fechaEntrega ? formatDate(doc.fechaEntrega) : 'No entregado'}
                                            </span>
                                            <span className="doc-archivo-uniforme">
                                                {doc.archivoDocumentacion ? (
                                                    <a href={doc.archivoDocumentacion} target="_blank" rel="noopener noreferrer" className="btn-ver-archivo-uniforme">
                                                        Ver
                                                    </a>
                                                ) : (
                                                    <span className="sin-archivo-uniforme">Sin archivo</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-documentacion-uniforme">
                                    No se encontró documentación registrada para este estudiante.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

ConsultaEstd.propTypes = {
    data: PropTypes.shape({
        success: PropTypes.bool.isRequired,
        estudiante: PropTypes.object.isRequired,
        domicilio: PropTypes.object,
        inscripcion: PropTypes.object,
        documentacion: PropTypes.arrayOf(
            PropTypes.shape({
                idDocumentaciones: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                descripcionDocumentacion: PropTypes.string,
                estadoDocumentacion: PropTypes.string,
                fechaEntrega: PropTypes.string,
                archivoDocumentacion: PropTypes.string,
            })
        ),
    }).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default ConsultaEstd;