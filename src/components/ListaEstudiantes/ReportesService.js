import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utilidades para cálculos estadísticos
const calcularPorcentaje = (parte, total) => total > 0 ? ((parte / total) * 100).toFixed(1) : '0.0';

const agruparPor = (array, propiedad) => {
  return array.reduce((acc, item) => {
    const key = item[propiedad] || 'Sin definir';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};


const obtenerMesAno = (fecha) => {
  if (!fecha) return 'Sin fecha';
  const d = new Date(fecha);
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const generarReporteEstadistico = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el reporte', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('📊 REPORTE ESTADÍSTICO COMPLETO', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, 14, 30);
  
  let yPos = 45;
  doc.setFontSize(12);
  
  // Información general
  doc.setFont(undefined, 'bold');
  doc.text('RESUMEN GENERAL:', 14, yPos);
  yPos += 10;
  doc.setFont(undefined, 'normal');
  
  doc.text(`• Total estudiantes: ${estudiantes.length}`, 20, yPos);
  yPos += 7;
  doc.text(`• Activos: ${estudiantes.filter(e => e.activo).length}`, 20, yPos);
  yPos += 7;
  doc.text(`• Inactivos: ${estudiantes.filter(e => !e.activo).length}`, 20, yPos);
  yPos += 15;

  // Estadísticas por modalidad
  doc.setFont(undefined, 'bold');
  doc.text('DISTRIBUCIÓN POR MODALIDAD:', 14, yPos);
  yPos += 10;
  doc.setFont(undefined, 'normal');
  
  const modalidades = [...new Set(estudiantes.map(e => e.modalidad).filter(Boolean))];
  modalidades.forEach(mod => {
    const cantidad = estudiantes.filter(e => e.modalidad === mod).length;
    const porcentaje = ((cantidad/estudiantes.length)*100).toFixed(1);
    doc.text(`• ${mod}: ${cantidad} (${porcentaje}%)`, 20, yPos);
    yPos += 7;
  });

  doc.save(`Reporte_estadistico_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📊 Reporte estadístico generado exitosamente', 'success');
};

export const generarReportePorPlan = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el reporte', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('🎓 ANÁLISIS POR PLAN DE ESTUDIOS', 14, 20);
  
  let yPos = 40;
  doc.setFontSize(12);
  
  // Agrupar por modalidad y plan
  const plansPorModalidad = {};
  estudiantes.forEach(est => {
    const mod = est.modalidad || 'Sin modalidad';
    const plan = est.cursoPlan || 'Sin plan';
    
    if (!plansPorModalidad[mod]) plansPorModalidad[mod] = {};
    if (!plansPorModalidad[mod][plan]) plansPorModalidad[mod][plan] = 0;
    plansPorModalidad[mod][plan]++;
  });

  Object.entries(plansPorModalidad).forEach(([modalidad, planes]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`MODALIDAD: ${modalidad}`, 14, yPos);
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    Object.entries(planes).forEach(([plan, cantidad]) => {
      doc.text(`• ${plan}: ${cantidad} estudiantes`, 20, yPos);
      yPos += 7;
    });
    yPos += 5;
  });

  doc.save(`Reporte_planes_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('🎓 Análisis por plan generado exitosamente', 'success');
};

export const generarReportePorModalidad = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el reporte', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('🏫 DISTRIBUCIÓN POR MODALIDAD', 14, 20);
  
  let yPos = 40;
  const modalidades = [...new Set(estudiantes.map(e => e.modalidad).filter(Boolean))];
  
  modalidades.forEach(mod => {
    const estudiantesModalidad = estudiantes.filter(e => e.modalidad === mod);
    const activos = estudiantesModalidad.filter(e => e.activo).length;
    const inactivos = estudiantesModalidad.filter(e => !e.activo).length;
    
    doc.setFont(undefined, 'bold');
    doc.text(`${mod}:`, 14, yPos);
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    doc.text(`• Total: ${estudiantesModalidad.length}`, 20, yPos);
    yPos += 7;
    doc.text(`• Activos: ${activos}`, 20, yPos);
    yPos += 7;
    doc.text(`• Inactivos: ${inactivos}`, 20, yPos);
    yPos += 15;
  });

  doc.save(`Reporte_modalidad_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('🏫 Reporte por modalidad generado exitosamente', 'success');
};

export const exportarListaPDF = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para exportar', 'error');
    return;
  }

  const rows = estudiantes.map(e => ({
    id: e.id,
    dni: e.dni,
    nombre: `${e.nombre} ${e.apellido}`,
    email: e.email || 'Sin email',
    estado: e.activo ? 'Activo' : 'Inactivo',
    modalidad: e.modalidad || 'Sin modalidad',
    plan: e.cursoPlan || 'Sin plan',
    estadoInscripcion: e.estadoInscripcion || 'Sin estado',
    fecha: e.fechaInscripcion ? new Date(e.fechaInscripcion).toLocaleDateString('es-AR') : 'Sin fecha'
  }));

  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  doc.setFontSize(16);
  doc.text('📋 LISTA DE ESTUDIANTES', 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, 14, 25);
  doc.text(`Total de registros: ${estudiantes.length}`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: [['ID', 'DNI', 'Nombre Completo', 'Email', 'Estado', 'Modalidad', 'Plan', 'Estado Inscripción', 'Fecha']],
    body: rows.map(row => [
      row.id, row.dni, row.nombre, row.email, row.estado, 
      row.modalidad, row.plan, row.estadoInscripcion, row.fecha
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`Lista_estudiantes_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📋 Lista exportada exitosamente', 'success');
};

// ===== NUEVAS FUNCIONES DE ANÁLISIS AVANZADO =====

export const generarAnalisisEstados = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el análisis', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('📊 ANÁLISIS DE ESTADOS DE INSCRIPCIÓN', 14, 20);
  
  let yPos = 40;
  
  // Análisis por estado de inscripción
  const estadosGroup = agruparPor(estudiantes, 'estadoInscripcion');
  const total = estudiantes.length;
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DISTRIBUCIÓN POR ESTADO:', 14, yPos);
  yPos += 15;
  
  Object.entries(estadosGroup).forEach(([estado, estudiantesEstado]) => {
    const cantidad = estudiantesEstado.length;
    const porcentaje = calcularPorcentaje(cantidad, total);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${estado.toUpperCase()}: ${cantidad} estudiantes (${porcentaje}%)`, 14, yPos);
    yPos += 10;
    
    // Análisis por modalidad dentro de cada estado
    const modalidadesEnEstado = agruparPor(estudiantesEstado, 'modalidad');
    doc.setFont(undefined, 'normal');
    Object.entries(modalidadesEnEstado).forEach(([modalidad, estudiantes]) => {
      const porcentajeModalidad = calcularPorcentaje(estudiantes.length, cantidad);
      doc.text(`  • ${modalidad}: ${estudiantes.length} (${porcentajeModalidad}%)`, 20, yPos);
      yPos += 7;
    });
    yPos += 5;
  });
  
  // Tendencias temporales
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TENDENCIAS TEMPORALES:', 14, yPos);
  yPos += 15;
  
  const inscripcionesPorMes = {};
  estudiantes.forEach(est => {
    const mesAno = obtenerMesAno(est.fechaInscripcion);
    if (!inscripcionesPorMes[mesAno]) inscripcionesPorMes[mesAno] = 0;
    inscripcionesPorMes[mesAno]++;
  });
  
  const mesesOrdenados = Object.entries(inscripcionesPorMes)
    .sort(([a], [b]) => new Date(a.split('/')[1], a.split('/')[0] - 1) - new Date(b.split('/')[1], b.split('/')[0] - 1));
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  mesesOrdenados.forEach(([mes, cantidad]) => {
    doc.text(`• ${mes}: ${cantidad} inscripciones`, 20, yPos);
    yPos += 6;
  });

  doc.save(`Analisis_Estados_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📊 Análisis de estados generado exitosamente', 'success');
};

export const generarTendenciasPlan = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el análisis', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('📈 TENDENCIAS POR PLAN/AÑO', 14, 20);
  
  let yPos = 40;
  const total = estudiantes.length;
  
  // Análisis por modalidad y plan
  const modalidades = agruparPor(estudiantes, 'modalidad');
  
  Object.entries(modalidades).forEach(([modalidad, estudiantesModalidad]) => {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`MODALIDAD: ${modalidad}`, 14, yPos);
    yPos += 10;
    
    const planes = agruparPor(estudiantesModalidad, 'cursoPlan');
    const totalModalidad = estudiantesModalidad.length;
    
    Object.entries(planes).forEach(([plan, estudiantesPlan]) => {
      const cantidad = estudiantesPlan.length;
      const porcentajeTotal = calcularPorcentaje(cantidad, total);
      const porcentajeModalidad = calcularPorcentaje(cantidad, totalModalidad);
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`• ${plan}:`, 20, yPos);
      yPos += 7;
      doc.text(`  - Estudiantes: ${cantidad}`, 25, yPos);
      yPos += 6;
      doc.text(`  - % del total: ${porcentajeTotal}%`, 25, yPos);
      yPos += 6;
      doc.text(`  - % de modalidad: ${porcentajeModalidad}%`, 25, yPos);
      yPos += 10;
      
      // Análisis de estados dentro del plan
      const estadosEnPlan = agruparPor(estudiantesPlan, 'estadoInscripcion');
      doc.setFontSize(10);
      doc.text(`  Estados:`, 25, yPos);
      yPos += 6;
      Object.entries(estadosEnPlan).forEach(([estado, est]) => {
        const pctEstado = calcularPorcentaje(est.length, cantidad);
        doc.text(`    ${estado}: ${est.length} (${pctEstado}%)`, 30, yPos);
        yPos += 5;
      });
      yPos += 5;
    });
    yPos += 10;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  });

  doc.save(`Tendencias_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📈 Análisis de tendencias generado exitosamente', 'success');
};

export const generarAnalisisPeriodos = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el análisis', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('📅 ANÁLISIS DE PERÍODOS DE INSCRIPCIÓN', 14, 20);
  
  let yPos = 40;
  
  // Inscripciones por mes
  const inscripcionesPorMes = {};
  const inscripcionesPorDia = {};
  
  estudiantes.forEach(est => {
    if (est.fechaInscripcion) {
      const fecha = new Date(est.fechaInscripcion);
      const mesAno = obtenerMesAno(est.fechaInscripcion);
      const diaMes = fecha.getDate();
      
      if (!inscripcionesPorMes[mesAno]) inscripcionesPorMes[mesAno] = 0;
      if (!inscripcionesPorDia[diaMes]) inscripcionesPorDia[diaMes] = 0;
      
      inscripcionesPorMes[mesAno]++;
      inscripcionesPorDia[diaMes]++;
    }
  });
  
  // Período de mayor actividad
  const [mesPico, cantidadPico] = Object.entries(inscripcionesPorMes)
    .reduce((max, [mes, cant]) => cant > max[1] ? [mes, cant] : max, ['', 0]);
  
  const [diaPico, cantidadDiaPico] = Object.entries(inscripcionesPorDia)
    .reduce((max, [dia, cant]) => cant > max[1] ? [dia, cant] : max, ['', 0]);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('PICOS DE INSCRIPCIÓN:', 14, yPos);
  yPos += 15;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`• Mes con más inscripciones: ${mesPico} (${cantidadPico} inscripciones)`, 20, yPos);
  yPos += 10;
  doc.text(`• Día del mes preferido: ${diaPico} (${cantidadDiaPico} inscripciones)`, 20, yPos);
  yPos += 20;
  
  // Distribución mensual detallada
  doc.setFont(undefined, 'bold');
  doc.text('DISTRIBUCIÓN MENSUAL:', 14, yPos);
  yPos += 15;
  
  const mesesOrdenados = Object.entries(inscripcionesPorMes)
    .sort(([a], [b]) => new Date(a.split('/')[1], a.split('/')[0] - 1) - new Date(b.split('/')[1], b.split('/')[0] - 1));
  
  doc.setFont(undefined, 'normal');
  mesesOrdenados.forEach(([mes, cantidad]) => {
    const porcentaje = calcularPorcentaje(cantidad, estudiantes.length);
    doc.text(`• ${mes}: ${cantidad} inscripciones (${porcentaje}%)`, 20, yPos);
    yPos += 8;
  });

  doc.save(`Analisis_Periodos_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📅 Análisis de períodos generado exitosamente', 'success');
};

export const generarAnalisisRendimiento = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el análisis', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('🎓 ANÁLISIS DE RENDIMIENTO ACADÉMICO', 14, 20);
  
  let yPos = 40;
  
  // Tasas de éxito por modalidad
  const modalidades = agruparPor(estudiantes, 'modalidad');
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TASAS DE ÉXITO POR MODALIDAD:', 14, yPos);
  yPos += 15;
  
  Object.entries(modalidades).forEach(([modalidad, estudiantesModalidad]) => {
    const aprobados = estudiantesModalidad.filter(e => 
      e.estadoInscripcion && e.estadoInscripcion.toLowerCase().includes('aprobado')).length;
    const pendientes = estudiantesModalidad.filter(e => 
      e.estadoInscripcion && e.estadoInscripcion.toLowerCase().includes('pendiente')).length;
    const anulados = estudiantesModalidad.filter(e => 
      e.estadoInscripcion && e.estadoInscripcion.toLowerCase().includes('anulado')).length;
    
    const total = estudiantesModalidad.length;
    const tasaAprobacion = calcularPorcentaje(aprobados, total);
    const tasaPendiente = calcularPorcentaje(pendientes, total);
    const tasaAnulacion = calcularPorcentaje(anulados, total);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${modalidad.toUpperCase()}:`, 14, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`• Total estudiantes: ${total}`, 20, yPos);
    yPos += 7;
    doc.text(`• Tasa de aprobación: ${tasaAprobacion}% (${aprobados} estudiantes)`, 20, yPos);
    yPos += 7;
    doc.text(`• Tasa pendiente: ${tasaPendiente}% (${pendientes} estudiantes)`, 20, yPos);
    yPos += 7;
    doc.text(`• Tasa de anulación: ${tasaAnulacion}% (${anulados} estudiantes)`, 20, yPos);
    yPos += 15;
  });
  
  // Rendimiento por plan
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('RENDIMIENTO POR PLAN DE ESTUDIOS:', 14, yPos);
  yPos += 15;
  
  const planes = agruparPor(estudiantes, 'cursoPlan');
  Object.entries(planes).forEach(([plan, estudiantesPlan]) => {
    const aprobados = estudiantesPlan.filter(e => 
      e.estadoInscripcion && e.estadoInscripcion.toLowerCase().includes('aprobado')).length;
    const total = estudiantesPlan.length;
    const rendimiento = calcularPorcentaje(aprobados, total);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`• ${plan}: ${rendimiento}% de aprobación (${aprobados}/${total})`, 20, yPos);
    yPos += 8;
  });

  doc.save(`Analisis_Rendimiento_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('🎓 Análisis de rendimiento generado exitosamente', 'success');
};

export const generarAnalisisDocumentacion = (estudiantes, showAlerta) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('📋 ANÁLISIS DE ESTADO DOCUMENTAL', 14, 20);
  
  let yPos = 40;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('📊 Análisis basado en datos de inscripción disponibles', 20, yPos);
  yPos += 15;
  
  // Análisis por modalidad (aproximado)
  const modalidades = agruparPor(estudiantes, 'modalidad');
  
  doc.setFont(undefined, 'bold');
  doc.text('ESTIMACIÓN DE COMPLETITUD DOCUMENTAL:', 14, yPos);
  yPos += 15;
  
  Object.entries(modalidades).forEach(([modalidad, estudiantesModalidad]) => {
    // Estimación basada en estado de inscripción
    const completos = estudiantesModalidad.filter(e => 
      e.estadoInscripcion && !e.estadoInscripcion.toLowerCase().includes('pendiente')).length;
    const pendientes = estudiantesModalidad.filter(e => 
      e.estadoInscripcion && e.estadoInscripcion.toLowerCase().includes('pendiente')).length;
    
    const total = estudiantesModalidad.length;
    const completitud = calcularPorcentaje(completos, total);
    
    doc.setFont(undefined, 'normal');
    doc.text(`• ${modalidad}:`, 20, yPos);
    yPos += 7;
    doc.text(`  - Documentación completa (estimada): ${completitud}%`, 25, yPos);
    yPos += 7;
    doc.text(`  - Documentación pendiente: ${calcularPorcentaje(pendientes, total)}%`, 25, yPos);
    yPos += 12;
  });
  
  doc.text('Nota: Para análisis detallado de documentación, se requiere', 20, yPos);
  yPos += 7;
  doc.text('acceso directo a la base de datos de documentos.', 20, yPos);

  doc.save(`Analisis_Documentacion_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('📋 Análisis documental generado exitosamente', 'success');
};

export const generarDashboardEjecutivo = (estudiantes, showAlerta) => {
  if (!estudiantes || estudiantes.length === 0) {
    showAlerta('No hay datos para generar el dashboard', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('💼 DASHBOARD EJECUTIVO - KPIs INSTITUCIONALES', 14, 20);
  
  let yPos = 40;
  const total = estudiantes.length;
  
  // KPIs principales
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('📊 INDICADORES CLAVE DE RENDIMIENTO (KPIs):', 14, yPos);
  yPos += 15;
  
  // Total de estudiantes
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`🎯 Total de Estudiantes: ${total}`, 20, yPos);
  yPos += 10;
  
  // Distribución por modalidad
  const modalidades = agruparPor(estudiantes, 'modalidad');
  const semipresencial = modalidades['SEMIPRESENCIAL']?.length || 0;
  const presencial = modalidades['PRESENCIAL']?.length || 0;
  
  doc.text(`📚 Modalidad Semipresencial: ${semipresencial} (${calcularPorcentaje(semipresencial, total)}%)`, 20, yPos);
  yPos += 8;
  doc.text(`🏫 Modalidad Presencial: ${presencial} (${calcularPorcentaje(presencial, total)}%)`, 20, yPos);
  yPos += 15;
  
  // Estados de inscripción
  const estados = agruparPor(estudiantes, 'estadoInscripcion');
  doc.setFont(undefined, 'bold');
  doc.text('📈 ESTADOS DE INSCRIPCIÓN:', 20, yPos);
  yPos += 10;
  
  Object.entries(estados).forEach(([estado, estudiantesEstado]) => {
    const cantidad = estudiantesEstado.length;
    const porcentaje = calcularPorcentaje(cantidad, total);
    doc.setFont(undefined, 'normal');
    doc.text(`• ${estado}: ${cantidad} (${porcentaje}%)`, 25, yPos);
    yPos += 8;
  });
  yPos += 10;
  
  // Tendencia de crecimiento (últimos meses)
  const inscripcionesPorMes = {};
  estudiantes.forEach(est => {
    const mesAno = obtenerMesAno(est.fechaInscripcion);
    if (!inscripcionesPorMes[mesAno]) inscripcionesPorMes[mesAno] = 0;
    inscripcionesPorMes[mesAno]++;
  });
  
  const mesesRecientes = Object.entries(inscripcionesPorMes)
    .sort(([a], [b]) => new Date(b.split('/')[1], b.split('/')[0] - 1) - new Date(a.split('/')[1], a.split('/')[0] - 1))
    .slice(0, 3);
  
  doc.setFont(undefined, 'bold');
  doc.text('📊 TENDENCIA RECIENTE (Últimos 3 períodos):', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  mesesRecientes.forEach(([mes, cantidad]) => {
    doc.text(`• ${mes}: ${cantidad} inscripciones`, 25, yPos);
    yPos += 8;
  });
  yPos += 15;
  
  // Recomendaciones
  doc.setFont(undefined, 'bold');
  doc.text('💡 RECOMENDACIONES ESTRATÉGICAS:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  
  if (semipresencial > presencial) {
    doc.text('• Reforzar infraestructura virtual - alta demanda semipresencial', 25, yPos);
    yPos += 6;
  }
  
  const pendientes = estados['pendiente']?.length || estados['Pendiente']?.length || 0;
  if (pendientes > total * 0.3) {
    doc.text('• Optimizar proceso de documentación - alto % pendientes', 25, yPos);
    yPos += 6;
  }
  
  doc.text('• Implementar seguimiento mensual de tendencias', 25, yPos);
  yPos += 6;
  doc.text('• Establecer metas de conversión pendiente → aprobado', 25, yPos);

  doc.save(`Dashboard_Ejecutivo_${new Date().toISOString().split('T')[0]}.pdf`);
  showAlerta('💼 Dashboard ejecutivo generado exitosamente', 'success');
};