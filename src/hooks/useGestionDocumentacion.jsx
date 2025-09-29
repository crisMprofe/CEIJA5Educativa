import { useState, useEffect } from 'react';
import { DocumentacionNameToId } from '../utils/DocumentacionMap';

const maxFileSize = 600 * 1024; // 600 KB

export default function useGestionDocumentacion() {
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [alert, setAlert] = useState({ text: '', type: '', show: false });

    // Efecto para cargar archivos existentes desde sessionStorage (registros pendientes)
    useEffect(() => {
        const cargarArchivosExistentes = () => {
            try {
                const datosString = sessionStorage.getItem('registroPendienteCompleto');
                if (datosString) {
                    const datos = JSON.parse(datosString);
                    const archivosExistentes = datos.archivosExistentes;
                    
                    if (archivosExistentes && Object.keys(archivosExistentes).length > 0) {
                        console.log('📎 Cargando archivos existentes desde registro pendiente:', archivosExistentes);
                        
                        const previewsExistentes = {};
                        
                        Object.keys(archivosExistentes).forEach(campo => {
                            const rutaArchivo = archivosExistentes[campo];
                            
                            if (rutaArchivo && typeof rutaArchivo === 'string') {
                                // Determinar la URL correcta para el preview
                                // Si la ruta empieza con '/', es una ruta relativa al servidor
                                const previewUrl = rutaArchivo.startsWith('/') 
                                    ? `http://localhost:5000${rutaArchivo}`  // Backend en puerto 5000
                                    : rutaArchivo;
                                
                                const nombreArchivo = rutaArchivo.split('/').pop();
                                const tipoArchivo = nombreArchivo.includes('.pdf') ? 'application/pdf' : 'image/jpeg';
                                
                                previewsExistentes[campo] = {
                                    url: previewUrl,
                                    type: tipoArchivo,
                                    file: {
                                        name: nombreArchivo,
                                        size: 0, // Tamaño desconocido para archivos existentes
                                        type: tipoArchivo
                                    },
                                    existente: true, // Marcar como archivo existente
                                    uploaded: true   // Ya está subido
                                };
                                
                                console.log(`📎 Archivo ${campo} cargado:`, {
                                    nombre: nombreArchivo,
                                    preview: previewUrl,
                                    tipo: tipoArchivo
                                });
                            }
                        });
                        
                        // Actualizar el estado de previews con los archivos existentes
                        setPreviews(previewsExistentes);
                        
                        console.log('✅ Archivos existentes cargados correctamente:', Object.keys(previewsExistentes));
                        
                        // Limpiar sessionStorage después de cargar
                        sessionStorage.removeItem('registroPendienteCompleto');
                    }
                }
            } catch (error) {
                console.error('Error al cargar archivos existentes:', error);
            }
        };
        
        cargarArchivosExistentes();
    }, []); // Solo ejecutar al montar el componente

    // Manejar cambios en los archivos
    const handleFileChange = (e, field, setFieldValue) => {
        const file = e.target.files[0];
        
        if (file) {
            if (file.size > maxFileSize) {
                setAlert({ text: 'El archivo es demasiado grande. Máximo permitido: 600 KB.', type: 'error', show: true });
                setTimeout(() => setAlert({ text: '', type: '', show: false }), 5000);
                return;
            }

            if (!(field in DocumentacionNameToId)) {
                console.warn(`El campo "${field}" no coincide con ninguna clave en DocumentacionNameToId.`);
            }

            // Verificar si hay un archivo existente
            const archivoExistente = previews[field]?.existente;
            if (archivoExistente) {
                console.log(`🔄 Reemplazando archivo existente para ${field}`);
            }

            const url = URL.createObjectURL(file);
            setPreviews((prev) => ({ 
                ...prev, 
                [field]: { 
                    url, 
                    type: file.type, 
                    file,
                    existente: false, // Marcar como nuevo archivo (no existente)
                    uploaded: false   // Aún no subido al servidor
                } 
            }));
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