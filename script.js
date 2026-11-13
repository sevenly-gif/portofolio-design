
document.addEventListener("DOMContentLoaded", () => {
    const year = document.querySelector("#year");
    if (year) year.textContent = new Date().getFullYear();

    const links = document.querySelectorAll(".nav-link");
    const sections = [...document.querySelectorAll("main section[id]")];
    const header = document.querySelector(".site-header");
    const navigation = document.querySelector(".glass-nav");
    const movePillTo = (link) => {
        if (!navigation || !link) return;
        navigation.style.setProperty("--nav-pill-x", `${link.offsetLeft}px`);
        navigation.style.setProperty("--nav-pill-width", `${link.offsetWidth}px`);
        navigation.classList.add("has-active-pill");
    };
    const moveActivePill = () => movePillTo(navigation?.querySelector(".nav-link.active"));
    const updateActiveLink = () => {
        header?.classList.toggle("is-scrolled", window.scrollY > 12);
        const activeLine = window.innerHeight * 0.45;
        const currentSection = sections.filter((section) => section.getBoundingClientRect().top <= activeLine).pop();
        if (currentSection) {
            links.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${currentSection.id}`);
            });
        }
        moveActivePill();
    };

    links.forEach((link) => {
        link.addEventListener("pointerenter", () => movePillTo(link));
        link.addEventListener("focus", () => movePillTo(link));
        link.addEventListener("click", () => {
            links.forEach((item) => item.classList.toggle("active", item === link));
            moveActivePill();
        });
    });
    navigation?.addEventListener("pointerleave", moveActivePill);
    navigation?.addEventListener("focusout", (event) => {
        if (!navigation.contains(event.relatedTarget)) moveActivePill();
    });
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("resize", moveActivePill, { passive: true });
    updateActiveLink();

    const cursorWave = document.querySelector(".cursor-wave");
    const heroArt = document.querySelector(".hero-art");
    const artSphere = heroArt?.querySelector(".art-sphere");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (cursorWave) {
        let scrollFrame = 0;
        const updateWaveFromScroll = () => {
            scrollFrame = 0;
            const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollRange > 0 ? Math.min(Math.max(window.scrollY / scrollRange, 0), 1) : 0;
            cursorWave.style.setProperty("--wave-dash-offset", `${-80 - progress * 1500}px`);
            cursorWave.style.setProperty("--wave-intensity", `${.18 + progress * .82}`);
        };
        const scheduleWaveUpdate = () => {
            if (scrollFrame) return;
            scrollFrame = window.requestAnimationFrame(updateWaveFromScroll);
        };
        window.addEventListener("scroll", scheduleWaveUpdate, { passive: true });
        window.addEventListener("resize", scheduleWaveUpdate, { passive: true });
        updateWaveFromScroll();
        prefersReducedMotion.addEventListener("change", (event) => {
            if (event.matches) {
                if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
                scrollFrame = 0;
            }
            updateWaveFromScroll();
        });
    }

    if (artSphere && !prefersReducedMotion.matches && window.matchMedia("(pointer: fine)").matches) {
        let pointerFrame = 0;
        let pointerX = window.innerWidth / 2;
        let pointerY = window.innerHeight / 2;

        const trackPointer = (event) => {
            if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
            pointerX = event.clientX;
            pointerY = event.clientY;

            if (!pointerFrame) {
                pointerFrame = window.requestAnimationFrame(() => {
                    pointerFrame = 0;
                    const offsetX = (pointerX / window.innerWidth - .5) * 28;
                    const offsetY = (pointerY / window.innerHeight - .5) * 28;
                    artSphere.style.setProperty("--sphere-x", `${offsetX}px`);
                    artSphere.style.setProperty("--sphere-y", `${offsetY}px`);
                });
            }
        };

        window.addEventListener("pointermove", trackPointer, { passive: true });
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
        const revealItems = document.querySelectorAll(".section-heading, .project-card, .about-card, .contact-section > .eyebrow, .contact-section > h2, .contact-actions");
        document.body.classList.add("has-reveal");
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
        let revealFrame = 0;
        const revealPassedItems = () => {
            revealFrame = 0;
            revealItems.forEach((item) => {
                if (item.classList.contains("is-visible") || item.getBoundingClientRect().top >= window.innerHeight - 36) return;
                item.classList.add("is-visible");
                revealObserver.unobserve(item);
            });
        };
        const scheduleRevealCheck = () => {
            if (revealFrame) return;
            revealFrame = window.requestAnimationFrame(revealPassedItems);
        };

        revealItems.forEach((item, index) => {
            item.classList.add("reveal");
            item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 330)}ms`);
            revealObserver.observe(item);
        });
        window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
        scheduleRevealCheck();
    }

    const videoDialog = document.querySelector(".video-dialog");
    const videoStage = videoDialog?.querySelector(".video-dialog-stage");
    const videoTitle = videoDialog?.querySelector("#video-dialog-title");
    const videoStatus = videoDialog?.querySelector(".video-dialog-status");
    const closeButton = videoDialog?.querySelector(".video-dialog-close");
    let activeVideo;
    let activePoster;
    let idleTimer;

    if (videoDialog && videoStage && videoTitle && videoStatus && closeButton) {
        const closeVideo = () => {
            if (!activePoster) return;

            window.clearTimeout(idleTimer);
            videoDialog.classList.remove("is-idle");
            activeVideo?.pause();
            videoStage.replaceChildren();
            activeVideo = null;
            activePoster.focus();
            activePoster = null;
            videoStatus.textContent = "";
        };

        const revealVideo = () => {
            window.clearTimeout(idleTimer);
            videoDialog.classList.remove("is-idle");
            idleTimer = window.setTimeout(() => videoDialog.classList.add("is-idle"), 1800);
        };

        closeButton.addEventListener("click", () => videoDialog.close());
        videoDialog.addEventListener("close", closeVideo);
        videoDialog.addEventListener("keydown", (event) => {
            revealVideo();
            if (event.key === "Escape") {
                event.preventDefault();
                videoDialog.close();
            }
        });
        videoDialog.addEventListener("pointermove", revealVideo, { passive: true });
        videoDialog.addEventListener("pointerdown", revealVideo);
        videoDialog.addEventListener("touchstart", revealVideo, { passive: true });
        videoDialog.addEventListener("click", (event) => {
            if (event.target === videoDialog) videoDialog.close();
        });

        document.querySelectorAll(".video-frame").forEach((frame) => {
            const video = frame.querySelector("video");
            const source = video?.querySelector("source");
            const playButton = frame.querySelector(".video-poster");
            const previewGif = playButton?.querySelector(".video-preview-gif");
            const title = frame.closest(".project-card")?.querySelector("h3")?.textContent.trim();

            if (!video || !source || !playButton || !title) return;
            const playLabel = `Play ${title}`;
            playButton.setAttribute("aria-label", playLabel);
            playButton.title = playLabel;

            const showGifPreview = () => {
                if (!previewGif || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                if (!previewGif.hasAttribute("src")) previewGif.src = previewGif.dataset.src;
                playButton.classList.add("is-previewing");
            };
            const hideGifPreview = () => {
                if (!previewGif || playButton.matches(":hover") || playButton.matches(":focus-visible")) return;
                playButton.classList.remove("is-previewing");
            };

            playButton.addEventListener("pointerenter", showGifPreview);
            playButton.addEventListener("pointerleave", hideGifPreview);
            playButton.addEventListener("focus", showGifPreview);
            playButton.addEventListener("blur", hideGifPreview);

            playButton.addEventListener("click", async () => {
                activePoster = playButton;
                videoTitle.textContent = title;

                if (window.location.protocol === "file:") {
                    videoStatus.textContent = "Browsers block MP4 playback when this page is opened as a file. Close this player and open start-portfolio.bat.";
                    videoStage.replaceChildren();
                    videoDialog.showModal();
                    revealVideo();
                    return;
                }

                const modalVideo = document.createElement("video");
                modalVideo.controls = true;
                modalVideo.playsInline = true;
                modalVideo.preload = "metadata";
                modalVideo.src = source.src;
                modalVideo.setAttribute("aria-label", `Video player for ${title}`);
                activeVideo = modalVideo;
                videoStatus.textContent = "Loading video...";
                videoStage.replaceChildren(modalVideo);
                videoDialog.showModal();
                revealVideo();

                modalVideo.addEventListener("playing", () => {
                    if (activeVideo === modalVideo) videoStatus.textContent = "";
                });

                const showMediaError = () => {
                    if (activeVideo !== modalVideo || !videoDialog.open) return;

                    const errorCode = modalVideo.error?.code;
                    if (errorCode === MediaError.MEDIA_ERR_NETWORK) {
                        videoStatus.textContent = "The video could not load. Check your connection and try again.";
                    } else if (errorCode === MediaError.MEDIA_ERR_DECODE) {
                        videoStatus.textContent = "The video file could not be decoded. Check the MP4 file.";
                    } else {
                        videoStatus.textContent = "This MP4 could not be opened. Check the file and its video codec.";
                    }
                };
                modalVideo.addEventListener("canplay", () => {
                    if (activeVideo === modalVideo) videoStatus.textContent = "";
                }, { once: true });
                modalVideo.addEventListener("error", showMediaError, { once: true });

                try {
                    await modalVideo.play();
                } catch (error) {
                    if (activeVideo !== modalVideo || !videoDialog.open || error.name === "AbortError") return;
                    if (error.name === "NotAllowedError") {
                        videoStatus.textContent = "Press play on the video controls to start playback.";
                    } else {
                        showMediaError();
                    }
                }
            });
        });
    }
});
