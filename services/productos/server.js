require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PRODUCTS_PORT || 3001;

app.use(cors());
app.use(express.json());

// Pool de conexión exclusivo para el esquema de productos
const pool = mysql.createPool({
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'compudesign_productos',
    waitForConnections: true,
    connectionLimit   : 10,
    charset           : 'utf8mb4'
});

(async () => {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('✅ Microservicio de Productos conectado a la BD compudesign_productos');
    } catch (err) {
        console.error('❌ Error al conectar a DB productos:', err.message);
    }
})();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'productos', timestamp: new Date() });
});

// GET /api/productos — Listado completo con categorías y specs
app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.id_producto  AS id,
                p.titulo       AS title,
                p.descripcion  AS \`desc\`,
                p.precio       AS price,
                p.imagen_url   AS img,
                p.modelo_3d    AS model3d,
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
        products.forEach(p => delete p.specs_raw);

        res.json({ ok: true, data: products });
    } catch (err) {
        console.error('Error GET /api/productos:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
    }
});

// GET /api/productos/:id — Detalle de un producto individual (Consumido internamente por Pedidos)
app.get('/api/productos/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.id_producto AS id,
                p.titulo      AS title,
                p.descripcion AS \`desc\`,
                p.precio      AS price,
                p.imagen_url  AS img,
                p.modelo_3d   AS model3d,
                c.nombre      AS category,
                p.destacado   AS featured
            FROM PRODUCTOS p
            JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ? AND p.activo = 1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        }

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
        console.error('Error GET /api/productos/:id:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener producto' });
    }
});

app.listen(PORT, () => {
    console.log(`📦 Microservicio de Productos corriendo en http://localhost:${PORT}`);
});
