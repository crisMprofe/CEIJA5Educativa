
import PropTypes from 'prop-types';
import Input from '../Input';

/**
 * Selector de Curso/Plan filtrado por modalidad.
 * Recibe los planes ya filtrados como prop.
 */
const CursoPlanSelector = ({ planes, value, setFieldValue }) => {
    // Logs para depuración
    console.log('CursoPlanSelector props:', { planes, value });

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
            {(!planes || planes.length === 0) && (
                <div style={{ color: 'red', marginBottom: '0.5rem' }}>
                    ⚠️ No hay planes disponibles para la modalidad seleccionada.
                </div>
            )}
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
    planes: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            plan: PropTypes.string.isRequired
        })
    ).isRequired,
    value: PropTypes.object.isRequired, // Debe contener cursoPlanId y cursoPlan
    setFieldValue: PropTypes.func.isRequired
};

export default CursoPlanSelector;
