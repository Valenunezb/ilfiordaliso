import { useState } from 'react';
import { supabase } from './ruta/a/tu/supabaseClient'; // Ajusta esta ruta

export default function GestionNinos() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [salaSugerida, setSalaSugerida] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Función que se ejecuta cada vez que cambia la fecha en el calendario
  const manejarCambioFecha = (e) => {
    const fecha = e.target.value;
    setFechaNac(fecha);

    if (fecha) {
      const hoy = new Date();
      const nacimiento = new Date(fecha);
      // Calculamos la diferencia en meses
      const mesesDeEdad = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());

      // Lógica de sugerencia inteligente (Ajusta los meses según necesites)
      if (mesesDeEdad < 18) {
        setSalaSugerida('Bebés (0-18 meses)');
      } else if (mesesDeEdad < 36) {
        setSalaSugerida('Medianos (18-36 meses)');
      } else {
        setSalaSugerida('Grandes (+36 meses)');
      }
    } else {
      setSalaSugerida('');
    }
  };

  // Función para guardar en Supabase al hacer clic en el botón
  const guardarNino = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setGuardando(true);

    try {
      const { data, error } = await supabase
        .from('ninos') // Asegúrate de que tu tabla en Supabase se llame así
        .insert([
          { 
            nombre: nombre, 
            apellido: apellido, 
            fecha_nacimiento: fechaNac,
            sala_asignada: salaSugerida // Opcional: si quieres guardar la sugerencia de una vez
          }
        ]);

      if (error) throw error;

      alert('¡Alumno registrado con éxito! 🧸');
      
      // Limpiamos el formulario
      setNombre('');
      setApellido('');
      setFechaNac('');
      setSalaSugerida('');

    } catch (error) {
      console.error('Error al guardar:', error.message);
      alert('Hubo un error al guardar el alumno.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Gestión de Niños 🧸</h2>
      <p className="text-gray-500 mb-6">Ingreso y sugerencia inteligente de salas.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-4">Registrar Nuevo Alumno</h3>
        
        <form onSubmit={guardarNino} className="flex flex-col md:flex-row gap-4 items-end">
          
          <div className="flex-1">
            <label className="block text-sm text-gray-500 mb-1">Nombre</label>
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-500 mb-1">Apellido</label>
            <input 
              type="text" 
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-500 mb-1">Fecha de Nac.</label>
            <input 
              type="date" 
              required
              value={fechaNac}
              onChange={manejarCambioFecha}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={guardando}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {guardando ? 'Guardando...' : 'Guardar Niño'}
          </button>
        </form>

        {/* Muestra la sugerencia inteligente si hay una fecha */}
        {salaSugerida && (
          <div className="mt-4 p-3 bg-indigo-50 text-indigo-800 rounded-md text-sm">
            💡 <strong>Sugerencia inteligente:</strong> Por su edad, este niño debería ir a la sala de <strong>{salaSugerida}</strong>.
          </div>
        )}
      </div>
    </div>
  );
}