// src/components/ModalidadSelection.jsx
import PropTypes from 'prop-types';
import { useEffect, useRef, memo } from 'react';
import PlanAnioSelector from './PlanAnioSelector';

const ModalidadSelection = memo(({ modalidad, modalidadId, handleChange, setFieldValue, values, showMateriasList }) => {
    const prevValuesRef = useRef();

    // Solo hacer log cuando cambien valores importantes
    useEffect(() => {
        if (import.meta.env.DEV) {
            const currentImportantValues = {
                modalidad,
                planAnio: values.planAnio,
                modalidadId,
                showMateriasList
            };

            const prevValues = prevValuesRef.current;
            
            // Solo hacer log si es el primer render o si cambió algo importante
            if (!prevValues || 
                prevValues.modalidad !== modalidad ||
                prevValues.planAnio !== values.planAnio ||
                prevValues.modalidadId !== modalidadId ||
                prevValues.showMateriasList !== showMateriasList) {
                
                console.log(`[ModalidadSelection] Modalidad: ${modalidad}, planAnio: ${values.planAnio}, modalidadId: ${modalidadId}, showMateriasList: ${showMateriasList}`);
                
                prevValuesRef.current = currentImportantValues;
            }
        }
    }, [modalidad, values.planAnio, modalidadId, showMateriasList]);

    return (
        <div className="form-eleccion">
            <h3>Modalidad: <span className="modalidad-elegida">{modalidad}</span></h3>
            
            <div className="form-group">
                <PlanAnioSelector
                    modalidad={modalidad}
                    modalidadId={modalidadId}
                    value={values.planAnio}
                    setFieldValue={setFieldValue}
                    showMateriasList={showMateriasList}
                    handleChange={handleChange}
                />
            </div>
        </div>
    );
});

// Agregar displayName para React DevTools
ModalidadSelection.displayName = 'ModalidadSelection';

ModalidadSelection.propTypes = {
    modalidad: PropTypes.string.isRequired,
    modalidadId: PropTypes.number.isRequired,
    handleChange: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    showMateriasList: PropTypes.bool.isRequired,
};

export default ModalidadSelection;
