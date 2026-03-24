// horarios.js - Lógica para la vista de Horarios, Selector de Fechas y Asignación

let fechaVistaActual = new Date(); 
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
async function actualizarCalendario() {
    const lunes = obtenerLunes(fechaVistaActual);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const opciones = { day: 'numeric', month: 'short' };
    const textoSemana = `${lunes.toLocaleDateString('es-ES', opciones)} - ${viernes.toLocaleDateString('es-ES', opciones)}`;
    
    const elementoTexto = document.getElementById('texto-rango-semana');
    if (elementoTexto) {
        elementoTexto.innerText = textoSemana;
    }
    
    // Primero dibujamos la cuadrícula vacía
    dibujarGrillaSemanal(lunes);
    
    // Luego buscamos los turnos en la base de datos y los pintamos encima
    await cargarTurnosAsignados(lunes, viernes);
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
        
        // Formato seguro YYYY-MM-DD para evitar problemas de zona horaria
        const year = dia.getFullYear();
        const month = String(dia.getMonth() + 1).padStart(2, '0');
        const day = String(dia.getDate()).padStart(2, '0');
        
        columnasDias.push({
            texto: `${nombresDias[i]} ${dia.getDate()}`,
            fechaSQL: `${year}-${month}-${day}` 
        });
    }

    let html = `
        <div class="min-w-[1000px]">
            <div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-indigo-50 border-b border-gray-200 text-sm font-bold text-gray-700 text-center sticky top-0 z-30">
                <div class="p-3 border-r border-gray-200 flex items-center justify-center">Hora</div>
                ${columnasDias.map(dia => `<div class="p-3 border-r border-gray-200">${dia.texto}</div>`).join('')}
            </div>
    `;

    horas.forEach(hora => {
        html += `<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors group">`;
        html += `<div class="p-2 border-r border-gray-200 text-gray-500 text-right pr-4 font-medium flex items-center justify-end">${hora}</div>`;
        
        for(let i=0; i<5; i++) {
            const fechaSQL = columnasDias[i].fechaSQL;
            const diaBonito = columnasDias[i].texto;
            
            // AGREGAMOS UN ID ÚNICO A CADA CELDA para saber dónde pegar el bloque
            html += `
                <div id="celda-${fechaSQL}-${hora}" class="border-r border-gray-100 p-1 relative min-h-[40px] flex gap-1 cursor-pointer hover:bg-indigo-50 transition-colors" 
                     onclick="abrirModalTurno('${fechaSQL}', '${hora}', '${diaBonito}')">
                </div>
            `;
        }
        
        html += `</div>`;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

// 4. CARGAR Y PINTAR LOS TURNOS (¡NUEVA MAGIA!)
async function cargarTurnosAsignados(lunes, viernes) {
    const yearL = lunes.getFullYear();
    const monthL = String(lunes.getMonth() + 1).padStart(2, '0');
    const dayL = String(lunes.getDate()).padStart(2, '0');
    const lunesStr = `${yearL}-${monthL}-${dayL}`;

    const yearV = viernes.getFullYear();
    const monthV = String(viernes.getMonth() + 1).padStart(2, '0');
    const dayV = String(viernes.getDate()).padStart(2, '0');
    const viernesStr = `${yearV}-${monthV}-${dayV}`;

    // Descargamos los turnos de la semana, las educadoras y las plantillas
    const { data: asignaciones } = await supabaseClient.from('schedules').select('*').gte('date_assigned', lunesStr).lte('date_assigned', viernesStr);
    const { data: staff } = await supabaseClient.from('staff').select('id, first_name, last_name');
    const { data: tiposTurno } = await supabaseClient.from('shift_types').select('*');

    if (!asignaciones) return;

    asignaciones.forEach(asignacion => {
        // Buscamos quién es y qué turno tiene
        const profesional = staff.find(s => s.id === asignacion.staff_id);
        const tipo = tiposTurno.find(t => t.id == asignacion.shift_type_id);
        
        if (!profesional || !tipo) return;

        // Buscamos la celda exacta donde debe empezar
        const idCelda = `celda-${asignacion.date_assigned}-${asignacion.start_time}`;
        const celda = document.getElementById(idCelda);
        
        if (celda) {
            // Cada 30 min (una fila) son unos 40px de alto. Multiplicamos horas * 80px
            const alturaPx = tipo.duration_hours * 80;
            
            // Creamos el bloque de color estilo Excel/Google Calendar
            const bloque = document.createElement('div');
            bloque.className = "absolute top-0 left-0 w-full z-20 rounded-md shadow-sm p-1.5 overflow-hidden border border-white/20 text-white cursor-pointer hover:opacity-90 transition-opacity flex flex-col justify-start";
            bloque.style.backgroundColor = tipo.color_hex;
            bloque.style.height = `calc(${alturaPx}px - 2px)`; 
            
            bloque.innerHTML = `
                <div class="font-bold text-[11px] truncate leading-tight drop-shadow-md">${profesional.first_name} ${profesional.last_name.charAt(0)}.</div>
                <div class="text-[9px] opacity-90 truncate drop-shadow-md">${tipo.name}</div>
            `;

            // Evitamos que al dar clic en el bloque se abra la opción de crear uno nuevo
            bloque.onclick = (e) => {
                e.stopPropagation(); 
                alert(`Has hecho clic en el turno de ${profesional.first_name}. Aquí luego pondremos la opción de Editar o Borrar.`);
            };

            celda.appendChild(bloque);
        }
    });
}

// --- LÓGICA DEL MODAL DE ASIGNACIÓN ---

async function abrirModalTurno(fechaSQL, hora, diaBonito) {
    fechaCeldaSeleccionada = fechaSQL;
    horaCeldaSeleccionada = hora;

    document.getElementById('modal-fecha-texto').innerText = diaBonito;
    document.getElementById('modal-hora-texto').innerText = hora;

    const modal = document.getElementById('modal-asignar-turno');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

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

    const { data: staff } = await supabaseClient.from('staff').select('id, first_name, last_name');
    if (staff) {
        selectEducadora.innerHTML = '<option value="">Selecciona una educadora...</option>';
        staff.forEach(ed => {
            selectEducadora.innerHTML += `<option value="${ed.id}">${ed.first_name} ${ed.last_name}</option>`;
        });
    }

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

    cerrarModalTurno();
    
    // Al guardar exitosamente, volvemos a pintar el calendario para que aparezca el bloque
    actualizarCalendario(); 
}

// Arrancamos el sistema
actualizarCalendario();