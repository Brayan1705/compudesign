require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.ORDERS_PORT || 3003;

app.use(cors());
app.use(express.json());

// Pool de conexión exclusivo para el esquema de pedidos
const pool = mysql.createPool({
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'compudesign_pedidos',
    waitForConnections: true,
    connectionLimit   : 10,
    charset           : 'utf8mb4'
});

// URL del microservicio de Productos para comunicación interna (Fase 8)
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001';

(async () => {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('✅ Microservicio de Pedidos conectado a la BD compudesign_pedidos');
    } catch (err) {
        console.error('❌ Error al conectar a DB pedidos:', err.message);
    }
})();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'pedidos', timestamp: new Date() });
});

// POST /api/pedidos — Crea pedido validando productos vía HTTP al microservicio de Productos (Fases 8 y 10)
app.post('/api/pedidos', async (req, res) => {
    const {
        id_usuario, items, subtotal, impuestos, total,
        envio, id_metodo_pago
    } = req.body;

    if (!id_usuario || !items || items.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Datos de pedido incompletos.' });
    }

    // --- FASE 8 & 10: COMUNICACIÓN ENTRE MICROSERVICIOS CON TIMEOUT Y MANEJO DE FALLO ---
    const verifiedItems = [];
    for (const item of items) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos (Fase 10)

            const response = await fetch(`${PRODUCTS_SERVICE_URL}/api/productos/${item.id}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `El producto con ID ${item.id} no está disponible o no existe en el catálogo.`
                });
            }

            const json = await response.json();
            verifiedItems.push({
                id: item.id,
                quantity: item.quantity,
                price: json.data.price
            });

        } catch (err) {
            console.error('❌ Error de comunicación con microservicio de Productos:', err.message);
            // Simulación de fallo controlado (Fase 10)
            return res.status(503).json({
                ok: false,
                error: 'SERVICIO_NO_DISPONIBLE',
                mensaje: 'El servicio de Catálogo de Productos no responde en este momento (Timeout o caída del servicio). Intente más tarde.',
                detalleTecnico: err.message
            });
        }
    }
    // ---------------------------------------------------------------------------------

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

        // Insertar items verificados
        for (const item of verifiedItems) {
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
        res.json({ ok: true, id_pedido, mensaje: 'Pedido creado exitosamente mediante comunicación inter-servicios.' });

    } catch (err) {
        await conn.rollback();
        console.error('Error /api/pedidos DB:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al procesar el pedido en la base de datos.' });
    } finally {
        conn.release();
    }
});

app.listen(PORT, () => {
    console.log(`🛒 Microservicio de Pedidos corriendo en http://localhost:${PORT}`);
});
