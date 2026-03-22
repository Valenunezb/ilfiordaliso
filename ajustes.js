// ajustes.js - Lógica para la vista de Ajustes y Festivos

// 1. Cargar los festivos desde Supabase
async function cargarFestivos() {
    const lista = document.getElementById('lista-festivos');
    
    // Traemos los datos ordenados por fecha
    const { data: festivos, error } = await supabaseClient
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error("Error al cargar festivos:", error);
        lista.innerHTML = '<li class="text-red-500">Error al cargar la lista.</li>';
        return;
    }

    // Limpiamos la lista
    lista.innerHTML = '';

    if (festivos.length === 0) {
        lista.innerHTML = '<li class="text-gray-500 italic">No hay festivos registrados.</li>';
        return;
    }

    // Dibujamos cada festivo
    festivos.forEach(festivo => {
        // Formateamos la fecha para que se vea bonita (ej: 25 Dic 2024)
        const fechaObj = new Date(festivo.date + 'T00:00:00'); // Evita desfases de zona horaria
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        const fechaBonita = fechaObj.toLocaleDateString('es-ES', opciones);

        const li = document.createElement('li');
        li.className = "flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors";
        li.innerHTML = `
            <div>
                <span class="font-medium text-gray-700 w-28 inline-block">${fechaBonita}</span>
                <span class="text-gray-600">${festivo.name}</span>
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

    const { error } = await supabaseClient
        .from('holidays')
        .insert([{ date: inputFecha, name: inputNombre }]);

    boton.innerText = "Añadir";
    boton.disabled = false;

    if (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema al guardar el festivo.");
        return;
    }

    // Limpiamos los campos y recargamos la lista
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

    // Recargamos la lista para que desaparezca
    cargarFestivos();
}

// Ejecutamos la carga inicial
cargarFestivos();