// --- LÓGICA DE LA SPA (NAVEGACIÓN) ---

function cambiarVista(idVistaDestino) {
    // 1. Seleccionamos todas las secciones que son "vistas"
    const vistas = ['vista-educadoras', 'vista-ninos', 'vista-horarios'];
    
    // 2. Recorremos cada vista
    vistas.forEach(id => {
        const elemento = document.getElementById(id);
        if (id === idVistaDestino) {
            // Si es la vista que queremos ver, le quitamos el 'hidden'
            elemento.classList.remove('hidden');
        } else {
            // Si no es, la ocultamos agregando 'hidden'
            elemento.classList.add('hidden');
        }
    });

    // Opcional: Aquí podríamos hacer que los botones del menú cambien de color 
    // para saber en qué sección estamos, pero lo mantendremos simple por ahora.
}

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

// --- LÓGICA DE NIÑOS ---

function calcularSala() {
    const inputFecha = document.getElementById('nino-nacimiento').value;
    const divAlerta = document.getElementById('alerta-sala');
    
    if (!inputFecha) {
        divAlerta.classList.add('hidden');
        return;
    }

    // Calculamos la edad en meses
    const fechaNacimiento = new Date(inputFecha);
    const hoy = new Date();
    
    let mesesEdad = (hoy.getFullYear() - fechaNacimiento.getFullYear()) * 12;
    mesesEdad -= fechaNacimiento.getMonth();
    mesesEdad += hoy.getMonth();

    // Determinamos la sala según la regla (puedes ajustar estos meses)
    let salaSugerida = "";
    if (mesesEdad >= 3 && mesesEdad <= 12) {
        salaSugerida = "Brucco (3m - 1a)";
    } else if (mesesEdad > 12 && mesesEdad <= 24) {
        salaSugerida = "Bozzoli (1a - 2a)";
    } else if (mesesEdad > 24 && mesesEdad <= 36) {
        salaSugerida = "Farfalle (2a - 3a)";
    } else if (mesesEdad > 36) {
        salaSugerida = "Centro (Mayores)";
    } else {
        salaSugerida = "Edad muy temprana";
    }

    // Mostramos la sugerencia en pantalla
    divAlerta.innerHTML = `🍼 Según su edad (${mesesEdad} meses), el sistema sugiere la sala: <strong>${salaSugerida}</strong>`;
    divAlerta.classList.remove('hidden');
}

// --- LÓGICA PARA GUARDAR NIÑOS EN SUPABASE ---

async function guardarNino(event) {
    // 1. Evitamos que la página se recargue al hacer clic
    event.preventDefault(); 

    // 2. Buscamos los valores que la directora escribió
    // (Asegúrate de que estos IDs sean los mismos que tienes en tu HTML)
    const inputNombre = document.getElementById('nino-nombre').value;
    const inputApellido = document.getElementById('nino-apellido').value;
    const inputFechaNac = document.getElementById('nino-nacimiento').value;

    // Si falta algo, le avisamos
    if (!inputNombre || !inputApellido || !inputFechaNac) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    // Cambiamos el texto del botón para que sepa que está cargando
    const botonGuardar = document.getElementById('btn-guardar-nino');
    const textoOriginal = botonGuardar.innerText;
    botonGuardar.innerText = "Guardando...";
    botonGuardar.disabled = true;

    // 3. Enviamos los datos a Supabase adaptado a tu tabla en inglés
    const { data, error } = await supabaseClient
        .from('children') // Tu tabla real
        .insert([
            { 
                first_name: inputNombre,     // Tu columna de nombre
                last_name: inputApellido,    // Tu columna de apellido
                birth_date: inputFechaNac    // Tu columna de fecha
            }
        ]);

    // Devolvemos el botón a la normalidad
    botonGuardar.innerText = textoOriginal;
    botonGuardar.disabled = false;

    // 4. Revisamos si hubo un error
    if (error) {
        console.error("Error al guardar en Supabase:", error);
        alert("Hubo un problema al guardar el niño. Revisa la consola.");
        return;
    }

    // 5. ¡Éxito! Limpiamos el formulario
    alert("¡Alumno registrado con éxito! 🧸");
    document.getElementById('nino-nombre').value = '';
    document.getElementById('nino-apellido').value = '';
    document.getElementById('nino-nacimiento').value = '';
    document.getElementById('alerta-sala').classList.add('hidden'); // Ocultamos la sugerencia de sala

    cargarSalas();

}


// --- LÓGICA DE LISTADO DE NIÑOS Y SALAS ---

let listaGlobalNinos = []; // Guardamos la lista aquí para poder ordenarla
let ordenActual = { columna: null, ascendente: true };

// 1. Descargar y preparar los datos
async function cargarSalas() {
    const { data: children, error } = await supabaseClient.from('children').select('*');
    
    if (error) {
        console.error("Error cargando niños:", error);
        return;
    }
    
    // Calculamos la edad y la sala de cada niño
    listaGlobalNinos = children.map(nino => {
        const nacimiento = new Date(nino.birth_date);
        const hoy = new Date();
        let meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 - nacimiento.getMonth() + hoy.getMonth();
        
        let sala = "Sin Asignar";
        if (meses >= 3 && meses <= 12) sala = "Brucco";
        else if (meses > 12 && meses <= 24) sala = "Bozzoli";
        else if (meses > 24 && meses <= 36) sala = "Farfalle";
        else if (meses > 36) sala = "Centro";

        return { ...nino, edadMeses: meses, salaActual: sala };
    });

    dibujarSalas();
}

// 2. Función para ordenar al hacer clic en las columnas
function ordenarNinos(columna) {
    if (ordenActual.columna === columna) {
        ordenActual.ascendente = !ordenActual.ascendente; // Cambia de A-Z a Z-A
    } else {
        ordenActual.columna = columna;
        ordenActual.ascendente = true;
    }

    listaGlobalNinos.sort((a, b) => {
        let valA = a[columna];
        let valB = b[columna];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return ordenActual.ascendente ? -1 : 1;
        if (valA > valB) return ordenActual.ascendente ? 1 : -1;
        return 0;
    });

    dibujarSalas();
}

// 3. Dibujar las burbujas (acordeones) y las tablas
function dibujarSalas() {
    const contenedor = document.getElementById('contenedor-salas');
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiamos antes de dibujar

    const nombresSalas = ["Brucco", "Bozzoli", "Farfalle", "Centro", "Sin Asignar"];
    
    nombresSalas.forEach(nombreSala => {
        const ninosEnSala = listaGlobalNinos.filter(n => n.salaActual === nombreSala);
        
        // Si no hay niños en esta sala, no dibujamos la burbuja
        if (ninosEnSala.length === 0) return; 

        const detalles = document.createElement('details');
        // 'details' y 'summary' de HTML crean un acordeón nativo sin necesidad de librerías
        detalles.className = "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 group outline-none";
        
        detalles.innerHTML = `
            <summary class="font-bold text-lg text-indigo-900 cursor-pointer list-none flex justify-between items-center outline-none">
                <span>🏠 Sala ${nombreSala} <span class="text-sm text-gray-500 font-normal ml-2">(${ninosEnSala.length} niños)</span></span>
                <span class="text-indigo-400 group-open:rotate-180 transition-transform duration-300">▼</span>
            </summary>
            
            <div class="mt-6 overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-indigo-50/50 text-indigo-800 text-sm border-b border-indigo-100">
                            <th class="p-3 cursor-pointer hover:bg-indigo-100 rounded-tl-lg transition-colors" onclick="ordenarNinos('first_name')">Nombre ↕</th>
                            <th class="p-3 cursor-pointer hover:bg-indigo-100 transition-colors" onclick="ordenarNinos('last_name')">Apellido ↕</th>
                            <th class="p-3 cursor-pointer hover:bg-indigo-100 transition-colors" onclick="ordenarNinos('edadMeses')">Edad (meses) ↕</th>
                            <th class="p-3 rounded-tr-lg">Modificar Sala</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ninosEnSala.map(n => `
                            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td class="p-3 font-medium text-gray-800">${n.first_name}</td>
                                <td class="p-3 text-gray-600">${n.last_name}</td>
                                <td class="p-3 text-gray-600">${n.edadMeses}</td>
                                <td class="p-3">
                                    <select class="border border-gray-200 rounded-lg p-1.5 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white cursor-pointer">
                                        <option value="Brucco" ${n.salaActual === 'Brucco' ? 'selected' : ''}>Brucco</option>
                                        <option value="Bozzoli" ${n.salaActual === 'Bozzoli' ? 'selected' : ''}>Bozzoli</option>
                                        <option value="Farfalle" ${n.salaActual === 'Farfalle' ? 'selected' : ''}>Farfalle</option>
                                        <option value="Centro" ${n.salaActual === 'Centro' ? 'selected' : ''}>Centro</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        contenedor.appendChild(detalles);
    });
}

// Ejecutamos la carga apenas se lea el archivo
cargarSalas();