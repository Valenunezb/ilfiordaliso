// horarios.js - Lógica para la vista de Horarios y Selector de Fechas

let fechaVistaActual = new Date(); // Guardamos la fecha que estamos mirando

// 1. Encontrar el Lunes de la semana que estamos viendo
function obtenerLunes(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    // Si es domingo (0), restamos 6 días. Si es otro día, restamos hasta llegar al lunes (1)
    const diferencia = d.getDate() - dia + (dia === 0 ? -6 : 1); 
    return new Date(d.setDate(diferencia));
}

// 2. Actualizar el texto superior y volver a dibujar la grilla
function actualizarCalendario() {
    const lunes = obtenerLunes(fechaVistaActual);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const opciones = { day: 'numeric', month: 'short' };
    const textoSemana = `${lunes.toLocaleDateString('es-ES', opciones)} - ${viernes.toLocaleDateString('es-ES', opciones)}`;
    
    // Cambiamos el texto del centro (ej: "30 mar - 3 abr")
    const elementoTexto = document.getElementById('texto-rango-semana');
    if (elementoTexto) {
        elementoTexto.innerText = textoSemana;
    }
    
    // Dibujamos la grilla pasándole el Lunes para que sepa qué números poner
    dibujarGrillaSemanal(lunes);
}

// 3. Funciones para los botones ◀, ▶ y "Hoy"
function cambiarSemana(direccion) {
    // direccion será -1 (atrás) o 1 (adelante)
    fechaVistaActual.setDate(fechaVistaActual.getDate() + (direccion * 7));
    actualizarCalendario();
}

function irAHoy() {
    fechaVistaActual = new Date();
    actualizarCalendario();
}

// 4. Dibujar la Grilla (Esta es la evolución de tu antigua función dibujarGrillaBase)
function dibujarGrillaSemanal(lunesDate) {
    const contenedor = document.getElementById('contenedor-calendario');
    if (!contenedor) return;

    // Mantenemos tus variables originales
    const horas = ["6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    const salas = ["Brucco", "Bozzoli", "Farfale"]; // Guardadas para la fase de filtrado por sala
    
    // Preparamos los nombres de las columnas con sus números (ej: "Lunes 30")
    const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const columnasDias = [];
    
    for(let i=0; i<5; i++) {
        const dia = new Date(lunesDate);
        dia.setDate(lunesDate.getDate() + i);
        columnasDias.push(`${nombresDias[i]} ${dia.getDate()}`);
    }

    let html = `
        <div class="min-w-[1000px]">
            <div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-indigo-50 border-b border-gray-200 text-sm font-bold text-gray-700 text-center sticky top-0 z-10">
                <div class="p-3 border-r border-gray-200 flex items-center justify-center">Hora</div>
                ${columnasDias.map(diaTexto => `<div class="p-3 border-r border-gray-200">${diaTexto}</div>`).join('')}
            </div>
    `;

    // Generamos las filas de las horas
    horas.forEach(hora => {
        html += `<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors group">`;
        html += `<div class="p-2 border-r border-gray-200 text-gray-500 text-right pr-4 font-medium flex items-center justify-end">${hora}</div>`;
        
        for(let i=0; i<5; i++) {
            // AHORA LAS CELDAS SON CLICKEABLES
            html += `
                <div class="border-r border-gray-100 p-1 relative min-h-[40px] flex gap-1 cursor-pointer hover:bg-indigo-50/50 transition-colors" onclick="clickCelda('${hora}', ${i})">
                    </div>
            `;
        }
        
        html += `</div>`;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

// 5. Preparar la interacción (Para el próximo paso)
function clickCelda(hora, indiceDia) {
    // Esto es solo para probar que los clics funcionan. Luego abriremos un menú aquí.
    console.log(`Hiciste clic a las ${hora} en el día ${indiceDia} de la semana.`);
}

// Arrancamos el sistema apenas cargue el archivo
actualizarCalendario();