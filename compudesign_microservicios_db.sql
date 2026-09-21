-- ============================================================
--  COMPUDESIGN — Base de datos para Arquitectura de Microservicios
--  Cumple con la FASE 7 del Laboratorio Uniminuto:
--  "Misma instancia de MySQL, pero con esquemas separados
--   sin consultar directamente tablas pertenecientes a otro servicio"
-- ============================================================

-- ============================================================
-- 1. ESQUEMA: compudesign_productos (Microservicio de Catálogo)
-- ============================================================
CREATE DATABASE IF NOT EXISTS compudesign_productos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE compudesign_productos;

CREATE TABLE IF NOT EXISTS CATEGORIAS (
    id_categoria  INT           NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(50)   NOT NULL,
    descripcion   TEXT,
    CONSTRAINT pk_categorias PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS PRODUCTOS (
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

CREATE TABLE IF NOT EXISTS ESPECIFICACIONES (
    id_especificacion INT          NOT NULL AUTO_INCREMENT,
    id_producto       INT          NOT NULL,
    nombre_spec       VARCHAR(100) NOT NULL,
    valor_spec        VARCHAR(200) NOT NULL,
    CONSTRAINT pk_especificaciones PRIMARY KEY (id_especificacion),
    CONSTRAINT fk_especificaciones_producto
        FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_productos_categoria ON PRODUCTOS(id_categoria);
CREATE INDEX idx_productos_precio    ON PRODUCTOS(precio);
CREATE INDEX idx_specs_producto      ON ESPECIFICACIONES(id_producto);

-- Datos iniciales de catálogo
INSERT IGNORE INTO CATEGORIAS (id_categoria, nombre, descripcion) VALUES
(1, 'laptops',   'Portátiles ASUS para trabajo, diseño y gaming'),
(2, 'desktops',  'Computadores de escritorio ASUS de alto rendimiento'),
(3, 'monitores', 'Monitores ASUS ProArt, ROG y serie estándar');

INSERT IGNORE INTO PRODUCTOS (id_producto, id_categoria, titulo, descripcion, precio, imagen_url, destacado) VALUES
(1, 2, 'ASUS ROG Gaming Desktop',  'Intel Core i7 - 16GB - RTX 3060 - 1TB',       6999000, './assets/img/rog-gaming-desktop.png',  1),
(2, 1, 'ASUS ROG Gaming Laptop',   'Intel Core i7 - 16GB - RTX 3050 - 512GB',     5499000, './assets/img/rog-gaming-laptop.png',   1),
(3, 2, 'MSI Aegis RS Desktop',     'Intel i7 - 32GB - RTX 3080 - 2TB SSD',        8999000, './assets/img/msi-aegis-desktop.png',   1),
(4, 3, 'ASUS ProArt Monitor 4K',   '27 pulgadas, OLED, Pantone Validated',         4299000, './assets/img/proart-monitor-4k.png',   1),
(5, 1, 'ASUS ExpertBook Laptop',   'Uso de oficina, equilibrado y confiable',      3499000, './assets/img/expertbook-laptop.png',   0),
(6, 2, 'ASUS TUF Desktop',         'Rendimiento gaming de entrada',                4799000, './assets/img/tuf-desktop.png',         0),
(7, 1, 'ASUS VivoBook Laptop',     'AMD Ryzen 5 - 8GB - 256GB SSD',               2299000, './assets/img/vivobook-laptop.png',     0),
(8, 3, 'ASUS ROG Swift Monitor',   '24 pulgadas, 165Hz, 1ms, FHD',                1899000, './assets/img/rog-swift-monitor.png',   0),
(9, 1, 'ASUS Zenbook 14 Laptop',   'Intel Core i5 - 16GB - 512GB SSD',            3299000, './assets/img/zenbook-14-laptop.png',   0),
(10, 2, 'ASUS ProArt Desktop',     'Intel Xeon - 64GB - RTX A4000 - 4TB',         8999000, './assets/img/proart-desktop.png',      0);

INSERT IGNORE INTO ESPECIFICACIONES (id_especificacion, id_producto, nombre_spec, valor_spec) VALUES
(1, 1, 'Procesador',       'Intel Core i7-12700KF'),
(2, 1, 'RAM',              '16GB DDR5 4800MHz'),
(3, 1, 'Tarjeta gráfica',  'NVIDIA RTX 3060 12GB'),
(4, 1, 'Almacenamiento',   '1TB NVMe SSD'),
(5, 1, 'Sistema operativo','Windows 11 Home'),
(6, 1, 'Conectividad',     'WiFi 6, Bluetooth 5.2'),
(7, 2, 'Procesador',       'Intel Core i7-12700H'),
(8, 2, 'RAM',              '16GB DDR5'),
(9, 2, 'Tarjeta gráfica',  'NVIDIA RTX 3050 4GB'),
(10, 2, 'Pantalla',        '15.6" FHD 144Hz'),
(11, 2, 'Almacenamiento',  '512GB NVMe SSD'),
(12, 2, 'Batería',         '90Wh, hasta 8 horas'),
(13, 3, 'Procesador',      'Intel Core i7-12700K'),
(14, 3, 'RAM',             '32GB DDR5 4800MHz'),
(15, 3, 'Tarjeta gráfica', 'NVIDIA RTX 3080 10GB'),
(16, 3, 'Almacenamiento',  '2TB NVMe SSD'),
(17, 3, 'Refrigeración',   'Líquida 240mm'),
(18, 3, 'Fuente de poder', '850W 80+ Gold'),
(19, 4, 'Panel',           'OLED 27" 4K UHD (3840x2160)'),
(20, 4, 'Respuesta',       '0.1ms'),
(21, 4, 'Frecuencia',      '60Hz'),
(22, 4, 'Color',           '99% DCI-P3, Pantone Validated'),
(23, 4, 'Puertos',         '2x HDMI 2.0, 1x DisplayPort 1.4, USB-C'),
(24, 4, 'Ajuste',          'Altura, inclinación y pivote'),
(25, 5, 'Procesador',      'Intel Core i5-1235U'),
(26, 5, 'RAM',             '8GB DDR4 3200MHz'),
(27, 5, 'Gráficos',        'Intel Iris Xe'),
(28, 5, 'Pantalla',        '14" FHD IPS'),
(29, 5, 'Almacenamiento',  '256GB SSD'),
(30, 5, 'Batería',         '72Wh, hasta 12 horas'),
(31, 6, 'Procesador',      'Intel Core i5-12400F'),
(32, 6, 'RAM',             '16GB DDR4 3200MHz'),
(33, 6, 'Tarjeta gráfica', 'NVIDIA RTX 3050 8GB'),
(34, 6, 'Almacenamiento',  '512GB NVMe SSD'),
(35, 6, 'Sistema operativo','Windows 11 Home'),
(36, 6, 'Conectividad',     'WiFi 6, Bluetooth 5.2'),
(37, 7, 'Procesador',      'AMD Ryzen 5 5500U'),
(38, 7, 'RAM',             '8GB DDR4 3200MHz'),
(39, 7, 'Gráficos',        'AMD Radeon Graphics'),
(40, 7, 'Pantalla',        '15.6" FHD IPS'),
(41, 7, 'Almacenamiento',  '256GB NVMe SSD'),
(42, 7, 'Batería',         '42Wh, hasta 8 horas'),
(43, 8, 'Panel',           '24" Fast IPS FHD (1920x1080)'),
(44, 8, 'Respuesta',       '1ms GTG'),
(45, 8, 'Frecuencia',      '165Hz'),
(46, 8, 'Tecnología',      'G-Sync Compatible, HDR10'),
(47, 8, 'Puertos',         '2x HDMI 2.0, 1x DisplayPort 1.2'),
(48, 8, 'Ajuste',          'Altura, inclinación y giro'),
(49, 9, 'Procesador',      'Intel Core i5-1240P'),
(50, 9, 'RAM',             '16GB LPDDR5 5200MHz'),
(51, 9, 'Gráficos',        'Intel Iris Xe'),
(52, 9, 'Pantalla',        '14" 2.8K OLED 90Hz'),
(53, 9, 'Almacenamiento',  '512GB NVMe SSD'),
(54, 9, 'Batería',         '75Wh, hasta 18 horas'),
(55, 10, 'Procesador',     'Intel Xeon W-2255'),
(56, 10, 'RAM',            '64GB DDR4 ECC'),
(57, 10, 'Tarjeta gráfica','NVIDIA RTX A4000 16GB'),
(58, 10, 'Almacenamiento', '4TB NVMe SSD'),
(59, 10, 'Certificación',  'ISV para software profesional'),
(60, 10, 'Fuente de poder','750W 80+ Platinum');


-- ============================================================
-- 2. ESQUEMA: compudesign_usuarios (Microservicio de Usuarios)
-- ============================================================
CREATE DATABASE IF NOT EXISTS compudesign_usuarios
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE compudesign_usuarios;

CREATE TABLE IF NOT EXISTS USUARIOS (
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

CREATE INDEX idx_usuarios_correo ON USUARIOS(correo);

-- Si ya existen usuarios en el monolito 'compudesign', se copian automáticamente:
INSERT IGNORE INTO compudesign_usuarios.USUARIOS
SELECT * FROM compudesign.USUARIOS WHERE EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'compudesign' AND TABLE_NAME = 'USUARIOS'
);


-- ============================================================
-- 3. ESQUEMA: compudesign_pedidos (Microservicio de Pedidos)
-- ============================================================
CREATE DATABASE IF NOT EXISTS compudesign_pedidos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE compudesign_pedidos;

CREATE TABLE IF NOT EXISTS METODOS_PAGO (
    id_metodo INT          NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(50)  NOT NULL,
    activo    TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT pk_metodos_pago PRIMARY KEY (id_metodo),
    CONSTRAINT uq_metodos_pago_nombre UNIQUE (nombre)
);

-- NOTA DE ARQUITECTURA:
-- 'id_usuario' se almacena como ID de referencia lógica.
-- No tiene llave foránea a nivel de SQL porque la tabla USUARIOS pertenece a otro microservicio.
CREATE TABLE IF NOT EXISTS PEDIDOS (
    id_pedido    INT            NOT NULL AUTO_INCREMENT,
    id_usuario   INT            NOT NULL,
    fecha_pedido DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal     DECIMAL(12,2)  NOT NULL,
    impuestos    DECIMAL(12,2)  NOT NULL,
    total        DECIMAL(12,2)  NOT NULL,
    estado       VARCHAR(30)    NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_pedidos PRIMARY KEY (id_pedido),
    CONSTRAINT chk_pedidos_estado
        CHECK (estado IN ('pendiente','procesando','enviado','entregado','cancelado'))
);

-- NOTA DE ARQUITECTURA:
-- 'id_producto' se almacena como referencia lógica.
-- La validación y precio se resuelven consultando por HTTP al microservicio de Productos.
CREATE TABLE IF NOT EXISTS DETALLE_PEDIDO (
    id_detalle      INT            NOT NULL AUTO_INCREMENT,
    id_pedido       INT            NOT NULL,
    id_producto     INT            NOT NULL,
    cantidad        INT            NOT NULL,
    precio_unitario DECIMAL(12,2)  NOT NULL,
    CONSTRAINT pk_detalle_pedido PRIMARY KEY (id_detalle),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS ENVIOS (
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

CREATE TABLE IF NOT EXISTS PAGOS (
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

CREATE INDEX idx_pedidos_usuario ON PEDIDOS(id_usuario);
CREATE INDEX idx_pedidos_estado  ON PEDIDOS(estado);
CREATE INDEX idx_detalle_pedido  ON DETALLE_PEDIDO(id_pedido);

INSERT IGNORE INTO METODOS_PAGO (id_metodo, nombre) VALUES
(1, 'Nequi'),
(2, 'Daviplata'),
(3, 'Tarjeta débito/crédito'),
(4, 'Contraentrega');


-- ============================================================
-- 4. ESQUEMA: compudesign_soporte (Microservicio de Soporte)
-- ============================================================
CREATE DATABASE IF NOT EXISTS compudesign_soporte
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE compudesign_soporte;

CREATE TABLE IF NOT EXISTS SERVICIOS (
    id_servicio INT          NOT NULL AUTO_INCREMENT,
    tipo        VARCHAR(50)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    disponible  TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT pk_servicios PRIMARY KEY (id_servicio),
    CONSTRAINT chk_servicios_tipo
        CHECK (tipo IN ('soporte','asesoria'))
);

CREATE TABLE IF NOT EXISTS SOLICITUDES_SERVICIO (
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
    CONSTRAINT chk_solicitudes_estado
        CHECK (estado IN ('pendiente','en_revision','atendida','cancelada'))
);

CREATE INDEX idx_solicitudes_servicio ON SOLICITUDES_SERVICIO(id_servicio);
CREATE INDEX idx_solicitudes_estado   ON SOLICITUDES_SERVICIO(estado);

INSERT IGNORE INTO SERVICIOS (id_servicio, tipo, nombre, descripcion) VALUES
(1, 'soporte',  'Soporte Técnico',  'Diagnóstico y solución de fallas en línea. Optimización, instalación de software y asesoría especializada para tus equipos ASUS.'),
(2, 'asesoria', 'Asesoría Virtual', 'Consultoría personalizada en línea con un experto. Te ayudamos a elegir el equipo ideal y resolver tus dudas tecnológicas.');
