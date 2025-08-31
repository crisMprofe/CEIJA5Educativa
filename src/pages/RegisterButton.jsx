import { useState } from 'react';
import PropTypes from 'prop-types';
import '../estilos/Modal.css';
import {useForm} from "react-hook-form";
import Input from '../components/Input';
import BotonCargando from '../components/BotonCargando';
import serviceUsuario from '../services/serviceUsuario';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup'; 
import { userValidationSchema } from '../validaciones/ValidacionSchemaYup';
import AlertaMens from '../components/AlertaMens';

const RegisterButton = ({ onClose }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(userValidationSchema) });
    const [alerta, setAlerta] = useState({text:"", variant:""})
    const [loading,setLoading] = useState(false)
    const navigate = useNavigate(); // Para redirigir

    const mostrarAlerta = (text, variant) => {
        console.log(`Alerta: ${text}, Variant: ${variant}`); // Verifica los valores
        setAlerta({ text, variant });
        setTimeout(() => {
            console.log('Ocultando alerta'); // Debug log
            setAlerta({ text: '', variant: '' });
        }, 10000); // Oculta la alerta después de 5s
    }
    const onSubmit = async (data) => {
        console.log("Datos enviados:", data);
        setLoading(true);
        try {
           
        // Llama al servicio para crear el usuario
            const response = await serviceUsuario.createU(data); // Llamada al servicio
            console.log("Respuesta completa del servidor:", response);
            setTimeout(() => {
                setLoading(false);
                if ( response && response.success) {
                    mostrarAlerta(response.message, 'success');
                    navigate('/'); // Redirige al home
                } else {
                    mostrarAlerta("Error en la respuesta: " + JSON.stringify(response), 'error');
                }
            }, 5000); // Mantiene el spinner durante 5 segundos
        } catch (error) {
            console.error('Error al registrar el usuario:', error);
            mostrarAlerta('Hubo un error al registrar el usuario', 'error');
            setLoading(false);
        }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="register-box">
                  {/* Mostrar la alerta si hay un mensaje */}
                  {alerta.text && <AlertaMens text={alerta.text} variant={alerta.variant} />}
                  <button onClick={(e) => { e.preventDefault(); onClose(); }} className="back-button">✖</button>
                <form onSubmit={handleSubmit(onSubmit)}>
                     <Input label="Nombre" placeholder="Nombre" registro={{...register("nombre")}} error={errors.nombre?.message}/>
                   
                     <Input label="Apellido" placeholder="Apellido" registro={{...register("apellido")}} error={errors.apellido?.message}/>
                     
                     <Input label="Email" placeholder="Email" registro={{...register("email")}} error={errors.email?.message}/>
                    
                     <Input label="Contraseña" type="password" registro={{...register("password" )}} error={errors.password?.message}/>
                     
                     <Input
                            label="Rol"
                            type="select"
                            registro={{ ...register("rol" ) }}
                            options={[
                                { value: 'administrador', label: 'Administrador' },
                                { value: 'profesor', label: 'Profesor' },
                                { value: 'estudiante', label: 'Estudiante' },
                                { value: 'secretario', label: 'Secretario' },
                                { value: 'coordinador', label: 'Coordinador' },
                            ]}
                            error={errors.rol?.message}
                        />
                        <BotonCargando loading={loading}>
                          Registrarse
                        </BotonCargando> 
                   
                </form>
                </div>
            </div>
        </div>
    );
};
RegisterButton.propTypes = {
    onClose: PropTypes.func.isRequired,
};
export default RegisterButton;
