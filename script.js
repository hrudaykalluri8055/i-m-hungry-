/* -----------------------
   Data & State
   ----------------------- */
const initialItems = [
  { id:1, title:'Spicy Pepperoni Pizza', category:'nonveg', price:499, img:'https://picsum.photos/seed/p1/600/400', available:true, rating:4.5, itemDiscount:0 },
  { id:2, title:'Gourmet Beef Burger', category:'nonveg', price:399, img:'https://picsum.photos/seed/p2/600/400', available:true, rating:4.6, itemDiscount:0 },
  { id:3, title:'Fresh Sushi Platter', category:'veg', price:699, img:'https://picsum.photos/seed/p3/600/400', available:true, rating:4.7, itemDiscount:0 },
  { id:4, title:'Crispy Fish Tacos', category:'nonveg', price:329, img:'https://picsum.photos/seed/p4/600/400', available:true, rating:4.2, itemDiscount:0 },
  { id:5, title:'Creamy Chicken Pasta', category:'nonveg', price:359, img:'https://picsum.photos/seed/p5/600/400', available:true, rating:4.3, itemDiscount:0 },
  { id:6, title:'Quinoa Power Salad', category:'veg', price:259, img:'https://picsum.photos/seed/p6/600/400', available:true, rating:4.1, itemDiscount:0 },
  { id:7, title:'Chocolate Lava Cake', category:'desserts', price:199, img:'https://picsum.photos/seed/p7/600/400', available:true, rating:4.9, itemDiscount:0 },
  { id:8, title:'Glazed Maple Donut', category:'desserts', price:99, img:'https://picsum.photos/seed/p8/600/400', available:true, rating:4.4, itemDiscount:0 }
];

const defaultCategories = ['all','veg','nonveg','starters','desserts'];

let menuItems = JSON.parse(localStorage.getItem('menuItems')) || initialItems;
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let addresses = JSON.parse(localStorage.getItem('addresses')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('user')) || null;
let dailyDiscount = Number(localStorage.getItem('dailyDiscount') || 0);

/* -----------------------
   Users & Auth
   ----------------------- */
let users = JSON.parse(localStorage.getItem('users')) || [];

const DEFAULT_ADMIN = {
  name: 'Admin',
  email: 'admin@chef.com',
  phone: '',
  password: 'admin123',
  role: 'admin'
};

function saveUsers(){
  localStorage.setItem('users', JSON.stringify(users));
}

function ensureDefaultAdmin(){
  if(!users.some(u => u.email && u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase())){
    users.push(DEFAULT_ADMIN);
    saveUsers();
  }
}
ensureDefaultAdmin();

/* -----------------------
   Save state helper
   ----------------------- */
function saveState(){
  localStorage.setItem('menuItems', JSON.stringify(menuItems));
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('addresses', JSON.stringify(addresses));
  localStorage.setItem('dailyDiscount', dailyDiscount);
  renderMenu();
  renderCart();
  renderAdminList();
}

/* -----------------------
   Renderers
   ----------------------- */
function renderMenu(filter='all'){
  const container = document.getElementById('menu');
  container.innerHTML='';
  const list = menuItems.filter(it => it.available && (filter==='all' || it.category===filter));
  list.forEach(item => {
    const div = document.createElement('div');
    div.className='card';
    const discountedPrice = (item.price * (1 - (item.itemDiscount||0)/100) * (1 - dailyDiscount/100));
    const showPriceHTML = item.itemDiscount > 0
      ? `<div><span style='text-decoration:line-through;color:#888'>₹${item.price.toFixed(2)}</span>
         <strong style='color:#d00'> ₹${(item.price * (1 - item.itemDiscount/100)).toFixed(2)}</strong>
         <div class="small-muted">After daily: ₹${discountedPrice.toFixed(2)}</div></div>`
      : `<div><strong>₹${item.price.toFixed(2)}</strong><div class="small-muted">After daily: ₹${discountedPrice.toFixed(2)}</div></div>`;
    div.innerHTML = `
      <img src="${item.img}" alt="">
      <h4>${item.title}</h4>
      <p class="small">Rating: ${item.rating} ★</p>
      <div class="meta">
        ${showPriceHTML}
        <div><button class="btn" onclick="addToCart(${item.id})">Add</button></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderAdminList(){
  const el = document.getElementById('adminList');
  if(!el) return;
  el.innerHTML = '';
  menuItems.forEach(it => {
    const row = document.createElement('div');
    row.style.display='flex';
    row.style.justifyContent='space-between';
    row.style.alignItems='center';
    row.style.padding='8px 0';
    row.style.gap = '10px';
    row.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600">${it.title}</div>
        <div class="small-muted">₹${it.price} • ${it.category} • Rating: ${it.rating}</div>
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <div>
          <label>Discount %</label><br />
          <input type="number" value="${it.itemDiscount||0}" min="0" max="100" style="width:70px" onchange="setItemDiscount(${it.id}, this.value)" />
        </div>
        <div>
          <label class="toggle"><input type="checkbox" ${it.available ? 'checked' : ''} onchange="toggleAvailable(${it.id}, this.checked)" /> Available</label>
        </div>
        <div><button onclick="editItem(${it.id})">Edit</button></div>
        <div><button onclick="removeItem(${it.id})" style="color:#a00">Delete</button></div>
      </div>
    `;
    el.appendChild(row);
  })
}

function renderCart(){
  document.getElementById('cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  const itemsEl = document.getElementById('cartItems');
  itemsEl.innerHTML='';
  if(cart.length===0){ itemsEl.innerHTML='<div class="small">Your cart is empty</div>'; document.getElementById('cartTotal').textContent='₹0.00'; return; }
  let total = 0;
  cart.forEach(ci=>{
    const item = menuItems.find(m=>m.id===ci.id);
    if(!item) return;
    let price = item.price;
    if (item.itemDiscount) price = price * (1 - item.itemDiscount/100);
    price = price * (1 - dailyDiscount/100);
    const line = document.createElement('div');
    line.className='cart-item';
    line.innerHTML = `
      <div style="flex:1">
        <div><strong>${item.title}</strong></div>
        <div class="small">₹${price.toFixed(2)} x ${ci.qty}</div>
      </div>
      <div style="text-align:right">
        <div class="qty">
          <button onclick="changeQty(${ci.id}, ${ci.qty-1})">−</button>
          <div class="badge">${ci.qty}</div>
          <button onclick="changeQty(${ci.id}, ${ci.qty+1})">+</button>
        </div>
        <div style="margin-top:6px">₹${(price*ci.qty).toFixed(2)}</div>
      </div>
    `;
    itemsEl.appendChild(line);
    total += price * ci.qty;
  });
  document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
}

/* -----------------------
   Cart functions
   ----------------------- */
function addToCart(id){
  const item = menuItems.find(it=>it.id===id);
  if(!item || !item.available){ alert('Item not available'); return; }
  const ci = cart.find(x=>x.id===id);
  if(ci) ci.qty++;
  else cart.push({ id, qty:1 });
  saveState();
  if(document.getElementById('cartDrawer').style.display === 'block') renderCart();
}

function changeQty(id, qty){
  if(qty<=0){ cart = cart.filter(c=>c.id!==id); }
  else { const ci = cart.find(c=>c.id===id); if(ci) ci.qty = qty; }
  saveState();
}

function toggleCart(){
  const d = document.getElementById('cartDrawer');
  d.style.display = d.style.display === 'block' ? 'none' : 'block';
  if(d.style.display === 'block') renderCart();
}

/* -----------------------
   LOGIN / SIGNUP / AUTH
   ----------------------- */
function openLogin(){
  const bg = document.getElementById('loginBg');
  if(bg) bg.style.display='flex';
  showLoginForm();
}

function closeLogin(){
  const bg = document.getElementById('loginBg');
  if(bg) bg.style.display='none';
}

function showLoginForm(){
  document.getElementById('authTitle').textContent = 'Login';
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('signupForm').classList.add('hidden');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  if(loginTab) loginTab.classList.add('active');
  if(signupTab) signupTab.classList.remove('active');
}

function showSignupForm(){
  document.getElementById('authTitle').textContent = 'Sign Up';
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  if(loginTab) loginTab.classList.remove('active');
  if(signupTab) signupTab.classList.add('active');
}

function performSignup(){
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const phone = document.getElementById('signupPhone').value.trim();
  const pwd = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  const role = 'user'; // only user signups

  if(!name || !email || !pwd || !confirm){
    alert('Please fill all required fields');
    return;
  }
  if(pwd !== confirm){
    alert('Passwords do not match');
    return;
  }
  if(pwd.length < 4){
    alert('Password must be at least 4 characters (demo)');
    return;
  }
  if(users.some(u => u.email && u.email.toLowerCase() === email)){
    alert('Email already registered. Please login.');
    showLoginForm();
    return;
  }

  const user = { name, email, phone, password: pwd, role };
  users.push(user);
  saveUsers();
  alert('Signup successful! Please login now.');
  showLoginForm();
}

function performLogin(){
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pwd = document.getElementById('loginPassword').value;

  if(!email || !pwd){
    alert('Enter email and password');
    return;
  }

  const user = users.find(u => u.email && u.email.toLowerCase() === email && u.password === pwd);
  if(!user){
    alert('Invalid email or password');
    return;
  }

  currentUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.role === 'admin',
    firstOrderUsed: JSON.parse(localStorage.getItem('firstOrderUsed') || 'false')
  };
  sessionStorage.setItem('user', JSON.stringify(currentUser));
  closeLogin();
  updateUIAfterLogin();
  alert(`Logged in as ${currentUser.name}${currentUser.isAdmin ? ' (Admin)' : ''}`);
}

function logout(){
  currentUser = null;
  sessionStorage.removeItem('user');
  updateUIAfterLogin();
  alert('Logged out');
}

function updateUIAfterLogin(){
  const adminPanel = document.getElementById('adminPanel');
  const userLabel = document.getElementById('userLabel');
  const logoutBtn = document.getElementById('logoutBtn');

  if(currentUser && currentUser.role){
    currentUser.isAdmin = currentUser.role === 'admin';
  }

  if(currentUser && currentUser.isAdmin){
    if(adminPanel) adminPanel.classList.remove('hidden');
  } else {
    if(adminPanel) adminPanel.classList.add('hidden');
  }

  if(currentUser){
    if(userLabel) userLabel.textContent = `Logged in as ${currentUser.name}${currentUser.isAdmin ? ' (Admin)' : ''}`;
    if(logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if(userLabel) userLabel.textContent = '';
    if(logoutBtn) logoutBtn.classList.add('hidden');
  }

  renderAdminList();
}

/* -----------------------
   Admin item add/edit
   ----------------------- */
let editingItemId = null;

function openAddItem(){
  editingItemId = null;
  document.getElementById('itemModalTitle').textContent = 'Add New Item';
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemPrice').value = '';
  populateCategorySelect();
  document.getElementById('itemRating').value = 4.0;
  document.getElementById('itemDiscount').value = 0;
  document.getElementById('itemAvailable').checked = true;
  document.getElementById('itemImgPreview').src = '';
  document.getElementById('itemImgUrl').value = '';
  document.getElementById('itemImgFile').value = '';
  document.getElementById('itemModal').style.display = 'flex';
}

function closeItemModal(){ document.getElementById('itemModal').style.display = 'none'; }

function populateCategorySelect(){
  const sel = document.getElementById('itemCategory');
  if(!sel) return;
  sel.innerHTML = '';
  categories.forEach(c => {
    if(c === 'all') return;
    const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
  });
}

document.getElementById('itemImgFile')?.addEventListener('change', function(e){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    document.getElementById('itemImgPreview').src = ev.target.result;
    document.getElementById('itemImgUrl').value = ev.target.result;
  }
  reader.readAsDataURL(f);
});

function saveNewItem(){
  const title = document.getElementById('itemTitle').value.trim();
  const price = Number(document.getElementById('itemPrice').value || 0);
  const category = document.getElementById('itemCategory').value || 'veg';
  const rating = Number(document.getElementById('itemRating').value || 4.0);
  const discount = Number(document.getElementById('itemDiscount').value || 0);
  const available = document.getElementById('itemAvailable').checked;
  const img = document.getElementById('itemImgUrl').value || 'https://picsum.photos/seed/'+Math.random()+'/600/400';

  if(!title || price<=0){ alert('Enter title and price'); return; }

  if(editingItemId){
    const it = menuItems.find(m=>m.id===editingItemId);
    if(it){
      it.title = title; it.price = price; it.category = category; it.rating = rating; it.itemDiscount = discount; it.available = available; it.img = img;
    }
  } else {
    const id = Date.now();
    menuItems.push({ id, title, price, category, rating, itemDiscount: discount, available, img });
  }
  saveState();
  closeItemModal();
}

function editItem(id){
  const it = menuItems.find(m=>m.id===id);
  if(!it) return;
  editingItemId = id;
  document.getElementById('itemModalTitle').textContent = 'Edit Item';
  document.getElementById('itemTitle').value = it.title;
  document.getElementById('itemPrice').value = it.price;
  populateCategorySelect();
  document.getElementById('itemCategory').value = it.category;
  document.getElementById('itemRating').value = it.rating;
  document.getElementById('itemDiscount').value = it.itemDiscount || 0;
  document.getElementById('itemAvailable').checked = !!it.available;
  document.getElementById('itemImgPreview').src = it.img;
  document.getElementById('itemImgUrl').value = it.img;
  document.getElementById('itemModal').style.display = 'flex';
}

function removeItem(id){
  if(!confirm('Delete item?')) return;
  menuItems = menuItems.filter(m=>m.id!==id);
  saveState();
}

function setItemDiscount(id, value){
  const item = menuItems.find(m => m.id === id);
  if (!item) return;
  item.itemDiscount = Number(value);
  saveState();
}

/* -----------------------
   Categories
   ----------------------- */
function openCategoryManager(){
  document.getElementById('catModal').style.display = 'flex';
  renderCategoryList();
}

function closeCategoryManager(){ document.getElementById('catModal').style.display = 'none'; }

function addCategory(){
  const v = document.getElementById('newCategory').value.trim().toLowerCase();
  if(!v) return;
  if(categories.includes(v)){ alert('Exists'); return; }
  categories.push(v);
  localStorage.setItem('categories', JSON.stringify(categories));
  document.getElementById('newCategory').value = '';
  renderCategoryList();
  populateCategorySelect();
}

function renderCategoryList(){
  const el = document.getElementById('catList');
  el.innerHTML = '';
  categories.forEach(c=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.justifyContent='space-between'; row.style.padding='6px 0';
    row.innerHTML = `<div>${c}</div><div>${c!=='all' ? `<button onclick="removeCategory('${c}')">Delete</button>` : ''}</div>`;
    el.appendChild(row);
  })
}

function removeCategory(c){
  if(c==='all') return;
  categories = categories.filter(x=>x!==c);
  menuItems.forEach(it=>{ if(it.category===c) it.category='veg' });
  saveState();
  renderCategoryList();
  populateCategorySelect();
}

/* -----------------------
   Address & Orders
   ----------------------- */
let checkoutAddress = null;

function openAddressModal(){
  if(cart.length===0){ alert('Cart empty'); return; }
  document.getElementById('addressModal').style.display = 'flex';
  renderSavedAddresses();
}

function closeAddressModal(){ document.getElementById('addressModal').style.display = 'none'; }

function renderSavedAddresses(){
  const el = document.getElementById('savedAddresses');
  el.innerHTML = '';
  if(addresses.length===0){ el.innerHTML = '<div class="small-muted">No saved addresses</div>'; return; }
  addresses.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:600">${a.name} • ${a.phone}</div>
        <div class="small-muted">${a.line} • ${a.pin}</div>
        <div class="small-muted">Slot: ${a.slot}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button onclick="useAddress(${idx})" class="btn">Use</button>
        <button onclick="deleteAddress(${idx})">Delete</button>
      </div>
    </div>`;
    el.appendChild(div);
  })
}

function saveAddress(){
  const name = document.getElementById('addrName').value.trim();
  const phone = document.getElementById('addrPhone').value.trim();
  const line = document.getElementById('addrLine').value.trim();
  const pin = document.getElementById('addrPin').value.trim();
  const slot = document.getElementById('deliverySlot').value;
  if(!name || !phone || !line || !pin){ alert('Complete address'); return; }
  const a = { name, phone, line, pin, slot };
  addresses.push(a);
  localStorage.setItem('addresses', JSON.stringify(addresses));
  checkoutAddress = a;
  closeAddressModal();
  openCheckout();
}

function useAddress(idx){
  checkoutAddress = addresses[idx];
  closeAddressModal();
  openCheckout();
}

function deleteAddress(idx){
  if(!confirm('Delete address?')) return;
  addresses.splice(idx,1);
  localStorage.setItem('addresses', JSON.stringify(addresses));
  renderSavedAddresses();
}

/* -----------------------
   Checkout & Payment
   ----------------------- */
function openCheckout(){
  if(cart.length===0){ alert('Cart empty'); return; }
  if(!checkoutAddress){ alert('Select address first'); openAddressModal(); return; }

  const totalRaw = cart.reduce((s,c)=>{
    const item = menuItems.find(i=>i.id===c.id);
    let price = item.price;
    if (item.itemDiscount) price = price * (1 - item.itemDiscount/100);
    price = price * (1 - dailyDiscount/100);
    return s + price * c.qty;
  }, 0);

  let discount = 0;
  if(currentUser && !currentUser.firstOrderUsed){
    discount += 0.5 * totalRaw;
  }
  const final = totalRaw - discount;

  document.getElementById('checkoutSummary').innerHTML = `
    <div>Deliver to: <strong>${checkoutAddress.name}</strong>, ${checkoutAddress.line} • ${checkoutAddress.pin}</div>
    <div>Slot: ${checkoutAddress.slot}</div>
    <hr />
    <div>Subtotal: ₹${totalRaw.toFixed(2)}</div>
    <div>Discount: ₹${discount.toFixed(2)}</div>
    <div style="font-weight:700;margin-top:6px">Payable: ₹${final.toFixed(2)}</div>
  `;
  document.getElementById('modalBg').style.display='flex';
}

document.addEventListener('change', (e)=>{
  if(e.target && e.target.name==='payOpt'){
    document.getElementById('cardForm').classList.toggle('hidden', e.target.value !== 'card');
    document.getElementById('upiForm').classList.toggle('hidden', e.target.value !== 'upi');
  }
});

function closeCheckout(){ document.getElementById('modalBg').style.display='none'; }

function processPayment(){
  const totalRaw = cart.reduce((s,c)=>{
    const item = menuItems.find(i=>i.id===c.id);
    let price = item.price;
    if (item.itemDiscount) price = price * (1 - item.itemDiscount/100);
    price = price * (1 - dailyDiscount/100);
    return s + price * c.qty;
  }, 0);

  let discount = 0;
  if(currentUser && !currentUser.firstOrderUsed){
    discount += 0.5 * totalRaw;
  }
  if(currentUser){
  currentUser.firstOrderUsed = JSON.parse(localStorage.getItem(currentUser.email + "_firstOrder") || 'false');
}

  const payable = Number((totalRaw - discount).toFixed(2));
  const payOpt = document.querySelector('input[name="payOpt"]:checked').value;

  if(payOpt === 'card'){
    const name = document.getElementById('cardName').value.trim();
    const num = document.getElementById('cardNumber').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    if(!name || !num || !cvv){ alert('Fill card details (demo)'); return; }
  } else {
    const upi = document.getElementById('upiId').value.trim();
    if(!upi){ alert('Enter UPI/Phone number (demo)'); return; }
  }

  if(currentUser){
    currentUser.firstOrderUsed = true;
    sessionStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem(currentUser.email +'firstOrderUsed', JSON.stringify(true));
  } else {
    localStorage.setItem('firstOrderUsed', JSON.stringify(true));
  }

  const order = {
    id: 'ORD' + Date.now(),
    user: currentUser ? currentUser.name : 'Guest',
    items: cart.map(ci => ({ id:ci.id, qty:ci.qty, title: (menuItems.find(m=>m.id===ci.id)||{}).title })),
    address: checkoutAddress,
    subtotal: totalRaw,
    discount,
    payable,
    paymentMethod: payOpt,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  cart = [];
  saveState();
  closeCheckout();
  toggleCart();
  checkoutAddress = null;
  alert(`Payment success (demo). Order ${order.id} placed!`);
}

/* -----------------------
   Orders UI
   ----------------------- */
function openOrdersUser(){
  document.getElementById('ordersModal').style.display='flex';
  renderUserOrders();
}
function closeOrdersUser(){ document.getElementById('ordersModal').style.display='none'; }

function renderUserOrders(){
  const el = document.getElementById('userOrdersList');
  el.innerHTML = '';
  const user = currentUser ? currentUser.name : null;
  const list = user ? orders.filter(o=>o.user === user) : orders.filter(o=>o.user === 'Guest');
  if(list.length===0){ el.innerHTML = '<div class="small-muted">No orders yet</div>'; return; }
  list.forEach(o=>{
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:600">${o.id} • ${o.items.length} items</div>
        <div class="small-muted">₹${o.payable.toFixed(2)} • ${o.status}</div>
        <div class="small-muted">${new Date(o.createdAt).toLocaleString()}</div>
        <div class="small-muted">Deliver to: ${o.address.name}, ${o.address.line}</div>
      </div>
      <div>
        <button onclick="viewOrder('${o.id}')" class="btn">View</button>
      </div>
    </div>`;
    el.appendChild(div);
  });
}

function viewOrder(id){
  const o = orders.find(x=>x.id===id);
  if(!o) return;
  alert(`Order ${o.id}\nUser: ${o.user}\nStatus: ${o.status}\nPayable: ₹${o.payable}\nItems:\n${o.items.map(i=>i.title+' x'+i.qty).join('\n')}`);
}

function openOrdersAdmin(){
  document.getElementById('ordersAdminModal').style.display='flex';
  renderAdminOrders();
}
function closeOrdersAdmin(){ document.getElementById('ordersAdminModal').style.display='none'; }

function renderAdminOrders(){
  const el = document.getElementById('adminOrdersList');
  el.innerHTML = '';
  if(orders.length===0){ el.innerHTML = '<div class="small-muted">No orders</div>'; return; }
  orders.forEach((o)=>{
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${o.id} • ${o.user}</div>
          <div class="small-muted">₹${o.payable.toFixed(2)} • ${o.status}</div>
          <div class="small-muted">${new Date(o.createdAt).toLocaleString()}</div>
          <div class="small-muted">Deliver to: ${o.address.name}, ${o.address.line}</div>
          <div style="margin-top:6px">Items: ${o.items.map(i=>i.title+' x'+i.qty).join(', ')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <select id="statusSelect_${o.id}">
            <option ${o.status==='Pending'?'selected':''}>Pending</option>
            <option ${o.status==='Preparing'?'selected':''}>Preparing</option>
            <option ${o.status==='Out for delivery'?'selected':''}>Out for delivery</option>
            <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
          </select>
          <button onclick="updateOrderStatus('${o.id}')">Update</button>
        </div>
      </div>
    `;
    el.appendChild(div);
  });
}

function updateOrderStatus(id){
  const sel = document.getElementById('statusSelect_'+id);
  if(!sel) return;
  const val = sel.value;
  const o = orders.find(x=>x.id===id);
  if(!o) return;
  o.status = val;
  saveState();
  renderAdminOrders();
  alert('Status updated');
}

/* -----------------------
   Admin small actions
   ----------------------- */
function toggleAvailable(id, val){
  const it = menuItems.find(m=>m.id===id);
  if(it) it.available = val;
  saveState();
}

function applyDailyDiscount(){
  const val = Number(document.getElementById('dailyDiscount').value || 0);
  if(val < 0 || val > 100){ alert('0-100 allowed'); return; }
  dailyDiscount = val;
  saveState();
}

/* filtering */
function filterCategory(cat){
  renderMenu(cat);
}

/* init render */
document.addEventListener('DOMContentLoaded', ()=>{
  const dd = document.getElementById('dailyDiscount');
  if(dd) dd.value = dailyDiscount;
  populateCategorySelect();
  renderMenu();
  renderCart();
  renderAdminList();
  updateUIAfterLogin();
});

/* expose functions to window */
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.performLogin = performLogin;
window.performSignup = performSignup;
window.logout = logout;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.processPayment = processPayment;
window.toggleAvailable = toggleAvailable;
window.applyDailyDiscount = applyDailyDiscount;
window.openAddItem = openAddItem;
window.openCategoryManager = openCategoryManager;
window.openAddressModal = openAddressModal;
window.openOrdersAdmin = openOrdersAdmin;
window.openOrdersUser = openOrdersUser;
window.closeOrdersUser = closeOrdersUser;
window.closeOrdersAdmin = closeOrdersAdmin;
window.closeAddressModal = closeAddressModal;
window.saveNewItem = saveNewItem;
window.closeItemModal = closeItemModal;
window.addCategory = addCategory;
window.removeCategory = removeCategory;
window.deleteAddress = deleteAddress;
window.saveAddress = saveAddress;
