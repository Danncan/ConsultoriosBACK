import Sequelize from 'sequelize';
import dotenv from "dotenv";

// Cargar las variables de entorno
dotenv.config();

console.log("🔹 Conectando a Supabase con:");
console.log("Host:", process.env.SUPABASE_HOST);
console.log("Puerto:", process.env.SUPABASE_PORT);
console.log("Usuario:", process.env.SUPABASE_DB_USER);
console.log("Base de datos:", process.env.SUPABASE_DB_NAME);

// Configurar Sequelize con Supabase
export const sequelize = new Sequelize(
    process.env.SUPABASE_DB_NAME,
    process.env.SUPABASE_DB_USER,
    process.env.SUPABASE_DB_PASSWORD,
    {
        host: process.env.SUPABASE_HOST,
        port: process.env.SUPABASE_PORT,
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    }
);




//USO LOCAL

// HEAD
  /* export const sequelize = new Sequelize(
       'prueba', 
       'root', 
       '12345', 
       {
          host: 'localhost',
          dialect: 'mysql'
       }
   );
    */

/*
export const sequelize = new Sequelize(
'prueba', 
'root', 
'12345', 
{
host: 'localhost',
dialect: 'mysql'
}
);
*/


//TefoVirtual
// export const sequelize = new Sequelize(
//     'ConsultoriosJuricosevi', 
//     'Cliente', 
//     '2444', 
//     {
//         host: '192.168.100.104', 
//         dialect: 'mysql'
//     }
// );
//Francis

/*export const sequelize = new Sequelize(
    'consultoriosjuridicos2', 
    'fvelasco', 
    'ltic', 
    {
       host: '192.168.56.102',
       dialect: 'mysql'
    }
);*/

