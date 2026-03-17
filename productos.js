;(function () {
  let allProducts = []

  const productList = document.getElementById("product-list")
  const searchInput = document.getElementById("search")

  function renderProducts(list) {
    if (!productList) return
    productList.innerHTML = ""

    if (list.length === 0) {
      productList.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:80px 20px; color:var(--text-muted);">
          <i class="fas fa-search" style="font-size:32px; margin-bottom:16px; display:block; opacity:0.4;"></i>
          <p style="font-size:15px;">No se encontraron productos</p>
        </div>
      `
      return
    }

    list.forEach((product, i) => {
      const card = window.buildCard ? window.buildCard(product) : buildFallbackCard(product)
      card.style.animationDelay = `${i * 0.06}s`
      productList.appendChild(card)
    })
  }

  function buildFallbackCard(product) {
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
      if (window.openProductModal) openProductModal(product.id)
    })
    return card
  }

  async function loadProducts() {
    try {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("API error")
      allProducts = await res.json()
    } catch (err) {
      allProducts = window.PRODUCTS || []
    }
    renderProducts(allProducts)
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const q = this.value.trim().toLowerCase()
      const filtered = q ? allProducts.filter((p) => p.name.toLowerCase().includes(q)) : allProducts
      renderProducts(filtered)
    })
  }

  loadProducts()
})()
