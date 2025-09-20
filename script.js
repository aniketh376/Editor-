// Modern CodePlayground Pro - Interactive Online Code Editor

class CodePlaygroundPro {
  constructor() {
    this.editors = {
      html: document.getElementById("htmlEditor"),
      css: document.getElementById("cssEditor"),
      js: document.getElementById("jsEditor"),
    };
    this.isOnline = navigator.onLine;
    this.consoleMessages = [];
    this.currentTheme = localStorage.getItem("theme") || "light";

    this.init();
  }

  init() {
    this.setupEditors();
    this.setupButtons();
    this.setupTheme();
    this.setupConnectionMonitoring();
    this.loadFromStorage();
    this.updatePreview();
    this.setupModals();
    this.setupMagneticRipple();
    window.addEventListener("resize", () => this.updatePreview());
    window.addEventListener("message", (e) => this.handleConsoleMessage(e));
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.saveCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.runCode();
      }
    });
  }

  setupEditors() {
    Object.values(this.editors).forEach((editor) => {
      editor.addEventListener("input", () => {
        this.updatePreview();
        this.saveToStorage();
      });
      editor.addEventListener("focus", (e) => {
        e.target.closest(".editor-panel").classList.add("focused");
      });
      editor.addEventListener("blur", (e) => {
        e.target.closest(".editor-panel").classList.remove("focused");
      });
      editor.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = e.target.selectionStart;
          const end = e.target.selectionEnd;
          e.target.value =
            e.target.value.substring(0, start) +
            "  " +
            e.target.value.substring(end);
          e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
      });
    });
  }

  setupButtons() {
    document.getElementById("runBtn").onclick = () => this.runCode();
    document.getElementById("formatBtn").onclick = () => this.formatCode();
    document.getElementById("saveBtn").onclick = () => this.saveCode();
    document.getElementById("downloadBtn").onclick = () => this.downloadCode();
    document.getElementById("clearBtn").onclick = () => this.clearCode();
    document.getElementById("shareBtn").onclick = () => this.showShareModal();
    document.getElementById("templatesBtn").onclick = () => this.showTemplatesModal();
    document.getElementById("themeToggle").onclick = () => this.toggleTheme();
    document.getElementById("refreshPreview").onclick = () => this.updatePreview();
    document.getElementById("fullscreenPreview").onclick = () => this.fullscreenPreview();
    document.getElementById("clearConsole").onclick = () => this.clearConsole();

    // Modals
    document.getElementById("closeTemplates").onclick = () => this.hideTemplatesModal();
    document.getElementById("closeShare").onclick = () => this.hideShareModal();
    document.getElementById("copyLink").onclick = () => this.copyShareLink();
    document.getElementById("exportGist").onclick = () => this.showNotification("Gist export coming soon!");
    document.getElementById("exportCodepen").onclick = () => this.exportToCodepen();

    // Template selection
    document.querySelectorAll(".template-card").forEach((card) => {
      card.onclick = () => {
        this.loadTemplate(card.textContent.trim());
        this.hideTemplatesModal();
      };
    });

    document.getElementById("reconnectBtn").onclick = () => this.checkConnection();
  }

  setupTheme() {
    document.documentElement.classList.toggle("dark", this.currentTheme === "dark");
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const themeToggle = document.getElementById("themeToggle");
    themeToggle.innerHTML =
      this.currentTheme === "dark"
        ? "🌙"
        : "☀️";
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("theme", this.currentTheme);
    document.documentElement.classList.toggle("dark", this.currentTheme === "dark");
    this.updateThemeIcon();
    this.showNotification(`Switched to ${this.currentTheme} theme`);
  }

  setupConnectionMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      this.hideOfflinePage();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.updateConnectionStatus();
      this.showOfflinePage();
    });
    this.updateConnectionStatus();
  }

  updateConnectionStatus() {
    const statusElement = document.getElementById("connectionStatus");
    statusElement.className = `connection-status ${this.isOnline ? "online" : "offline"}`;
    statusElement.querySelector(".status-text").textContent = this.isOnline ? "Online" : "Offline";
  }

  showOfflinePage() {
    document.getElementById("offlinePage").classList.remove("hidden");
  }
  hideOfflinePage() {
    document.getElementById("offlinePage").classList.add("hidden");
  }
  checkConnection() {
    if (navigator.onLine) {
      this.isOnline = true;
      this.updateConnectionStatus();
      this.hideOfflinePage();
      this.showNotification("Connection restored!");
    } else {
      this.showNotification("Still offline. Please check your connection.");
    }
  }

  runCode() {
    this.updatePreview();
    this.showNotification("Code executed!");
  }

  updatePreview() {
    const html = this.editors.html.value || "";
    const css = this.editors.css.value || "";
    const js = this.editors.js.value || "";

    const previewContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          (function(){
            const log = console.log, error = console.error, warn = console.warn;
            console.log = function(...args){ log(...args); parent.postMessage({type:'console',method:'log',args},'*'); }
            console.error = function(...args){ error(...args); parent.postMessage({type:'console',method:'error',args},'*'); }
            console.warn = function(...args){ warn(...args); parent.postMessage({type:'console',method:'warn',args},'*'); }
            window.addEventListener('error',(e)=>parent.postMessage({type:'console',method:'error',args:[e.message]},'*'));
            try { ${js} } catch(e){ console.error('JS Error:',e.message); }
          })();
        </script>
      </body></html>
    `;
    document.getElementById("preview").src =
      "data:text/html;charset=utf-8," + encodeURIComponent(previewContent);
  }

  formatCode() {
    Object.entries(this.editors).forEach(([type, editor]) => {
      let formatted = editor.value;
      if (type === "html") formatted = this.formatHTML(formatted);
      if (type === "css") formatted = this.formatCSS(formatted);
      if (type === "js") formatted = this.formatJS(formatted);
      editor.value = formatted;
    });
    this.saveToStorage();
    this.showNotification("Code formatted!");
  }

  formatHTML(html) {
    return html
      .replace(/></g, ">\n<")
      .split("\n")
      .map((line, idx, arr) => "  ".repeat(this.calculateIndent(line, idx, arr)) + line.trim())
      .join("\n");
  }
  formatCSS(css) {
    return css.replace(/\{/g, " {\n  ").replace(/\}/g, "\n}\n").replace(/;/g, ";\n  ");
  }
  formatJS(js) {
    return js.replace(/\{/g, " {\n  ").replace(/\}/g, "\n}").replace(/;/g, ";\n");
  }
  calculateIndent(line, idx, arr) {
    let indent = 0;
    for (let i = 0; i < idx; i++) {
      if (arr[i].includes("<") && !arr[i].includes("</") && !arr[i].endsWith("/>")) indent++;
      if (arr[i].includes("</")) indent--;
    }
    return Math.max(0, indent);
  }

  handleConsoleMessage(event) {
    if (event.data && event.data.type === "console") {
      this.addConsoleMessage(event.data.method, event.data.args);
    }
  }
  addConsoleMessage(method, args) {
    const consoleDiv = document.getElementById("console");
    const msgDiv = document.createElement("div");
    msgDiv.className = `console-log console-${method}`;
    msgDiv.innerHTML =
      `<span class="console-timestamp">[${new Date().toLocaleTimeString()}]</span> ` +
      `<span class="console-content">${args.join(" ")}</span>`;
    consoleDiv.appendChild(msgDiv);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
    this.consoleMessages.push({ method, args });
  }

  clearConsole() {
    document.getElementById("console").innerHTML =
      '<div class="console-welcome"><span class="console-prompt">></span> Console cleared.</div>';
    this.consoleMessages = [];
    this.showNotification("Console cleared");
  }

  saveCode() {
    this.saveToStorage();
    this.showNotification("Code saved locally!");
  }
  saveToStorage() {
    localStorage.setItem(
      "codeplayground-code",
      JSON.stringify({
        html: this.editors.html.value,
        css: this.editors.css.value,
        js: this.editors.js.value,
        theme: this.currentTheme,
      })
    );
  }
  loadFromStorage() {
    const saved = localStorage.getItem("codeplayground-code");
    if (saved) {
      const code = JSON.parse(saved);
      this.editors.html.value = code.html || "";
      this.editors.css.value = code.css || "";
      this.editors.js.value = code.js || "";
      if (code.theme) {
        this.currentTheme = code.theme;
        this.setupTheme();
      }
    }
  }

  downloadCode() {
    const html = this.editors.html.value || "";
    const css = this.editors.css.value || "";
    const js = this.editors.js.value || "";
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export</title>
  <style>${css}</style>
</head>
<body>
${html}
<script>${js}</script>
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codeplayground-export.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showNotification("Code downloaded!");
  }

  clearCode() {
    if (confirm("Clear all code? This cannot be undone.")) {
      Object.values(this.editors).forEach((editor) => (editor.value = ""));
      this.clearConsole();
      this.updatePreview();
      this.saveToStorage();
      this.showNotification("All code cleared");
    }
  }

  fullscreenPreview() {
    const preview = document.getElementById("preview");
    if (preview.requestFullscreen) preview.requestFullscreen();
    else if (preview.webkitRequestFullscreen) preview.webkitRequestFullscreen();
    else if (preview.msRequestFullscreen) preview.msRequestFullscreen();
  }

  showTemplatesModal() {
    document.getElementById("templatesModal").classList.add("show");
    document.body.style.overflow = "hidden";
  }
  hideTemplatesModal() {
    document.getElementById("templatesModal").classList.remove("show");
    document.body.style.overflow = "";
  }

  showShareModal() {
    document.getElementById("shareModal").classList.add("show");
    this.generateShareLink();
    document.body.style.overflow = "hidden";
  }
  hideShareModal() {
    document.getElementById("shareModal").classList.remove("show");
    document.body.style.overflow = "";
  }
  generateShareLink() {
    const code = {
      html: this.editors.html.value,
      css: this.editors.css.value,
      js: this.editors.js.value,
    };
    const encoded = btoa(JSON.stringify(code));
    document.getElementById("shareUrl").value =
      `${window.location.origin}${window.location.pathname}?code=${encoded}`;
  }

  copyShareLink() {
    const input = document.getElementById("shareUrl");
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand("copy");
    this.showNotification("Link copied to clipboard!");
  }

  exportToCodepen() {
    const html = this.editors.html.value || "";
    const css = this.editors.css.value || "";
    const js = this.editors.js.value || "";
    const form = document.createElement("form");
    form.action = "https://codepen.io/pen/define";
    form.method = "POST";
    form.target = "_blank";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = JSON.stringify({ title: "CodePlayground Pro Export", html, css, js });
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    this.showNotification("Exported to CodePen!");
  }

  loadTemplate(name) {
    const templates = {
      "🌟 Landing Page": {
        html: "<!-- Landing Page HTML -->",
        css: "body { background: #667eea; }",
        js: "console.log('Landing Page Loaded!');",
      },
      "📊 Dashboard": {
        html: "<!-- Dashboard HTML -->",
        css: "body { background: #f8fafc; }",
        js: "console.log('Dashboard Loaded!');",
      },
      "💼 Portfolio": {
        html: "<!-- Portfolio HTML -->",
        css: "body { background: #f5f7fa; }",
        js: "console.log('Portfolio Loaded!');",
      },
      "🎮 Game": {
        html: "<!-- Game HTML -->",
        css: "body { background: #1a1a2e; }",
        js: "console.log('Game Loaded!');",
      },
    };
    if (templates[name]) {
      this.editors.html.value = templates[name].html;
      this.editors.css.value = templates[name].css;
      this.editors.js.value = templates[name].js;
      this.updatePreview();
      this.saveToStorage();
      this.showNotification(`${name} template loaded`);
    }
  }

  setupModals() {
    document.body.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideTemplatesModal();
        this.hideShareModal();
      }
    });
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
          document.body.style.overflow = "";
        }
      });
    });
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  setupMagneticRipple() {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btn.style.transform = `translate(${(x - rect.width/2)/10}px, ${(y-rect.height/2)/10}px) scale(1.01)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
      btn.addEventListener("click", (e) => this.rippleEffect(e, btn));
    });
  }

  rippleEffect(e, btn) {
    const root = document.getElementById("particle-root");
    const span = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    span.style.left = `${rect.left + rect.width / 2}px`;
    span.style.top = `${rect.top + rect.height / 2}px`;
    span.style.width = span.style.height = "0px";
    span.style.background = "radial-gradient(circle, #00c6fb 0%, #605cff 60%, transparent 100%)";
    root.appendChild(span);
    span.animate([
      { width: "0px", height: "0px", opacity: 0.5 },
      { width: "80px", height: "80px", opacity: 0 }
    ], { duration: 500, easing: "cubic-bezier(.61,-0.27,.7,1.22)" });
    setTimeout(() => root.removeChild(span), 500);
  }
}

// Start the app
document.addEventListener("DOMContentLoaded", () => {
  window.codePlayground = new CodePlaygroundPro();
});
