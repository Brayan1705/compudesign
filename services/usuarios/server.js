require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.USERS_PORT || 3002;

app.use(cors());
app.use(express.json());

// Pool de conexión exclusivo para el esquema de usuarios
const pool = mysql.createPool({
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'compudesign_usuarios',
    waitForConnections: true,
    connectionLimit   : 10,
    charset           : 'utf8mb4'
});

(async () => {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('✅ Microservicio de Usuarios conectado a la BD compudesign_usuarios');
    } catch (err) {
        console.error('❌ Error al conectar a DB usuarios:', err.message);
    }
})();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'usuarios', timestamp: new Date() });
});

// POST /api/registro
app.post('/api/registro', async (req, res) => {
    const { nombre_completo, correo, contrasena, telefono } = req.body;

    if (!nombre_completo || !correo || !contrasena) {
        return res.status(400).json({ ok: false, mensaje: 'Nombre, correo y contraseña son obligatorios.' });
    }
    if (contrasena.length < 8) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    if (!/\S+@\S+\.\S+/.test(correo)) {
        return res.status(400).json({ ok: false, mensaje: 'El correo no tiene un formato válido.' });
    }

    try {
        const [existe] = await pool.query(
            'SELECT id_usuario FROM USUARIOS WHERE correo = ?', [correo]
        );
        if (existe.length > 0) {
            return res.status(409).json({ ok: false, mensaje: 'Este correo ya está registrado. Intenta iniciar sesión.' });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        const [result] = await pool.query(
            `INSERT INTO USUARIOS (nombre_completo, correo, contrasena_hash, telefono)
             VALUES (?, ?, ?, ?)`,
            [nombre_completo.trim(), correo.toLowerCase().trim(), hash, telefono || null]
        );

        const usuario = {
            id_usuario     : result.insertId,
            nombre_completo: nombre_completo.trim(),
            correo         : correo.toLowerCase().trim()
        };

        res.status(201).json({
            ok     : true,
            mensaje: '¡Cuenta creada exitosamente! Bienvenido/a a CompuDesign.',
            usuario
        });

    } catch (err) {
        console.error('Error /api/registro:', err);
        res.status(500).json({ ok: false, mensaje: 'Error interno. Intenta de nuevo más tarde.' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ ok: false, mensaje: 'Correo y contraseña son obligatorios.' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre_completo, correo, contrasena_hash, activo
             FROM USUARIOS WHERE correo = ?`,
            [correo.toLowerCase().trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos.' });
        }

        const user = rows[0];

        if (!user.activo) {
            return res.status(403).json({ ok: false, mensaje: 'Tu cuenta ha sido desactivada. Contacta soporte.' });
        }

        const match = await bcrypt.compare(contrasena, user.contrasena_hash);
        if (!match) {
            return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos.' });
        }

        const usuario = {
            id_usuario     : user.id_usuario,
            nombre_completo: user.nombre_completo,
            correo         : user.correo
        };

        res.json({
            ok     : true,
            mensaje: `¡Bienvenido/a de nuevo, ${user.nombre_completo.split(' ')[0]}!`,
            usuario
        });

    } catch (err) {
        console.error('Error /api/login:', err);
        res.status(500).json({ ok: false, mensaje: 'Error interno. Intenta de nuevo más tarde.' });
    }
});

// GET /api/usuarios/:id (Consulta interna)
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id_usuario AS id, nombre_completo, correo, telefono, activo FROM USUARIOS WHERE id_usuario = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
        }
        res.json({ ok: true, data: rows[0] });
    } catch (err) {
        console.error('Error GET /api/usuarios/:id:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener usuario' });
    }
});

app.listen(PORT, () => {
    console.log(`👤 Microservicio de Usuarios corriendo en http://localhost:${PORT}`);
});
