document.getElementById("foto-persona").addEventListener("change", function() {
    mostrarPreview(this, "preview-persona");
});

document.getElementById("foto-superior").addEventListener("change", function() {
    mostrarPreview(this, "preview-superior");
});

function mostrarPreview(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function generarImagen() {
    const persona = document.getElementById("foto-persona").files[0];
    const superior = document.getElementById("foto-superior").files[0];

    if (!persona || !superior) {
        mostrarError("Por favor sube la foto de la persona y la prenda.");
        return;
    }

    document.getElementById("cargando").classList.remove("oculto");
    document.getElementById("resultado").classList.add("oculto");
    document.getElementById("error").classList.add("oculto");
    document.getElementById("btn-generar").disabled = true;

    try {
        const personaBase64 = await imagenABase64(persona);
        const superiorBase64 = await imagenABase64(superior);

        const respuesta = await fetch("/api/generar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                human_img: personaBase64,
                garm_img: superiorBase64
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "Error al generar la imagen.");
        }

        document.getElementById("imagen-resultado").src = datos.imagen;
        document.getElementById("resultado").classList.remove("oculto");

    } catch (error) {
        mostrarError(error.message);
    } finally {
        document.getElementById("cargando").classList.add("oculto");
        document.getElementById("btn-generar").disabled = false;
    }
}

function imagenABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(archivo);
    });
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove("oculto");
}