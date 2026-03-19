// horarios.js - Lógica exclusiva para la vista de Horarios y Ratios

function dibujarGrillaBase() {
    const contenedor = document.getElementById('contenedor-calendario');
    if (!contenedor) return;

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const horas = ["6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
    const salas = ["Brucco", "Bozzoli", "Farfale"]; // Las salas principales de tu excel

    // Construimos el HTML de la tabla
    let html = `
        <div class="min-w-[1000px]"> <div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-indigo-50 border-b border-gray-200 text-sm font-bold text-gray-700 text-center">
                <div class="p-3 border-r border-gray-200 flex items-center justify-center">Hora</div>
                ${dias.map(dia => `<div class="p-3 border-r border-gray-200">${dia}</div>`).join('')}
            </div>
    `;

    // Generamos las filas de las horas
    horas.forEach(hora => {
        html += `<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-100 text-xs hover:bg-gray-50 transition-colors">`;
        
        // Columna de la hora
        html += `<div class="p-2 border-r border-gray-200 text-gray-500 text-right pr-4 font-medium flex items-center justify-end">${hora}</div>`;
        
        // Columnas de los 5 días vacías (por ahora)
        for(let i=0; i<5; i++) {
            html += `
                <div class="border-r border-gray-100 p-1 relative min-h-[40px] flex gap-1">
                    </div>
            `;
        }
        
        html += `</div>`;
    });

    html += `</div>`; // Cierre del min-w
    contenedor.innerHTML = html;
}

// Dibujamos la grilla apenas cargue este archivo
dibujarGrillaBase();