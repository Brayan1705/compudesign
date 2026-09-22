document.addEventListener('DOMContentLoaded', () => {

    const API = '/api';

    // ── Autenticación y Sesión ──
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
        const authTabs = document.querySelector('.auth-tabs');
        const formPerfil = document.getElementById('form-perfil');
        const formLogin = document.getElementById('form-login');
        const formRegistro = document.getElementById('form-registro');
        const formRecuperar = document.getElementById('form-recuperar');

        if (sesionUsuario) {
            const nombre = sesionUsuario.nombre_completo ? sesionUsuario.nombre_completo.split(' ')[0] : 'Usuario';
            if (userLabel) userLabel.textContent = nombre;
            if (userIcon) userIcon.title = `Sesión: ${sesionUsuario.nombre_completo}`;

            const perfilNombre = document.getElementById('perfil-nombre');
            const perfilCorreo = document.getElementById('perfil-correo');
            const perfilSaludo = document.getElementById('perfil-saludo');
            const perfilAvatar = document.getElementById('perfil-avatar-letra');

            if (perfilNombre) perfilNombre.textContent = sesionUsuario.nombre_completo || 'Usuario';
            if (perfilCorreo) perfilCorreo.textContent = sesionUsuario.correo || '';
            if (perfilSaludo) perfilSaludo.textContent = `¡Hola, ${nombre}!`;
            if (perfilAvatar) perfilAvatar.textContent = nombre.charAt(0).toUpperCase();

            if (authTabs) authTabs.style.display = 'none';
            formLogin?.classList.remove('active');
            formRegistro?.classList.remove('active');
            formRecuperar?.classList.remove('active');
            formPerfil?.classList.add('active');

        } else {
            if (userLabel) userLabel.textContent = '';
            if (userIcon) userIcon.title = 'Iniciar sesión';

            if (authTabs) authTabs.style.display = 'flex';
            formPerfil?.classList.remove('active');
            formRecuperar?.classList.remove('active');
            formLogin?.classList.add('active');
            formRegistro?.classList.remove('active');
        }
    }

    // ── Catálogo de Productos ──
    let products = [];

    async function cargarProductos() {
        const bannerCatalogo = document.getElementById('catalogo-error-banner');
        const bannerInicio   = document.getElementById('inicio-error-banner');

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
                if (bannerCatalogo) bannerCatalogo.style.display = 'none';
                if (bannerInicio)   bannerInicio.style.display   = 'none';
            } else {
                throw new Error('Sin datos en la API');
            }
        } catch (err) {
            console.error('❌ Microservicio de Productos no disponible:', err.message);
            products = [];
            if (bannerCatalogo) bannerCatalogo.style.display = 'block';
            if (bannerInicio)   bannerInicio.style.display   = 'block';
        }
        renderDestacados();
        aplicarFiltros();
    }

    // ── Estado Global ──
    let cart = [];
    let shippingCost = 0;
    let shippingLabel = 'Gratis';
    let selectedPayment = null;
    let selectedPaymentId = null;  

    let filtroCategoria = '';
    let filtroMinPrecio = 0;
    let filtroMaxPrecio = 99999999;
    let filtroOrden = 'nombre';
    const ITEMS_POR_PAGINA = 8;
    let paginaActual = 1;

    function formatCOP(amount) {
        return '$' + Math.round(amount).toLocaleString('es-CO');
    }

    // ── Sistema de Navegación ──
    const navButtons = document.querySelectorAll('.nav-btn');
    const vistas = document.querySelectorAll('.vista');
    const cartBadge = document.getElementById('cart-count');

    function navigateTo(targetId, filter = null, scrollTo = null, featuredFilter = undefined, clickedBtn = null) {
        if (!targetId) return;
        vistas.forEach(v => v.classList.remove('active'));
        const targetVista = document.getElementById(targetId);
        if (targetVista) targetVista.classList.add('active');

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
            closeMobileMenu();
        });
    });

    // ── Menú Móvil ──
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const navEl = document.querySelector('nav');

    function openMobileMenu() {
        document.body.classList.add('nav-open');
        menuToggleBtn?.setAttribute('aria-expanded', 'true');
    }
    function closeMobileMenu() {
        document.body.classList.remove('nav-open');
        menuToggleBtn?.setAttribute('aria-expanded', 'false');
        document.querySelectorAll('.dropdown-parent.open').forEach(el => el.classList.remove('open'));
    }
    function toggleMobileMenu() {
        document.body.classList.contains('nav-open') ? closeMobileMenu() : openMobileMenu();
    }
    menuToggleBtn?.addEventListener('click', toggleMobileMenu);
    mobileNavOverlay?.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.dropdown-parent > a').forEach(dropdownLink => {
        dropdownLink.addEventListener('click', (e) => {
            if (window.innerWidth > 900) return;
            const parent = dropdownLink.closest('.dropdown-parent');
            const isOpen = parent.classList.contains('open');
            if (!isOpen) {
                e.preventDefault();
                e.stopImmediatePropagation();
                document.querySelectorAll('.dropdown-parent.open').forEach(el => { if (el !== parent) el.classList.remove('open'); });
                parent.classList.add('open');
            }
        });
    });

    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMobileMenu(); });

    // ── Catálogo y Filtros ──
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

    // ── Modal de Detalle y Visor 3D ──
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

        if (window.init3DViewer) {
            window.init3DViewer(p.id, p.category);
        }
    }

    function closeProductModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
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

    // ── Carrito de Compras ──

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

    // ── Opciones de Envío ──
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

    // ── Proceso de Pago ──
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

    const btnConfirmarPedido = document.getElementById('btn-confirmar-pedido');
    const msgCheckoutError   = document.getElementById('checkout-error-msg');

    function mostrarErrorCheckout(texto) {
        if (msgCheckoutError) {
            msgCheckoutError.textContent = texto;
            msgCheckoutError.style.display = 'block';
            msgCheckoutError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(texto);
        }
    }

    function limpiarErrorCheckout() {
        if (msgCheckoutError) {
            msgCheckoutError.textContent = '';
            msgCheckoutError.style.display = 'none';
        }
    }

    if (btnConfirmarPedido) {
        btnConfirmarPedido.addEventListener('click', async () => {
            limpiarErrorCheckout();

            if (cart.length === 0) {
                mostrarErrorCheckout('Tu carrito está vacío. Agrega productos antes de confirmar.');
                return;
            }

            if (!sesionUsuario) {
                mostrarErrorCheckout('Debes iniciar sesión con tu cuenta para procesar y registrar el pedido.');
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

            btnConfirmarPedido.disabled = true;
            btnConfirmarPedido.textContent = 'Procesando con microservicio...';

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

                let json = null;
                try {
                    json = await res.json();
                } catch (e) {
                    json = null;
                }

                if (!res.ok || !json || !json.ok) {
                    // Validación de respuesta del microservicio de pedidos
                    btnConfirmarPedido.disabled = false;
                    btnConfirmarPedido.textContent = 'Confirmar pedido';

                    let motivo = (json && json.mensaje) ? json.mensaje : '';
                    if (!motivo) {
                        if (res.status === 503) {
                            motivo = 'El microservicio de Pedidos o Catálogo está fuera de línea en este momento (Proceso detenido).';
                        } else if (res.status === 502 || res.status === 504) {
                            motivo = 'Tiempo de espera agotado al conectar con el microservicio.';
                        } else {
                            motivo = 'No se pudo procesar la solicitud en el servidor.';
                        }
                    }

                    mostrarErrorCheckout(`🚨 Error al procesar el pedido (HTTP ${res.status}): ${motivo}`);
                    return;
                }

                const numEl = document.getElementById('numero-pedido');
                if (numEl) numEl.textContent = `Pedido #${json.id_pedido}`;

                cart = [];
                shippingCost = 0;
                shippingLabel = 'Gratis';
                selectedPayment = null;
                selectedPaymentId = null;
                updateCartBadge();
                btnConfirmarPedido.disabled = false;
                btnConfirmarPedido.textContent = 'Confirmar pedido';
                navigateTo('vista-confirmacion');

            } catch (err) {
                btnConfirmarPedido.disabled = false;
                btnConfirmarPedido.textContent = 'Confirmar pedido';
                mostrarErrorCheckout(`🚨 Error de conexión con el microservicio de Pedidos: ${err.message}. Verifica que los servicios estén activos.`);
            }
        });
    }

    const btnVolverInicio = document.getElementById('btn-volver-inicio-confirm');
    if (btnVolverInicio) {
        btnVolverInicio.addEventListener('click', () => {
            navigateTo('vista-inicio');
        });
    }

    // ── Banner Principal ──

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

    // ── Autenticación de Usuarios ──
    const formLogin    = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const tabLogin     = document.getElementById('tab-login');
    const tabRegistro  = document.getElementById('tab-registro');

    const loginEmail    = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const btnLogin      = document.getElementById('btn-login');
    const msgLogin      = document.getElementById('msg-login');

    const regNombre   = document.getElementById('registro-nombre');
    const regEmail    = document.getElementById('registro-email');
    const regPassword = document.getElementById('registro-password');
    const regTelefono = document.getElementById('registro-telefono');
    const btnRegistro = document.getElementById('btn-registro');
    const msgRegistro = document.getElementById('msg-registro');

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

    const formPerfil     = document.getElementById('form-perfil');
    const formRecuperar  = document.getElementById('form-recuperar');
    const msgRecuperar   = document.getElementById('msg-recuperar');
    const authTabsWrap   = document.querySelector('.auth-tabs');

    function showLoginForm() {
        formLogin?.classList.add('active');
        formRegistro?.classList.remove('active');
        formRecuperar?.classList.remove('active');
        formPerfil?.classList.remove('active');
        tabLogin?.classList.add('active');
        tabRegistro?.classList.remove('active');
        if (authTabsWrap) authTabsWrap.style.display = 'flex';
        limpiarMensaje(msgLogin);
    }

    function showRegistroForm() {
        formRegistro?.classList.add('active');
        formLogin?.classList.remove('active');
        formRecuperar?.classList.remove('active');
        formPerfil?.classList.remove('active');
        tabRegistro?.classList.add('active');
        tabLogin?.classList.remove('active');
        if (authTabsWrap) authTabsWrap.style.display = 'flex';
        limpiarMensaje(msgRegistro);
    }

    function showRecuperarForm() {
        formRecuperar?.classList.add('active');
        formLogin?.classList.remove('active');
        formRegistro?.classList.remove('active');
        formPerfil?.classList.remove('active');
        if (authTabsWrap) authTabsWrap.style.display = 'none';
        limpiarMensaje(msgRecuperar);
    }

    tabLogin?.addEventListener('click', showLoginForm);
    tabRegistro?.addEventListener('click', showRegistroForm);

    document.getElementById('switch-to-registro')?.addEventListener('click', showRegistroForm);
    document.getElementById('switch-to-login')?.addEventListener('click', showLoginForm);
    document.getElementById('link-olvido-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        showRecuperarForm();
    });
    document.getElementById('switch-recuperar-to-login')?.addEventListener('click', showLoginForm);

    document.getElementById('btn-perfil-catalogo')?.addEventListener('click', () => {
        navigateTo('vista-catalogo');
    });
    document.getElementById('btn-perfil-logout')?.addEventListener('click', () => {
        cerrarSesion();
        showLoginForm();
    });

    document.getElementById('user-nav-icon')?.addEventListener('click', () => {
        navigateTo('vista-login');
        actualizarNavUsuario();
    });

    btnLogin?.addEventListener('click', async () => {
        const correo    = loginEmail?.value.trim();
        const contrasena = loginPassword?.value;

        if (!correo || !contrasena) {
            mostrarMensaje(msgLogin, 'Por favor completa todos los campos.');
            return;
        }

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
                if (loginEmail)    loginEmail.value    = '';
                if (loginPassword) loginPassword.value = '';
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

    btnRegistro?.addEventListener('click', async () => {
        const nombre_completo = regNombre?.value.trim();
        const correo          = regEmail?.value.trim();
        const contrasena      = regPassword?.value;
        const telefono        = regTelefono?.value.trim();

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
                guardarSesion(json.usuario);
                actualizarNavUsuario();
                if (regNombre)    regNombre.value    = '';
                if (regEmail)     regEmail.value     = '';
                if (regPassword)  regPassword.value  = '';
                if (regTelefono)  regTelefono.value  = '';
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

    const btnRecuperarSubmit = document.getElementById('btn-recuperar-submit');
    const recuperarEmailEl   = document.getElementById('recuperar-email');
    const recuperarPassEl    = document.getElementById('recuperar-password');

    btnRecuperarSubmit?.addEventListener('click', async () => {
        const correo         = recuperarEmailEl?.value.trim();
        const nuevaContrasena = recuperarPassEl?.value;

        if (!correo || !nuevaContrasena) {
            mostrarMensaje(msgRecuperar, 'Por favor completa todos los campos.');
            return;
        }
        if (!correo.includes('@')) {
            mostrarMensaje(msgRecuperar, 'Ingresa un correo electrónico válido.');
            return;
        }
        if (nuevaContrasena.length < 8) {
            mostrarMensaje(msgRecuperar, 'La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        btnRecuperarSubmit.disabled = true;
        btnRecuperarSubmit.textContent = 'Actualizando...';
        limpiarMensaje(msgRecuperar);

        try {
            const res = await fetch(`${API}/usuarios/recuperar-password`, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ correo, nueva_contrasena: nuevaContrasena })
            });
            const json = await res.json();

            if (json.ok) {
                mostrarMensaje(msgRecuperar, json.mensaje, 'success');
                if (recuperarEmailEl) recuperarEmailEl.value = '';
                if (recuperarPassEl)  recuperarPassEl.value  = '';

                setTimeout(() => {
                    showLoginForm();
                    if (loginEmail) loginEmail.value = correo;
                }, 2000);
            } else {
                mostrarMensaje(msgRecuperar, json.mensaje || 'No se pudo actualizar la contraseña.');
            }
        } catch (err) {
            mostrarMensaje(msgRecuperar, 'Error de conexión con el servidor. Intenta de nuevo.');
            console.error('Error recuperar password:', err);
        } finally {
            btnRecuperarSubmit.disabled = false;
            btnRecuperarSubmit.textContent = 'Actualizar contraseña';
        }
    });

    [loginEmail, loginPassword].forEach(el => {
        el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLogin?.click(); });
    });
    [regNombre, regEmail, regPassword, regTelefono].forEach(el => {
        el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnRegistro?.click(); });
    });
    [recuperarEmailEl, recuperarPassEl].forEach(el => {
        el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnRecuperarSubmit?.click(); });
    });

    document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
        cerrarSesion();
        showLoginForm();
    });

    // ── Datos Geográficos ──
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

    // ── Servicios Técnicos y Asesoría ──
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

    function generarFechasDisponibles() {
        const hoy = new Date();
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        const badgeMes = document.getElementById('modal-mes-badge');
        if (badgeMes) {
            const mesActual = meses[hoy.getMonth()];
            badgeMes.textContent = `${mesActual.charAt(0).toUpperCase() + mesActual.slice(1)} ${hoy.getFullYear()}`;
        }

        const contenedor = document.getElementById('fechas-soporte-lista') || document.querySelector('.fechas-lista');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        const slots = [
            { offset: 1, hora: '10:00 a.m.' },
            { offset: 3, hora: '02:00 p.m.' },
            { offset: 5, hora: '09:00 a.m.' }
        ];

        slots.forEach((slot, index) => {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() + slot.offset);

            if (fecha.getDay() === 0) {
                fecha.setDate(fecha.getDate() + 1);
            }

            const diaNombre = diasSemana[fecha.getDay()];
            const diaNum    = fecha.getDate();
            const mesNombre = meses[fecha.getMonth()];
            const anio      = fecha.getFullYear();

            const textoVisible  = `${diaNombre} · ${diaNum} de ${mesNombre} ${anio}`;
            const valorCompleto = `${diaNombre} ${diaNum} de ${mesNombre} ${anio} — ${slot.hora}`;

            const label = document.createElement('label');
            label.className = 'fecha-option';
            label.innerHTML = `
                <input type="radio" name="fecha-soporte" value="${valorCompleto}" ${index === 0 ? 'checked' : ''}>
                <span class="fecha-checkbox-custom"></span>
                <div class="fecha-detail">
                    <span class="fecha-day">${textoVisible}</span>
                    <span class="fecha-date">${slot.hora}</span>
                </div>
            `;
            contenedor.appendChild(label);
        });
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

    btnEnviar?.addEventListener('click', async () => {
        const nombre  = document.getElementById('servicio-nombre')?.value.trim();
        const email   = document.getElementById('servicio-email')?.value.trim();
        const mensaje = document.getElementById('servicio-mensaje')?.value.trim();

        if (!nombre)  { alert('Por favor ingresa tu nombre completo.');   return; }
        if (!email || !email.includes('@')) { alert('Ingresa un correo electrónico válido.'); return; }
        if (!mensaje) { alert('Por favor describe tu solicitud o problema.'); return; }
        if (!servicioSeleccionado) { alert('Selecciona primero un servicio.'); return; }

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
            generarFechasDisponibles();
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
    document.getElementById('btn-x-soporte')?.addEventListener('click',
        () => cerrarModal('modal-soporte-overlay'));

    const limpiarFormServicio = () => {
        deseleccionarServicio();
        const n = document.getElementById('servicio-nombre');
        const e = document.getElementById('servicio-email');
        const m = document.getElementById('servicio-mensaje');
        if (n) n.value = '';
        if (e) e.value = '';
        if (m) m.value = '';
    };

    document.getElementById('btn-cerrar-soporte-confirm')?.addEventListener('click', () => {
        cerrarModal('modal-soporte-confirm-overlay');
        limpiarFormServicio();
    });
    document.getElementById('btn-x-soporte-confirm')?.addEventListener('click', () => {
        cerrarModal('modal-soporte-confirm-overlay');
        limpiarFormServicio();
    });

    document.getElementById('btn-cerrar-asesoria')?.addEventListener('click', () => {
        cerrarModal('modal-asesoria-overlay');
        limpiarFormServicio();
    });
    document.getElementById('btn-x-asesoria')?.addEventListener('click', () => {
        cerrarModal('modal-asesoria-overlay');
        limpiarFormServicio();
    });

    // ── Formulario de Contacto ──
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

    // ── Inicialización ──
    updateCartBadge();
    renderCartView();
    actualizarNavUsuario();
    cargarProductos();
    generarFechasDisponibles();

});
