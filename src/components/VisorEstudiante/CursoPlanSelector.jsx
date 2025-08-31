import PropTypes from 'prop-types';
import { usePlanesPorModalidad } from '../../hooks/usePlanesPorModalidad';
import Input from '../Input';

const CursoPlanSelector = ({ modalidadId, value, setFieldValue }) => {
    // ✅ Cargar los planes según la modalidad
    const planes = usePlanesPorModalidad(modalidadId);

    const handleCursoPlanChange = (e) => {
        const selectedPlanId = Number(e.target.value);
        setFieldValue('cursoPlanId', selectedPlanId);

        // Busca el curso/plan seleccionado para setear también el nombre
        const cursoSeleccionado = planes.find(p => p.id === selectedPlanId);
        if (cursoSeleccionado) {
            setFieldValue('cursoPlan', cursoSeleccionado.plan);
        }
    };

    return (
        <div className="curso-plan-selector">
            <Input
                label="Curso / Plan"
                name="cursoPlanId"
                type="select"
                options={[
                    { value: '', label: 'Seleccionar curso/plan' },
                    ...planes.map(p => ({
                        value: p.id,
                        label: p.plan
                    }))
                ]}
                registro={{
                    value: value.cursoPlanId || '',
                    onChange: handleCursoPlanChange
                }}
            />
        </div>
    );
};

CursoPlanSelector.propTypes = {
    modalidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    value: PropTypes.object.isRequired, // Debe contener cursoPlanId y cursoPlan
    setFieldValue: PropTypes.func.isRequired
};

export default CursoPlanSelector;
