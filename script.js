let db = null;
const DB_NAME = 'Products'
const DB_VERSION = 1
const STORE_NAME = 'products'

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = function (event) {
            db = event.target.result

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                })

                store.createIndex('name_idx', 'name', { unique: false })
                store.createIndex('date_idx', 'expiryDate', { unique: false })
                
                console.log('Хранилище создано')
            }
        }

        request.onsuccess = function (event) {
            db = event.target.result
            console.log('База данных открыта')
            resolve(db)
        }

        request.onerror = function (event) {
            console.log('Ошибка открытия базы')
            reject(event.target.error)
        }
    })
}

function addProduct(product) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('База данных не открыта')
            return
        }

        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const request = store.add(product)

        request.onsuccess = function () {
            console.log('Продукт добавлен, id:', request.result)
            resolve(request.result)
        }

        request.onerror = function (event) {
            console.error('Ошибка добавления:', event.target.error)
            reject(event.target.error)
        }
    })
}

function getAllProducts() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('База данных не открыта')
            return
        }

        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)

        const request = store.getAll()

        request.onsuccess = function () {
            resolve(request.result)
        }

        request.onerror = function (event) {
            console.error('Ошибка получения:', event.target.error)
            reject(event.target.error)
        }
    })
}

function updateProduct(product) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('База данных не открыта')
            return
        }

        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const request = store.put(product)

        request.onsuccess = function () {
            console.log('Продукт обновлен')
            resolve()
        }

        request.onerror = function (event) {
            console.error('Ошибка обновления:', event.target.error)
            reject(event.target.error)
        }
    })
    // const product = products.find(p => p.id === productId)
    // if (!product) return

    // const input = document.createElement('input')
    // input.type = 'file'
    // input.accept = 'image/*'

    // input.onchange = function(event) {
    //     const file = event.target.files[0];
    //     if (!file) return

    //     if (!file.type.startsWith('image/')) {
    //         alert('Выберите файл для изображения!')
    //         return
    //     }

    //     const reader = new FileReader()

    //     reader.onload = function(e) {
    //         product.image = e.target.result
    //         showProducts()
    //     }

    //     reader.readAsDataURL(file)
    // }

    // input.click()
}

function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('База данных не открыта')
            return
        }

        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const request = store.delete(id)

        request.onsuccess = function () {
            console.log('Продукт удален')
            resolve()
        }

        request.onerror = function (event) {
            console.error('Ошибка удаления:', event.target.error)
            reject(event.target.error)
        }
    })
}

async function showProducts() {
    const container = document.getElementById('products-container')
    container.innerHTML = ''

    try {
        const products = await getAllProducts()

        products.forEach(product => {
        const div = document.createElement('div')
        div.classList.add('product')
        div.innerHTML = `
        <h3>${product.name}</h3>
        <p>Срок: ${product.exprityDate}</p>

        <div class="image-preview" id="preview-${product.id}">
        ${product.image
                ? `<img src="${product.image}" alt="${product.name}">`
                : 'Нет фото'
            }
        </div>

        <input type="file"
        id="file-${product.id}"
        accept="image/*"
        style="display: none;">
        <button onclick="uploadPhoto(${product.id})">
        Загрузить фото
        </button>

        ${product.image
                ? `<button onclick="removePhoto(${product.id})">Удалить фото</button>`
                : ''
            }

        <button onclick="deleteProductFromDB(${product.id})" style="margin-top: 10px;">
        Удалить продукт
        </button>
        `;

        container.append(div)
    });

    showData(products)
    } catch (error) {
        console.error('Ошибка при показе продуктов', error)
    }
}

async function uploadPhoto(productId) {
    try {
        const products = await getAllProducts()
        const product = products.find(p => p.id === productId)
    if (!product) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Выберите файл для изображения!')
            return
        }

        const reader = new FileReader()

        reader.onload = async function(e) {
            product.image = e.target.result

            await updateProduct(product)
            await showProducts()
        }

        reader.readAsDataURL(file)
    }

    input.click()
    } catch(error) {
        console.error('Ошибка при загрузке фото:', error)
   }
}



async function removePhoto(productId) {
    try {
        const products = await getAllProducts()
        const product = products.find(p => p.id === productId)
    if (!product) return

    product.image = null

    await updateProduct(product)
    await showProducts()
    } catch {
        console.error('Ошибка при удалении фото:', error)
    }
}

async function deleteProductFromDB(productId) {
    if (!confirm('Удалить этот продукт?')) return

        try {
            await deleteProduct(productId)
            await showProducts()
        } catch {
            console.error('Ошибка при удалении:', error)
        }
}

function showData(products) {
    const output = document.getElementById('data-output')
    const simpleData = products.map(p => ({
        id: p.id,
        name: p.name,
        hasImage: p.image ? 'Да' : 'Нет'
    }))

    output.textContent = JSON.stringify(simpleData, null, 2)
}

async function addSampleProducts() {
    const sampleProducts = [
        {
            name: 'Молоко',
            exprityDate: '2025-12-25',
            image: null,
        },
        {
            name: 'Йогурт',
            exprityDate: '2025-12-15',
            image: null,
        }
    ];

    try {
        for (const product of sampleProducts) {
            await addProduct(product)
        }
        console.log('Тестовые продукты добавлены')
        await showProducts()
    } catch (error) {
        console.error('Ошибка при добавлении тестовых продуктов', error)
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    await openDatabase()
    await showProducts()
})

window.uploadPhoto = uploadPhoto;
window.removePhoto = removePhoto;
window.deleteProductFromDB = deleteProductFromDB;

window.addSampleProducts = addSampleProducts
