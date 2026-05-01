// ==UserScript==
// @name         Detector de Mídia Sniff
// @namespace    https://github.com
// @version      0.2
// @description  Sniff Media Resource + Botão Flutuante que lembra posição
// @author       Eterna e José
// @run-at       document-end
// @match        https://*/*
// @grant        none
// @license      MIT License
// ==/UserScript==

(function () {
    // === Cria botão flutuante minimalista
    const btn = document.createElement("button");
    btn.innerText = "👁️";
    Object.assign(btn.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 999999,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(79, 195, 247, 0.5)",
        color: "#111",
        fontSize: "20px",
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        transition: "background 0.2s"
    });
    document.body.appendChild(btn);
 
    // === Recupera posição salva
    const savedPosition = JSON.parse(localStorage.getItem("floatingBtnPosition"));
    if (savedPosition) {
        btn.style.left = savedPosition.left;
        btn.style.top = savedPosition.top;
        btn.style.bottom = "auto";
        btn.style.right = "auto";
    }
 
    // === Arrastável com memória
    let isDragging = false;
    let offsetX, offsetY;
 
    btn.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - btn.getBoundingClientRect().left;
        offsetY = e.clientY - btn.getBoundingClientRect().top;
        btn.style.cursor = "grabbing";
    });
 
    document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        btn.style.left = e.clientX - offsetX + "px";
        btn.style.top = e.clientY - offsetY + "px";
        btn.style.bottom = "auto";
        btn.style.right = "auto";
    });
 
    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        btn.style.cursor = "grab";
        // Salva posição
        localStorage.setItem("floatingBtnPosition", JSON.stringify({
            left: btn.style.left,
            top: btn.style.top
        }));
    });
 
    // === Overlay Player
    let overlay;
    function openPlayer(src, type) {
        if (overlay) overlay.remove();
 
        overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999998
        });
 
        const box = document.createElement("div");
        Object.assign(box.style, {
            width: "300px",
            background: "#111",
            borderRadius: "12px",
            padding: "12px",
            position: "relative",
            boxShadow: "0 0 30px rgba(255,255,255,0.15)"
        });
 
        const media = document.createElement(type);
        media.src = src;
        media.controls = true;
        media.autoplay = true;
        media.style.width = "100%";
 
        // Fechar
        const close = document.createElement("div");
        close.innerText = "✖";
        Object.assign(close.style, {
            position: "absolute",
            top: "10px",
            right: "15px",
            cursor: "pointer",
            color: "white",
            fontSize: "18px"
        });
        close.onclick = () => overlay.remove();
 
        box.appendChild(media);
        box.appendChild(close);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
 
    // === Função que varre toda a página
    function sniffMedia() {
        const mediaList = [];
 
        document.querySelectorAll('video, audio').forEach(el => {
            if (el.src) mediaList.push({ src: el.src, type: el.tagName.toLowerCase() });
            el.querySelectorAll('source').forEach(s => {
                if (s.src) mediaList.push({ src: s.src, type: el.tagName.toLowerCase() });
            });
        });
 
        document.querySelectorAll('a[href$=".mp4"], a[href$=".mp3"], a[href$=".m4a"], a[href$=".webm"], a[href$=".ogg"], a[href$=".m3u8"]').forEach(a => {
            mediaList.push({ src: a.href, type: "video" });
        });
 
        if (mediaList.length === 0) {
            alert("Nenhuma mídia encontrada 😅");
            return;
        }
 
        openPlayer(mediaList[0].src, mediaList[0].type);
        console.log("👁️ Mídias detectadas:", mediaList.map(m => m.src));
    }
 
    // Botão clicado
    btn.onclick = sniffMedia;
 
    console.log("👁️ Sniff Media Resource + Botão Flutuante Minimalista ATIVO com memória de posição");
})();
