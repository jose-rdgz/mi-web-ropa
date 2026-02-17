export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const { human_img, garm_img } = req.body;

    try {
        // Primero obtenemos la URL de subida
        const uploadPersona = await subirImagenHF(human_img, HF_TOKEN);
        const uploadPrenda = await subirImagenHF(garm_img, HF_TOKEN);

        // Llamamos al Space de Gradio
        const respuesta = await fetch(
            "https://yisol-idm-vton.hf.space/run/predict",
            {
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
            }
        );

        if (!respuesta.ok) {
            const errorText = await respuesta.text();
            return res.status(500).json({ error: errorText });
        }

        const datos = await respuesta.json();
        res.json({ imagen: datos.data[0] });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function subirImagenHF(base64, token) {
    const buffer = Buffer.from(base64, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("files", blob, "imagen.jpg");

    const respuesta = await fetch("https://yisol-idm-vton.hf.space/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    const datos = await respuesta.json();
    return datos[0];
}
