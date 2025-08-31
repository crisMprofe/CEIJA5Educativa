import comprobanteStyles from '../estilos/comprobante.css?raw';
import jsPDF from 'jspdf';

// Documentos requeridos por plan/año
const docsPrimario = [
    'Certificado Nivel Primario',
    'DNI',
    'CUIL',
    'Partida de Nacimiento',
    'Ficha Médica'
];
const docsAnalitico = [
    'Analítico Parcial',
    'DNI',
    'CUIL',
    'Partida de Nacimiento',
    'Ficha Médica'
];

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
    // Documentos presentados: solo los requeridos y con archivo
    const presentados = (estudiante.documentacion || [])
      .filter(doc => requeridos.includes(doc.descripcionDocumentacion) && doc.archivoDocumentacion)
      .map(doc => doc.descripcionDocumentacion);
    // Documentos faltantes: requeridos menos presentados
    const faltantes = requeridos.filter(doc => !presentados.includes(doc));

    return `
      <div class="comprobante-documentos-requeridos">
        <h3 class="comprobante-h3">📑 Documentos Requeridos</h3>
        <ul class="comprobante-ul">
          ${requeridos.length > 0 ? requeridos.map(doc => `<li class="comprobante-li">${doc}</li>`).join('') : '<li class="comprobante-li">No hay requeridos.</li>'}
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
      
      return true;
    } catch (error) {
      console.error('Error al generar comprobante:', error);
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
