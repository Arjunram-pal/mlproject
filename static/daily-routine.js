'use strict';

(function () {
  const postsContainer = document.getElementById('postsContainer');
  const postForm = document.getElementById('postForm');
  const postMessage = document.getElementById('postMessage');

  if (!postsContainer || !postForm || !postMessage) {
    return;
  }

  let posts = [];
  const initialPosts = postsContainer.dataset.initialPosts;
  if (initialPosts) {
    try {
      posts = JSON.parse(initialPosts);
    } catch (error) {
      console.error('Error parsing initial posts:', error);
      posts = [];
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  function renderPosts() {
    if (!posts.length) {
      postsContainer.innerHTML = '<div class="empty-state"><p>No posts yet. Be the first to share your daily routine!</p></div>';
      return;
    }

    let html = '';
    posts.forEach((post) => {
      html += `
        <div class="post-card" data-post-id="${post.id}">
          <div class="post-header">
            <div class="post-time">${formatTime(post.timestamp)}</div>
          </div>
          <div class="post-message">${escapeHtml(post.message)}</div>
          <div class="post-actions">
            <button class="btn-reply" type="button" data-action="toggle-reply" data-post-id="${post.id}">Reply</button>
          </div>

          <div class="reply-form" id="replyForm-${post.id}">
            <textarea placeholder="Write a reply..." id="replyText-${post.id}" rows="3"></textarea>
            <button type="button" data-action="submit-reply" data-post-id="${post.id}">Post Reply</button>
          </div>
      `;

      if (post.replies && post.replies.length > 0) {
        html += '<div class="replies-container">';
        post.replies.forEach((reply) => {
          html += `
            <div class="reply-item">
              <div class="reply-time">${formatTime(reply.timestamp)}</div>
              <div class="reply-text">${escapeHtml(reply.message)}</div>
            </div>
          `;
        });
        html += '</div>';
      }

      html += '</div>';
    });

    postsContainer.innerHTML = html;
  }

  async function loadPosts() {
    try {
      const response = await fetch('/api/routine/posts');
      posts = await response.json();
      renderPosts();
    } catch (error) {
      console.error('Error loading posts:', error);
      renderPosts();
    }
  }

  function toggleReplyForm(postId) {
    const form = document.getElementById(`replyForm-${postId}`);
    if (!form) {
      return;
    }

    form.classList.toggle('show');
    if (form.classList.contains('show')) {
      const replyInput = document.getElementById(`replyText-${postId}`);
      if (replyInput) {
        replyInput.focus();
      }
    }
  }

  async function submitReply(postId) {
    const replyInput = document.getElementById(`replyText-${postId}`);
    if (!replyInput) {
      return;
    }

    const message = replyInput.value.trim();
    if (!message) {
      return;
    }

    try {
      const response = await fetch(`/api/routine/reply/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        replyInput.value = '';
        await loadPosts();
      }
    } catch (error) {
      console.error('Error replying:', error);
    }
  }

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = postMessage.value.trim();
    if (!message) {
      return;
    }

    try {
      const response = await fetch('/api/routine/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        postMessage.value = '';
        await loadPosts();
      }
    } catch (error) {
      console.error('Error posting:', error);
    }
  });

  postsContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionEl = target.closest('[data-action]');
    if (!(actionEl instanceof HTMLElement)) {
      return;
    }

    const postId = actionEl.dataset.postId;
    if (!postId) {
      return;
    }

    if (actionEl.dataset.action === 'toggle-reply') {
      toggleReplyForm(postId);
      return;
    }

    if (actionEl.dataset.action === 'submit-reply') {
      submitReply(postId);
    }
  });

  renderPosts();
})();
