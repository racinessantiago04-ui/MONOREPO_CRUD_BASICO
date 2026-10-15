// Responsablidad: Se tienen las rutas del CRUD de articulos (recibe la peticion) -> Viaje a SQL -> Responde)
import { Router } from "express"
import {baseDatos} from "./baseDatos.js"
import {subirImagen, borrarImagen} from "./subirImagen.js"

const rutas = Router()

// si una funcion falla, responde con error 500 en vez de dejar la peticion colgada. (async/await)
const conManejoDeErrores = funcion => (peticion, respuesta) => funcion(peticion, respuesta).catch(error => {
    console.error(error)
    respuesta.status(500).json({error: "Error en el servidor: " + error.message})
})

// Convierte lo que llega del formulario (todo llega como texto) en numeros y los valida
function leerCampos(cuerpo){
    const articulo = {
        nombre: (cuerpo.nombre ?? "").trim(),
        descripcion: (cuerpo.descripcion ?? "").trim(),
        precio_compra: Number(cuerpo.precio_compra),
        precio_venta: Number(cuerpo.precio_venta),
        stock_minimo: Number(cuerpo.stock_minimo),
        stock_maximo: Number(cuerpo.stock_maximo),
    }
    let mesanjeError = null
    if (!articulo.nombre) mesanjeError = "El nombre es obligatorio"
    else if (!(articulo.precio_compra >=0) || !(articulo.precio_venta >=0)) mesanjeError = "El precio debe ser un numero positivo"
    else if (!(articulo.stock_minimo >=0) || !(articulo.stock_maximo >=0)) mesanjeError = "El stock debe ser un numero positivo"
    else if (articulo.stock_minimo > articulo.stock_maximo) mesanjeError = "El stock minimo no puede ser mayor que el stock maximo"
    return {articulo, mesanjeError}
}

// Listar todos los articulos
rutas.get("/", conManejoDeErrores(async (peticion, respuesta) => {
    const [filas] = await baseDatos.query("SELECT * FROM articulos ORDER BY id DESC")
    respuesta.json(filas)
}))

// Listar UNO por su ID (Read ID)
rutas.get("/:id", conManejoDeErrores(async (peticion, respuesta) => {
    const [filas] = await baseDatos.query("SELECT * FROM articulos WHERE id = ?", [peticion.params.id])
    if (!filas.length) return respuesta.status(404).json({error: "Articulo no encontrado"})
    respuesta.json(filas[0])
}))

// Crear (Create) El formulario llega como multipart: los textos en petecion body y el archivo en peticion.file
rutas.post("/", subirImagen.single("imagen"), conManejoDeErrores(async (peticion, respuesta) => {
    const {articulo, mesanjeError} = leerCampos(peticion.body)
    if (mesanjeError) {
        if (peticion.file) borrarImagen("uploads/" + peticion.file.filename) // Borra la imagen si hay error en los campos
        return respuesta.status(400).json({error: mesanjeError})
    }
    const imagen = peticion.file ? "/uploads/" + peticion.file.filename : null
    const [resultado] = await baseDatos.query(
    `INSERT INTO articulos (nombre, descripcion, precio_compra, precio_venta, stock_minimo, stock_maximo, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [articulo.nombre, articulo.descripcion, articulo.precio_compra, articulo.precio_venta, articulo.stock_minimo, articulo.stock_maximo, imagen],
    )
    respuesta.status(201).json({id: resultado.insertId, ...articulo, imagen})
}))

// Editar (update) si no se envia una imagen nueva, se conserva la anteriror.
rutas.put("/:id", subirImagen.single("imagen"), conManejoDeErrores(async (peticion, respuesta) => {
    const imagenNueva = peticion.file ? "/uploads/" + peticion.file.filename : null
    const [filas] = await baseDatos.query("SELECT * FROM articulos WHERE id = ?", [peticion.params.id])
    if (!filas.length) {
        borrarImagen(imagenNueva) // Borra la imagen si el articulo no existe
        return respuesta.status(404).json({error: "Articulo no encontrado"})
    }
    const {articulo, mesanjeError} = leerCampos(peticion.body)
    if (mesanjeError) {
        borrarImagen(imagenNueva) // Borra la imagen si hay error en los campos
        return respuesta.status(400).json({error: mesanjeError})
    }
    const imagen = imagenNueva ?? filas[0].imagen // Si no hay imagen nueva, se conserva la anterior
    await baseDatos.query(
        `UPDATE articulos SET nombre = ?, descripcion = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?, stock_maximo = ?, imagen = ? WHERE id = ?,`
        [articulo.nombre, articulo.descripcion, articulo.precio_compra, articulo.precio_venta, articulo.stock_minimo, articulo.stock_maximo, imagen, peticion.params.id],
    )
    if (imagenNueva) borrarImagen(filas[0].imagen) // Borra la imagen anterior si hay una nueva
    respuesta.json({id: peticion.params.id, ...articulo, imagen})
}))

// Eliminar (Delete) Este metodo tambien borra la foto del disco
rutas.delete("/:id", conManejoDeErrores(async (peticion, respuesta) => {
    const [filas] = await baseDatos.query("SELECT imagen FROM articulos WHERE id = ?", [peticion.params.id])
    if (!filas.length) return respuesta.status(404).json({error: "Articulo no encontrado"})
    await baseDatos.query("DELETE FROM articulos WHERE id = ?", [peticion.params.id])
    borrarImagen(filas[0].imagen) // Borra la imagen del disco
    respuesta.json({mensaje: "Articulo eliminado"})
}))

export default rutas