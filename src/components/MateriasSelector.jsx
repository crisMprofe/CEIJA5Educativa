import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import service from "../services/serviceObtenerAcad";
import BotonCargando from "./BotonCargando";

const MateriasSelector = ({ idAreaEstudio }) => {
    const prevIdAreaEstudioRef = useRef();

    // Solo hacer log cuando cambie idAreaEstudio
    useEffect(() => {
        if (import.meta.env.DEV) {
            if (prevIdAreaEstudioRef.current !== idAreaEstudio) {
                console.log("[MateriasSelector] Valores para API de materias:", { idAreaEstudio });
                prevIdAreaEstudioRef.current = idAreaEstudio;
            }
        }
    }, [idAreaEstudio]);
    const [materias, setMaterias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
    const fetchMaterias = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await service.getMateriasPorArea(idAreaEstudio);
            console.log("Respuesta de la API de materias:", response);

            if (Array.isArray(response)) {
                setMaterias(response);
            } else {
                setError("No se encontraron materias para esta área de estudio.");
            }
        } catch (error) {
            console.error("Error al obtener materias:", error);
            setError("Hubo un error al obtener las materias.");
        } finally {
            setLoading(false);
        }
    };

        if (idAreaEstudio) {
            fetchMaterias();
        }
    }, [idAreaEstudio]);

    return (
        <div className="form-group">
            <label htmlFor="materias">Materias:</label>
            <div>
                {loading ? (
                    <BotonCargando loading={loading} />
                ) : error ? (
                    <p>{error}</p>
                ) : materias.length > 0 ? (
                    <ul>
                        {materias.map((materia) => (
                            <li key={materia.id}>{materia.materia}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No hay materias disponibles.</p>
                )}
            </div>
        </div>
    );
};

MateriasSelector.propTypes = {
    idAreaEstudio: PropTypes.number.isRequired,
};

export default MateriasSelector;