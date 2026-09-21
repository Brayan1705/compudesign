require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.SUPPORT_PORT || 3004;

app.use(cors());
app.use(express.json());

// Pool de conexión exclusivo para el esquema de soporte
const pool = mysql.createPool({
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'compudesign_soporte',
    waitForConnections: true,
    connectionLimit   : 10,
    charset           : 'utf8mb4'
});

(async () => {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('✅ Microservicio de Soporte conectado a la BD compudesign_soporte');
    } catch (err) {
        console.error('❌ Error al conectar a DB soporte:', err.message);
    }
})();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'soporte', timestamp: new Date() });
});

// POST /api/servicios/solicitud — Registro de solicitudes de soporte técnico
app.post('/api/servicios/solicitud', async (req, res) => {
    const { id_servicio, id_usuario, nombre_cliente, correo_cliente, mensaje } = req.body;

    if (!id_servicio || !nombre_cliente || !correo_cliente || !mensaje) {
        return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios para la solicitud.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO SOLICITUDES_SERVICIO
             (id_servicio, id_usuario, nombre_cliente, correo_cliente, mensaje)
             VALUES (?, ?, ?, ?, ?)`,
            [id_servicio, id_usuario || null, nombre_cliente.trim(), correo_cliente.trim(), mensaje.trim()]
        );
        res.json({ ok: true, mensaje: 'Solicitud de soporte registrada exitosamente.', id: result.insertId });
    } catch (err) {
        console.error('Error /api/servicios/solicitud:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al guardar la solicitud de soporte.' });
    }
});

app.listen(PORT, () => {
    console.log(`🛠️ Microservicio de Soporte corriendo en http://localhost:${PORT}`);
});
