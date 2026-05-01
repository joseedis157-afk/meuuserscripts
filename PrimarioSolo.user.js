// ==UserScript==
// @name         Primário Solo Completo com Barrinha UPB Clone
// @namespace    https://github.com
// @version      1.2
// @description  Script primário solo do José com barrinha estilo Ultra Popup Blocker v2 totalmente funcional e Settings integrado
// @author       José & Eterna
// @match        *://*/*
// @license      MIT License
// @run-at       document-start
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==

(function () {
'use strict';

// ===============================
// CONSTANTES
// ===============================
const CONSTANTS = {
TIMEOUT_SECONDS: 15,
MODAL_WIDTH_PC: '550px',
LOGO_SVG: "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiIvPjxwYXRoIGQ9Ik05IDEybDIgMiA0LTQiLz48L3N2Zz4=",
STORAGE_KEYS: {
ALL: "allow_",
DEN: "deny_",
CONFIG: "upb_config"
}
};

const globalScope = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
const originalOpen = globalScope.open;

// ===============================
// ESTILOS CSS
// ===============================
const STYLES = `
.upb-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;height:32px!important;padding:0 14px!important;margin:0!important;box-sizing:border-box!important;border-radius:2px!important;font-size:12px!important;font-weight:400!important;cursor:pointer!important;transition:background 0.1s,color 0.1s!important;line-height:1!important;outline:0!important;white-space:nowrap!important;font-family:monospace,"Courier New",Courier,sans-serif!important;text-transform:uppercase!important;letter-spacing:0.5px!important;-webkit-appearance:none!important;appearance:none!important;}
.upb-allow{background:transparent!important;color:#E0E0E0!important;border:1px solid #E0E0E0!important}
.upb-allow:hover{background:#E0E0E0!important;color:#000!important}
.upb-trust{background:transparent!important;color:#E0E0E0!important;border:1px solid #E0E0E0!important}
.upb-trust:hover{background:#E0E0E0!important;color:#000!important}
.upb-deny{background:transparent!important;color:#E0E0E0!important;border:1px solid #E0E0E0!important;font-weight:bold!important}
.upb-deny:hover{background:#E0E0E0!important;color:#000!important}
.upb-denyTemp{background:transparent!important;color:#999!important;border:1px dashed #999!important}
.upb-denyTemp:hover{background:#999!important;color:#000!important}
.upb-neutral{background:transparent!important;color:#888!important;border:1px solid #444!important}
.upb-neutral:hover{background:#444!important;color:#E0E0E0!important}

#upb-bar{position:fixed!important;bottom:20px!important;left:50%!important;transform:translateX(-50%)!important;z-index:2147483647!important;width:auto!important;max-width:95%!important;padding:10px 14px!important;display:none;align-items:center!important;gap:15px!important;font-family:monospace,"Courier New",Courier,sans-serif!important;font-size:12px!important;color:#E0E0E0!important;background:#000!important;border:1px solid #444!important}
#upb-settings{color:#E0E0E0!important;text-decoration:underline!important;cursor:pointer!important;font-size:11px!important;margin-left:8px!important}
`;

const styleTag = document.createElement('style');
styleTag.textContent = STYLES;
document.head.appendChild(styleTag);

// ===============================
// UTILITÁRIOS
// ===============================
const createButton = (text, className, onClick) => {
const btn = document.createElement("button");
btn.className = `upb-btn upb-${className}`;
btn.textContent = text;
btn.onclick = onClick;
return btn;
};

// ===============================
// GERENCIADOR DE DOMÍNIOS
// ===============================
const DomainManager = {
async getDomainState(domain) {
if (!domain) return "ask";
if (await GM.getValue(CONSTANTS.STORAGE_KEYS.ALL + domain)) return "allow";
if (await GM.getValue(CONSTANTS.STORAGE_KEYS.DEN + domain)) return "deny";
return "ask";
},
async modifyDomain(domain, type) {
if (!domain) return;
await GM.deleteValue(CONSTANTS.STORAGE_KEYS.ALL + domain);
await GM.deleteValue(CONSTANTS.STORAGE_KEYS.DEN + domain);
if (type === "allow") await GM.setValue(CONSTANTS.STORAGE_KEYS.ALL + domain, 1);
if (type === "deny") await GM.setValue(CONSTANTS.STORAGE_KEYS.DEN + domain, 1);
},
parseDomain(url) {
try {
let hostname = new URL(url).hostname.toLowerCase();
hostname = hostname.replace(/^www\./, '');
return hostname;
} catch { return null; }
}
};

// ===============================
// BARRINHA DE AVISO
// ===============================
class NotificationBar {
constructor() {
this.element = null;
this.timer = null;
this.count = CONSTANTS.TIMEOUT_SECONDS;
}

show(url) {
url = url || "about:blank";

if (!this.element) {
this.element = document.createElement("div");
this.element.id = "upb-bar";
document.body.appendChild(this.element);
}

this.count = CONSTANTS.TIMEOUT_SECONDS;
if (this.timer) clearInterval(this.timer);

this.element.style.display = "flex";
this.element.innerHTML = '';

const domain = DomainManager.parseDomain(url);

// Botões
const denyBtn = createButton(`[ Deny (${this.count}) ]`, "denyTemp", () => this.hide());
const allowBtn = createButton("[ Allow ]", "allow", () => { this.hide(); originalOpen(url); });
const trustBtn = createButton("[ Trust ]", "trust", () => { this.hide(); DomainManager.modifyDomain(domain, 'allow'); originalOpen(url); });

// Info
const info = document.createElement("div");
info.className = "upb-info";
const displayUrl = url.length > 40 ? url.substring(0, 40) + '...' : url;
info.innerHTML = `<img src="${CONSTANTS.LOGO_SVG}" style="width:20px;height:20px;margin-right:6px"><span>Blocked popup to ${displayUrl}</span>`;

// Actions
const actions = document.createElement("div");
actions.className = "upb-actions";
actions.append(allowBtn, trustBtn, denyBtn);

// Settings link
const settings = document.createElement("span");
settings.id = "upb-settings";
settings.textContent = "Settings";
settings.onclick = () => alert("Aqui você pode configurar as permissões futuras.");

this.element.append(info, actions, settings);

this.timer = setInterval(() => {
this.count--;
denyBtn.textContent = `[ Deny (${this.count}) ]`;
if (this.count <= 0) this.hide();
}, 1000);
}

hide() {
if (this.element) this.element.style.display = "none";
if (this.timer) clearInterval(this.timer);
}
}

const notificationBar = new NotificationBar();

// ===============================
// SOBRESCREVE O OPEN
// ===============================
globalScope.open = function(url, name, specs) {
const domain = DomainManager.parseDomain(url);
DomainManager.getDomainState(domain).then(state => {
if (state === "allow") {
return originalOpen(url, name, specs);
} else if (state === "deny") {
console.log(`Blocked popup to ${url}`);
return null;
} else {
notificationBar.show(url);
return null;
}
});
return null;
};

})();
