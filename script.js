document.addEventListener("DOMContentLoaded", () => {
    const productGrid = document.getElementById("product-grid");
    const energyBeanFiltersContainer = document.getElementById("energy-bean-filters");
    const wishlistBtn = document.getElementById("wishlist-btn");
    const wishlistCountSpan = document.getElementById("wishlist-count");
    const wishlistModal = document.getElementById("wishlist-modal");
    const closeBtn = wishlistModal.querySelector(".close-btn");
    const wishlistItemsContainer = document.getElementById("wishlist-items");
    const totalEnergyBeansSpan = document.getElementById("total-energy-beans");

    // Image Viewer Modal Elements
    const imageViewerModal = document.getElementById("image-viewer-modal");
    const imageViewerSrc = document.getElementById("image-viewer-src");
    const closeViewerBtn = imageViewerModal.querySelector(".close-viewer-btn");

    let allProducts = [];
    let wishlist = [];
    let currentEnergyFilter = "all";

    const detailKeyTranslations = {
        "taste": "口感",
        "health": "健康",
        "quantity": "分量",
        "reputation": "口碑"
    };

    async function fetchProducts() {
        try {
            const response = await fetch("data.json");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            populateEnergyBeanFilters(allProducts);
            loadWishlist(); 
            renderProducts(allProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
            productGrid.innerHTML = "<p>加载商品数据失败，请稍后再试。</p>";
        }
    }

    function populateEnergyBeanFilters(products) {
        energyBeanFiltersContainer.innerHTML = "";
        let energyValues = [...new Set(products.map(p => p.energyBeans))].sort((a, b) => a - b);
        const filterCategories = [];
        filterCategories.push({ text: "全部", value: "all", active: true });
        energyValues.filter(val => val < 8).forEach(val => {
            filterCategories.push({ text: `${val} 能量豆`, value: val.toString() });
        });
        if (energyValues.some(val => val >= 8)) {
            filterCategories.push({ text: "8豆及以上", value: "8+" });
        }
        filterCategories.forEach(cat => {
            const button = document.createElement("button");
            button.textContent = cat.text;
            button.dataset.energy = cat.value;
            if (cat.active) button.classList.add("active");
            button.addEventListener("click", () => filterByEnergy(cat.value));
            energyBeanFiltersContainer.appendChild(button);
        });
    }

    function filterByEnergy(energyValue) {
        currentEnergyFilter = energyValue;
        let filteredProducts;
        if (energyValue === "all") {
            filteredProducts = allProducts;
        } else if (energyValue === "8+") {
            filteredProducts = allProducts.filter(p => p.energyBeans >= 8);
        } else {
            filteredProducts = allProducts.filter(p => p.energyBeans === parseInt(energyValue));
        }
        renderProducts(filteredProducts);
        const buttons = energyBeanFiltersContainer.querySelectorAll("button");
        buttons.forEach(button => {
            button.classList.toggle("active", button.dataset.energy === energyValue);
        });
    }

    function renderProducts(productsToRender) {
        productGrid.innerHTML = "";
        if (productsToRender.length === 0) {
            productGrid.innerHTML = "<p style=\"text-align:center; color: #073B4C; font-weight: bold;\">没有找到符合条件的商品。</p>";
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("product-card");
            card.dataset.id = product.id;
            const isWishlisted = wishlist.some(item => item.id === product.id);

            let dimensionTabsHtml = "";
            let firstDetailKey = "";
            let firstDetailContent = "无详细信息";
            if (product.details && Object.keys(product.details).length > 0) {
                const detailKeys = Object.keys(product.details);
                firstDetailKey = detailKeys[0];
                firstDetailContent = product.details[firstDetailKey];
                detailKeys.forEach((key, index) => {
                    dimensionTabsHtml += `<button class=\"dimension-tab-btn ${index === 0 ? "active" : ""}\" data-detail-key=\"${key}\">${detailKeyTranslations[key] || key}</button>`;
                });
            } else {
                 dimensionTabsHtml = `<span style=\"font-size:0.9em; color: #6c757d;\">暂无维度信息</span>`;
            }

            let reviewsHtml = "";
            if (product.reviews && product.reviews.length > 0) {
                product.reviews.forEach(review => {
                    reviewsHtml += `<span class=\"tag\">${review}</span>`;
                });
            } else {
                reviewsHtml = `<span class=\"tag\">暂无评价</span>`;
            }

            card.innerHTML = `
                <div class="product-card-image-container" data-img-src="${product.image}">
                    <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<p style=\'text-align:center;color:grey;\'>图片加载失败</p>';">
                </div>
                <div class="product-card-info">
                    <div class="product-card-header">
                        <h3>${product.name}</h3>
                        <button class="heart-btn ${isWishlisted ? "active" : ""}" data-id="${product.id}">❤</button>
                    </div>
                    <div class="product-card-meta">
                        <span class="price">¥${product.price.toFixed(2)}</span>
                        <span class="energy-beans">${product.energyBeans} 能量豆</span>
                    </div>
                </div>
                <div class="card-details-section">
                    <div class="card-dimension-tabs">
                        ${dimensionTabsHtml}
                    </div>
                    <div class="card-dimension-content">
                        ${firstDetailContent}
                    </div>
                    <div class="card-reviews-tags">
                        ${reviewsHtml}
                    </div>
                </div>
            `;
            productGrid.appendChild(card);

            // Event listener for image click to open viewer
            const imageContainer = card.querySelector(".product-card-image-container");
            imageContainer.addEventListener("click", () => {
                imageViewerSrc.src = imageContainer.dataset.imgSrc;
                imageViewerModal.style.display = "flex"; // Use flex to center content
            });

            if (product.details && Object.keys(product.details).length > 0) {
                const dimensionTabButtons = card.querySelectorAll(".dimension-tab-btn");
                const dimensionContentDiv = card.querySelector(".card-dimension-content");
                dimensionTabButtons.forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const detailKey = btn.dataset.detailKey;
                        if (product.details && product.details[detailKey]) {
                            dimensionContentDiv.textContent = product.details[detailKey];
                            dimensionTabButtons.forEach(innerBtn => innerBtn.classList.remove("active"));
                            btn.classList.add("active");
                        }
                    });
                });
            }
        });

        addEventListenersToHeartButtons();
    }

    function addEventListenersToHeartButtons() {
        const heartButtons = productGrid.querySelectorAll(".heart-btn");
        heartButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const productId = parseInt(newBtn.dataset.id);
                toggleWishlist(productId, newBtn);
            });
        });
    }

    function toggleWishlist(productId, heartBtn) {
        const productIndex = wishlist.findIndex(item => item.id === productId);
        const productData = allProducts.find(p => p.id === productId);
        if (productIndex > -1) {
            wishlist.splice(productIndex, 1);
            if (heartBtn) heartBtn.classList.remove("active");
        } else {
            if (productData) {
                wishlist.push(productData);
                if (heartBtn) heartBtn.classList.add("active");
            }
        }
        updateWishlistUI();
        saveWishlist();
    }

    function updateWishlistUI() {
        wishlistCountSpan.textContent = wishlist.length;
        wishlistItemsContainer.innerHTML = "";
        let totalBeans = 0;
        if (wishlist.length === 0) {
            wishlistItemsContainer.innerHTML = "<p>你的心愿单是空的。</p>";
        } else {
            wishlist.forEach(item => {
                const listItem = document.createElement("div");
                listItem.classList.add("wishlist-item");
                listItem.innerHTML = `
                    <span>${item.name} (能量豆: ${item.energyBeans})</span>
                    <button class="remove-wishlist-item" data-id="${item.id}">移除</button>
                `;
                wishlistItemsContainer.appendChild(listItem);
                totalBeans += item.energyBeans;
            });
            const removeButtons = wishlistItemsContainer.querySelectorAll(".remove-wishlist-item");
            removeButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const productIdToRemove = parseInt(btn.dataset.id);
                    const productCardHeartBtn = productGrid.querySelector(`.product-card[data-id="${productIdToRemove}"] .heart-btn`);
                    toggleWishlist(productIdToRemove, productCardHeartBtn);
                });
            });
        }
        totalEnergyBeansSpan.textContent = totalBeans;
    }

    function saveWishlist() {
        localStorage.setItem("samShopWishlist", JSON.stringify(wishlist.map(item => item.id)));
    }

    function loadWishlist() {
        const savedWishlistIds = JSON.parse(localStorage.getItem("samShopWishlist"));
        if (savedWishlistIds && Array.isArray(savedWishlistIds) && allProducts.length > 0) {
            wishlist = savedWishlistIds.map(id => allProducts.find(p => p.id === id)).filter(p => p); 
        }
        updateWishlistUI(); 
    }

    // Event Listeners for Modals
    wishlistBtn.addEventListener("click", () => {
        wishlistModal.style.display = "block";
    });
    closeBtn.addEventListener("click", () => {
        wishlistModal.style.display = "none";
    });
    window.addEventListener("click", (event) => {
        if (event.target === wishlistModal) {
            wishlistModal.style.display = "none";
        }
        if (event.target === imageViewerModal) { // Close image viewer if background is clicked
            imageViewerModal.style.display = "none";
        }
    });

    // Close image viewer modal with its own button
    closeViewerBtn.addEventListener("click", () => {
        imageViewerModal.style.display = "none";
    });

    fetchProducts();
});

