import { Field, ErrorMessage } from 'formik';

export const Domicilio = ({ esAdmin = false }) => {
    console.log('🏠 Domicilio cargado con esAdmin:', esAdmin);
    
    return (
        <>
            <div className="form-domicilio">
                <h3>Domicilio</h3>
                <div className="form-group">
                    <label>Calle:</label>
                    <Field type="text" name="calle" placeholder="Calle" className="form-control" />
                    <ErrorMessage name="calle" component="div" className="error" />
                </div>
                <div className="form-group">
                    <label>Número:</label>
                    <Field type="number" name="numero" placeholder="Número" className="form-control" />
                    <ErrorMessage name="numero" component="div" className="error" />
                </div>
                <div className="form-group">
                    <label>Barrio:</label>
                    <Field type="text" name="barrio" placeholder="Barrio (temporal)" className="form-control" />
                    <ErrorMessage name="barrio" component="div" className="error" />
                    {esAdmin && <small style={{color: 'blue'}}>Como admin podrás agregar barrios (próximamente)</small>}
                </div>
                <div className="localprovincia">
                    <div className="form-group">
                        <label>Localidad:</label>
                        <Field type="text" name="localidad" placeholder="Localidad (temporal)" className="form-control" />
                        <ErrorMessage name="localidad" component="div" className="error" />
                        {esAdmin && <small style={{color: 'blue'}}>Como admin podrás agregar localidades (próximamente)</small>}
                    </div>
                    <div className="form-group">
                        <label>Provincia:</label>
                        <Field type="text" name="provincia" placeholder="Provincia (temporal)" className="form-control" />
                        <ErrorMessage name="provincia" component="div" className="error" />
                        {esAdmin && <small style={{color: 'blue'}}>Como admin podrás agregar provincias (próximamente)</small>}
                    </div>
                </div>
            </div>                              
        </>
    );
};