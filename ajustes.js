// ajustes.js - Lógica para la vista de Ajustes y Festivos adaptada a tu base de datos

// 1. Cargar los festivos desde Supabase
async function cargarFestivos() {
    const lista = document.getElementById('lista-festivos');
    
    // Traemos los datos usando tu columna "holiday_date"
    const { data: festivos, error } = await supabaseClient
        .from('holidays')
        .select('*')
        .order('holiday_date', { ascending: true });

    if (error) {
        console.error("Error al cargar festivos:", error);
        lista.innerHTML = '<li class="text-red-500">Error al cargar la lista.</li>';
        return;
    }

    lista.innerHTML = '';

    if (festivos.length === 0) {
        lista.innerHTML = '<li class="text-gray-500 italic">No hay festivos registrados.</li>';
        return;
    }

    festivos.forEach(festivo => {
        // Usamos festivo.holiday_date
        const fechaObj = new Date(festivo.holiday_date + 'T00:00:00'); 
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        const fechaBonita = fechaObj.toLocaleDateString('es-ES', opciones);

        const li = document.createElement('li');
        li.className = "flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors";
        li.innerHTML = `
            <div>
                <span class="font-medium text-gray-700 w-28 inline-block">${fechaBonita}</span>
                <span class="text-gray-600">${festivo.description}</span>
            </div>
            <button onclick="eliminarFestivo('${festivo.id}')" class="text-red-400 hover:text-red-600 px-2 font-bold" title="Eliminar festivo">✕</button>
        `;
        lista.appendChild(li);
    });
}

// 2. Guardar un nuevo festivo en Supabase
async function guardarFestivo(event) {
    event.preventDefault();

    const inputFecha = document.getElementById('festivo-fecha').value;
    const inputNombre = document.getElementById('festivo-nombre').value;
    const boton = document.getElementById('btn-guardar-festivo');

    if (!inputFecha || !inputNombre) {
        alert("Por favor, ingresa la fecha y el nombre del festivo.");
        return;
    }

    boton.innerText = "Guardando...";
    boton.disabled = true;

    // Aquí guardamos enviando los datos a "holiday_date" y "description"
    const { error } = await supabaseClient
        .from('holidays')
        .insert([{ holiday_date: inputFecha, description: inputNombre }]);

    boton.innerText = "Añadir";
    boton.disabled = false;

    if (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema al guardar el festivo.");
        return;
    }

    document.getElementById('festivo-fecha').value = '';
    document.getElementById('festivo-nombre').value = '';
    cargarFestivos();
}

// 3. Eliminar un festivo
async function eliminarFestivo(id) {
    if (!confirm("¿Seguro que quieres eliminar este festivo?")) return;

    const { error } = await supabaseClient
        .from('holidays')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar.");
        return;
    }

    cargarFestivos();
}

// Ejecutamos la carga inicial
cargarFestivos();

// --- LÓGICA DE PLANTILLAS DE TURNOS ---

// 1. Cargar turnos desde Supabase
async function cargarTurnos() {
    const lista = document.getElementById('lista-turnos');
    
    const { data: turnos, error } = await supabaseClient
        .from('shift_types')
        .select('*')
        .order('duration_hours', { ascending: true });

    if (error) {
        console.error("Error al cargar turnos:", error);
        lista.innerHTML = '<li class="text-red-500">Error al cargar la lista.</li>';
        return;
    }

    lista.innerHTML = '';

    if (turnos.length === 0) {
        lista.innerHTML = '<li class="text-gray-500 italic">No hay plantillas registradas.</li>';
        return;
    }

    turnos.forEach(turno => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors";
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="w-4 h-4 rounded-full shadow-sm" style="background-color: ${turno.color_hex};"></span>
                <span class="font-medium text-gray-700 w-24">${turno.name}</span>
                <span class="text-gray-500">${turno.duration_hours} hrs</span>
            </div>
            <button onclick="eliminarTurno('${turno.id}')" class="text-red-400 hover:text-red-600 px-2 font-bold" title="Eliminar turno">✕</button>
        `;
        lista.appendChild(li);
    });
}

// 2. Guardar un nuevo turno
async function guardarTurno(event) {
    event.preventDefault();

    const inputNombre = document.getElementById('turno-nombre').value;
    const inputHoras = document.getElementById('turno-horas').value;
    const inputColor = document.getElementById('turno-color').value;
    const boton = document.getElementById('btn-guardar-turno');

    if (!inputNombre || !inputHoras) {
        alert("Por favor, ingresa el nombre y la cantidad de horas.");
        return;
    }

    boton.innerText = "...";
    boton.disabled = true;

    const { error } = await supabaseClient
        .from('shift_types')
        .insert([{ 
            name: inputNombre, 
            duration_hours: parseFloat(inputHoras), 
            color_hex: inputColor 
        }]);

    boton.innerText = "Crear";
    boton.disabled = false;

    if (error) {
        console.error("Error al guardar turno:", error);
        alert("Hubo un problema al guardar la plantilla.");
        return;
    }

    // Limpiar campos y recargar
    document.getElementById('turno-nombre').value = '';
    document.getElementById('turno-horas').value = '';
    // Podemos dejar el último color elegido por si quiere hacer varios de la misma gama
    cargarTurnos();
}

// 3. Eliminar turno
async function eliminarTurno(id) {
    if (!confirm("¿Seguro que quieres eliminar esta plantilla de turno?")) return;

    const { error } = await supabaseClient
        .from('shift_types')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar.");
        return;
    }

    cargarTurnos();
}

// Ejecutamos la carga inicial de turnos cuando se abre la página
cargarTurnos();