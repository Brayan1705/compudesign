document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://3.138.195.46/api';

    // Estado de sesión 
    let sesionUsuario = JSON.parse(localStorage.getItem('compudesign_usuario')) || null;

    function guardarSesion(usuario) {
        sesionUsuario = usuario;
        localStorage.setItem('compudesign_usuario', JSON.stringify(usuario));
    }

    function cerrarSesion() {
        sesionUsuario = null;
        localStorage.removeItem('compudesign_usuario');
        actualizarNavUsuario();
    }

    function actualizarNavUsuario() {
        const userIcon = document.getElementById('user-nav-icon');
        const userLabel = document.getElementById('user-nav-label');

        if (sesionUsuario) {
            const nombre = sesionUsuario.nombre_completo.split(' ')[0];
            if (userLabel) userLabel.textContent = nombre;
            if (userIcon) userIcon.title = `Sesión: ${sesionUsuario.nombre_completo}`;
            // Mostrar botón cerrar sesión si existe
            const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
            if (btnCerrarSesion) btnCerrarSesion.style.display = 'inline-block';
        } else {
            if (userLabel) userLabel.textContent = '';
            if (userIcon) userIcon.title = 'Iniciar sesión';
            const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
            if (btnCerrarSesion) btnCerrarSesion.style.display = 'none';
        }
    }

    // 1. PRODUCTOS — carga desde la API

    let products = [];   

    // Datos de respaldo por si el servidor no responde
    const productosFallback = [
        { id: 1,  title: "ASUS ROG Gaming Desktop",  desc: "Intel Core i7 - 16GB - RTX 3060 - 1TB",      price: 6999000,  img: "./assets/img/rog-gaming-desktop.png",  category: "desktops",  featured: true,  specs: ["Procesador: Intel Core i7-12700KF", "RAM: 16GB DDR5 4800MHz", "Tarjeta gráfica: NVIDIA RTX 3060 12GB", "Almacenamiento: 1TB NVMe SSD", "Sistema operativo: Windows 11 Home", "Conectividad: WiFi 6, Bluetooth 5.2"] },
        { id: 2,  title: "ASUS ROG Gaming Laptop",   desc: "Intel Core i7 - 16GB - RTX 3050 - 512GB",    price: 5499000,  img: "./assets/img/rog-gaming-laptop.png",   category: "laptops",   featured: true,  specs: ["Procesador: Intel Core i7-12700H", "RAM: 16GB DDR5", "Tarjeta gráfica: NVIDIA RTX 3050 4GB", "Pantalla: 15.6\" FHD 144Hz", "Almacenamiento: 512GB NVMe SSD", "Batería: 90Wh, hasta 8 horas"] },
        { id: 3,  title: "MSI Aegis RS Desktop",     desc: "Intel i7 - 32GB - RTX 3080 - 2TB SSD",       price: 8999000,  img: "./assets/img/msi-aegis-desktop.png",   category: "desktops",  featured: true,  specs: ["Procesador: Intel Core i7-12700K", "RAM: 32GB DDR5 4800MHz", "Tarjeta gráfica: NVIDIA RTX 3080 10GB", "Almacenamiento: 2TB NVMe SSD", "Refrigeración: Líquida 240mm", "Fuente de poder: 850W 80+ Gold"] },
        { id: 4,  title: "ASUS ProArt Monitor 4K",   desc: "27 pulgadas, OLED, Pantone Validated",        price: 4299000,  img: "./assets/img/proart-monitor-4k.png",   category: "monitores", featured: true,  specs: ["Panel: OLED 27\" 4K UHD (3840x2160)", "Respuesta: 0.1ms", "Frecuencia: 60Hz", "Color: 99% DCI-P3, Pantone Validated", "Puertos: 2x HDMI 2.0, 1x DisplayPort 1.4, USB-C", "Ajuste: Altura, inclinación y pivote"] },
        { id: 5,  title: "ASUS ExpertBook Laptop",   desc: "Uso de oficina, equilibrado y confiable",     price: 3499000,  img: "./assets/img/expertbook-laptop.png",   category: "laptops",   featured: false, specs: ["Procesador: Intel Core i5-1235U", "RAM: 8GB DDR4 3200MHz", "Gráficos: Intel Iris Xe", "Pantalla: 14\" FHD IPS", "Almacenamiento: 256GB SSD", "Batería: 72Wh, hasta 12 horas"] },
        { id: 6,  title: "ASUS TUF Desktop",         desc: "Rendimiento gaming de entrada",               price: 4799000,  img: "./assets/img/tuf-desktop.png",         category: "desktops",  featured: false, specs: ["Procesador: Intel Core i5-12400F", "RAM: 16GB DDR4 3200MHz", "Tarjeta gráfica: NVIDIA RTX 3060 Ti 8GB", "Almacenamiento: 512GB SSD + 1TB HDD", "Chasis: Torre ATX con ventilación optimizada", "Sistema operativo: Windows 11 Home"] },
        { id: 7,  title: "ASUS VivoBook Laptop",     desc: "AMD Ryzen 5 - 8GB - 256GB SSD",              price: 2299000,  img: "./assets/img/vivobook-laptop.png",     category: "laptops",   featured: false, specs: ["Procesador: AMD Ryzen 5 5600H", "RAM: 8GB DDR4", "Gráficos: AMD Radeon RX Vega 7", "Pantalla: 15.6\" FHD IPS 60Hz", "Almacenamiento: 256GB NVMe SSD", "Peso: 1.8kg"] },
        { id: 8,  title: "ASUS ROG Swift Monitor",   desc: "24 pulgadas, 165Hz, 1ms, FHD",               price: 1899000,  img: "./assets/img/rog-swift-monitor.png",   category: "monitores", featured: false, specs: ["Panel: IPS 24\" FHD (1920x1080)", "Frecuencia de refresco: 165Hz", "Tiempo de respuesta: 1ms (GTG)", "Compatibilidad: NVIDIA G-Sync", "Puertos: 1x HDMI 2.0, 1x DisplayPort 1.4", "ROG GamePlus: Crosshair, Timer, FPS Counter"] },
        { id: 9,  title: "ASUS Zenbook 14 Laptop",   desc: "Intel Core i5 - 16GB - 512GB SSD",           price: 3299000,  img: "./assets/img/zenbook-14-laptop.png",   category: "laptops",   featured: false, specs: ["Procesador: Intel Core i5-1240P", "RAM: 16GB LPDDR5", "Gráficos: Intel Iris Xe Graphics", "Pantalla: 14\" OLED 2.8K 90Hz", "Almacenamiento: 512GB PCIe 4.0 SSD", "Peso: 1.39kg, Chasis: Aluminio cepillado"] },
        { id: 10, title: "ASUS ProArt Desktop",      desc: "Intel Xeon - 64GB - RTX A4000 - 4TB",        price: 8999000,  img: "./assets/img/proart-desktop.png",      category: "desktops",  featured: false, specs: ["Procesador: Intel Xeon W-1290P", "RAM: 64GB ECC DDR4 3200MHz", "Tarjeta gráfica: NVIDIA RTX A4000 16GB", "Almacenamiento: 4TB NVMe SSD RAID", "Certificado: ISV para Adobe, Autodesk", "Puertos: Thunderbolt 4, USB 3.2 Gen 2"] },
    ];

    async function cargarProductos() {
        try {
            const res = await fetch(`${API}/productos`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.ok && json.data.length > 0) {
                products = json.data.map(p => ({
                    ...p,
                    featured: Boolean(p.featured)
                }));
                console.log(`✅ ${products.length} productos cargados desde MySQL`);
            } else {
                throw new Error('Sin datos en la API');
            }
        } catch (err) {
            console.warn('⚠️ API no disponible, usando datos locales:', err.message);
            products = productosFallback;
        }
        // Inicializar vistas que dependen de los productos
        renderDestacados();
        aplicarFiltros();
    }

    // 2. ESTADO GLOBAL

    let cart = [];
    let shippingCost = 0;
    let shippingLabel = 'Gratis';
    let selectedPayment = null;
    let selectedPaymentId = null;  

    // Filtros catálogo
    let filtroCategoria = '';
    let filtroMinPrecio = 0;
    let filtroMaxPrecio = 99999999;
    let filtroOrden = 'nombre';
    const ITEMS_POR_PAGINA = 8;
    let paginaActual = 1;

    // Formateador de precios en pesos colombianos
    function formatCOP(amount) {
        return '$' + Math.round(amount).toLocaleString('es-CO');
    }

    // 3. SISTEMA DE NAVEGACIÓN 

    const navButtons = document.querySelectorAll('.nav-btn');
    const vistas = document.querySelectorAll('.vista');
    const cartBadge = document.getElementById('cart-count');

    function navigateTo(targetId, filter = null, scrollTo = null, featuredFilter = undefined, clickedBtn = null) {
        if (!targetId) return;
        vistas.forEach(v => v.classList.remove('active'));
        const targetVista = document.getElementById(targetId);
        if (targetVista) targetVista.classList.add('active');

        // Actualizar nav activo
        document.querySelectorAll('.nav-links > li > a').forEach(a => a.classList.remove('active'));

        if (clickedBtn) {
            const inDropdown = clickedBtn.closest('.dropdown-menu');
            if (inDropdown) {
                const parentTrigger = clickedBtn.closest('.dropdown-parent').querySelector('a');
                if (parentTrigger) parentTrigger.classList.add('active');
            } else {
                clickedBtn.classList.add('active');
            }
        } else {
            document.querySelectorAll('.nav-links > li > a').forEach(a => {
                if (a.getAttribute('data-target') === targetId) a.classList.add('active');
            });
        }

        if (targetId === 'vista-catalogo' && filter) {
            filtroCategoria = filter;
            aplicarFiltros();
            syncFiltroUI();
        }

        if (targetId === 'vista-carrito') renderCartView();
        if (targetId === 'vista-envio')  renderCheckoutSidebar('envio');
        if (targetId === 'vista-pago') {
            renderCheckoutSidebar('pago');
            prefillPagoForm();
        }

        if (featuredFilter !== undefined && targetId === 'vista-inicio') {
            renderDestacados(featuredFilter);
            setTimeout(() => {
                const seccion = document.getElementById(scrollTo || 'seccion-destacados');
                if (seccion) seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        } else if (scrollTo) {
            setTimeout(() => {
                const seccion = document.getElementById(scrollTo);
                if (seccion) seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const filter = btn.getAttribute('data-filter') || null;
            const scrollTo = btn.getAttribute('data-scroll-to') || null;
            const featuredFilter = btn.hasAttribute('data-featured-filter')
                ? btn.getAttribute('data-featured-filter')
                : undefined;
            navigateTo(targetId, filter, scrollTo, featuredFilter, btn);
        });
    });


    // 4. CATÁLOGO: RENDERIZADO Y FILTROS

    function renderProductCard(product) {
        const div = document.createElement('div');
        div.className = 'card-producto';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div class="img-container">
                <img src="${product.img}" alt="${product.title}" class="img-producto">
            </div>
            <h3 class="text-left mt-10">${product.title}<br><span class="text-sm text-muted">${product.desc}</span></h3>
            <p class="precio mt-10">${formatCOP(product.price)}</p>
            <button class="btn-primary w-100 add-to-cart-btn" data-id="${product.id}">Añadir al carrito</button>
        `;
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart-btn')) {
                openProductModal(product.id);
            }
        });
        return div;
    }

  
    // MODAL DE DETALLE DE PRODUCTO
   
    const modalOverlay = document.getElementById('product-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const categoryLabels = { laptops: 'Laptop', desktops: 'Desktop', monitores: 'Monitor' };

    function openProductModal(productId) {
        const p = products.find(p => p.id === productId);
        if (!p || !modalOverlay) return;

        document.getElementById('modal-img').src = p.img;
        document.getElementById('modal-img').alt = p.title;
        document.getElementById('modal-title').textContent = p.title;
        document.getElementById('modal-desc').textContent = p.desc;
        document.getElementById('modal-price').textContent = formatCOP(p.price);
        document.getElementById('modal-category-badge').textContent = categoryLabels[p.category] || p.category;
        document.getElementById('modal-add-to-cart-btn').setAttribute('data-id', p.id);

        const specsList = document.getElementById('modal-specs-list');
        specsList.innerHTML = '';
        if (p.specs && p.specs.length > 0) {
            p.specs.forEach(spec => {
                const li = document.createElement('li');
                li.textContent = spec;
                specsList.appendChild(li);
            });
        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Inicializar visor 3D
        if (window.init3DViewer) {
            window.init3DViewer(p.id, p.category);
        }
    }

    function closeProductModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Limpiar visor 3D
        const v = document.getElementById('modal-3d-viewer');
        const i = document.getElementById('modal-img');
        const w = document.getElementById('modal-view-toggle');
        const b = document.getElementById('btn-toggle-3d');
        if (v) { v.style.display='none'; v.innerHTML=''; }
        if (i) i.style.display='block';
        if (w) w.style.display='none';
        if (b) b.innerHTML='🎲 Ver en 3D';
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProductModal);
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeProductModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProductModal();
    });

    // Render productos destacados
    const destacadosContainer = document.getElementById('productos-destacados-container');
    const filtroDestacadosLabel = document.getElementById('filtro-destacados-label');
    const categoryNames = { laptops: 'Laptops', desktops: 'Desktops', monitores: 'Monitores' };

    function renderDestacados(filter = '') {
        if (!destacadosContainer) return;
        destacadosContainer.innerHTML = '';

        if (filtroDestacadosLabel) {
            filtroDestacadosLabel.textContent = filter
                ? `Filtrando por: ${categoryNames[filter] || filter}`
                : '';
        }

        const filtered = products.filter(p => p.featured && (!filter || p.category === filter));
        if (filtered.length === 0) {
            destacadosContainer.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">No hay productos destacados en esta categoría.</p>';
            return;
        }
        filtered.forEach(p => destacadosContainer.appendChild(renderProductCard(p)));
    }

    function aplicarFiltros() {
        let filtered = products.filter(p => {
            const matchCat = !filtroCategoria || p.category === filtroCategoria;
            const matchMin = p.price >= filtroMinPrecio;
            const matchMax = p.price <= filtroMaxPrecio;
            return matchCat && matchMin && matchMax;
        });

        if (filtroOrden === 'precio-asc')  filtered.sort((a, b) => a.price - b.price);
        if (filtroOrden === 'precio-desc') filtered.sort((a, b) => b.price - a.price);
        if (filtroOrden === 'nombre')      filtered.sort((a, b) => a.title.localeCompare(b.title));

        renderCatalogo(filtered);
    }

    function renderCatalogo(filtered) {
        const container = document.getElementById('catalogo-productos-container');
        const sinResultados = document.getElementById('sin-resultados');
        const infoEl = document.getElementById('catalogo-resultado-info');
        if (!container) return;

        container.innerHTML = '';

        if (filtered.length === 0) {
            sinResultados.style.display = 'block';
            container.style.display = 'none';
            infoEl.textContent = '';
            renderPaginacion(0);
            return;
        }

        sinResultados.style.display = 'none';
        container.style.display = 'grid';

        const totalPages = Math.ceil(filtered.length / ITEMS_POR_PAGINA);
        if (paginaActual > totalPages) paginaActual = 1;
        const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
        const pageItems = filtered.slice(start, start + ITEMS_POR_PAGINA);

        infoEl.textContent = `Mostrando ${Math.min(pageItems.length, filtered.length)} de ${filtered.length} producto(s)`;
        pageItems.forEach(p => container.appendChild(renderProductCard(p)));
        renderPaginacion(totalPages, filtered);
    }

    function renderPaginacion(totalPages, filtered) {
        const pag = document.getElementById('paginacion-catalogo');
        if (!pag) return;
        pag.innerHTML = '';
        if (totalPages <= 1) return;

        const btnPrev = document.createElement('button');
        btnPrev.className = 'page-btn';
        btnPrev.textContent = '‹';
        btnPrev.disabled = paginaActual === 1;
        btnPrev.addEventListener('click', () => { paginaActual--; renderCatalogo(filtered); window.scrollTo({top:300, behavior:'smooth'}); });
        pag.appendChild(btnPrev);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === paginaActual ? ' active' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => { paginaActual = i; renderCatalogo(filtered); window.scrollTo({top:300, behavior:'smooth'}); });
            pag.appendChild(btn);
        }

        const btnNext = document.createElement('button');
        btnNext.className = 'page-btn';
        btnNext.textContent = '›';
        btnNext.disabled = paginaActual === totalPages;
        btnNext.addEventListener('click', () => { paginaActual++; renderCatalogo(filtered); window.scrollTo({top:300, behavior:'smooth'}); });
        pag.appendChild(btnNext);
    }

    function syncFiltroUI() {
        document.querySelectorAll('input[name="cat"]').forEach(radio => {
            radio.checked = radio.value === filtroCategoria;
        });
        const selectTop = document.getElementById('filtro-categoria-top');
        if (selectTop) selectTop.value = filtroCategoria;
    }

    // Lista eventos filtros
    document.querySelectorAll('input[name="cat"]').forEach(radio => {
        radio.addEventListener('change', () => {
            filtroCategoria = radio.value;
            paginaActual = 1;
            const selectTop = document.getElementById('filtro-categoria-top');
            if (selectTop) selectTop.value = filtroCategoria;
            aplicarFiltros();
        });
    });

    const filtroCategTop = document.getElementById('filtro-categoria-top');
    if (filtroCategTop) {
        filtroCategTop.addEventListener('change', () => {
            filtroCategoria = filtroCategTop.value;
            paginaActual = 1;
            syncFiltroUI();
            aplicarFiltros();
        });
    }

    const filtroOrdenarEl = document.getElementById('filtro-ordenar');
    if (filtroOrdenarEl) {
        filtroOrdenarEl.addEventListener('change', () => {
            filtroOrden = filtroOrdenarEl.value;
            paginaActual = 1;
            aplicarFiltros();
        });
    }

    const btnAplicarPrecio = document.getElementById('btn-aplicar-precio');
    if (btnAplicarPrecio) {
        btnAplicarPrecio.addEventListener('click', () => {
            const minEl = document.getElementById('precio-min');
            const maxEl = document.getElementById('precio-max');
            filtroMinPrecio = parseFloat(minEl.value) || 0;
            filtroMaxPrecio = parseFloat(maxEl.value) || 99999999;
            paginaActual = 1;
            aplicarFiltros();
        });
    }

    const filtroPrecios = document.getElementById('filtro-precio-top');
    if (filtroPrecios) {
        filtroPrecios.addEventListener('change', () => {
            const val = filtroPrecios.value;
            if (!val) { filtroMinPrecio = 0; filtroMaxPrecio = 99999999; }
            else {
                const [min, max] = val.split('-').map(Number);
                filtroMinPrecio = min;
                filtroMaxPrecio = max;
            }
            paginaActual = 1;
            aplicarFiltros();
        });
    }

    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', () => {
            filtroCategoria = '';
            filtroMinPrecio = 0;
            filtroMaxPrecio = 99999999;
            filtroOrden = 'nombre';
            paginaActual = 1;
            syncFiltroUI();
            aplicarFiltros();
        });
    }

    // 5. CARRITO DE COMPRAS

    function addToCart(productId) {
        const productToAdd = products.find(p => p.id === productId);
        if (!productToAdd) return;
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...productToAdd, quantity: 1 });
        }
        updateCartBadge();
        showAddedFeedback(productId);
    }

    function changeQuantity(productId, delta) {
        const item = cart.find(item => item.id === productId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity < 1) {
            cart = cart.filter(item => item.id !== productId);
        }
        updateCartBadge();
        renderCartView();
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }

    function getCartSubtotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function renderCartView() {
        const emptyView  = document.getElementById('cart-empty-view');
        const filledView = document.getElementById('cart-filled-view');
        const itemsContainer = document.getElementById('cart-items-container');
        if (!itemsContainer) return;

        if (cart.length === 0) {
            emptyView.style.display = 'block';
            filledView.style.display = 'none';
            return;
        }

        emptyView.style.display = 'none';
        filledView.style.display = 'flex';

        itemsContainer.innerHTML = '<h3 class="mb-10">Tus productos</h3>';
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.innerHTML = `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.title}">
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>${item.desc}</p>
                        <p class="precio-cart">${formatCOP(item.price)}</p>
                    </div>
                    <div class="qty-selector">
                        <button class="qty-minus" data-id="${item.id}">−</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button class="qty-plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <hr class="hr-claro">
            `;
            itemsContainer.appendChild(itemEl);
        });

        updateCartTotals();
    }

    function updateCartTotals() {
        const subtotal = getCartSubtotal();
        const taxes    = subtotal * 0.19;
        const total    = subtotal + taxes + shippingCost;

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText('cart-subtotal', formatCOP(subtotal));
        setText('cart-taxes',   formatCOP(taxes));
        setText('cart-total',   formatCOP(total));

        document.querySelectorAll('.checkout-subtotal-value').forEach(el => el.textContent = formatCOP(subtotal));
        document.querySelectorAll('.checkout-taxes-value').forEach(el => el.textContent = formatCOP(taxes));
        document.querySelectorAll('.checkout-total-value').forEach(el => el.textContent = formatCOP(total));
    }

    function renderCheckoutSidebar(vista) {
        const containerId = vista === 'envio' ? 'envio-items-resumen' : 'pago-items-resumen';
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'mini-cart-item';
            div.innerHTML = `
                <div class="mini-cart-item-row">
                    <img src="${item.img}" alt="${item.title}" class="mini-cart-item-img">
                    <div class="mini-cart-info">
                        <p>${item.title}</p>
                        <span>${item.desc}</span>
                    </div>
                    <span class="mini-cart-precio">${formatCOP(item.price * item.quantity)}</span>
                </div>
            `;
            container.appendChild(div);
        });

        updateCartTotals();

        const envioLabel = vista === 'envio' ? 'envio-costo-label' : 'pago-envio-label';
        const envioEl = document.getElementById(envioLabel);
        if (envioEl) envioEl.textContent = shippingLabel;
    }

    function showAddedFeedback(productId) {
        const btns = document.querySelectorAll(`.add-to-cart-btn[data-id="${productId}"]`);
        btns.forEach(btn => {
            const original = btn.textContent;
            btn.textContent = '✓ Añadido';
            btn.style.background = '#22c55e';
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = '';
            }, 1200);
        });
    }

    // 6. EVENTO DELEGACION — CARRITO

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            addToCart(productId);
        }
        if (e.target.classList.contains('qty-plus')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            changeQuantity(productId, 1);
        }
        if (e.target.classList.contains('qty-minus')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            changeQuantity(productId, -1);
        }
    });

    // 7. ENVÍO

    document.querySelectorAll('.select-envio').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.select-envio').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            shippingCost = parseInt(card.getAttribute('data-envio')) || 0;
            shippingLabel = card.getAttribute('data-label') || 'Gratis';
            updateCartTotals();
            const lbl = document.getElementById('envio-costo-label');
            if (lbl) lbl.textContent = shippingCost > 0 ? `$${shippingCost.toLocaleString('es-CO')}` : 'Gratis';
        });
    });

    const btnContinuarPago = document.getElementById('btn-continuar-pago');
    if (btnContinuarPago) {
        btnContinuarPago.addEventListener('click', () => {
            navigateTo('vista-pago');
        });
    }

    // 8. PAGO
   
    // Mapeo nombre método → id en la BD
    const metodoPagoIds = { 'nequi': 1, 'daviplata': 2, 'tarjeta': 3, 'contraentrega': 4 };

    document.querySelectorAll('.btn-pago').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPayment = btn.getAttribute('data-metodo');
            selectedPaymentId = metodoPagoIds[selectedPayment] || null;
        });
    });

    function prefillPagoForm() {
        const envioNombre   = document.getElementById('envio-nombre');
        const envioTel      = document.getElementById('envio-telefono');
        const envioDireccion = document.getElementById('envio-direccion');
        const pagoNombre    = document.getElementById('pago-nombre');
        const pagoTel       = document.getElementById('pago-telefono');
        const pagoDireccion = document.getElementById('pago-direccion');
        if (envioNombre && pagoNombre && !pagoNombre.value)     pagoNombre.value    = envioNombre.value;
        if (envioTel    && pagoTel    && !pagoTel.value)        pagoTel.value       = envioTel.value;
        if (envioDireccion && pagoDireccion && !pagoDireccion.value) pagoDireccion.value = envioDireccion.value;
    }

    // Confirmar pedido — guarda en la BD
    const btnConfirmarPedido = document.getElementById('btn-confirmar-pedido');
    if (btnConfirmarPedido) {
        btnConfirmarPedido.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío.');
                return;
            }

            const subtotal  = getCartSubtotal();
            const impuestos = subtotal * 0.19;
            const total     = subtotal + impuestos + shippingCost;

            const envio = {
                nombre      : document.getElementById('envio-nombre')?.value.trim()      || '',
                telefono    : document.getElementById('envio-telefono')?.value.trim()    || '',
                direccion   : document.getElementById('envio-direccion')?.value.trim()   || '',
                departamento: document.getElementById('envio-departamento')?.value.trim()|| '',
                ciudad      : document.getElementById('envio-ciudad')?.value.trim()      || '',
                tipo        : shippingCost > 0 ? 'express' : 'estandar',
                costo       : shippingCost
            };

            // Si el usuario está logueado, guardar el pedido en la BD
            if (sesionUsuario) {
                try {
                    const res = await fetch(`${API}/pedidos`, {
                        method : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body   : JSON.stringify({
                            id_usuario   : sesionUsuario.id_usuario,
                            items        : cart,
                            subtotal,
                            impuestos,
                            total,
                            envio,
                            id_metodo_pago: selectedPaymentId
                        })
                    });
                    const json = await res.json();
                    if (json.ok) {
                        const numEl = document.getElementById('numero-pedido');
                        if (numEl) numEl.textContent = `Pedido #${json.id_pedido}`;
                    } else {
                        console.warn('Advertencia al guardar pedido:', json.mensaje);
                    }
                } catch (err) {
                    console.warn('No se pudo guardar el pedido en BD:', err.message);
                }
            } else {
                // Sin sesión, solo número local
                const orderNum = Math.floor(10000 + Math.random() * 90000);
                const numEl = document.getElementById('numero-pedido');
                if (numEl) numEl.textContent = `Pedido #${orderNum}`;
            }

            // Limpiar carrito y navegar a confirmación
            cart = [];
            shippingCost = 0;
            shippingLabel = 'Gratis';
            selectedPayment = null;
            selectedPaymentId = null;
            updateCartBadge();
            navigateTo('vista-confirmacion');
        });
    }

    const btnVolverInicio = document.getElementById('btn-volver-inicio-confirm');
    if (btnVolverInicio) {
        btnVolverInicio.addEventListener('click', () => {
            navigateTo('vista-inicio');
        });
    }

    // 9. BANNER HERO / SLIDER

    const banners = [
        {
            title: "Encuentra la mejor selección de <br><span class='text-blue'>computadoras ASUS</span>",
            desc: "Brindamos los mejores equipos para tus creaciones, diseños y ediciones.",
            img: "./assets/img/banner-asus.png"
        },
        {
            title: "Potencia tu setup con <br><span class='text-blue'>Línea ROG Gaming</span>",
            desc: "Desempeño extremo para los jugadores y técnicos más exigentes.",
            img: "./assets/img/banner-asus_2.png"
        }
    ];

    let currentSlide = 0;
    const bannerTitle = document.getElementById('banner-title');
    const bannerDesc  = document.getElementById('banner-desc');
    const bannerImg   = document.getElementById('banner-img');
    const btnNext = document.getElementById('next-slide');
    const btnPrev = document.getElementById('prev-slide');

    function updateBanner(index) {
        if (!bannerImg) return;
        const frame = bannerImg.closest('.hero-img-frame-inner') || bannerImg;
        frame.style.opacity = 0;
        setTimeout(() => {
            bannerTitle.innerHTML = banners[index].title;
            bannerDesc.innerHTML  = banners[index].desc;
            bannerImg.src         = banners[index].img;
            frame.style.opacity   = 1;
        }, 300);
    }

    btnNext?.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % banners.length;
        updateBanner(currentSlide);
    });
    btnPrev?.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + banners.length) % banners.length;
        updateBanner(currentSlide);
    });

    // 10. AUTENTICACIÓN — LOGIN Y REGISTRO

    const formLogin    = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const tabLogin     = document.getElementById('tab-login');
    const tabRegistro  = document.getElementById('tab-registro');

    // Elementos del form de LOGIN
    const loginEmail    = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const btnLogin      = document.getElementById('btn-login');
    const msgLogin      = document.getElementById('msg-login');

    // Elementos del form de REGISTRO
    const regNombre   = document.getElementById('registro-nombre');
    const regEmail    = document.getElementById('registro-email');
    const regPassword = document.getElementById('registro-password');
    const regTelefono = document.getElementById('registro-telefono');
    const btnRegistro = document.getElementById('btn-registro');
    const msgRegistro = document.getElementById('msg-registro');

    // Función para mostrar mensajes en los formularios
    function mostrarMensaje(el, texto, tipo = 'error') {
        if (!el) return;
        el.textContent = texto;
        el.className = `auth-msg auth-msg--${tipo}`;
        el.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

    function limpiarMensaje(el) {
        if (!el) return;
        el.textContent = '';
        el.style.display = 'none';
    }

    // Mostrar form login
    function showLoginForm() {
        formLogin?.classList.add('active');
        formRegistro?.classList.remove('active');
        tabLogin?.classList.add('active');
        tabRegistro?.classList.remove('active');
        limpiarMensaje(msgLogin);
    }

    // Mostrar form registro
    function showRegistroForm() {
        formRegistro?.classList.add('active');
        formLogin?.classList.remove('active');
        tabRegistro?.classList.add('active');
        tabLogin?.classList.remove('active');
        limpiarMensaje(msgRegistro);
    }

    tabLogin?.addEventListener('click', showLoginForm);
    tabRegistro?.addEventListener('click', showRegistroForm);

    document.getElementById('switch-to-registro')?.addEventListener('click', showRegistroForm);
    document.getElementById('switch-to-login')?.addEventListener('click', showLoginForm);

    // Si ya hay sesión activa, mostrar opción de cerrar sesión
    document.getElementById('user-nav-icon')?.addEventListener('click', () => {
        if (sesionUsuario) {
            // Si está logueado, mostrar formulario con opción de cerrar sesión
            showLoginForm();
        } else {
            showLoginForm();
        }
    });

    // ── ENVIAR LOGIN ──
    btnLogin?.addEventListener('click', async () => {
        const correo    = loginEmail?.value.trim();
        const contrasena = loginPassword?.value;

        if (!correo || !contrasena) {
            mostrarMensaje(msgLogin, 'Por favor completa todos los campos.');
            return;
        }

        // Estado de carga
        btnLogin.disabled = true;
        btnLogin.textContent = 'Iniciando sesión...';
        limpiarMensaje(msgLogin);

        try {
            const res = await fetch(`${API}/login`, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ correo, contrasena })
            });
            const json = await res.json();

            if (json.ok) {
                guardarSesion(json.usuario);
                actualizarNavUsuario();
                mostrarMensaje(msgLogin, json.mensaje, 'success');
                // Limpiar campos
                if (loginEmail)    loginEmail.value    = '';
                if (loginPassword) loginPassword.value = '';
                // Redirigir al inicio después de 1.5 s
                setTimeout(() => navigateTo('vista-inicio'), 1500);
            } else {
                mostrarMensaje(msgLogin, json.mensaje || 'Error al iniciar sesión.');
            }
        } catch (err) {
            mostrarMensaje(msgLogin, 'No se pudo conectar con el servidor. Verifica que esté corriendo.');
            console.error('Error login:', err);
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Inicia sesión';
        }
    });

    // ── ENVIAR REGISTRO ───
    btnRegistro?.addEventListener('click', async () => {
        const nombre_completo = regNombre?.value.trim();
        const correo          = regEmail?.value.trim();
        const contrasena      = regPassword?.value;
        const telefono        = regTelefono?.value.trim();

        // Validaciones en el cliente
        if (!nombre_completo) { mostrarMensaje(msgRegistro, 'El nombre es obligatorio.'); return; }
        if (!correo || !correo.includes('@')) { mostrarMensaje(msgRegistro, 'Ingresa un correo válido.'); return; }
        if (!contrasena || contrasena.length < 8) { mostrarMensaje(msgRegistro, 'La contraseña debe tener mínimo 8 caracteres.'); return; }

        btnRegistro.disabled = true;
        btnRegistro.textContent = 'Registrando...';
        limpiarMensaje(msgRegistro);

        try {
            const res = await fetch(`${API}/registro`, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ nombre_completo, correo, contrasena, telefono })
            });
            const json = await res.json();

            if (json.ok) {
                // Auto-login después de registrarse
                guardarSesion(json.usuario);
                actualizarNavUsuario();
                mostrarMensaje(msgRegistro, json.mensaje, 'success');
                // Limpiar campos
                if (regNombre)    regNombre.value    = '';
                if (regEmail)     regEmail.value     = '';
                if (regPassword)  regPassword.value  = '';
                if (regTelefono)  regTelefono.value  = '';
                setTimeout(() => navigateTo('vista-inicio'), 1800);
            } else {
                mostrarMensaje(msgRegistro, json.mensaje || 'Error al registrar la cuenta.');
            }
        } catch (err) {
            mostrarMensaje(msgRegistro, 'No se pudo conectar con el servidor. Verifica que esté corriendo.');
            console.error('Error registro:', err);
        } finally {
            btnRegistro.disabled = false;
            btnRegistro.textContent = 'Regístrate';
        }
    });

    // Permitir submit con Enter en los inputs de auth
    [loginEmail, loginPassword].forEach(el => {
        el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLogin?.click(); });
    });
    [regNombre, regEmail, regPassword, regTelefono].forEach(el => {
        el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnRegistro?.click(); });
    });

    // Botón cerrar sesión
    document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
        cerrarSesion();
        navigateTo('vista-inicio');
    });

    // 11. DEPARTAMENTOS Y CIUDADES DE COLOMBIA

    const colombiaData = {
        "Amazonas":         ["Leticia","Puerto Nariño","El Encanto","La Chorrera","La Pedrera","Tarapacá"],
        "Antioquia":        ["Medellín","Bello","Itagüí","Envigado","Apartadó","Turbo","Rionegro","Caucasia","Marinilla","La Ceja","Sabaneta","Copacabana","Girardota","Barbosa","El Carmen de Viboral","Andes","Yarumal","Santa Fe de Antioquia","Jericó","Sonsón"],
        "Arauca":           ["Arauca","Arauquita","Saravena","Tame","Fortul","Puerto Rondón","Cravo Norte"],
        "Atlántico":        ["Barranquilla","Soledad","Malambo","Sabanalarga","Baranoa","Puerto Colombia","Galapa","Luruaco","Palmar de Varela","Ponedera"],
        "Bogotá D.C.":      ["Bogotá"],
        "Bolívar":          ["Cartagena","Magangué","El Carmen de Bolívar","Mompox","Turbaco","Arjona","Lorica","San Jacinto","Córdoba","María la Baja"],
        "Boyacá":           ["Tunja","Duitama","Sogamoso","Chiquinquirá","Paipa","Monguí","Villa de Leyva","Nobsa","Tibasosa","Garagoa","Soatá","Puerto Boyacá"],
        "Caldas":           ["Manizales","Villamaría","Chinchiná","Anserma","Riosucio","La Dorada","Salamina","Aguadas","Manzanares","Neira","Pensilvania"],
        "Caquetá":          ["Florencia","San Vicente del Caguán","Puerto Rico","Cartagena del Chairá","El Doncello","La Montañita","Milán","Belén de los Andaquíes"],
        "Casanare":         ["Yopal","Paz de Ariporo","Aguazul","Villanueva","Tauramena","Orocué","Trinidad","Hato Corozal","Maní","Pore"],
        "Cauca":            ["Popayán","Santander de Quilichao","Puerto Tejada","Patía","Timbío","El Bordo","Silvia","Caldono","Piendamó","La Vega"],
        "Cesar":            ["Valledupar","Aguachica","Codazzi","Bosconia","La Jagua de Ibirico","Chimichagua","Curumani","El Copey","Pailitas","Pelaya"],
        "Chocó":            ["Quibdó","Istmina","Tumaco","Condoto","Riosucio","Acandí","Bahía Solano","Nuquí","Lloró"],
        "Córdoba":          ["Montería","Cereté","Sahagún","Lorica","Montelíbano","Planeta Rica","San Pelayo","Tierralta","Ciénaga de Oro","Pueblo Nuevo"],
        "Cundinamarca":     ["Soacha","Zipaquirá","Fusagasugá","Facatativá","Chía","Mosquera","Madrid","Funza","Cajicá","Girardot","Villeta","La Mesa","Anapoima","Tocancipá","Sopó","Guaduas","Cota","Tabio","Tenjo","Sibaté"],
        "Guainía":          ["Inírida","Barranco Minas","Mapiripana","San Felipe","Puerto Colombia"],
        "Guaviare":         ["San José del Guaviare","Calamar","El Retorno","Miraflores"],
        "Huila":            ["Neiva","Pitalito","Garzón","La Plata","Campoalegre","Rivera","Palermo","Isnos","Acevedo","Algeciras"],
        "La Guajira":       ["Riohacha","Maicao","Uribia","Manaure","San Juan del Cesar","Fonseca","Albania","Dibulla","Barrancas","Villanueva"],
        "Magdalena":        ["Santa Marta","Ciénaga","Fundación","Aracataca","El Banco","Plato","Pivijay","Zona Bananera","San Zenón","Salamina"],
        "Meta":             ["Villavicencio","Acacías","Granada","San Martín","Puerto López","Cumaral","Restrepo","Puerto Gaitán","Castilla la Nueva","El Castillo"],
        "Nariño":           ["Pasto","Tumaco","Ipiales","La Unión","Samaniego","Túquerres","Sandoná","Barbacoas","El Charco","La Cruz"],
        "Norte de Santander":["Cúcuta","Ocaña","Pamplona","Villa del Rosario","Los Patios","El Zulia","Tibú","Sardinata","Chinácota","Bucarasica"],
        "Putumayo":         ["Mocoa","Puerto Asís","Orito","Valle del Guamuez","Sibundoy","Puerto Leguízamo","San Francisco","Villagarzón","Puerto Caicedo"],
        "Quindío":          ["Armenia","Calarcá","Montenegro","Quimbaya","La Tebaida","Circasia","Filandia","Buenavista","Génova","Pijao"],
        "Risaralda":        ["Pereira","Dosquebradas","Santa Rosa de Cabal","La Virginia","Santuario","Belén de Umbría","Quinchía","Marsella","Guática","Mistrató"],
        "San Andrés y Providencia":["San Andrés","Providencia"],
        "Santander":        ["Bucaramanga","Floridablanca","Girón","Piedecuesta","Barrancabermeja","San Gil","Socorro","Málaga","Lebrija","Vélez","Barbosa","Rionegro","Charalá","Zapatoca"],
        "Sucre":            ["Sincelejo","Corozal","Sampués","San Marcos","Tolú","Morroa","Ovejas","Coveñas","San Luis de Sincé","Los Palmitos"],
        "Tolima":           ["Ibagué","Espinal","Melgar","Honda","Líbano","Chaparral","Mariquita","Ataco","Fresno","Guamo","Purificación","Armero"],
        "Valle del Cauca":  ["Cali","Buenaventura","Palmira","Tuluá","Buga","Cartago","Yumbo","Jamundí","Florida","Pradera","Candelaria","El Cerrito","Sevilla","Roldanillo","La Unión","Zarzal","Riofrío"],
        "Vaupés":           ["Mitú","Carurú","Taraira","Papunahua"],
        "Vichada":          ["Puerto Carreño","La Primavera","Santa Rosalía","Cumaribo"]
    };

    const selectDepto  = document.getElementById('envio-departamento');
    const selectCiudad = document.getElementById('envio-ciudad');

    if (selectDepto && selectCiudad) {
        Object.keys(colombiaData).sort().forEach(depto => {
            const opt = document.createElement('option');
            opt.value = depto;
            opt.textContent = depto;
            selectDepto.appendChild(opt);
        });

        selectDepto.addEventListener('change', () => {
            const depto = selectDepto.value;
            selectCiudad.innerHTML = '';
            if (!depto) {
                selectCiudad.innerHTML = '<option value="">Primero selecciona un departamento</option>';
                selectCiudad.disabled = true;
                return;
            }
            const opt0 = document.createElement('option');
            opt0.value = '';
            opt0.textContent = 'Selecciona una ciudad';
            selectCiudad.appendChild(opt0);

            colombiaData[depto].forEach(ciudad => {
                const opt = document.createElement('option');
                opt.value = ciudad;
                opt.textContent = ciudad;
                selectCiudad.appendChild(opt);
            });
            selectCiudad.disabled = false;
        });
    }

    // 12. SERVICIOS

    let servicioSeleccionado = null;

    const cardSoporte  = document.getElementById('card-soporte');
    const cardAsesoria = document.getElementById('card-asesoria');
    const hintBadge    = document.getElementById('servicio-hint-badge');
    const formPanel    = document.getElementById('servicio-form-panel');
    const chipWrap     = document.getElementById('servicio-selected-chip');
    const chipIcon     = document.getElementById('chip-icon');
    const chipText     = document.getElementById('chip-text');
    const formSubtitle = document.getElementById('servicio-form-subtitle');
    const btnDeselect  = document.getElementById('btn-deselect-servicio');
    const btnEnviar    = document.getElementById('btn-enviar-servicio');
    const formNota     = document.getElementById('servicio-form-nota');
    const formNotaText = document.getElementById('servicio-form-nota-text');

    function seleccionarServicio(tipo) {
        servicioSeleccionado = tipo;
        cardSoporte.classList.toggle('selected',  tipo === 'soporte');
        cardAsesoria.classList.toggle('selected', tipo === 'asesoria');
        formPanel.classList.add('has-selection');
        hintBadge.style.opacity = '0.3';

        if (tipo === 'soporte') {
            chipIcon.textContent  = '💻';
            chipText.textContent  = 'Soporte Técnico seleccionado';
            formSubtitle.textContent = 'Soporte Técnico — elige fecha tras enviar';
            formNota.style.display = 'flex';
            formNotaText.textContent = 'Te mostraremos las fechas disponibles para confirmar tu cita de soporte.';
        } else {
            chipIcon.textContent  = '🎧';
            chipText.textContent  = 'Asesoría Virtual seleccionada';
            formSubtitle.textContent = 'Asesoría Virtual — recibirás respuesta en 24–48 h';
            formNota.style.display = 'flex';
            formNotaText.textContent = 'Un asesor se comunicará contigo por correo en un plazo de 24 a 48 horas hábiles.';
        }

        chipWrap.style.display = 'inline-flex';
        btnEnviar.disabled = false;
    }

    function deseleccionarServicio() {
        servicioSeleccionado = null;
        cardSoporte.classList.remove('selected');
        cardAsesoria.classList.remove('selected');
        formPanel.classList.remove('has-selection');
        hintBadge.style.opacity = '1';
        chipWrap.style.display  = 'none';
        formNota.style.display  = 'none';
        formSubtitle.textContent = '← Selecciona un servicio para continuar';
        btnEnviar.disabled = true;
    }

    cardSoporte?.addEventListener('click',  () => seleccionarServicio('soporte'));
    cardAsesoria?.addEventListener('click', () => seleccionarServicio('asesoria'));
    btnDeselect?.addEventListener('click',  (e) => { e.stopPropagation(); deseleccionarServicio(); });

    function generarRadicado() {
        return Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }
    function abrirModal(overlayId) {
        document.getElementById(overlayId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function cerrarModal(overlayId) {
        document.getElementById(overlayId).classList.remove('active');
        document.body.style.overflow = '';
    }

    ['modal-soporte-overlay','modal-soporte-confirm-overlay','modal-asesoria-overlay'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            if (e.target === document.getElementById(id)) cerrarModal(id);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['modal-soporte-overlay','modal-soporte-confirm-overlay','modal-asesoria-overlay'].forEach(cerrarModal);
        }
    });

    // Enviar solicitud — guarda en la BD
    btnEnviar?.addEventListener('click', async () => {
        const nombre  = document.getElementById('servicio-nombre')?.value.trim();
        const email   = document.getElementById('servicio-email')?.value.trim();
        const mensaje = document.getElementById('servicio-mensaje')?.value.trim();

        if (!nombre)  { alert('Por favor ingresa tu nombre completo.');   return; }
        if (!email || !email.includes('@')) { alert('Ingresa un correo electrónico válido.'); return; }
        if (!mensaje) { alert('Por favor describe tu solicitud o problema.'); return; }
        if (!servicioSeleccionado) { alert('Selecciona primero un servicio.'); return; }

        // Guardar en la BD (id_servicio: 1=soporte, 2=asesoría)
        const id_servicio = servicioSeleccionado === 'soporte' ? 1 : 2;
        try {
            await fetch(`${API}/servicios/solicitud`, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    id_servicio,
                    id_usuario    : sesionUsuario?.id_usuario || null,
                    nombre_cliente: nombre,
                    correo_cliente: email,
                    mensaje
                })
            });
        } catch (err) {
            console.warn('No se pudo guardar la solicitud en BD:', err.message);
        }

        if (servicioSeleccionado === 'soporte') {
            document.getElementById('modal-fechas-nombre').textContent = nombre;
            document.getElementById('modal-fechas-email').textContent  = email;
            document.querySelectorAll('input[name="fecha-soporte"]').forEach(r => r.checked = false);
            abrirModal('modal-soporte-overlay');
        } else {
            const radicado = generarRadicado();
            document.getElementById('confirm-asesoria-nombre').textContent = nombre;
            document.getElementById('confirm-asesoria-email').textContent  = email;
            document.getElementById('numero-radicado-asesoria').textContent = radicado;
            abrirModal('modal-asesoria-overlay');
        }
    });

    document.getElementById('btn-confirmar-fecha')?.addEventListener('click', () => {
        const selected = document.querySelector('input[name="fecha-soporte"]:checked');
        if (!selected) { alert('Por favor selecciona una fecha disponible.'); return; }

        const nombre   = document.getElementById('servicio-nombre')?.value.trim();
        const email    = document.getElementById('servicio-email')?.value.trim();
        const radicado = generarRadicado();

        document.getElementById('confirm-soporte-nombre').textContent = nombre;
        document.getElementById('confirm-soporte-fecha').textContent  = selected.value;
        document.getElementById('confirm-soporte-email').textContent  = email;
        document.getElementById('numero-radicado-soporte').textContent = radicado;

        cerrarModal('modal-soporte-overlay');
        abrirModal('modal-soporte-confirm-overlay');
    });

    document.getElementById('btn-cerrar-soporte')?.addEventListener('click',
        () => cerrarModal('modal-soporte-overlay'));
    document.getElementById('btn-cerrar-soporte-confirm')?.addEventListener('click', () => {
        cerrarModal('modal-soporte-confirm-overlay');
        deseleccionarServicio();
        document.getElementById('servicio-nombre').value  = '';
        document.getElementById('servicio-email').value   = '';
        document.getElementById('servicio-mensaje').value = '';
    });
    document.getElementById('btn-cerrar-asesoria')?.addEventListener('click', () => {
        cerrarModal('modal-asesoria-overlay');
        deseleccionarServicio();
        document.getElementById('servicio-nombre').value  = '';
        document.getElementById('servicio-email').value   = '';
        document.getElementById('servicio-mensaje').value = '';
    });

    // 13. FORMULARIO DE CONTACTO

    const btnEnviarContacto = document.getElementById('btn-enviar-contacto');
    btnEnviarContacto?.addEventListener('click', () => {
        const nombre  = document.getElementById('contacto-nombre')?.value.trim();
        const email   = document.getElementById('contacto-email')?.value.trim();
        const mensaje = document.getElementById('contacto-mensaje')?.value.trim();

        if (!nombre)  { alert('Por favor ingresa tu nombre completo.'); return; }
        if (!email || !email.includes('@')) { alert('Ingresa un correo electrónico válido.'); return; }
        if (!mensaje) { alert('Por favor escribe tu mensaje.'); return; }

        document.getElementById('confirm-contacto-nombre').textContent = nombre;
        document.getElementById('confirm-contacto-email').textContent  = email;

        document.getElementById('modal-contacto-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const cerrarContactoModal = () => {
        document.getElementById('modal-contacto-overlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('contacto-nombre').value  = '';
        document.getElementById('contacto-email').value   = '';
        document.getElementById('contacto-mensaje').value = '';
    };
    document.getElementById('btn-cerrar-contacto')?.addEventListener('click', cerrarContactoModal);
    document.getElementById('btn-cerrar-contacto-2')?.addEventListener('click', cerrarContactoModal);
    document.getElementById('modal-contacto-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-contacto-overlay')) cerrarContactoModal();
    });

    // INICIALIZACIÓN
    
    updateCartBadge();
    renderCartView();
    actualizarNavUsuario();   // Restaurar sesión si existía
    cargarProductos();        // Carga desde MySQL 

});
