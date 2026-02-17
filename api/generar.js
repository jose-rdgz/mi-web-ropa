export const config = {
    maxDuration: 60
};

const SPACE_URL = "https://acidown-idm-vton.hf.space";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const { human_img, garm_img } = req.body;

    if (!HF_TOKEN) {
        return res.status(500).json({ error: "Token no configurado" });
    }

    try {
        // Subir las dos imágenes al Space
        const uploadPersona = await subirImagenHF(human_img, HF_TOKEN);
        const uploadPrenda = await subirImagenHF(garm_img, HF_TOKEN);

        // Llamar al modelo
        const respuesta = await fetch(`${SPACE_URL}/run/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${HF_TOKEN}`
            },
            body: JSON.stringify({
                fn_index: 0,
                data: [
                    { background: uploadPersona, layers: [], composite: null },
                    uploadPrenda,
                    "prenda de ropa",
                    true,
                    false,
                    30,
                    42
                ]
            })
        });

        if (!respuesta.ok) {
            const errorText = await respuesta.text();
            return res.status(500).json({ error: errorText });
        }

        const datos = await respuesta.json();

        // Extraer la imagen del resultado
        let imagenFinal = null;

        if (datos.data && datos.data[0]) {
            const primerDato = datos.data[0];
            if (typeof primerDato === "string") {
                imagenFinal = primerDato;
            } else if (primerDato.url) {
                imagenFinal = primerDato.url;
            } else if (primerDato.path) {
                imagenFinal = `${SPACE_URL}/file=${primerDato.path}`;
            }
        }

        if (!imagenFinal) {
            return res.status(500).json({
                error: "No se pudo extraer la imagen",
                debug: JSON.stringify(datos).substring(0, 1000)
            });
        }

        res.json({ imagen: imagenFinal });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function subirImagenHF(base64, token) {
    const buffer = Buffer.from(base64, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("files", blob, "imagen.jpg");

    const respuesta = await fetch(`${SPACE_URL}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!respuesta.ok) {
        throw new Error(`Error subiendo imagen: ${await respuesta.text()}`);
    }

    const datos = await respuesta.json();
    return datos[0];
}
