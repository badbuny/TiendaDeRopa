;(function () {
  let products = []
  let cart = JSON.parse(localStorage.getItem("cart")) || []

  const productList = document.getElementById("product-list")
  const cartItems = document.getElementById("cart-items")
  const cartCount = document.getElementById("cart-count")
  const cartTotal = document.getElementById("cart-total")

  const modalOverlay = document.getElementById("product-modal-overlay")
  const modalImage = document.getElementById("modal-product-image")
  const modalName = document.getElementById("modal-product-name")
  const modalPrice = document.getElementById("modal-product-price")
  const modalAddCart = document.getElementById("modal-add-cart")

  /* ---- BUILD PRODUCT CARD ---- */
  function buildCard(product) {
    const card = document.createElement("div")
    card.classList.add("product-card")

    card.innerHTML = `
      <div class="product-card-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-overlay">
          <button class="overlay-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
            <i class="fas fa-shopping-bag" style="margin-right:8px;"></i> Agregar
          </button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-info-left">
          <h3>${product.name}</h3>
          <span class="product-category">Ropa</span>
        </div>
        <span class="price">$${product.price}</span>
      </div>
    `

    card.addEventListener("click", (e) => {
      if (e.target.closest(".overlay-btn")) return
      openProductModal(product.id)
    })

    return card
  }

  /* ---- RENDER HOME PRODUCTS ---- */
  function renderHomeProducts() {
    if (!productList) return
    if (document.getElementById("search")) return

    productList.innerHTML = ""
    products.slice(0, 3).forEach((product, i) => {
      const card = buildCard(product)
      card.style.animationDelay = `${i * 0.08}s`
      productList.appendChild(card)
    })
  }

  /* ---- PRODUCT MODAL ---- */
  function openProductModal(id) {
    if (!modalOverlay || !modalImage || !modalName || !modalPrice || !modalAddCart) return
    const product = products.find((p) => p.id === id)
    if (!product) return

    modalImage.src = product.image
    modalImage.alt = product.name
    modalName.textContent = product.name
    modalPrice.textContent = `$${product.price}`

    modalAddCart.onclick = function () {
      addToCart(product.id)
      closeProductModal()
    }

    modalOverlay.classList.add("active")
  }

  function closeProductModal() {
    if (!modalOverlay) return
    modalOverlay.classList.remove("active")
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeProductModal()
    })
  }

  /* ---- LOAD PRODUCTS ---- */
  async function loadProducts() {
    try {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("API error")
      products = await res.json()
    } catch (err) {
      products = window.PRODUCTS || []
    }
    if (productList && !document.getElementById("search")) {
      renderHomeProducts()
    }
  }

  /* ---- ADD TO CART ---- */
  function addToCart(id) {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const existing = cart.find((item) => item.id === id)
    if (existing) {
      existing.qty++
    } else {
      cart.push({ ...product, qty: 1 })
    }

    saveCart()
    renderCart()
    // Brief flash on cart icon
    const icon = document.querySelector(".cart-icon")
    if (icon) {
      icon.style.transform = "scale(1.25)"
      setTimeout(() => { icon.style.transform = "" }, 200)
    }
  }

  /* ---- RENDER CART ---- */
  function renderCart() {
    if (!cartItems || !cartCount || !cartTotal) return

    cartItems.innerHTML = ""
    let total = 0
    let count = 0

    cart.forEach((item) => {
      total += item.price * item.qty
      count += item.qty

      const div = document.createElement("div")
      div.classList.add("cart-item")
      div.innerHTML = `
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-qty">Cantidad: ${item.qty}</div>
        </div>
        <span class="cart-item-price">$${item.price * item.qty}</span>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">
          <i class="fas fa-trash-alt"></i>
        </button>
      `
      cartItems.appendChild(div)
    })

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:rgba(245,240,232,0.35);">
          <i class="fas fa-shopping-bag" style="font-size:40px; margin-bottom:16px; display:block;"></i>
          <p style="font-size:14px; letter-spacing:1px;">Tu carrito está vacío</p>
        </div>
      `
    }

    cartTotal.textContent = total
    cartCount.textContent = count
  }

  /* ---- REMOVE FROM CART ---- */
  function removeFromCart(id) {
    cart = cart.filter((item) => item.id !== id)
    saveCart()
    renderCart()
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  /* ---- CHECKOUT ---- */
  async function handleCheckout() {
    if (!cart.length) {
      alert("Tu carrito está vacío")
      return
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const overlay = document.getElementById("checkout-modal-overlay")
    const nameInput = document.getElementById("checkout-name")
    const lastNameInput = document.getElementById("checkout-lastname")
    const cityInput = document.getElementById("checkout-city")
    const addressInput = document.getElementById("checkout-address")
    const housingTypeSelect = document.getElementById("checkout-housing-type")
    const apartmentInput = document.getElementById("checkout-apartment-number")
    const confirmBtn = document.getElementById("checkout-confirm")

    if (!overlay) { alert("No se encontró el formulario de checkout"); return }

    overlay.classList.add("active")

    confirmBtn.onclick = async function () {
      const name = nameInput.value.trim()
      const lastName = lastNameInput.value.trim()
      const city = cityInput.value.trim()
      const address = addressInput.value.trim()
      const housingType = housingTypeSelect.value
      const apartmentNumber = apartmentInput.value.trim()

      if (!name || !lastName || !city || !address || !housingType) {
        alert("Por favor completa todos los campos de envío")
        return
      }
      if (housingType === "apartamento" && !apartmentNumber) {
        alert("Por favor indica el número de apartamento")
        return
      }

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart, total, name, lastName, city, address, housingType, apartmentNumber }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.message || "Error al crear el pedido")

        const contacts = [
          { name: "Emanuel", phone: "573332732672" },
          { name: "Santiago", phone: "573146966976" },
          { name: "Andres", phone: "573245712919" },
        ]
        const contact = contacts[Math.floor(Math.random() * contacts.length)]

        const lines = []
        lines.push(`Nuevo pedido para ${contact.name}`)
        lines.push(`Cliente: ${name} ${lastName}`)
        lines.push(`Ciudad: ${city}`)
        lines.push(`Dirección: ${address}`)
        lines.push(`Tipo vivienda: ${housingType === "apartamento" ? "Apartamento" : "Casa"}`)
        if (housingType === "apartamento") lines.push(`Nº Apartamento: ${apartmentNumber}`)
        lines.push(`ID pedido: ${data.orderId}`)
        lines.push(`Total: $${total}`)
        lines.push("")
        lines.push("Detalle:")
        cart.forEach((item) => lines.push(`- ${item.name} x${item.qty} = $${item.price * item.qty}`))

        const text = encodeURIComponent(lines.join("\n"))
        window.open(`https://wa.me/${contact.phone}?text=${text}`, "_blank")

        cart = []
        saveCart()
        renderCart()
        overlay.classList.remove("active")
        closeCart()
      } catch (err) {
        console.error(err)
        alert("Ocurrió un error al procesar el pedido")
      }
    }
  }

  /* ---- PANEL & MENU ---- */
  function toggleCart() {
    const panel = document.getElementById("cart-panel")
    if (panel) panel.classList.toggle("active")
  }

  function toggleMenu() {
    const menu = document.getElementById("nav-links")
    if (menu) menu.classList.toggle("active")
  }

  document.addEventListener("click", function (e) {
    const cartPanel = document.getElementById("cart-panel")
    const icon = document.querySelector(".cart-icon")
    if (!cartPanel || !icon) return
    if (!cartPanel.contains(e.target) && !icon.contains(e.target)) {
      cartPanel.classList.remove("active")
    }
  })

  function closeCart() {
    const panel = document.getElementById("cart-panel")
    if (panel) panel.classList.remove("active")
  }

  /* ---- SCROLL HEADER ---- */
  window.addEventListener("scroll", function () {
    const header = document.querySelector("header")
    if (!header) return
    header.classList.toggle("scrolled", window.scrollY > 50)
  })

  /* ---- CHECKOUT HOUSING TYPE ---- */
  const checkoutOverlay = document.getElementById("checkout-modal-overlay")
  if (checkoutOverlay) {
    const housingTypeSelect = document.getElementById("checkout-housing-type")
    const apartmentInput = document.getElementById("checkout-apartment-number")
    if (housingTypeSelect && apartmentInput) {
      housingTypeSelect.addEventListener("change", function () {
        apartmentInput.style.display = this.value === "apartamento" ? "block" : "none"
        if (this.value !== "apartamento") apartmentInput.value = ""
      })
    }
    checkoutOverlay.addEventListener("click", (e) => {
      if (e.target === checkoutOverlay) checkoutOverlay.classList.remove("active")
    })
  }

  /* ---- EXPOSE GLOBALS ---- */
  window.addToCart = addToCart
  window.removeFromCart = removeFromCart
  window.toggleCart = toggleCart
  window.toggleMenu = toggleMenu
  window.closeCart = closeCart
  window.openProductModal = openProductModal
  window.closeProductModal = closeProductModal
  window.buildCard = buildCard

  /* ---- INIT ---- */
  renderCart()
  loadProducts()

  const checkoutBtn = document.querySelector(".checkout")
  if (checkoutBtn) checkoutBtn.addEventListener("click", handleCheckout)

})()
