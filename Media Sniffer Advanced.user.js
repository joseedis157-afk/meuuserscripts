// ==UserScript==
// @name         Media Sniffer Avançado & Robusto v1.0
// @namespace    https://github.com
// @version      1.0
// @description  Detector avançado de mídia + Network Intercept + Multi-Player Support
// @author       José & Eterna
// @run-at       document-start
// @match        https://*/*
// @match        http://*/*
// @grant        none
// @license      MIT License
// ==/UserScript==

(function () {
    'use strict';

    console.log("🚀 Media Sniffer Avançado iniciado!");

    // ============================================
    // 1️⃣ INTERCEPTA XHR E FETCH (NETWORK)
    // ============================================
    const detectedMedia = [];
    const mediaPatterns = /\.(mp4|webm|ogg|mkv|avi|mov|flv|m4v|mpg|mpeg|3gp|m3u8|mpd|ts|m4a|mp3|aac|opus|flac|wav|aiff|wma|m4b|m4p)(\?.*)?$/i;

    // Intercepta FETCH
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        const url = args[0];
        if (url && mediaPatterns.test(url.toString())) {
            addMediaSource(url.toString(), 'fetch');
        }
        return originalFetch.apply(this, args);
    };

    // Intercepta XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        if (url && mediaPatterns.test(url.toString())) {
            addMediaSource(url.toString(), 'xhr');
        }
        return originalOpen.apply(this, arguments);
    };

    // ============================================
    // 2️⃣ MONITORA MUDANÇAS NO DOM (MUTATION OBSERVER)
    // ============================================
    function scanDOMForMedia() {
        // VIDEO tags
        document.querySelectorAll('video').forEach(video => {
            if (video.src && mediaPatterns.test(video.src)) {
                addMediaSource(video.src, 'video-tag');
            }
            video.querySelectorAll('source').forEach(source => {
                if (source.src && mediaPatterns.test(source.src)) {
                    addMediaSource(source.src, 'source-tag');
                }
            });
        });

        // AUDIO tags
        document.querySelectorAll('audio').forEach(audio => {
            if (audio.src && mediaPatterns.test(audio.src)) {
                addMediaSource(audio.src, 'audio-tag');
            }
            audio.querySelectorAll('source').forEach(source => {
                if (source.src && mediaPatterns.test(source.src)) {
                    addMediaSource(source.src, 'source-tag');
                }
            });
        });

        // Links diretos para mídia
        document.querySelectorAll('a[href*=".mp4"], a[href*=".webm"], a[href*=".m3u8"], a[href*=".mpd"], a[href*=".mp3"], a[href*=".m4a"]').forEach(a => {
            if (a.href && mediaPatterns.test(a.href)) {
                addMediaSource(a.href, 'link');
            }
        });

        // Data attributes (players customizados)
        document.querySelectorAll('[data-video-url], [data-src], [data-media-url], [data-url]').forEach(el => {
            ['data-video-url', 'data-src', 'data-media-url', 'data-url', 'data-video', 'data-source'].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && mediaPatterns.test(val)) {
                    addMediaSource(val, 'data-attr');
                }
            });
        });

        // Scripts inline (players como HLS.js, Dash.js)
        document.querySelectorAll('script').forEach(script => {
            if (!script.src) {
                const content = script.textContent;
                const urls = content.match(/https?:\/\/[^\s"'<>]+\.(m3u8|mpd|mp4|webm|ogg|mp3|m4a)/gi) || [];
                urls.forEach(url => addMediaSource(url, 'script-inline'));
            }
        });
    }

    // Mutation Observer - detecta mudanças em tempo real
    const observer = new MutationObserver((mutations) => {
        scanDOMForMedia();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-video-url', 'data-src', 'href']
    });

    // ============================================
    // 3️⃣ DETECTA PLAYERS POPULARES
    // ============================================
    function detectPlayers() {
        // Video.js
        if (window.videojs) {
            console.log("✅ Video.js detectado!");
            document.querySelectorAll('.video-js').forEach(player => {
                if (player.player()) {
                    const src = player.player().currentSrc();
                    if (src) addMediaSource(src, 'videojs');
                }
            });
        }

        // HLS.js
        if (window.Hls) {
            console.log("✅ HLS.js detectado!");
        }

        // DASH.js
        if (window.dashjs) {
            console.log("✅ DASH.js detectado!");
        }

        // JW Player
        if (window.jwplayer) {
            console.log("✅ JW Player detectado!");
        }

        // Plyr
        if (window.Plyr) {
            console.log("✅ Plyr detectado!");
        }

        // YouTube (iframe)
        document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
            addMediaSource(iframe.src, 'youtube-iframe');
        });

        // Vimeo (iframe)
        document.querySelectorAll('iframe[src*="vimeo"]').forEach(iframe => {
            addMediaSource(iframe.src, 'vimeo-iframe');
        });
    }

    // ============================================
    // 4️⃣ ARMAZENA MEDIA SOURCES
    // ============================================
    function addMediaSource(url, source) {
        if (!url || url.length < 10) return;

        try {
            const normalizedUrl = new URL(url, window.location.origin).href;
            
            // Evita duplicatas
            if (!detectedMedia.some(m => m.src === normalizedUrl)) {
                detectedMedia.push({
                    src: normalizedUrl,
                    type: getMediaType(normalizedUrl),
                    source: source
                });

                console.log(`🎬 Mídia detectada [${source}]:`, normalizedUrl);
            }
        } catch (e) {
            console.log("⚠️ URL inválida:", url);
        }
    }

    function getMediaType(url) {
        if (url.match(/\.(mp4|webm|mkv|avi|mov|flv|m4v|mpg|mpeg|3gp)(\?.*)?$/i)) return 'video';
        if (url.match(/\.(m3u8|mpd)(\?.*)?$/i)) return 'video';
        if (url.match(/\.(mp3|m4a|aac|opus|flac|wav|aiff|wma)(\?.*)?$/i)) return 'audio';
        return 'video';
    }

    // ============================================
    // 5️⃣ BOTÃO FLUTUANTE (IGUAL AO ORIGINAL)
    // ============================================
    function createFloatingButton() {
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

        // Recupera posição salva
        const savedPosition = JSON.parse(localStorage.getItem("floatingBtnPosition"));
        if (savedPosition) {
            btn.style.left = savedPosition.left;
            btn.style.top = savedPosition.top;
            btn.style.bottom = "auto";
            btn.style.right = "auto";
        }

        // Arrastar (mouse + touch)
        let isDragging = false;
        let offsetX, offsetY;

        function startDrag(x, y) {
            isDragging = true;
            offsetX = x - btn.getBoundingClientRect().left;
            offsetY = y - btn.getBoundingClientRect().top;
            btn.style.cursor = "grabbing";
        }

        function moveDrag(x, y) {
            if (!isDragging) return;
            btn.style.left = x - offsetX + "px";
            btn.style.top = y - offsetY + "px";
            btn.style.bottom = "auto";
            btn.style.right = "auto";
        }

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            btn.style.cursor = "grab";
            localStorage.setItem("floatingBtnPosition", JSON.stringify({
                left: btn.style.left,
                top: btn.style.top
            }));
        }

        // Mouse
        btn.addEventListener("mousedown", e => startDrag(e.clientX, e.clientY));
        document.addEventListener("mousemove", e => moveDrag(e.clientX, e.clientY));
        document.addEventListener("mouseup", endDrag);

        // Touch (mobile)
        btn.addEventListener("touchstart", e => {
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
        });

        document.addEventListener("touchmove", e => {
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
        });

        document.addEventListener("touchend", endDrag);

        // Clique para abrir reprodutor
        btn.addEventListener("click", sniffMedia);
    }

    // ============================================
    // 6️⃣ REPRODUTOR OVERLAY (IGUAL AO ORIGINAL)
    // ============================================
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

        const media = document.createElement(type === 'audio' ? 'audio' : 'video');
        media.src = src;
        media.controls = true;
        media.autoplay = true;
        media.style.width = "100%";

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

    // ============================================
    // 7️⃣ FUNÇÃO SNIFF (ORIGINAL)
    // ============================================
    function sniffMedia() {
        if (detectedMedia.length === 0) {
            alert("Nenhuma mídia encontrada 😅");
            return;
        }

        openPlayer(detectedMedia[0].src, detectedMedia[0].type);
        console.log("👁️ Mídias detectadas:", detectedMedia.map(m => m.src));
    }

    // ============================================
    // 8️⃣ INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log("✅ Inicializando Media Sniffer...");
        createFloatingButton();
        scanDOMForMedia();
        detectPlayers();

        // Rescans periódicos
        setInterval(scanDOMForMedia, 5000);
        setInterval(detectPlayers, 10000);
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }

    console.log("✅ Media Sniffer Avançado carregado com sucesso!");
})();
