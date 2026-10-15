// Responsabilidad: Este archivo habla con el backend. Los componentes no saben nada de fetch ni de URL.
export const URL_BACKEND = "http://localhost:3000"

async function leerRespuesta(respuesta) {
    const datos = await respuesta.json()
    if (!respuesta.ok) throw new Error(datos.error ?? "Error inesperado")
    return datos
}

export const listarArticulos = fertch (`${URL_BACKEND}/api/articulos`).then(leerRespuesta)

export const crearArticulo = datosFormulario =>
    fetch(`${URL_BACKEND}/api/articulos`, {method: "POST", body: datosFormulario}).then(leerRespuesta)

export const editarArticulo = (id, datosFormulario) =>
    fetch(`${URL_BACKEND}/api/articulos/${id}`, {method: "PUT", body: datosFormulario}).then(leerRespuesta)

export const eliminarArticulo = id =>
    fetch(`${URL_BACKEND}/api/articulos/${id}`, {method: "DELETE"}).then(leerRespuesta)