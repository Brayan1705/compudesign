-- ============================================================
--  COMPUDESIGN — Script completo de base de datos MySQL
--  Tienda Virtual de Computadoras ASUS
--  Versión: 1.0  |  2026
-- ============================================================

-- 1. CREAR Y SELECCIONAR LA BASE DE DATOS
-- ------------------------------------------------------------
DROP DATABASE IF EXISTS compudesign;
CREATE DATABASE compudesign
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE compudesign;


-- ============================================================
-- 2. TABLAS
-- ============================================================

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE CATEGORIAS (
    id_categoria  INT           NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(50)   NOT NULL,
    descripcion   TEXT,
    CONSTRAINT pk_categorias PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

-- ------------------------------------------------------------
-- USUARIOS
-- ------------------------------------------------------------
CREATE TABLE USUARIOS (
    id_usuario      INT           NOT NULL AUTO_INCREMENT,
    nombre_completo VARCHAR(100)  NOT NULL,
    correo          VARCHAR(150)  NOT NULL,
    contrasena_hash VARCHAR(255)  NOT NULL,
    telefono        VARCHAR(20),
    fecha_registro  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo          TINYINT(1)    NOT NULL DEFAULT 1,
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo)
);

-- ------------------------------------------------------------
-- PRODUCTOS
-- ------------------------------------------------------------
CREATE TABLE PRODUCTOS (
    id_producto  INT            NOT NULL AUTO_INCREMENT,
    id_categoria INT            NOT NULL,
    titulo       VARCHAR(150)   NOT NULL,
    descripcion  TEXT,
    precio       DECIMAL(12,2)  NOT NULL,
    imagen_url   VARCHAR(255),
    destacado    TINYINT(1)     NOT NULL DEFAULT 0,
    activo       TINYINT(1)     NOT NULL DEFAULT 1,
    CONSTRAINT pk_productos PRIMARY KEY (id_producto),
    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- ESPECIFICACIONES
-- ------------------------------------------------------------
CREATE TABLE ESPECIFICACIONES (
    id_especificacion INT          NOT NULL AUTO_INCREMENT,
    id_producto       INT          NOT NULL,
    nombre_spec       VARCHAR(100) NOT NULL,
    valor_spec        VARCHAR(200) NOT NULL,
    CONSTRAINT pk_especificaciones PRIMARY KEY (id_especificacion),
    CONSTRAINT fk_especificaciones_producto
        FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- METODOS_PAGO
-- ------------------------------------------------------------
CREATE TABLE METODOS_PAGO (
    id_metodo INT          NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(50)  NOT NULL,
    activo    TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT pk_metodos_pago PRIMARY KEY (id_metodo),
    CONSTRAINT uq_metodos_pago_nombre UNIQUE (nombre)
);

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
CREATE TABLE PEDIDOS (
    id_pedido    INT            NOT NULL AUTO_INCREMENT,
    id_usuario   INT            NOT NULL,
    fecha_pedido DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal     DECIMAL(12,2)  NOT NULL,
    impuestos    DECIMAL(12,2)  NOT NULL,
    total        DECIMAL(12,2)  NOT NULL,
    estado       VARCHAR(30)    NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_pedidos PRIMARY KEY (id_pedido),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pedidos_estado
        CHECK (estado IN ('pendiente','procesando','enviado','entregado','cancelado'))
);

-- ------------------------------------------------------------
-- DETALLE_PEDIDO
-- ------------------------------------------------------------
CREATE TABLE DETALLE_PEDIDO (
    id_detalle      INT            NOT NULL AUTO_INCREMENT,
    id_pedido       INT            NOT NULL,
    id_producto     INT            NOT NULL,
    cantidad        INT            NOT NULL,
    precio_unitario DECIMAL(12,2)  NOT NULL,
    CONSTRAINT pk_detalle_pedido PRIMARY KEY (id_detalle),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
);

-- ------------------------------------------------------------
-- ENVIOS
-- ------------------------------------------------------------
CREATE TABLE ENVIOS (
    id_envio        INT            NOT NULL AUTO_INCREMENT,
    id_pedido       INT            NOT NULL,
    nombre_receptor VARCHAR(100)   NOT NULL,
    direccion       VARCHAR(255)   NOT NULL,
    departamento    VARCHAR(100)   NOT NULL,
    ciudad          VARCHAR(100)   NOT NULL,
    telefono        VARCHAR(20)    NOT NULL,
    tipo_envio      VARCHAR(20)    NOT NULL DEFAULT 'estandar',
    costo_envio     DECIMAL(10,2)  NOT NULL,
    fecha_estimada  DATE,
    CONSTRAINT pk_envios PRIMARY KEY (id_envio),
    CONSTRAINT uq_envios_pedido UNIQUE (id_pedido),
    CONSTRAINT fk_envios_pedido
        FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_envios_tipo
        CHECK (tipo_envio IN ('estandar','express'))
);

-- ------------------------------------------------------------
-- PAGOS
-- ------------------------------------------------------------
CREATE TABLE PAGOS (
    id_pago     INT            NOT NULL AUTO_INCREMENT,
    id_pedido   INT            NOT NULL,
    id_metodo   INT            NOT NULL,
    monto       DECIMAL(12,2)  NOT NULL,
    fecha_pago  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_pago VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    referencia  VARCHAR(100),
    CONSTRAINT pk_pagos PRIMARY KEY (id_pago),
    CONSTRAINT uq_pagos_pedido UNIQUE (id_pedido),
    CONSTRAINT fk_pagos_pedido
        FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pagos_metodo
        FOREIGN KEY (id_metodo) REFERENCES METODOS_PAGO(id_metodo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pagos_estado
        CHECK (estado_pago IN ('pendiente','aprobado','rechazado'))
);

-- ------------------------------------------------------------
-- SERVICIOS
-- ------------------------------------------------------------
CREATE TABLE SERVICIOS (
    id_servicio INT          NOT NULL AUTO_INCREMENT,
    tipo        VARCHAR(50)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    disponible  TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT pk_servicios PRIMARY KEY (id_servicio),
    CONSTRAINT chk_servicios_tipo
        CHECK (tipo IN ('soporte','asesoria'))
);

-- ------------------------------------------------------------
-- SOLICITUDES_SERVICIO
-- ------------------------------------------------------------
CREATE TABLE SOLICITUDES_SERVICIO (
    id_solicitud    INT          NOT NULL AUTO_INCREMENT,
    id_servicio     INT          NOT NULL,
    id_usuario      INT,
    nombre_cliente  VARCHAR(100) NOT NULL,
    correo_cliente  VARCHAR(150) NOT NULL,
    mensaje         TEXT         NOT NULL,
    fecha_solicitud DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_solicitudes PRIMARY KEY (id_solicitud),
    CONSTRAINT fk_solicitudes_servicio
        FOREIGN KEY (id_servicio) REFERENCES SERVICIOS(id_servicio)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_solicitudes_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_solicitudes_estado
        CHECK (estado IN ('pendiente','en_proceso','resuelto'))
);


-- ============================================================
-- 3. ÍNDICES
-- ============================================================

-- USUARIOS
CREATE INDEX idx_usuarios_activo        ON USUARIOS(activo);

-- PRODUCTOS
CREATE INDEX idx_productos_categoria    ON PRODUCTOS(id_categoria);
CREATE INDEX idx_productos_precio       ON PRODUCTOS(precio);
CREATE INDEX idx_productos_destacado    ON PRODUCTOS(destacado);
CREATE INDEX idx_productos_activo       ON PRODUCTOS(activo);

-- ESPECIFICACIONES
CREATE INDEX idx_specs_producto         ON ESPECIFICACIONES(id_producto);

-- PEDIDOS
CREATE INDEX idx_pedidos_usuario        ON PEDIDOS(id_usuario);
CREATE INDEX idx_pedidos_estado         ON PEDIDOS(estado);
CREATE INDEX idx_pedidos_fecha          ON PEDIDOS(fecha_pedido);

-- DETALLE_PEDIDO
CREATE INDEX idx_detalle_pedido         ON DETALLE_PEDIDO(id_pedido);
CREATE INDEX idx_detalle_producto       ON DETALLE_PEDIDO(id_producto);

-- PAGOS
CREATE INDEX idx_pagos_estado           ON PAGOS(estado_pago);

-- SOLICITUDES_SERVICIO
CREATE INDEX idx_solicitudes_servicio   ON SOLICITUDES_SERVICIO(id_servicio);
CREATE INDEX idx_solicitudes_estado     ON SOLICITUDES_SERVICIO(estado);
CREATE INDEX idx_solicitudes_usuario    ON SOLICITUDES_SERVICIO(id_usuario);


-- ============================================================
-- 4. DATOS INICIALES (INSERT)
-- ============================================================

-- Categorías
INSERT INTO CATEGORIAS (nombre, descripcion) VALUES
('laptops',   'Portátiles ASUS para trabajo, diseño y gaming'),
('desktops',  'Computadores de escritorio ASUS de alto rendimiento'),
('monitores', 'Monitores ASUS ProArt, ROG y serie estándar');

-- Métodos de pago
INSERT INTO METODOS_PAGO (nombre) VALUES
('Nequi'),
('Daviplata'),
('Tarjeta débito/crédito'),
('Contraentrega');

-- Servicios
INSERT INTO SERVICIOS (tipo, nombre, descripcion) VALUES
('soporte',  'Soporte Técnico',  'Diagnóstico y solución de fallas en línea. Optimización, instalación de software y asesoría especializada para tus equipos ASUS.'),
('asesoria', 'Asesoría Virtual', 'Consultoría personalizada en línea con un experto. Te ayudamos a elegir el equipo ideal y resolver tus dudas tecnológicas.');

-- Productos
INSERT INTO PRODUCTOS (id_categoria, titulo, descripcion, precio, imagen_url, destacado) VALUES
(2, 'ASUS ROG Gaming Desktop',  'Intel Core i7 - 16GB - RTX 3060 - 1TB',       6999000, './assets/img/rog-gaming-desktop.png',  1),
(1, 'ASUS ROG Gaming Laptop',   'Intel Core i7 - 16GB - RTX 3050 - 512GB',     5499000, './assets/img/rog-gaming-laptop.png',   1),
(2, 'MSI Aegis RS Desktop',     'Intel i7 - 32GB - RTX 3080 - 2TB SSD',        8999000, './assets/img/msi-aegis-desktop.png',   1),
(3, 'ASUS ProArt Monitor 4K',   '27 pulgadas, OLED, Pantone Validated',         4299000, './assets/img/proart-monitor-4k.png',   1),
(1, 'ASUS ExpertBook Laptop',   'Uso de oficina, equilibrado y confiable',      3499000, './assets/img/expertbook-laptop.png',   0),
(2, 'ASUS TUF Desktop',         'Rendimiento gaming de entrada',                4799000, './assets/img/tuf-desktop.png',         0),
(1, 'ASUS VivoBook Laptop',     'AMD Ryzen 5 - 8GB - 256GB SSD',               2299000, './assets/img/vivobook-laptop.png',     0),
(3, 'ASUS ROG Swift Monitor',   '24 pulgadas, 165Hz, 1ms, FHD',                1899000, './assets/img/rog-swift-monitor.png',   0),
(1, 'ASUS Zenbook 14 Laptop',   'Intel Core i5 - 16GB - 512GB SSD',            3299000, './assets/img/zenbook-14-laptop.png',   0),
(2, 'ASUS ProArt Desktop',      'Intel Xeon - 64GB - RTX A4000 - 4TB',         8999000, './assets/img/proart-desktop.png',      0);

-- Especificaciones de productos
INSERT INTO ESPECIFICACIONES (id_producto, nombre_spec, valor_spec) VALUES
-- ASUS ROG Gaming Desktop (id=1)
(1, 'Procesador',       'Intel Core i7-12700KF'),
(1, 'RAM',              '16GB DDR5 4800MHz'),
(1, 'Tarjeta gráfica',  'NVIDIA RTX 3060 12GB'),
(1, 'Almacenamiento',   '1TB NVMe SSD'),
(1, 'Sistema operativo','Windows 11 Home'),
(1, 'Conectividad',     'WiFi 6, Bluetooth 5.2'),
-- ASUS ROG Gaming Laptop (id=2)
(2, 'Procesador',       'Intel Core i7-12700H'),
(2, 'RAM',              '16GB DDR5'),
(2, 'Tarjeta gráfica',  'NVIDIA RTX 3050 4GB'),
(2, 'Pantalla',         '15.6" FHD 144Hz'),
(2, 'Almacenamiento',   '512GB NVMe SSD'),
(2, 'Batería',          '90Wh, hasta 8 horas'),
-- MSI Aegis RS Desktop (id=3)
(3, 'Procesador',       'Intel Core i7-12700K'),
(3, 'RAM',              '32GB DDR5 4800MHz'),
(3, 'Tarjeta gráfica',  'NVIDIA RTX 3080 10GB'),
(3, 'Almacenamiento',   '2TB NVMe SSD'),
(3, 'Refrigeración',    'Líquida 240mm'),
(3, 'Fuente de poder',  '850W 80+ Gold'),
-- ASUS ProArt Monitor 4K (id=4)
(4, 'Panel',            'OLED 27" 4K UHD (3840x2160)'),
(4, 'Respuesta',        '0.1ms'),
(4, 'Frecuencia',       '60Hz'),
(4, 'Color',            '99% DCI-P3, Pantone Validated'),
(4, 'Puertos',          '2x HDMI 2.0, 1x DisplayPort 1.4, USB-C'),
(4, 'Ajuste',           'Altura, inclinación y pivote'),
-- ASUS ExpertBook (id=5)
(5, 'Procesador',       'Intel Core i5-1235U'),
(5, 'RAM',              '8GB DDR4 3200MHz'),
(5, 'Gráficos',         'Intel Iris Xe'),
(5, 'Pantalla',         '14" FHD IPS'),
(5, 'Almacenamiento',   '256GB SSD'),
(5, 'Batería',          '72Wh, hasta 12 horas');


-- ============================================================
-- 5. CONSULTAS DE VERIFICACIÓN
-- ============================================================

-- Ver todas las tablas creadas
SHOW TABLES;

-- Ver productos con su categoría
SELECT p.id_producto, p.titulo, c.nombre AS categoria, p.precio, p.destacado
FROM PRODUCTOS p
JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
ORDER BY c.nombre, p.precio;

-- Ver índices creados
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'compudesign'
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
