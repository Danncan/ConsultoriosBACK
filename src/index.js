import app from "./app.js";
import { sequelize } from "./database/database.js";
import { PORT } from "./config.js";


async function main(){
   try {
      await sequelize.sync({ alter: false }); // Se asegura de que la DB esté actualizada sin perder datos
      console.log("✅ Base de datos sincronizada correctamente en Supabase");

      app.listen(PORT, () => {
         console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
       }).on('error', (err) => {
         if (err.code === 'EADDRINUSE') {
           console.error(`❌ El puerto ${PORT} ya está en uso. Cambia el puerto o cierra el proceso que lo usa.`);
         } else {
           console.error("❌ Error al iniciar el servidor:", err);
         }
       });
       

   } catch (error) {
      console.error("❌ Error al iniciar el servidor:", error);
   }
}

main();

//USO LOCAL

// async function main(){
//    try { 
//       await sequelize.sync();
//       app.listen(3000, () => {
//          console.log("Server running on port 3000")
//       })
//    } catch (error) {
//       console.error("Error starting server: ", error)
//    }
// }

// main();