import PropTypes from 'prop-types';

const SeccionDescargas = ({ 
    descargando, 
    onGenerarReporteTXT, 
    onGenerarReporteCSV, 
    onGenerarReportePDF,
    onDescargarJSON 
}) => {
    return (
        <div className="botones-descarga">
            <button 
                onClick={onGenerarReporteTXT}
                className="btn-reporte-txt"
                title="Generar reporte legible para administración escolar"
            >
                📋 Reporte TXT
            </button>
            <button 
                onClick={onGenerarReporteCSV}
                className="btn-excel-csv"
                title="Generar archivo Excel (CSV) para análisis de datos"
            >
                📊 Excel (CSV)
            </button>
            <button 
                onClick={onGenerarReportePDF}
                className="btn-reporte-pdf"
                disabled={descargando}
                title="Generar reporte PDF profesional para presentaciones"
            >
                {descargando ? '⏳ Generando...' : '📄 Reporte PDF'}
            </button>
            <button 
                onClick={onDescargarJSON}
                className="btn-json-tecnico"
                disabled={descargando}
                title="Descargar archivo JSON técnico (para programadores)"
            >
                {descargando ? '⏳ Descargando...' : '💾 JSON Técnico'}
            </button>
        </div>
    );
};

SeccionDescargas.propTypes = {
    descargando: PropTypes.bool.isRequired,
    onGenerarReporteTXT: PropTypes.func.isRequired,
    onGenerarReporteCSV: PropTypes.func.isRequired,
    onGenerarReportePDF: PropTypes.func.isRequired,
    onDescargarJSON: PropTypes.func.isRequired
};

export default SeccionDescargas;