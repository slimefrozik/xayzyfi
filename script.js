const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

const targets = document.querySelectorAll(".link-card, .player-shell, .now-card, .ladder-wrap");
targets.forEach((el) => observer.observe(el));

const stack = document.querySelector(".image-stack");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let isCycling = false;

const cycleCards = (cards) => {
  cards.forEach((card) => {
    if (card.classList.contains("pos-1")) {
      card.classList.remove("pos-1");
      card.classList.add("pos-2");
    } else if (card.classList.contains("pos-2")) {
      card.classList.remove("pos-2");
      card.classList.add("pos-3");
    } else {
      card.classList.remove("pos-3");
      card.classList.add("pos-1");
    }
  });
};

if (stack) {
  stack.addEventListener("click", () => {
    if (isCycling) return;

    const cards = Array.from(stack.querySelectorAll(".img"));
    if (prefersReducedMotion.matches) {
      cycleCards(cards);
      return;
    }

    isCycling = true;
    stack.classList.remove("prism-spin");
    void stack.offsetWidth;
    stack.classList.add("prism-spin");

    setTimeout(() => {
      cycleCards(cards);
    }, 360);

    setTimeout(() => {
      stack.classList.remove("prism-spin");
      isCycling = false;
    }, 1000);
  });
}

const player = document.querySelector("[data-player]");

if (player) {
  const playlist = [
    "BEAT-1_chill_141pbm.mp3",
    "BEAT-2_future_129Bpm.mp3",
    "BEAT-3_139bpm.mp3",
    "BEAT-4_138Bpm.mp3",
  ];

  const audio = player.querySelector("[data-audio]");
  const toggle = player.querySelector("[data-play-toggle]");
  const prev = player.querySelector("[data-prev]");
  const next = player.querySelector("[data-next]");
  const currentTimeEl = player.querySelector("[data-time-current]");
  const trackCountEl = player.querySelector("[data-track-count]");
  const progress = player.querySelector("[data-seek]");
  const fill = player.querySelector("[data-progress-fill]");
  const volume = player.querySelector("[data-volume]");
  let currentTrack = 0;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const updateProgressA11y = () => {
    const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progress.setAttribute("aria-valuenow", String(Math.round(ratio)));
    progress.setAttribute(
      "aria-valuetext",
      `${formatTime(audio.currentTime)} of ${formatTime(audio.duration || 0)}`
    );
  };

  const renderTrack = () => {
    audio.src = playlist[currentTrack];
    trackCountEl.textContent = `${currentTrack + 1} / ${playlist.length}`;
    currentTimeEl.textContent = "0:00";
    fill.style.width = "0%";
    updateProgressA11y();
  };

  const updateButtonState = () => {
    toggle.classList.toggle("is-playing", !audio.paused);
  };

  const changeTrack = (direction) => {
    currentTrack = (currentTrack + direction + playlist.length) % playlist.length;
    const shouldResume = !audio.paused;
    renderTrack();
    if (shouldResume) {
      audio.play();
    }
    updateButtonState();
  };

  const seekTo = (clientX) => {
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = ratio * audio.duration;
    }
  };

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    updateButtonState();
  });

  prev.addEventListener("click", () => changeTrack(-1));
  next.addEventListener("click", () => changeTrack(1));

  audio.addEventListener("timeupdate", () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fill.style.width = `${ratio}%`;
    updateProgressA11y();
  });

  audio.addEventListener("play", updateButtonState);
  audio.addEventListener("pause", updateButtonState);
  audio.addEventListener("ended", () => changeTrack(1));
  audio.addEventListener("loadedmetadata", () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    updateProgressA11y();
  });

  progress.addEventListener("click", (event) => {
    seekTo(event.clientX);
  });

  progress.addEventListener("keydown", (event) => {
    if (!Number.isFinite(audio.duration)) return;

    if (event.key === "ArrowRight") {
      audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
    }

    if (event.key === "ArrowLeft") {
      audio.currentTime = Math.max(audio.currentTime - 5, 0);
    }

    if (event.key === "Home") {
      audio.currentTime = 0;
    }

    if (event.key === "End") {
      audio.currentTime = audio.duration;
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value) / 100;
  });

  audio.volume = 1;
  renderTrack();
  updateButtonState();
}
