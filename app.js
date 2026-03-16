// Función para buscar las educadoras y mostrarlas
async function cargarEducadoras() {
    const contenedor = document.getElementById('contenedor-educadoras');

    // Le pedimos a Supabase todos los datos de la tabla 'staff'
    const { data: staff, error } = await supabaseClient
        .from('staff')
        .select('*');

    if (error) {
        console.error("Error al traer datos:", error);
        contenedor.innerHTML = '<p class="text-red-500 font-bold">Hubo un error al cargar las educadoras.</p>';
        return;
    }

    // Limpiamos el texto de "Cargando..."
    contenedor.innerHTML = '';

    // Recorremos cada educadora y creamos su tarjeta HTML con Tailwind
    staff.forEach(miembro => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow';
        
        tarjeta.innerHTML = `
            <div class="flex items-center gap-4 mb-4">
                <div class="h-12 w-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                    ${miembro.initials}
                </div>
                <div>
                    <h3 class="font-bold text-lg text-gray-900">${miembro.first_name} ${miembro.last_name}</h3>
                </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg text-sm">
                <div class="flex justify-between mb-1">
                    <span class="text-gray-500">Contrato:</span>
                    <span class="font-semibold text-gray-800">${miembro.contract_percentage}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Horas Semanales:</span>
                    <span class="font-semibold text-gray-800">${miembro.weekly_contract_hours}h</span>
                </div>
            </div>
        `;
        
        contenedor.appendChild(tarjeta);
    });
}

// Ejecutamos la función apenas se lea este archivo
cargarEducadoras();
