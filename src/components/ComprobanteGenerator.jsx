import comprobanteStyles from '../estilos/comprobante.css?raw';
import jsPDF from 'jspdf';

// Mapeo de nombres técnicos a nombres legibles
const nombresLegibles = {
    'archivo_dni': 'Documento Nacional de Identidad (DNI)',
    'archivo_cuil': 'Constancia de CUIL',
    'archivo_fichaMedica': 'Ficha Médica',
    'archivo_partidaNacimiento': 'Partida de Nacimiento',
    'archivo_analiticoParcial': 'Analítico Parcial',
    'archivo_certificadoNivelPrimario': 'Certificado Nivel Primario',
    'archivo_solicitudPase': 'Solicitud de Pase',
    'foto': 'Fotografía'
};

// Documentos requeridos por plan/año - NOMBRES EXACTOS de la DB
const docsPrimario = [
    'archivo_certificadoNivelPrimario',
    'archivo_dni',
    'archivo_cuil', 
    'archivo_partidaNacimiento',
    'archivo_fichaMedica'
];
const docsAnalitico = [
    'archivo_analiticoParcial',
    'archivo_dni',
    'archivo_cuil',
    'archivo_partidaNacimiento', 
    'archivo_fichaMedica'
];

// Función para convertir nombre técnico a legible
function getNombreLegible(nombreTecnico) {
    return nombresLegibles[nombreTecnico] || nombreTecnico;
}

// Determina los requeridos según plan/año
function getDocsRequeridos(planAnio) {
    const val = String(planAnio).toLowerCase();
    // Solo para 1er año o plan A
    if (val === '1' || val === 'a' || val === 'plan a' || val === 'primer año' || val === '1er año') {
        return docsPrimario;
    }
    // Para plan B, C, 2do año, 3er año
    if (
      val === '2' || val === '3' ||
      val === 'b' || val === 'c' ||
      val === 'plan b' || val === 'plan c' ||
      val === 'segundo año' || val === '2do año' ||
      val === 'tercer año' || val === '3er año'
    ) {
        return docsAnalitico;
    }
    // Por defecto, usar docsPrimario
    return docsPrimario;
}

// (Eliminado: función obtenerDocumentacionFaltante no utilizada)

/**
 * Componente para generar comprobantes de inscripción en formato PDF
 * Optimizado para formato A5
 */
class ComprobanteGenerator {
  
  /**
   * Formatea una fecha para mostrar en formato argentino
   * @param {string|Date} fecha - La fecha a formatear
   * @returns {string} - Fecha formateada o mensaje de error
   */
  static formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-AR');
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * Genera la sección de documentación según el estado de inscripción
   * @param {Object} estudiante - Datos del estudiante
   * @returns {string} - HTML de la sección de documentación
   */
  static generarSeccionDocumentacion(estudiante) {
    // Documentos requeridos según el plan
    const requeridos = getDocsRequeridos(estudiante.planAnio || estudiante.cursoPlan);
    
    console.log('📋 Documentación del estudiante completa:', estudiante.documentacion);
    console.log('📝 Documentos requeridos para el plan:', requeridos);
    console.log('🎯 Plan/Año del estudiante:', estudiante.planAnio, estudiante.cursoPlan);
    
    // Obtener documentos presentados desde la documentación del estudiante
    const presentados = [];
    const faltantes = [];
    
    // Verificar cada documento requerido
    requeridos.forEach(docRequerido => {
      console.log(`🔍 Buscando documento: ${docRequerido}`);
      
      // Mostrar TODOS los documentos del estudiante para debug
      console.log(`  📂 Documentos disponibles del estudiante:`, (estudiante.documentacion || []).map(d => `${d.descripcionDocumentacion} (${d.estadoDocumentacion})`));
      
      // Buscar si el documento está en la documentación del estudiante
      const docEncontrado = (estudiante.documentacion || []).find(doc => {
        const coincideNombre = doc.descripcionDocumentacion === docRequerido;
        const tieneArchivo = doc.archivoDocumentacion && doc.archivoDocumentacion !== null && doc.archivoDocumentacion !== '';
        const noEsFaltante = doc.estadoDocumentacion !== 'Faltante';
        
        console.log(`  📄 Evaluando ${doc.descripcionDocumentacion}:`);
        console.log(`    - Coincide nombre: ${coincideNombre} (buscando: "${docRequerido}")`);
        console.log(`    - Tiene archivo: ${tieneArchivo} (archivo: "${doc.archivoDocumentacion}")`);
        console.log(`    - No es faltante: ${noEsFaltante} (estado: "${doc.estadoDocumentacion}")`);
        
        return coincideNombre && tieneArchivo && noEsFaltante;
      });
      
      if (docEncontrado) {
        console.log(`  ✅ PRESENTADO: ${docRequerido} (archivo: ${docEncontrado.archivoDocumentacion})`);
        presentados.push(getNombreLegible(docRequerido));
      } else {
        console.log(`  ❌ FALTANTE: ${docRequerido}`);
        faltantes.push(getNombreLegible(docRequerido));
      }
    });
    
    console.log('✅ RESUMEN - Documentos presentados:', presentados);
    console.log('❌ RESUMEN - Documentos faltantes:', faltantes);

    return `
      <div class="comprobante-documentos-requeridos">
        <h3 class="comprobante-h3">📑 Documentos Requeridos</h3>
        <ul class="comprobante-ul">
          ${requeridos.length > 0 ? requeridos.map(doc => `<li class="comprobante-li">${getNombreLegible(doc)}</li>`).join('') : '<li class="comprobante-li">No hay requeridos.</li>'}
        </ul>
      </div>
      <div class="comprobante-documentos-presentados">
        <h3 class="comprobante-h3">📄 Documentación Presentada</h3>
        <ul class="comprobante-ul">
          ${presentados.length > 0 ? presentados.map(doc => `<li class="comprobante-li">✅ ${doc}</li>`).join('') : '<li class="comprobante-li">No hay documentación presentada.</li>'}
        </ul>
      </div>
      <div class="comprobante-documentos-faltantes">
        <h3 class="comprobante-h3">📋 Documentación Faltante</h3>
        <ul class="comprobante-ul">
          ${faltantes.length > 0 ? faltantes.map(doc => `<li class="comprobante-li">❌ ${doc}</li>`).join('') : '<li class="comprobante-li">No hay documentación faltante.</li>'}
        </ul>
      </div>
    `;
  }

  /**
  /**
   * Genera el HTML completo del comprobante
   * @param {Object} estudiante - Datos del estudiante
   * @returns {string} - HTML completo del comprobante
   */
  static generarHTML(estudiante) {
    const fecha = new Date().toLocaleDateString('es-AR');
    const hora = new Date().toLocaleTimeString('es-AR');
    const seccionDocumentacion = this.generarSeccionDocumentacion(estudiante);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de Estado de Inscripción</title>
        <style>${comprobanteStyles}</style>
      </head>
      <body>
        <div class="comprobante-header">
          <div class="comprobante-logo">CEIJA 5</div>
          <div class="comprobante-institucion">Centro de Educación Integral para Jóvenes y Adultos N° 5</div>
          <div class="comprobante-subtitulo">Comprobante de Estado de Inscripción</div>
        </div>

        <div class="comprobante-info-estudiante">
          <h3 class="comprobante-h3">Información del Estudiante</h3>
          <p class="comprobante-p"><strong class="comprobante-strong">ID:</strong> ${estudiante.id}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">DNI:</strong> ${estudiante.dni}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">Nombre y Apellido:</strong> ${estudiante.nombre} ${estudiante.apellido}</p>
        </div>

        <div class="comprobante-info-academica">
          <h3 class="comprobante-h3">Información Académica</h3>
          <p class="comprobante-p"><strong class="comprobante-strong">Modalidad:</strong> ${estudiante.modalidad || 'Sin modalidad'}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">Plan/Año:</strong> ${estudiante.planAnio || estudiante.cursoPlan || 'Sin asignar'}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">Módulo:</strong> ${estudiante.modulo || 'Sin asignar'}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">Fecha de Inscripción:</strong> ${this.formatearFecha(estudiante.fechaInscripcion)}</p>
          <p class="comprobante-p"><strong class="comprobante-strong">Estado de Inscripción:</strong> 
            <span class="${estudiante.estadoInscripcion?.toLowerCase().includes('pendiente') ? 'comprobante-estado-pendiente' : 'comprobante-estado-activo'}">
              ${estudiante.estadoInscripcion || 'Sin estado'}
            </span>
          </p>
        </div>

        ${seccionDocumentacion}

        <div class="comprobante-footer">
          <p>Comprobante emitido el ${fecha} a las ${hora}</p>
          <p>Este documento es válido como constancia del estado de inscripción del estudiante.</p>
          <p><strong class="comprobante-strong">CEIJA 5 - Centro de Educación Integral para Jóvenes y Adultos N° 5</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera y abre el comprobante para impresión
  /**
   * Genera y abre el comprobante para impresión
   * @param {Object} estudiante - Datos del estudiante
   */
  static generar(estudiante) {
    try {
      console.log('🎯 Generando comprobante para estudiante:', estudiante);
      
      if (!estudiante) {
        throw new Error('Datos del estudiante no proporcionados');
      }
      
      if (!estudiante.dni) {
        throw new Error('DNI del estudiante no disponible');
      }
      
      const contenidoHTML = this.generarHTML(estudiante);
      
      // Crear ventana nueva para imprimir
      const ventanaImpresion = window.open('', '_blank');
      if (!ventanaImpresion) {
        throw new Error('No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.');
      }
      
      ventanaImpresion.document.write(contenidoHTML);
      ventanaImpresion.document.close();
      
      // Esperar a que cargue y luego abrir diálogo de impresión
      ventanaImpresion.onload = () => {
        ventanaImpresion.focus();
        ventanaImpresion.print();
      };
      
      console.log('✅ Comprobante generado exitosamente');
      return true;
    } catch (error) {
      console.error('🚨 Error al generar comprobante:', error);
      throw error;
    }
  }
  /**
   * Genera el comprobante PDF de inscripción y documentación.
   * @param {Object} estudiante - Datos del estudiante
   */
  static generarPDF(estudiante) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Comprobante de Estado de Inscripción', 20, 20);

    doc.setFontSize(12);
    doc.text(`Nombre: ${estudiante.nombre} ${estudiante.apellido}`, 20, 35);
    doc.text(`DNI: ${estudiante.dni}`, 20, 42);
    doc.text(`Modalidad: ${estudiante.modalidad}`, 20, 49);
    doc.text(`Curso/Plan: ${estudiante.planAnio || estudiante.cursoPlan}`, 20, 56);
    doc.text(`Módulo: ${estudiante.modulo || estudiante.modulos || 'Sin asignar'}`, 20, 63);
    doc.text(`Estado de Inscripción: ${estudiante.estadoInscripcion}`, 20, 70);

    // Usar los arrays requeridos, presentados y faltantes si existen (de backend)
    const requeridos = estudiante.requeridos || [];
    const presentados = estudiante.presentados || [];
    const faltantes = estudiante.faltantes || [];

    let y = 82;
    doc.setFontSize(13);
    doc.text('Documentos Requeridos:', 20, y);
    y += 7;
    if (requeridos.length > 0) {
      requeridos.forEach(docName => {
        doc.text(`• ${docName}`, 25, y);
        y += 6;
      });
    } else {
      doc.text('No hay requeridos.', 25, y);
      y += 6;
    }

    doc.setFontSize(13);
    doc.text('Documentos Presentados:', 20, y);
    y += 7;
    if (presentados.length > 0) {
      presentados.forEach(docName => {
        doc.text(`✓ ${docName}`, 25, y);
        y += 6;
      });
    } else {
      doc.text('No hay documentación presentada.', 25, y);
      y += 6;
    }

    doc.setFontSize(13);
    doc.text('Documentos Faltantes:', 20, y);
    y += 7;
    if (faltantes.length > 0) {
      faltantes.forEach(docName => {
        doc.text(`✗ ${docName}`, 25, y);
        y += 6;
      });
    } else {
      doc.text('No hay documentación faltante.', 25, y);
      y += 6;
    }

    doc.save(`Comprobante_Inscripcion_${estudiante.dni}.pdf`);
  }
}

export default ComprobanteGenerator;
