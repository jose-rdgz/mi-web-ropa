export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const { human_img, garm_img } = req.body;

    try {
        const respuesta = await fetch(
            "https://api-inference.huggingface.co/models/yisol/IDM-VTON",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: {
                        human_img,
                        garm_img,
                        garment_des: "prenda de ropa"
                    }
                })
            }
        );

        if (!respuesta.ok) {
            const errorText = await respuesta.text();
            return res.status(500).json({ error: errorText });
        }

        const buffer = await respuesta.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        res.json({ imagen: `data:image/png;base64,${base64}` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}