export const config = {
    maxDuration: 60
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const { human_img, garm_img } = req.body;

    if (!RAPIDAPI_KEY) {
        return res.status(500).json({ error: "API key no configurada" });
    }

    try {
        // Convertir base64 a Blob para enviar como multipart/form-data
        const personaBuffer = Buffer.from(human_img, "base64");
        const prendaBuffer = Buffer.from(garm_img, "base64");

        // Crear el FormData manualmente
        const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);

        const buildPart = (name, buffer, filename) => {
            const header = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
            return Buffer.concat([Buffer.from(header), buffer, Buffer.from("\r\n")]);
        };

        const closing = Buffer.from(`--${boundary}--\r\n`);


        const body = Buffer.concat([
            buildPart("avatar_image", personaBuffer, "persona.jpg"),
            buildPart("clothing_image", prendaBuffer, "prenda.jpg"),
            closing
        ]);

        const respuesta = await fetch("https://try-on-diffusion.p.rapidapi.com/try-on-file", {
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "x-rapidapi-host": "try-on-diffusion.p.rapidapi.com",
                "x-rapidapi-key": RAPIDAPI_KEY
            },
            body: body
        });

        if (!respuesta.ok) {
            const errorText = await respuesta.text();
            return res.status(500).json({ error: errorText });
        }

        // La respuesta es directamente la imagen
        const buffer = await respuesta.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        res.json({ imagen: `data:image/jpeg;base64,${base64}` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}