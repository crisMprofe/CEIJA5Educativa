const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../middleware/upload');
const guardarDetalleDocumentacion = require('../utils/guardarDetalleDocumentacion');
const buscarOInsertarProvincia = require('../utils/buscarOInsertarProvincia');
const buscarOInsertarLocalidad = require('../utils/buscarOInsertarLocalidad');
const buscarOInsertarBarrio = require('../utils/buscarOInsertarBarrio');
const obtenerRutaFoto = require('../utils/obtenerRutaFoto');



router.get('/buscar/:dni', async (req, res) => {
    try {
        const { dni } = req.params;
        const modalidadId = Number(req.query.modalidadId); // <-- recibe modalidadId

        if (isNaN(dni)) {
            return res.status(400).json({ success: false, message: 'DNI inválido.' });
        }

        const [estudiante] = await db.query('SELECT *, email FROM estudiantes WHERE dni = ? AND activo = 1', [dni]);
        if (estudiante.length === 0) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado o inactivo.' });
        }

        const [domicilio] = await db.query(`
            SELECT 
                d.calle,
                d.numero,
                b.nombre AS barrio,
                l.nombre AS localidad,
                p.nombre AS provincia
            FROM domicilios d
            LEFT JOIN barrios b ON d.idBarrio = b.id
            LEFT JOIN localidades l ON d.idLocalidad = l.id
            LEFT JOIN provincias p ON d.idProvincia = p.id
            WHERE d.id = ?
        `, [estudiante[0].idDomicilio]);

        // Filtrar inscripción por modalidadId
        let inscripcionQuery = `
            SELECT 
                i.id AS idInscripcion,
                i.fechaInscripcion, 
                m.modalidad, 
                a.descripcionAnioPlan AS cursoPlan
            FROM inscripciones i
            LEFT JOIN modalidades m ON i.idModalidad = m.id
            LEFT JOIN anio_plan a ON i.idAnioPlan = a.id
            WHERE i.idEstudiante = ?
        `;
        const queryParams = [estudiante[0].id];

        if (modalidadId) {
            inscripcionQuery += ' AND i.idModalidad = ?';
            queryParams.push(modalidadId);
        }

        const [inscripcion] = await db.query(inscripcionQuery, queryParams);

        // Si no hay inscripción para esa modalidad, devuelve error
        if (!inscripcion.length) {
            return res.status(404).json({ success: false, message: 'No existe inscripción en la modalidad seleccionada.' });
        }

        res.status(200).json({
            success: true,
            estudiante: estudiante[0],
            domicilio: domicilio[0],
            inscripcion: inscripcion[0],
        });
    } catch (error) {
        console.error('Error al obtener estudiante por DNI:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, activo } = req.query; // Recibe los parámetros de paginación y filtro
        const offset = (page - 1) * limit;

        console.log('🔍 Parámetros recibidos:', { page, limit, activo });

        // Construir la cláusula WHERE según el filtro
        let whereClause = '';
        let countWhereClause = '';
        let queryParams = [parseInt(limit), parseInt(offset)];
        let countParams = [];

        if (activo !== undefined) {
            // Si se especifica activo (0 o 1), filtrar por ese valor
            whereClause = 'WHERE e.activo = ?';
            countWhereClause = 'WHERE activo = ?';
            queryParams = [parseInt(activo), parseInt(limit), parseInt(offset)];
            countParams = [parseInt(activo)];
            console.log('📋 Filtrando por activo:', activo);
        } else {
            // Si no se especifica, mostrar todos (comportamiento por defecto)
            whereClause = '';
            countWhereClause = '';
            console.log('📋 Mostrando todos los estudiantes');
        }

        // Consulta para obtener estudiantes con modalidad y curso/plan
        const [result] = await db.query(`
            SELECT 
                e.id, e.nombre, e.apellido, e.dni, e.cuil, e.fechaNacimiento, e.activo, e.email,
                d.calle, d.numero, b.nombre AS barrio, l.nombre AS localidad, p.nombre AS provincia,
                i.fechaInscripcion, 
                m.modalidad, 
                a.descripcionAnioPlan AS cursoPlan,
                ei.id AS idEstadoInscripcion, -- <--- AGREGAR ESTA LINEA
                ei.descripcionEstado AS estadoInscripcion
            FROM estudiantes e
            LEFT JOIN domicilios d ON e.idDomicilio = d.id
            LEFT JOIN barrios b ON d.idBarrio = b.id
            LEFT JOIN localidades l ON d.idLocalidad = l.id
            LEFT JOIN provincias p ON d.idProvincia = p.id
            LEFT JOIN inscripciones i ON e.id = i.idEstudiante
            LEFT JOIN modalidades m ON i.idModalidad = m.id
            LEFT JOIN anio_plan a ON i.idAnioPlan = a.id
            LEFT JOIN estado_inscripciones ei ON i.idEstadoInscripcion = ei.id
            ${whereClause}
            ORDER BY i.fechaInscripcion DESC, e.id ASC
            LIMIT ? OFFSET ?
        `, queryParams);

        // Contar total de estudiantes según el filtro
        const [total] = await db.query(`SELECT COUNT(*) AS total FROM estudiantes ${countWhereClause}`, countParams);

        console.log('📊 Resultados:', {
            total: total[0].total,
            estudiantes: result.length,
            filtro: activo !== undefined ? `activo=${activo}` : 'todos'
        });

        res.status(200).json({
            success: true,
            estudiantes: Array.isArray(result) ? result.map(estudiante => ({
                ...estudiante,
                fechaInscripcion: estudiante.fechaInscripcion || 'Sin inscripción',
                modalidad: estudiante.modalidad || 'Sin modalidad',
                cursoPlan: estudiante.cursoPlan || 'Sin curso/plan',
                estadoInscripcion: estudiante.estadoInscripcion || 'Sin estado',
            })) : [],
            total: total[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total[0].total / parseInt(limit)),
        });
    } catch (error) {
        console.error('Error al obtener estudiantes inscritos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
module.exports = router;