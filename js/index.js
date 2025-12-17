/* ================== DATA ================== */
let contacts = [];
let editingId = null;
let currentPhoto = null;

/* ================== REGEX PATTERNS ================== */
let nameRegex = /^[a-zA-Z ]{3,}$/;
let phoneRegex = /^01[0-9]{9}$/;
let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ================== START ================== */
loadContacts();
setupEvents();

/* ================== LOAD DATA ================== */
function loadContacts() {
  let saved = localStorage.getItem("contacts");
  if (saved) {
    contacts = JSON.parse(saved);
  }
  showContacts();
  updateStats();
}

/* ================== SAVE DATA ================== */
function saveData() {
  localStorage.setItem("contacts", JSON.stringify(contacts));
}

/* ================== GET INITIALS ================== */
function getInitials(name) {
  let words = name.split(" ");
  let first = words[0] ? words[0][0] : "";
  let second = words[1] ? words[1][0] : "";
  return (first + second).toUpperCase();
}

/* ================== VALIDATE FORM ================== */
function validateForm() {
  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let email = document.getElementById("email").value.trim();
  let valid = true;

  document.getElementById("nameError").textContent = "";
  document.getElementById("phoneError").textContent = "";
  document.getElementById("emailError").textContent = "";

  if (!nameRegex.test(name)) {
    document.getElementById("nameError").textContent =
      "Enter valid name (minimum 3 letters)";
    valid = false;
  }

  if (!phoneRegex.test(phone)) {
    document.getElementById("phoneError").textContent =
      "Invalid phone number (e.g., 01012345678)";
    valid = false;
  } else {
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i].phone === phone && contacts[i].id !== editingId) {
        document.getElementById("phoneError").textContent =
          "This phone number already exists!";
        valid = false;
        break;
      }
    }
  }

  if (email && !emailRegex.test(email)) {
    document.getElementById("emailError").textContent = "Invalid email address";
    valid = false;
  }

  return valid;
}

/* ================== OPEN MODAL ================== */
function openModal(contact) {
  let modal = document.getElementById("contactModal");
  let title = document.getElementById("modalTitle");
  let avatar = document.getElementById("avatarPreview");

  document.getElementById("nameError").textContent = "";
  document.getElementById("phoneError").textContent = "";
  document.getElementById("emailError").textContent = "";

  if (contact) {
    editingId = contact.id;
    currentPhoto = contact.photo || null;
    title.textContent = "Edit Contact";

    document.getElementById("name").value = contact.name;
    document.getElementById("phone").value = contact.phone;
    document.getElementById("email").value = contact.email || "";
    document.getElementById("address").value = contact.address || "";
    document.getElementById("group").value = contact.group || "";
    document.getElementById("notes").value = contact.notes || "";
    document.getElementById("favorite").checked = contact.favorite || false;
    document.getElementById("emergency").checked = contact.emergency || false;

    if (contact.photo) {
      avatar.innerHTML = '<img src="' + contact.photo + '">';
    } else {
      avatar.innerHTML = '<i class="bi bi-person-fill"></i>';
    }
  } else {
    editingId = null;
    currentPhoto = null;
    title.textContent = "Add New Contact";
    document.getElementById("contactForm").reset();
    avatar.innerHTML = '<i class="bi bi-person-fill"></i>';
  }

  modal.classList.add("active");
}

/* ================== CLOSE MODAL ================== */
function closeModal() {
  document.getElementById("contactModal").classList.remove("active");
  editingId = null;
  currentPhoto = null;
}

/* ================== SAVE CONTACT ================== */
function saveContact() {
  if (!validateForm()) return;

  let contact = {
    id: editingId || Date.now().toString(),
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    group: document.getElementById("group").value,
    notes: document.getElementById("notes").value.trim(),
    favorite: document.getElementById("favorite").checked,
    emergency: document.getElementById("emergency").checked,
    photo: currentPhoto,
  };

  if (editingId) {
    // Update existing
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i].id === editingId) {
        contacts[i] = contact;
        break;
      }
    }
    saveData();
    closeModal();
    sweetalert("edit", "");
    showContacts();
    updateStats();
  } else {
    // Add new
    contacts.push(contact);
    saveData();
    closeModal();
    sweetalert("success", "");
    showContacts();
    updateStats();
  }
}

/* ================== SWEET ALERT ================== */
function sweetalert(status, contactName) {
  if (status === "success") {
    Swal.fire({
      title: "Good job!",
      text: "You saved contact successfully!",
      icon: "success",
    });
  } else if (status === "delete") {
    return Swal.fire({
      title: "Delete Contact?",
      text: `Are you sure you want to delete ${contactName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
  } else if (status === "edit") {
    Swal.fire({
      title: "Success!",
      text: "Contact updated successfully!",
      icon: "success",
    });
  }
}

/* ================== REAL-TIME VALIDATION ================== */
function setupRealtimeValidation() {
  document.getElementById("name").oninput = function () {
    let name = this.value.trim();
    let error = document.getElementById("nameError");
    error.textContent =
      name && !nameRegex.test(name)
        ? "Enter valid name (minimum 3 letters)"
        : "";
  };

  document.getElementById("phone").oninput = function () {
    let phone = this.value.trim();
    let error = document.getElementById("phoneError");

    if (phone && !phoneRegex.test(phone)) {
      error.textContent = "Invalid phone number (e.g., 01012345678)";
      return;
    }

    // Check duplicate
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i].phone === phone && contacts[i].id !== editingId) {
        error.textContent = "This phone number already exists!";
        return;
      }
    }
    error.textContent = "";
  };

  document.getElementById("email").oninput = function () {
    let email = this.value.trim();
    let error = document.getElementById("emailError");
    error.textContent =
      email && !emailRegex.test(email) ? "Invalid email address" : "";
  };
}

/* ================== DELETE CONTACT ================== */
async function deleteContact(id) {
  let contact = findContact(id);
  if (!contact) return;

  let result = await sweetalert("delete", contact.name);

  if (result.isConfirmed) {
    contacts = contacts.filter((c) => c.id !== id);

    saveData();
    showContacts();
    updateStats();

    Swal.fire({
      title: "Deleted!",
      text: "Contact has been deleted.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
  }
}

/* ================== TOGGLE FAVORITE ================== */
function toggleFavorite(id) {
  let contact = findContact(id);
  if (!contact) return;

  contact.favorite = !contact.favorite;

  saveData();
  showContacts();
  updateStats();
}

/* ================== TOGGLE EMERGENCY ================== */
function toggleEmergency(id) {
  let contact = findContact(id);
  if (!contact) return;

  contact.emergency = !contact.emergency;

  saveData();
  showContacts();
  updateStats();
}

/* ================== SHOW CONTACTS ================== */
function showContacts() {
  let search = document.getElementById("searchInput").value.toLowerCase();
  let list = document.getElementById("contactsList");
  let empty = document.getElementById("emptyState");

  // Filter contacts
  let filtered = contacts.filter((c) => {
    return (
      c.name.toLowerCase().includes(search) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search))
    );
  });

  // Show empty state if no results
  if (filtered.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  // Build HTML
  empty.style.display = "none";
  let html = "";

  filtered.forEach((c) => {
    html += `<div class="contact-card">`;

    // Avatar
    html += `<div class="contact-avatar">`;
    html += c.photo ? `<img src="${c.photo}">` : getInitials(c.name);
    html += `</div>`;

    // Info
    html += `<div class="contact-info">`;
    html += `<h6>${c.name}</h6>`;
    html += `<p><a href="tel:${c.phone}" style="color: inherit; text-decoration: none;">
              <i class="bi bi-telephone" style="cursor: pointer; color: #10b981;"></i> ${c.phone}
            </a></p>`;

    if (c.email) {
      html += `<p><a href="mailto:${c.email}" style="color: inherit; text-decoration: none;">
                <i class="bi bi-envelope" style="cursor: pointer; color: #3b82f6;"></i> ${c.email}
              </a></p>`;
    }

    if (c.address) {
      html += `<p><i class="bi bi-geo-alt"></i> ${c.address}</p>`;
    }

    // Badges
    html += `<div class="contact-badges">`;
    if (c.group) html += `<span class="badge badge-work">${c.group}</span>`;
    if (c.emergency)
      html += `<span class="badge badge-emergency">Emergency</span>`;
    html += `</div></div>`;

    // Action buttons
    html += `<div class="contact-actions">`;
    html += `<button class="action-btn btn-call" onclick="callContact('${c.phone}')">
              <i class="bi bi-telephone"></i>
            </button>`;

    if (c.email) {
      html += `<button class="action-btn btn-email" onclick="emailContact('${c.email}')">
                <i class="bi bi-envelope"></i>
              </button>`;
    }

    html += `<button class="action-btn btn-favorite ${
      c.favorite ? "active" : ""
    }" 
                     onclick="toggleFavorite('${c.id}')">
              <i class="bi bi-star${c.favorite ? "-fill" : ""}"></i>
            </button>`;

    html += `<button class="action-btn btn-emergency ${
      c.emergency ? "active" : ""
    }" 
                     onclick="toggleEmergency('${c.id}')">
              <i class="bi bi-heart-pulse"></i>
            </button>`;

    html += `<button class="action-btn btn-edit" onclick="editContact('${c.id}')">
              <i class="bi bi-pencil"></i>
            </button>`;

    html += `<button class="action-btn btn-delete" onclick="deleteContact('${c.id}')">
              <i class="bi bi-trash"></i>
            </button>`;

    html += `</div></div>`;
  });

  list.innerHTML = html;
  showSidebars();
}

/* ================== SHOW SIDEBARS ================== */
function showSidebars() {
  let favList = document.getElementById("favoritesList");
  let emgList = document.getElementById("emergencyList");

  let favorites = contacts.filter((c) => c.favorite);
  let emergencies = contacts.filter((c) => c.emergency);

  // Favorites
  if (favorites.length === 0) {
    favList.innerHTML =
      '<p style="text-align:center;color:#94a3b8;margin:0">No favorites yet</p>';
  } else {
    favList.innerHTML = favorites
      .map(
        (c) => `
      <div class="sidebar-item">
        <div class="sidebar-avatar">
          ${c.photo ? `<img src="${c.photo}">` : getInitials(c.name)}
        </div>
        <div class="sidebar-item-info">
          <h6>${c.name}</h6>
          <p>${c.phone}</p>
        </div>
        <button class="call-icon call-green" onclick="callContact('${
          c.phone
        }')">
          <i class="bi bi-telephone"></i>
        </button>
      </div>
    `
      )
      .join("");
  }

  // Emergencies
  if (emergencies.length === 0) {
    emgList.innerHTML =
      '<p style="text-align:center;color:#94a3b8;margin:0">No emergency contacts</p>';
  } else {
    emgList.innerHTML = emergencies
      .map(
        (c) => `
      <div class="sidebar-item">
        <div class="sidebar-avatar">
          ${c.photo ? `<img src="${c.photo}">` : getInitials(c.name)}
        </div>
        <div class="sidebar-item-info">
          <h6>${c.name}</h6>
          <p>${c.phone}</p>
        </div>
        <button class="call-icon call-red" onclick="callContact('${c.phone}')">
          <i class="bi bi-telephone"></i>
        </button>
      </div>
    `
      )
      .join("");
  }
}

/* ================== UPDATE STATS ================== */
function updateStats() {
  let total = contacts.length;
  let favCount = contacts.filter((c) => c.favorite).length;
  let emgCount = contacts.filter((c) => c.emergency).length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("favoriteCount").textContent = favCount;
  document.getElementById("emergencyCount").textContent = emgCount;
  document.getElementById("contactCountText").textContent = total;
}

/* ================== UPLOAD PHOTO ================== */
function uploadPhoto(file) {
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (e) {
    currentPhoto = e.target.result;
    document.getElementById(
      "avatarPreview"
    ).innerHTML = `<img src="${currentPhoto}">`;
  };
  reader.readAsDataURL(file);
}

/* ================== FIND CONTACT ================== */
function findContact(id) {
  return contacts.find((c) => c.id === id) || null;
}

/* ================== HELPER FUNCTIONS ================== */
function callContact(phone) {
  window.location.href = `tel:${phone}`;
}

function emailContact(email) {
  window.location.href = `mailto:${email}`;
}

function editContact(id) {
  let contact = findContact(id);
  if (contact) openModal(contact);
}

/* ================== SETUP EVENTS ================== */
function setupEvents() {
  document.getElementById("photoInput").onchange = function (e) {
    uploadPhoto(e.target.files[0]);
  };

  document.getElementById("searchInput").oninput = function () {
    showContacts();
  };

  document.getElementById("contactForm").onsubmit = function (e) {
    e.preventDefault();
    saveContact();
  };

  document.getElementById("contactModal").onclick = function (e) {
    if (e.target.id === "contactModal") {
      closeModal();
    }
  };
}

setupRealtimeValidation();
