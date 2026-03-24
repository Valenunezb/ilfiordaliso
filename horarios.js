// horarios.js - Lógica completa de Calendario, Asignación, Edición y Salas

let fechaVistaActual = new Date(); 
let fechaCeldaSeleccionada = null;
let horaCeldaSeleccionada = null;

function obtenerLunes(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diferencia = d.getDate() - dia + (dia === 0 ? -6 : 1); 
    return new Date(d.setDate(diferencia));
}

async function actualizarCalendario() {
    const lunes = obtenerLunes(fechaVistaActual);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const opciones = { day: 'numeric', month: 'short' };
    document.getElementById('texto-rango-semana').innerText = `${lunes.toLocaleDateString('es-ES', opciones)} - ${viernes.toLocaleDateString('es-ES', opciones)}`;
    
    dibujarGrillaSemanal(lunes);
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

function dibujarGrillaSemanal(lunesDate) {
    const contenedor = document.getElementById('contenedor-calendario');
    if (!contenedor) return;

    const horas = ["6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const columnasDias = [];
    
    for(let i=0; i<5; i++) {
        const dia = new Date(lunesDate);
        dia.setDate(lunesDate.getDate() + i);
        
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

// 4. CARGAR Y PINTAR LOS TURNOS (SISTEMA ANTI-COLISIONES Y ORDEN POR SALA)
async function cargarTurnosAsignados(lunes, viernes) {
    const lunesStr = `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, '0')}-${String(lunes.getDate()).padStart(2, '0')}`;
    const viernesStr = `${viernes.getFullYear()}-${String(viernes.getMonth() + 1).padStart(2, '0')}-${String(viernes.getDate()).padStart(2, '0')}`;

    const { data: asignaciones } = await supabaseClient.from('schedules').select('*').gte('date_assigned', lunesStr).lte('date_assigned', viernesStr);
    const { data: staff } = await supabaseClient.from('staff').select('id, first_name, last_name, contract_percentage');
    const { data: tiposTurno } = await supabaseClient.from('shift_types').select('*');

    if (!asignaciones) return;

    // 1. Definimos el orden estricto de izquierda a derecha
    const ordenSalas = ["Brucco", "Bozzoli", "Farfalle", "Centro"];

    // Función auxiliar para convertir "08:30" en minutos (facilita calcular si chocan)
    function horaAMinutos(horaTexto) {
        const [h, m] = horaTexto.split(':').map(Number);
        return h * 60 + m;
    }

    // 2. Agrupamos todos los turnos por Día y luego por Sala
    const mapaDias = {};

    asignaciones.forEach(asignacion => {
        const date = asignacion.date_assigned;
        if (!mapaDias[date]) {
            mapaDias[date] = {};
            ordenSalas.forEach(s => mapaDias[date][s] = []);
            mapaDias[date]["Otros"] = [];
        }
        
        let salaKey = asignacion.sala || "Otros";
        if (!ordenSalas.includes(salaKey)) salaKey = "Otros";

        const tipo = tiposTurno.find(t => t.id == asignacion.shift_type_id);
        const profesional = staff.find(s => s.id === asignacion.staff_id);

        if (tipo && profesional) {
            const start = horaAMinutos(asignacion.start_time);
            const end = start + (tipo.duration_hours * 60);
            mapaDias[date][salaKey].push({ start, end, asignacion, tipo, profesional });
        }
    });

    // 3. Procesamos cada día dibujando de izquierda a derecha
    for (const date in mapaDias) {
        let carrilGlobalIndex = 0; // Índice de columna general del día
        const salasDelDia = [...ordenSalas, "Otros"];

        salasDelDia.forEach(salaKey => {
            const turnosSala = mapaDias[date][salaKey];
            
            // Ordenamos primero al que entra más temprano
            turnosSala.sort((a, b) => a.start - b.start);

            const carrilesOcupados = []; // Control de colisiones de esta sala

            turnosSala.forEach(turnoInfo => {
                let carrilLocal = 0;
                let colocado = false;

                // Buscamos un carril libre para que no se pise con otra de su misma sala
                while (!colocado) {
                    if (!carrilesOcupados[carrilLocal]) carrilesOcupados[carrilLocal] = [];

                    const hayChoque = carrilesOcupados[carrilLocal].some(t => {
                        return (turnoInfo.start < t.end) && (turnoInfo.end > t.start);
                    });

                    if (!hayChoque) {
                        carrilesOcupados[carrilLocal].push(turnoInfo);
                        colocado = true;
                    } else {
                        carrilLocal++; // Si choca, probamos en el carril de al lado
                    }
                }

                // Dibujamos el bloque en su posición exacta
                dibujarBloque(turnoInfo, carrilGlobalIndex + carrilLocal);
            });

            // Sumamos los carriles que usó esta sala para que la siguiente empiece más a la derecha
            if (carrilesOcupados.length > 0) {
                carrilGlobalIndex += carrilesOcupados.length;
            }
        });
    }

    // 4. El "Pintor"
    function dibujarBloque(turnoInfo, laneIndex) {
        const { asignacion, tipo, profesional } = turnoInfo;
        const idCelda = `celda-${asignacion.date_assigned}-${asignacion.start_time}`;
        const celda = document.getElementById(idCelda);

        if (celda) {
            const alturaPx = tipo.duration_hours * 80;
            const anchoCinta = 32;
            const espacio = 6; // Píxeles de separación entre cintas
            const desplazamientoIzquierda = laneIndex * (anchoCinta + espacio);

            const bloque = document.createElement('div');
            bloque.className = "absolute top-0 z-20 rounded-md shadow-sm overflow-hidden border border-white/50 text-white cursor-pointer hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 transition-all flex justify-center py-2";
            bloque.style.backgroundColor = tipo.color_hex;
            bloque.style.height = `calc(${alturaPx}px - 2px)`; 
            bloque.style.width = `${anchoCinta}px`;
            bloque.style.left = `${desplazamientoIzquierda}px`; 

            const salaTexto = asignacion.sala ? asignacion.sala.substring(0,3).toUpperCase() : "S/S";
            const porcentaje = profesional.contract_percentage ? profesional.contract_percentage : '100';

            bloque.innerHTML = `
                <div class="text-[10px] font-bold whitespace-nowrap flex items-center gap-2 drop-shadow-md" style="writing-mode: vertical-rl; transform: rotate(180deg);">
                    <span class="tracking-wide">${profesional.first_name}</span>
                    <span class="opacity-60 font-normal">|</span>
                    <span>${porcentaje}%</span>
                    <span class="opacity-60 font-normal">|</span>
                    <span class="bg-white/30 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest">${salaTexto}</span>
                </div>
            `;

            bloque.onclick = (e) => {
                e.stopPropagation(); 
                abrirModalTurno(asignacion.date_assigned, asignacion.start_time, 'Turno Asignado', asignacion);
            };

            celda.appendChild(bloque);
        }
    }
}

// --- LÓGICA DEL MODAL ---

// Esta función ahora es inteligente: sabe si estás creando o editando
async function abrirModalTurno(fechaSQL, hora, diaBonito, asignacionExistente = null) {
    fechaCeldaSeleccionada = fechaSQL;
    horaCeldaSeleccionada = hora;

    document.getElementById('modal-fecha-texto').innerText = diaBonito;
    document.getElementById('modal-hora-texto').innerText = hora;
    
    // Cargamos las opciones primero
    await cargarOpcionesModal();

    const titulo = document.getElementById('modal-titulo');
    const inputId = document.getElementById('modal-asignacion-id');
    const btnEliminar = document.getElementById('btn-eliminar-asignacion');
    
    // Resetear valores de los selects
    document.getElementById('modal-select-educadora').value = "";
    document.getElementById('modal-select-turno').value = "";
    document.getElementById('modal-select-sala').value = "";

    if (asignacionExistente) {
        // MODO EDICIÓN
        titulo.innerText = "Editar Turno";
        inputId.value = asignacionExistente.id;
        btnEliminar.classList.remove('hidden'); // Mostramos el botón rojo
        
        // Rellenar con los datos guardados
        document.getElementById('modal-select-educadora').value = asignacionExistente.staff_id;
        document.getElementById('modal-select-turno').value = asignacionExistente.shift_type_id;
        if(asignacionExistente.sala) {
            document.getElementById('modal-select-sala').value = asignacionExistente.sala;
        }
    } else {
        // MODO CREACIÓN
        titulo.innerText = "Asignar Educadora";
        inputId.value = "";
        btnEliminar.classList.add('hidden'); // Ocultamos el botón rojo
    }

    const modal = document.getElementById('modal-asignar-turno');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function cerrarModalTurno() {
    const modal = document.getElementById('modal-asignar-turno');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

async function cargarOpcionesModal() {
    const selectEducadora = document.getElementById('modal-select-educadora');
    const selectTurno = document.getElementById('modal-select-turno');

    // Solo cargar si están vacíos para no gastar internet
    if (selectEducadora.options.length <= 1) {
        const { data: staff } = await supabaseClient.from('staff').select('id, first_name, last_name');
        if (staff) {
            selectEducadora.innerHTML = '<option value="">Selecciona una educadora...</option>';
            staff.forEach(ed => {
                selectEducadora.innerHTML += `<option value="${ed.id}">${ed.first_name} ${ed.last_name}</option>`;
            });
        }
    }

    if (selectTurno.options.length <= 1) {
        const { data: turnos } = await supabaseClient.from('shift_types').select('*').order('duration_hours', { ascending: true });
        if (turnos) {
            selectTurno.innerHTML = '<option value="">Selecciona un tipo de turno...</option>';
            turnos.forEach(t => {
                selectTurno.innerHTML += `<option value="${t.id}">${t.name} (${t.duration_hours}h)</option>`;
            });
        }
    }
}

async function guardarAsignacion() {
    const idAsignacion = document.getElementById('modal-asignacion-id').value;
    const idEducadora = document.getElementById('modal-select-educadora').value;
    const idTurno = document.getElementById('modal-select-turno').value;
    const salaSeleccionada = document.getElementById('modal-select-sala').value;
    const boton = document.getElementById('btn-guardar-asignacion');

    if (!idEducadora || !idTurno || !salaSeleccionada) {
        alert("Por favor completa todos los campos, incluyendo la sala.");
        return;
    }

    boton.innerText = "Guardando...";
    boton.disabled = true;

    let error;

    if (idAsignacion) {
        // ACTUALIZAR TURNO EXISTENTE
        const { error: errUpdate } = await supabaseClient
            .from('schedules')
            .update({ staff_id: idEducadora, shift_type_id: idTurno, sala: salaSeleccionada })
            .eq('id', idAsignacion);
        error = errUpdate;
    } else {
        // CREAR TURNO NUEVO
        const { error: errInsert } = await supabaseClient
            .from('schedules')
            .insert([{ 
                staff_id: idEducadora, 
                shift_type_id: idTurno, 
                date_assigned: fechaCeldaSeleccionada, 
                start_time: horaCeldaSeleccionada,
                sala: salaSeleccionada
            }]);
        error = errInsert;
    }

    boton.innerText = "Guardar";
    boton.disabled = false;

    if (error) {
        console.error("Error:", error);
        alert("Hubo un error al guardar.");
        return;
    }

    cerrarModalTurno();
    actualizarCalendario(); 
}

// Función para eliminar el turno
async function eliminarAsignacion() {
    const idAsignacion = document.getElementById('modal-asignacion-id').value;
    
    if (!confirm("¿Estás seguro de que quieres eliminar este turno?")) return;

    const { error } = await supabaseClient
        .from('schedules')
        .delete()
        .eq('id', idAsignacion);

    if (error) {
        alert("Error al eliminar.");
        return;
    }

    cerrarModalTurno();
    actualizarCalendario();
}

// Arrancamos el sistema
actualizarCalendario();

// --- FUNCIONES DE EXPORTACIÓN Y VISTAS ---

function imprimirHorario() {
    // Al llamar a print(), el navegador abre automáticamente la ventana para guardar como PDF o Imprimir
    window.print();
}

function compartirWhatsApp() {
    const textoSemana = document.getElementById('texto-rango-semana').innerText;
    const mensaje = `¡Hola equipo! 🌟 Ya están listos los horarios para la semana: *${textoSemana}*. Por favor ingresen al sistema para revisar sus turnos y salas asignadas.`;
    
    // Abre WhatsApp Web o la app del celular con el mensaje pre-escrito
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function compartirEmail() {
    const textoSemana = document.getElementById('texto-rango-semana').innerText;
    const asunto = `Nuevos Horarios: Semana ${textoSemana}`;
    const cuerpo = `¡Hola equipo!\n\nYa están disponibles los horarios para la semana: ${textoSemana}.\n\nPor favor, ingresen a la plataforma para revisar sus turnos y salas asignadas.\n\nSaludos cordiales.`;
    
    // Abre el gestor de correos (Outlook, Gmail, Apple Mail)
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

function cambiarVista() {
    const vistaSeleccionada = document.getElementById('selector-vista').value;
    
    if (vistaSeleccionada === 'mes' || vistaSeleccionada === 'ano') {
        alert("¡Has seleccionado la vista " + vistaSeleccionada.toUpperCase() + "!\n\nEsta será nuestra próxima gran actualización visual. Por ahora te regresaré a la vista semanal.");
        // Devolvemos el selector a la semana temporalmente
        document.getElementById('selector-vista').value = 'semana';
    }
}