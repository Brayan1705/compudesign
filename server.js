
require('dotenv').config();

const express  = require('express');
const mysql    = require('mysql2/promise');
const bcrypt   = require('bcryptjs');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));  


const pool = mysql.createPool({
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit   : 10,
    charset           : 'utf8mb4'
});


(async () => {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('✅ Conectado a la base de datos compudesign');
    } catch (err) {
        console.error('❌ Error al conectar a MySQL:', err.message);
    }
})();



app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.id_producto  AS id,
                p.titulo       AS title,
                p.descripcion  AS \`desc\`,
                p.precio       AS price,
                p.imagen_url   AS img,
                c.nombre       AS category,
                p.destacado    AS featured,
                GROUP_CONCAT(
                    CONCAT(e.nombre_spec, ': ', e.valor_spec)
                    ORDER BY e.id_especificacion
                    SEPARATOR '||'
                ) AS specs_raw
            FROM PRODUCTOS p
            JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
            LEFT JOIN ESPECIFICACIONES e ON e.id_producto = p.id_producto
            WHERE p.activo = 1
            GROUP BY p.id_producto
            ORDER BY p.destacado DESC, p.titulo
        `);

        const products = rows.map(r => ({
            ...r,
            featured: r.featured === 1,
            specs   : r.specs_raw ? r.specs_raw.split('||') : []
        }));
        delete products.forEach(p => delete p.specs_raw);

        res.json({ ok: true, data: products });
    } catch (err) {
        console.error('Error /api/productos:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
    }
});


app.get('/api/productos/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.id_producto AS id,
                p.titulo      AS title,
                p.descripcion AS \`desc\`,
                p.precio      AS price,
                p.imagen_url  AS img,
                c.nombre      AS category,
                p.destacado   AS featured
            FROM PRODUCTOS p
            JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ? AND p.activo = 1
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

        const [specs] = await pool.query(
            'SELECT nombre_spec, valor_spec FROM ESPECIFICACIONES WHERE id_producto = ?',
            [req.params.id]
        );

        const product = {
            ...rows[0],
            featured: rows[0].featured === 1,
            specs: specs.map(s => `${s.nombre_spec}: ${s.valor_spec}`)
        };

        res.json({ ok: true, data: product });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener producto' });
    }
});



app.post('/api/registro', async (req, res) => {
    const { nombre_completo, correo, contrasena, telefono } = req.body;

    // Validaciones básicas
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
        // Verificar si el correo ya existe
        const [existe] = await pool.query(
            'SELECT id_usuario FROM USUARIOS WHERE correo = ?', [correo]
        );
        if (existe.length > 0) {
            return res.status(409).json({ ok: false, mensaje: 'Este correo ya está registrado. Intenta iniciar sesión.' });
        }

        // Hash de contraseña
        const hash = await bcrypt.hash(contrasena, 10);

        // Insertar usuario
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


app.post('/api/servicios/solicitud', async (req, res) => {
    const { id_servicio, id_usuario, nombre_cliente, correo_cliente, mensaje } = req.body;

    if (!id_servicio || !nombre_cliente || !correo_cliente || !mensaje) {
        return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO SOLICITUDES_SERVICIO
             (id_servicio, id_usuario, nombre_cliente, correo_cliente, mensaje)
             VALUES (?, ?, ?, ?, ?)`,
            [id_servicio, id_usuario || null, nombre_cliente.trim(), correo_cliente.trim(), mensaje.trim()]
        );
        res.json({ ok: true, mensaje: 'Solicitud registrada exitosamente.', id: result.insertId });
    } catch (err) {
        console.error('Error /api/servicios/solicitud:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al guardar la solicitud.' });
    }
});


// ============================================================
// RUTAS — PEDIDOS
// ============================================================

app.post('/api/pedidos', async (req, res) => {
    const {
        id_usuario, items, subtotal, impuestos, total,
        envio, id_metodo_pago
    } = req.body;

    if (!id_usuario || !items || items.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Datos de pedido incompletos.' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Crear pedido
        const [pedidoRes] = await conn.query(
            `INSERT INTO PEDIDOS (id_usuario, subtotal, impuestos, total)
             VALUES (?, ?, ?, ?)`,
            [id_usuario, subtotal, impuestos, total]
        );
        const id_pedido = pedidoRes.insertId;

        // Insertar items
        for (const item of items) {
            await conn.query(
                `INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?)`,
                [id_pedido, item.id, item.quantity, item.price]
            );
        }

        // Insertar envío
        if (envio) {
            await conn.query(
                `INSERT INTO ENVIOS
                 (id_pedido, nombre_receptor, direccion, departamento, ciudad, telefono, tipo_envio, costo_envio)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_pedido, envio.nombre, envio.direccion, envio.departamento,
                 envio.ciudad, envio.telefono, envio.tipo, envio.costo]
            );
        }

        // Insertar pago
        if (id_metodo_pago) {
            await conn.query(
                `INSERT INTO PAGOS (id_pedido, id_metodo, monto, estado_pago)
                 VALUES (?, ?, ?, 'pendiente')`,
                [id_pedido, id_metodo_pago, total]
            );
        }

        await conn.commit();
        res.json({ ok: true, id_pedido, mensaje: 'Pedido creado exitosamente.' });

    } catch (err) {
        await conn.rollback();
        console.error('Error /api/pedidos:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al procesar el pedido.' });
    } finally {
        conn.release();
    }
});


// ___Iniciar servidor ____
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📦 Abre tu tienda en: http://localhost:${PORT}/index.html`);
});
