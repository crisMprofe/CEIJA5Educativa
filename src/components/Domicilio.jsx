import {Field, ErrorMessage } from 'formik';

export const Domicilio = () => {
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
            <Field type="text" name="barrio" placeholder="Barrio" className="form-control" />
            <ErrorMessage name="barrio" component="div" className="error" />
        </div>
        <div className="localprovincia">
            <div className="form-group">
            <label>Localidad:</label>
            <Field type="text" name="localidad" placeholder="Localidad" className="form-control" />
            <ErrorMessage name="localidad" component="div" className="error" />
            </div>
            <div className="form-group">
            <label>Provincia:</label>
            <Field type="text" name="provincia" placeholder="Provincia" className="form-control" />
            <ErrorMessage name="provincia" component="div" className="error" />
            </div>
        </div>
    </div>                              
    </>
    );
                   
}