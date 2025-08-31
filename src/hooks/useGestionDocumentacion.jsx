import { useState } from 'react';
import { DocumentacionNameToId } from '../utils/DocumentacionMap';

const maxFileSize = 600 * 1024; // 600 KB

export default function useGestionDocumentacion() {
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [alert, setAlert] = useState({ text: '', variant: '' });

    // Manejar cambios en los archivos
    const handleFileChange = (e, field, setFieldValue) => {
        const file = e.target.files[0];
        
        if (file) {
            if (file.size > maxFileSize) {
                setAlert({ text: 'El archivo es demasiado grande. Máximo permitido: 600 KB.', variant: 'error' });
                setTimeout(() => setAlert({ text: '', variant: '' }), 5000);
                return;
            }

           if (!(field in DocumentacionNameToId)) {
                    console.warn(`El campo "${field}" no coincide con ninguna clave en DocumentacionNameToId.`);
                }


            const url = URL.createObjectURL(file);
            setPreviews((prev) => ({ ...prev, [field]: { url, type: file.type, file } }));
            setFiles((prev) => ({ ...prev, [field]: file }));
            if (setFieldValue) {
                setFieldValue(field, file);
            }
        }
    };

    // Construir detalle de documentación
    const buildDetalleDocumentacion = () => {
        if (import.meta.env.DEV) {
            console.log("Previews actuales:", previews);
            console.log("DocumentacionNameToId:", DocumentacionNameToId);
            console.log("Nombres de archivos en previews:", Object.keys(previews));
        }

        return Object.entries(previews)
            .filter(([name]) => {
                // Usar el nombre tal como está, sin normalización agresiva
                const exists = DocumentacionNameToId[name];
                if (!exists && import.meta.env.DEV) {
                    console.warn(`El nombre "${name}" no coincide con ninguna clave en DocumentacionNameToId.`);
                }
                return exists;
            })
            .map(([name, doc]) => {
                return {
                    idDocumentaciones: DocumentacionNameToId[name],
                    estadoDocumentacion: doc?.url ? 'Entregado' : 'Faltante',
                    nombreArchivo: name,
                    archivoDocumentacion: null,
                    fechaEntrega: doc?.url ? new Date().toISOString().slice(0, 10) : null,
                };
            });
    };

    // Resetear archivos y vistas previas
    const resetArchivos = () => {
        Object.values(previews).forEach((preview) => {
            if (preview?.url) {
                URL.revokeObjectURL(preview.url);
            }
        });
        setFiles({});
        setPreviews({});
    };


    return {
        files,
        setFiles,
        previews,
        setPreviews,
        alert,
        setAlert,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
    };
}