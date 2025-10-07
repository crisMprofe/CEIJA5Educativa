// Datos de ejemplo de proyectos de tesis
const proyectos = [
    {
        id: 1,
        titulo: "Innovación en Metodologías Educativas",
        autor: "Ana García",
        descripcion: "Análisis del impacto de las nuevas metodologías en el aprendizaje",
        estado: "activo",
        fecha: "2025-01-15"
    },
    {
        id: 2,
        titulo: "Tecnología en el Aula",
        autor: "Carlos Rodríguez",
        descripcion: "Evaluación de herramientas digitales en educación primaria",
        estado: "revision",
        fecha: "2025-02-01"
    },
    {
        id: 3,
        titulo: "Educación Inclusiva",
        autor: "María López",
        descripcion: "Estrategias para la integración en el sistema educativo",
        estado: "completado",
        fecha: "2024-12-10"
    }
];

// Función para cargar proyectos en la página
function cargarProyectos() {
    const listaProyectos = document.getElementById('lista-proyectos');
    if (!listaProyectos) return;

    listaProyectos.innerHTML = '';

    proyectos.forEach(proyecto => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h3>${proyecto.titulo}</h3>
            <p><strong>Autor:</strong> ${proyecto.autor}</p>
            <p>${proyecto.descripcion}</p>
            <p><small>Fecha: ${proyecto.fecha}</small></p>
            <span class="project-status status-${proyecto.estado}">
                ${proyecto.estado.charAt(0).toUpperCase() + proyecto.estado.slice(1)}
            </span>
        `;
        listaProyectos.appendChild(card);
    });
}

// Función para mostrar formulario de nuevo proyecto
function mostrarFormulario() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-proyecto';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="cerrarModal()">&times;</span>
            <h2>Nuevo Proyecto de Tesis</h2>
            <form id="form-proyecto" class="contact-form">
                <input type="text" id="titulo" placeholder="Título del Proyecto" required>
                <input type="text" id="autor" placeholder="Nombre del Autor" required>
                <textarea id="descripcion" placeholder="Descripción del Proyecto" required></textarea>
                <input type="date" id="fecha" required>
                <select id="estado" required>
                    <option value="">Seleccionar Estado</option>
                    <option value="activo">Activo</option>
                    <option value="revision">En Revisión</option>
                    <option value="completado">Completado</option>
                </select>
                <button type="submit" class="btn-primary">Crear Proyecto</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Manejar el envío del formulario
    document.getElementById('form-proyecto').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarProyecto();
    });
}

// Función para cerrar modal
function cerrarModal() {
    const modal = document.getElementById('modal-proyecto');
    if (modal) {
        modal.remove();
    }
}

// Función para agregar un nuevo proyecto
function agregarProyecto() {
    const titulo = document.getElementById('titulo').value;
    const autor = document.getElementById('autor').value;
    const descripcion = document.getElementById('descripcion').value;
    const fecha = document.getElementById('fecha').value;
    const estado = document.getElementById('estado').value;

    const nuevoProyecto = {
        id: proyectos.length + 1,
        titulo,
        autor,
        descripcion,
        estado,
        fecha
    };

    proyectos.push(nuevoProyecto);
    cargarProyectos();
    cerrarModal();

    // Mostrar mensaje de éxito
    mostrarMensaje('Proyecto creado exitosamente', 'success');
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background-color: ${tipo === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        z-index: 2000;
        animation: slideIn 0.3s;
    `;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);

    setTimeout(() => {
        mensajeDiv.remove();
    }, 3000);
}

// Manejar formulario de contacto
document.addEventListener('DOMContentLoaded', function() {
    // Cargar proyectos al iniciar
    cargarProyectos();

    // Manejar formulario de contacto
    const formContacto = document.getElementById('form-contacto');
    if (formContacto) {
        formContacto.addEventListener('submit', function(e) {
            e.preventDefault();
            mostrarMensaje('Mensaje enviado exitosamente', 'success');
            formContacto.reset();
        });
    }

    // Smooth scroll para navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('modal-proyecto');
    if (event.target === modal) {
        cerrarModal();
    }
}
