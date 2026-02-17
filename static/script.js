'use strict';

const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
  });
}

const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const testimonialsModalFunc = function () {
  if (!modalContainer || !overlay) {
    return;
  }
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
};

if (testimonialsItem.length && modalImg && modalTitle && modalText) {
  for (let i = 0; i < testimonialsItem.length; i++) {
    testimonialsItem[i].addEventListener("click", function () {
      const avatar = this.querySelector("[data-testimonials-avatar]");
      const title = this.querySelector("[data-testimonials-title]");
      const text = this.querySelector("[data-testimonials-text]");

      if (!avatar || !title || !text) {
        return;
      }

      modalImg.src = avatar.src;
      modalImg.alt = avatar.alt;
      modalTitle.textContent = title.textContent;
      modalText.textContent = text.textContent;

      testimonialsModalFunc();
    });
  }
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", testimonialsModalFunc);
}
if (overlay) {
  overlay.addEventListener("click", testimonialsModalFunc);
}

const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue =
  document.querySelector("[data-select-value]") ||
  document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

if (select) {
  select.addEventListener("click", function () {
    elementToggleFunc(this);
  });
}

if (select && selectValue && selectItems.length) {
  for (let i = 0; i < selectItems.length; i++) {
    selectItems[i].addEventListener("click", function () {
      const selectedValue = this.innerText.toLowerCase();
      selectValue.innerText = this.innerText;
      elementToggleFunc(select);
      filterFunc(selectedValue);
    });
  }
}

const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
  const isAll = selectedValue === "all";
  for (let i = 0; i < filterItems.length; i++) {
    const matchesCategory = selectedValue === filterItems[i].dataset.category;
    filterItems[i].classList.toggle("active", isAll || matchesCategory);
  }
};

let lastClickedBtn = filterBtn.length ? filterBtn[0] : null;

for (let i = 0; i < filterBtn.length; i++) {
  filterBtn[i].addEventListener("click", function () {
    const selectedValue = this.innerText.toLowerCase();

    if (selectValue) {
      selectValue.innerText = this.innerText;
    }

    filterFunc(selectedValue);

    if (lastClickedBtn) {
      lastClickedBtn.classList.remove("active");
    }
    this.classList.add("active");
    lastClickedBtn = this;
  });
}

const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

if (form && formBtn && formInputs.length) {
  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {
      formBtn.toggleAttribute("disabled", !form.checkValidity());
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      fullname: formData.get("fullname"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Message sent successfully!");
        form.reset();
        formBtn.setAttribute("disabled", "");
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("Failed to send message. Please try again.");
      console.error("Error:", error);
    }
  });
}

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const selectedPage = this.textContent.trim().toLowerCase();

    for (let j = 0; j < pages.length; j++) {
      if (selectedPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);

        if (pages[j].dataset.page === "blog") {
          loadBlogs();
        }
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}

const blogForm = document.querySelector("[data-blog-form]");
const blogBtn = document.querySelector("[data-blog-btn]");
const blogsContainer = document.getElementById("blogs-container");

async function loadBlogs() {
  if (!blogsContainer) {
    return;
  }

  try {
    const response = await fetch("/api/blogs");
    const blogs = await response.json();
    displayBlogs(blogs);
  } catch (error) {
    console.error("Error loading blogs:", error);
  }
}

function displayBlogs(blogs) {
  if (!blogsContainer) {
    return;
  }

  blogsContainer.innerHTML = "";

  if (blogs.length === 0) {
    blogsContainer.innerHTML =
      "<p style='text-align: center; color: #999;'>No blogs yet. Write your first blog!</p>";
    return;
  }

  blogs.forEach((blog) => {
    const date = new Date(blog.timestamp).toLocaleDateString();
    const excerpt =
      blog.content.length > 150 ? `${blog.content.substring(0, 150)}...` : blog.content;

    const li = document.createElement("li");
    li.className = "blog-post-item";

    const contentDiv = document.createElement("div");
    contentDiv.className = "blog-content";
    contentDiv.style.padding = "15px";

    const metaDiv = document.createElement("div");
    metaDiv.className = "blog-meta";

    const categoryP = document.createElement("p");
    categoryP.className = "blog-category";
    categoryP.textContent = blog.category;

    const dotSpan = document.createElement("span");
    dotSpan.className = "dot";

    const time = document.createElement("time");
    time.textContent = date;

    metaDiv.appendChild(categoryP);
    metaDiv.appendChild(dotSpan);
    metaDiv.appendChild(time);

    const titleH3 = document.createElement("h3");
    titleH3.className = "h3 blog-item-title";
    titleH3.textContent = blog.title;

    const textP = document.createElement("p");
    textP.className = "blog-text";
    textP.textContent = excerpt;

    const actionsDiv = document.createElement("div");
    actionsDiv.style.marginTop = "10px";
    actionsDiv.style.display = "flex";
    actionsDiv.style.gap = "10px";

    const editBtn = document.createElement("button");
    editBtn.className = "form-btn";
    editBtn.style.padding = "5px 15px";
    editBtn.style.fontSize = "0.9rem";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      editBlog(blog.id, blog.title, blog.category, blog.content);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "form-btn";
    deleteBtn.style.padding = "5px 15px";
    deleteBtn.style.fontSize = "0.9rem";
    deleteBtn.style.backgroundColor = "#ff6b6b";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      deleteBlog(blog.id);
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    contentDiv.appendChild(metaDiv);
    contentDiv.appendChild(titleH3);
    contentDiv.appendChild(textP);
    contentDiv.appendChild(actionsDiv);

    li.appendChild(contentDiv);
    blogsContainer.appendChild(li);
  });
}

function editBlog(id, title, category, content) {
  if (!blogForm || !blogBtn) {
    return;
  }

  const titleInput = document.querySelector('[name="title"]');
  const categoryInput = document.querySelector('[name="category"]');
  const contentInput = document.querySelector('[name="content"]');

  if (!titleInput || !categoryInput || !contentInput) {
    return;
  }

  titleInput.value = title;
  categoryInput.value = category;
  contentInput.value = content;
  blogForm.dataset.blogId = id;
  blogBtn.innerHTML =
    '<ion-icon name="checkmark-outline"></ion-icon><span>Update Blog</span>';
  window.scrollTo(0, 0);
}

async function deleteBlog(id) {
  if (confirm("Are you sure you want to delete this blog?")) {
    try {
      const response = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (response.ok) {
        alert("Blog deleted successfully!");
        loadBlogs();
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  }
}

if (blogForm && blogBtn) {
  blogForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(blogForm);
    const data = {
      title: formData.get("title"),
      category: formData.get("category"),
      content: formData.get("content")
    };

    try {
      const blogId = blogForm.dataset.blogId;
      const url = blogId ? `/api/blogs/${blogId}` : "/api/blogs";
      const method = blogId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert(blogId ? "Blog updated successfully!" : "Blog published successfully!");
        blogForm.reset();
        delete blogForm.dataset.blogId;
        blogBtn.innerHTML =
          '<ion-icon name="checkmark-outline"></ion-icon><span>Publish Blog</span>';
        loadBlogs();
      }
    } catch (error) {
      alert("Error saving blog. Please try again.");
      console.error("Error:", error);
    }
  });
}

window.addEventListener("load", loadBlogs);
