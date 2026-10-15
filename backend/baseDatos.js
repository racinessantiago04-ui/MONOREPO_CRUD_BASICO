// Responsabilidad: conectarse a mysql. Por lo tanto ningun otro archivo conoce la contraseña ni el nombre de la base de datos.
import mysql from "mysql2/promise"

// un "pool" (piscina) reutiliza conexiones abiertas: se utiliza en grandes proyectos.
export const database = mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "root", // Escribir la clave del gestor MSQL
    database: process.env.DB_DATABASE ?? "tienda",
});
