// horarios.js - Lógica para la vista de Horarios, Selector de Fechas y Asignación

let fechaVistaActual = new Date(); 
// Variables para guardar dónde hizo clic la directora
let fechaCeldaSeleccionada = null;
let horaCeldaSeleccionada = null;

// 1. Encontrar el Lunes
function obtenerLunes(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diferencia = d.getDate() - dia + (dia === 0 ? -6 : 1); 
    return new Date(d.setDate(diferencia));
}

// 2. Actualizar Calendario
function actualizarCalendario() {
    const lunes = obtenerLunes(fechaVistaActual);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const opciones = { day: 'numeric', month: 'short' };
    const textoSemana = `${lunes.toLocaleDateString('es-ES', opciones)} - ${viernes.toLocaleDateString('es-ES', opciones)}`;
    
    const elementoTexto = document.getElementById('texto-rango-semana');
    if (elementoTexto) {
        elementoTexto.innerText = textoSemana;
    }
    
    dibujarGrillaSemanal(lunes);
}

function cambiarSemana(direccion) {
    fechaVistaActual.setDate(fechaVistaActual.getDate() + (direccion * 7));
    actualizarCalendario();
}

function irAHoy() {
    fechaVistaActual = new Date();
    actualizarCalendario();
}

// 3. Dibujar la Grilla
function dibujarGrillaSemanal(lunesDate) {
    const contenedor = document.getElementById('contenedor-calendario');
    if (!contenedor) return;

    const horas = ["6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const columnasDias = [];
    
    for(let i=0; i<5; i++) {
        const dia = new Date(lunesDate);
        dia.setDate(lunesDate.getDate() + i);
        columnasDias.push({
            texto: `${nombresDias[i]} ${dia.getDate()}`,
            fechaReal: dia // Guardamos la fecha real para la base de datos
        });
    }

    let html = `
        <div class="min-w-[1000px]">
            <div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-indigo-50 border-b border-gray-200 text-sm font-bold text-gray-700 text-center sticky top-0 z-10">
                <div class="p-3 border-r border-gray-200 flex items-center justify-center">Hora</div>
                ${columnasDias.map(dia => `<div class="p-3 border-r border-gray-200">${dia.texto}</div>`).join('')}
            </div>
    `;

    horas.forEach(hora => {
        html += `<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors group">`;
        html += `<div class="p-2 border-r border-gray-200 text-gray-500 text-right pr-4 font-medium flex items-center justify-end">${hora}</div>`;
        
        for(let i=0; i<5; i++) {
            // Formateamos la fecha a YYYY-MM-DD para Supabase
            const fechaSQL = columnasDias[i].fechaReal.toISOString().split('T')[0];
            const diaBonito = columnasDias[i].texto;
            
            html += `
                <div class="border-r border-gray-100 p-1 relative min-h-[40px] flex gap-1 cursor-pointer hover:bg-indigo-50 transition-colors" 
                     onclick="abrirModalTurno('${fechaSQL}', '${hora}', '${diaBonito}')">
                </div>
            `;
        }
        
        html += `</div>`;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

// --- LÓGICA DEL MODAL DE ASIGNACIÓN ---

async function abrirModalTurno(fechaSQL, hora, diaBonito) {
    // 1. Guardamos los datos de dónde hizo clic
    fechaCeldaSeleccionada = fechaSQL;
    horaCeldaSeleccionada = hora;

    // 2. Actualizamos los textos visuales del modal
    document.getElementById('modal-fecha-texto').innerText = diaBonito;
    document.getElementById('modal-hora-texto').innerText = hora;

    // 3. Mostramos el modal (quitamos 'hidden', ponemos 'flex')
    const modal = document.getElementById('modal-asignar-turno');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // 4. Cargamos las opciones de los selectores
    await cargarOpcionesModal();
}

function cerrarModalTurno() {
    const modal = document.getElementById('modal-asignar-turno');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

async function cargarOpcionesModal() {
    const selectEducadora = document.getElementById('modal-select-educadora');
    const selectTurno = document.getElementById('modal-select-turno');

    // Cargar Educadoras
    const { data: staff } = await supabaseClient.from('staff').select('id, first_name, last_name');
    if (staff) {
        selectEducadora.innerHTML = '<option value="">Selecciona una educadora...</option>';
        staff.forEach(ed => {
            selectEducadora.innerHTML += `<option value="${ed.id}">${ed.first_name} ${ed.last_name}</option>`;
        });
    }

    // Cargar Turnos (Plantillas)
    const { data: turnos } = await supabaseClient.from('shift_types').select('*').order('duration_hours', { ascending: true });
    if (turnos) {
        selectTurno.innerHTML = '<option value="">Selecciona un tipo de turno...</option>';
        turnos.forEach(t => {
            selectTurno.innerHTML += `<option value="${t.id}">${t.name} (${t.duration_hours}h)</option>`;
        });
    }
}

async function guardarAsignacion() {
    const idEducadora = document.getElementById('modal-select-educadora').value;
    const idTurno = document.getElementById('modal-select-turno').value;
    const boton = document.getElementById('btn-guardar-asignacion');

    if (!idEducadora || !idTurno) {
        alert("Por favor selecciona una educadora y un tipo de turno.");
        return;
    }

    boton.innerText = "Guardando...";
    boton.disabled = true;

    // Guardamos en Supabase
    const { error } = await supabaseClient
        .from('schedules')
        .insert([{ 
            staff_id: idEducadora, 
            shift_type_id: idTurno, 
            date_assigned: fechaCeldaSeleccionada, 
            start_time: horaCeldaSeleccionada 
        }]);

    boton.innerText = "Asignar Turno";
    boton.disabled = false;

    if (error) {
        console.error("Error al asignar turno:", error);
        alert("Hubo un error al guardar. Revisa la consola.");
        return;
    }

    // Si todo salió bien
    cerrarModalTurno();
    alert("¡Turno asignado con éxito! ✅");
    
    // Aquí luego llamaremos a una función para volver a pintar la tabla con el turno visible
    actualizarCalendario(); 
}

// Arrancamos el sistema
actualizarCalendario();