document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  const mode = document.getElementById("mode");

  const quickMode = document.getElementById("quickMode");
  const sizeMode = document.getElementById("sizeMode");
  const manualMode = document.getElementById("manualMode");

  const sizeTarget = document.getElementById("sizeTarget");
  const customSize = document.getElementById("customSize");

  const compressBtn = document.getElementById("compressBtn");
  const result = document.getElementById("result");
  const compressedPreview = document.getElementById("compressedPreview");
  const fileSizes = document.getElementById("fileSizes");
  const downloadLink = document.getElementById("downloadLink");

  const manualWidth = document.getElementById("manualWidth");
  const manualHeight = document.getElementById("manualHeight");

  const errorMessage = document.getElementById("errorMessage");

  // Get elements for new features
  const removeImageBtn = document.getElementById("removeImageBtn");
  const zoomBtn = document.getElementById("zoomBtn");
  const zoomModal = document.getElementById("zoomModal");
  const zoomImage = document.getElementById("zoomImage");
  const closeZoomBtn = document.getElementById("closeZoomBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomResetBtn = document.getElementById("zoomResetBtn");
  const zoomPercentage = document.getElementById("zoomPercentage");

  // Get progress indicator elements
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressDetails = document.getElementById("progressDetails");
  const progressStatus = document.getElementById("progressStatus");

  let originalImage = null;
  let currentFile = null;

  // Variables for zoom functionality
  let currentZoom = 1;
  let minZoom = 0.5;
  let maxZoom = 4;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;
  let lastTranslateX = 0;
  let lastTranslateY = 0;
  let isDragging = false;
  let pinchDistance = 0;
  let pointerX = 0;
  let pointerY = 0;

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
    setTimeout(() => {
      errorMessage.classList.add("hidden");
    }, 5000);
  }

  function hideError() {
    errorMessage.classList.add("hidden");
  }

  function validateImage(file) {
    const maxSize = 10 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      showError("Please upload a valid image file (JPEG, PNG, or WebP)");
      return false;
    }

    if (file.size > maxSize) {
      showError("File size too large. Please upload an image under 10MB");
      return false;
    }

    return true;
  }

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      currentFile = file;
      const reader = new FileReader();
      reader.onload = function (evt) {
        preview.src = evt.target.result;
        document
          .getElementById("imageComparisonContainer")
          .classList.remove("hidden");
        originalImage = new Image();
        originalImage.onload = function () {
          // Show original file size and dimensions
          const originalSizeKB = (file.size / 1024).toFixed(2);
          document.getElementById(
            "originalSize"
          ).textContent = `Size: ${originalSizeKB} kB`;
          document.getElementById(
            "originalDimensions"
          ).textContent = `Dimensions: ${this.width} × ${this.height}`;

          // Update manual mode placeholders
          manualWidth.placeholder = this.width.toString();
          manualHeight.placeholder = this.height.toString();
        };
        originalImage.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  mode.addEventListener("change", () => {
    document
      .querySelectorAll(".mode")
      .forEach((m) => m.classList.add("hidden"));
    if (mode.value === "quick") quickMode.classList.remove("hidden");
    else if (mode.value === "size") sizeMode.classList.remove("hidden");
    else if (mode.value === "manual") manualMode.classList.remove("hidden");
  });

  sizeTarget.addEventListener("change", () => {
    customSize.classList.toggle("hidden", sizeTarget.value !== "custom");
  });

  // Progress indicator functions
  function showProgress() {
    progressContainer.classList.remove("hidden");
    updateProgress(0, "Initializing...");
  }

  function hideProgress() {
    progressContainer.classList.add("hidden");
  }

  function updateProgress(percent, details) {
    // Ensure percent is between 0 and 100
    percent = Math.min(Math.max(percent, 0), 100);

    // Update the progress bar width
    progressBar.style.width = percent + "%";

    // Update the percentage text
    progressPercentage.textContent = Math.round(percent) + "%";

    // Update the status details if provided
    if (details) {
      progressDetails.textContent = details;
    }

    // Update the status text based on progress
    if (percent < 25) {
      progressStatus.textContent = "Analyzing image...";
    } else if (percent < 50) {
      progressStatus.textContent = "Setting up compression...";
    } else if (percent < 75) {
      progressStatus.textContent = "Applying compression...";
    } else if (percent < 95) {
      progressStatus.textContent = "Optimizing...";
    } else {
      progressStatus.textContent = "Finalizing...";
    }
  }

  compressBtn.addEventListener("click", async () => {
    if (!originalImage || !currentFile) {
      showError("Please upload an image first.");
      return;
    }

    hideError();
    compressBtn.classList.add("loading");
    compressBtn.disabled = true;
    showProgress(); // Show progress indicator

    try {
      // Update progress to show we're starting
      updateProgress(5, "Preparing image...");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let quality = 0.8;

      // Simulate progress for image preparation
      await simulateProgress(5, 15, "Setting up canvas...");

      if (mode.value === "quick") {
        quality = parseFloat(document.getElementById("quickLevel").value);
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        // Simulate quick mode progress
        await simulateProgress(15, 40, "Applying quick compression...");
      } else if (mode.value === "manual") {
        const width = manualWidth.value
          ? parseInt(manualWidth.value)
          : originalImage.width;
        const height = manualHeight.value
          ? parseInt(manualHeight.value)
          : originalImage.height;

        // Validate dimensions
        if (width <= 0 || height <= 0) {
          throw new Error("Width and height must be positive numbers");
        }

        canvas.width = width;
        canvas.height = height;
        quality = 0.8;

        // Simulate manual mode progress
        await simulateProgress(15, 40, "Resizing image...");
      } else if (mode.value === "size") {
        let targetKB =
          sizeTarget.value === "custom"
            ? parseInt(customSize.value)
            : parseInt(sizeTarget.value);
        if (!targetKB || targetKB <= 0) {
          throw new Error("Please enter a valid target file size");
        }

        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        // Binary search for the optimal quality
        let minQuality = 0.05;
        let maxQuality = 1.0;
        let bestQuality = null;
        let bestSize = null;
        let attempts = 0;
        const maxAttempts = 12;

        // Simulate initial sizing progress
        await simulateProgress(15, 30, "Analyzing optimal compression...");

        while (attempts < maxAttempts) {
          quality = (minQuality + maxQuality) / 2;

          // Update progress for each attempt (spread from 30% to 80%)
          const attemptProgress = 30 + (attempts / maxAttempts) * 50;
          updateProgress(
            attemptProgress,
            `Attempt ${
              attempts + 1
            }/${maxAttempts}: testing quality ${quality.toFixed(2)}`
          );

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const blob = await (await fetch(dataUrl)).blob();
          const currentSize = blob.size / 1024;

          if (
            currentSize <= targetKB &&
            (bestSize === null || currentSize > bestSize)
          ) {
            bestQuality = quality;
            bestSize = currentSize;
            minQuality = quality;
            updateProgress(
              attemptProgress,
              `Found suitable quality: ${quality.toFixed(
                2
              )} (${currentSize.toFixed(1)}kB)`
            );
          } else {
            maxQuality = quality;
          }

          if (maxQuality - minQuality < 0.01) {
            break;
          }

          attempts++;

          // Add a small delay to make the progress more visible
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (bestQuality === null) {
          quality = 0.05;
          updateProgress(
            80,
            "Using minimum quality: target size may not be achievable"
          );
        } else {
          quality = bestQuality;
          updateProgress(80, `Found optimal quality: ${quality.toFixed(2)}`);
        }
      }

      // Update progress for final rendering
      await simulateProgress(80, 90, "Rendering final image...");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      const compressedData = canvas.toDataURL("image/jpeg", quality);

      // Update progress as we prepare to display result
      updateProgress(90, "Preparing preview...");

      compressedPreview.src = compressedData;
      result.classList.remove("hidden");

      const compressedImage = new Image();
      compressedImage.onload = async () => {
        // Update progress while finalizing
        updateProgress(95, "Calculating size savings...");

        const originalSizeKB = (currentFile.size / 1024).toFixed(2);
        const compressedBlob = await (await fetch(compressedData)).blob();
        const compressedSizeKB = (compressedBlob.size / 1024).toFixed(2);
        const savings = (
          100 *
          (1 - compressedBlob.size / currentFile.size)
        ).toFixed(1);

        // Complete the progress
        updateProgress(100, "Compression complete!");

        fileSizes.innerHTML = `
                    Size: ${compressedSizeKB} kB (${savings}% smaller)<br>
                    Dimensions: ${compressedImage.width} × ${compressedImage.height}
                `;
        downloadLink.href = compressedData;
        downloadLink.download = getCompressedFileName(currentFile.name);
        showResult();

        // Hide progress after a short delay to show 100%
        setTimeout(hideProgress, 1000);
      };
      compressedImage.src = compressedData;
    } catch (error) {
      hideProgress();
      showError(error.message || "An error occurred during compression");
    } finally {
      compressBtn.classList.remove("loading");
      compressBtn.disabled = false;
    }
  });

  function getCompressedFileName(originalName) {
    const extension = originalName.split(".").pop();
    const baseName = originalName.slice(0, -(extension.length + 1));
    return `${baseName}-compressed.jpg`;
  }

  manualWidth.addEventListener("input", validateDimension);
  manualHeight.addEventListener("input", validateDimension);

  function validateDimension(e) {
    const value = parseInt(e.target.value);
    if (value < 0) {
      e.target.value = "";
      showError("Dimensions must be positive numbers");
    }
    if (value > 10000) {
      e.target.value = 10000;
      showError("Maximum dimension is 10000 pixels");
    }
  }

  // Result section animation
  const showResult = () => {
    result.classList.add("show");
  };

  function initializeDragAndDrop() {
    const dropZone = document.querySelector(".upload-zone");
    const fileInput = document.getElementById("imageInput");

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener("drop", handleDrop, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function highlight(e) {
      dropZone.classList.add("drag-over");
    }

    function unhighlight(e) {
      dropZone.classList.remove("drag-over");
    }

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }

    function handleFiles(files) {
      const validFiles = [];
      const maxSize = 10 * 1024 * 1024;
      const validTypes = ["image/jpeg", "image/png", "image/webp"];

      Array.from(files).forEach((file) => {
        if (validTypes.includes(file.type) && file.size <= maxSize) {
          validFiles.push(file);
        } else {
          showError(
            !validTypes.includes(file.type)
              ? "Invalid file type. Please use JPG, PNG, or WebP."
              : "File too large. Maximum size is 10MB."
          );
        }
      });

      if (validFiles.length > 0) {
        currentFile = validFiles[0];
        fileInput.files = createFileList(validFiles);
        const event = new Event("change");
        fileInput.dispatchEvent(event);
      }
    }

    function createFileList(files) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      return dataTransfer.files;
    }
  }

  // Add event listener for the Remove Image button
  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", function () {
      console.log("Remove image clicked");
      // Reset all states
      originalImage = null;
      currentFile = null;
      preview.src = "";
      compressedPreview.src = "";
      document
        .getElementById("imageComparisonContainer")
        .classList.add("hidden");
      result.classList.remove("show");

      // Reset the file input
      imageInput.value = "";

      // Reset size and dimension info
      document.getElementById("originalSize").textContent = "";
      document.getElementById("originalDimensions").textContent = "";
      fileSizes.textContent = "";

      // Reset manual inputs
      manualWidth.value = "";
      manualHeight.value = "";

      // Reset custom size input if visible
      customSize.value = "";

      // Hide any error messages
      hideError();
    });
  } else {
    console.error("Remove Image button not found");
  }

  // Add event listener for the Zoom button
  if (zoomBtn) {
    zoomBtn.addEventListener("click", function () {
      console.log("Zoom button clicked");
      if (compressedPreview.src) {
        zoomImage.src = compressedPreview.src;
        zoomModal.classList.remove("hidden");
        setTimeout(() => {
          zoomModal.classList.add("active");
        }, 10);

        // Reset zoom on opening
        resetZoom();

        // Prevent scrolling of the background
        document.body.style.overflow = "hidden";
      }
    });
  } else {
    console.error("Zoom button not found");
  }

  // Add event listener for the Close Zoom button
  if (closeZoomBtn) {
    closeZoomBtn.addEventListener("click", closeZoomModal);
  } else {
    console.error("Close zoom button not found");
  }

  // Close when clicking outside the image
  if (zoomModal) {
    zoomModal.addEventListener("click", function (e) {
      if (e.target === zoomModal) {
        closeZoomModal();
      }
    });
  } else {
    console.error("Zoom modal not found");
  }

  // Close with Escape key
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      zoomModal &&
      !zoomModal.classList.contains("hidden")
    ) {
      closeZoomModal();
    }
  });

  function closeZoomModal() {
    if (zoomModal) {
      zoomModal.classList.remove("active");

      // Wait for animation to finish before hiding
      setTimeout(() => {
        zoomModal.classList.add("hidden");
        // Restore scrolling
        document.body.style.overflow = "";
      }, 300);
    }
  }

  function resetZoom() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    lastTranslateX = 0;
    lastTranslateY = 0;
    updateZoomImage();
  }

  function updateZoomImage() {
    zoomImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    zoomPercentage.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  function showZoomPercentage() {
    // No need to change opacity as it's always visible
    // No need to update position as it's fixed
  }

  function limitZoom(value) {
    return Math.min(Math.max(value, minZoom), maxZoom);
  }

  function limitTranslation() {
    // Implement boundaries based on current zoom level
    const scaledWidth = zoomImage.offsetWidth * currentZoom;
    const scaledHeight = zoomImage.offsetHeight * currentZoom;

    const maxX = Math.max(0, (scaledWidth - window.innerWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - window.innerHeight) / 2);

    translateX = Math.min(Math.max(translateX, -maxX), maxX);
    translateY = Math.min(Math.max(translateY, -maxY), maxY);
  }

  // Events for zoom controls
  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      currentZoom = limitZoom(currentZoom + 0.25);
      updateZoomImage();
      showZoomPercentage();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      currentZoom = limitZoom(currentZoom - 0.25);
      updateZoomImage();
      showZoomPercentage();
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", () => {
      resetZoom();
      showZoomPercentage();
    });
  }

  // Mouse wheel zoom
  if (zoomImage) {
    zoomImage.addEventListener("wheel", (e) => {
      e.preventDefault();

      // Store mouse position
      const rect = zoomImage.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom direction
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const oldZoom = currentZoom;
      currentZoom = limitZoom(currentZoom + delta);

      // Adjust translation to zoom towards mouse position
      if (oldZoom !== currentZoom) {
        const zoomFactor = currentZoom / oldZoom;

        translateX = mouseX - (mouseX - translateX) * zoomFactor;
        translateY = mouseY - (mouseY - translateY) * zoomFactor;

        limitTranslation();
        updateZoomImage();

        // Update pointer position and show zoom percentage
        pointerX = e.clientX;
        pointerY = e.clientY;
        showZoomPercentage();
      }
    });

    // Drag functionality
    zoomImage.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      isDragging = true;
      zoomModal.classList.add("grabbing");
    });

    zoomImage.addEventListener("mousemove", (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;

      if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        limitTranslation();
        updateZoomImage();
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        zoomModal.classList.remove("grabbing");
        lastTranslateX = translateX;
        lastTranslateY = translateY;
      }
    });

    // Touch events for mobile pinch zoom
    let initialTouchDistance = 0;
    let initialZoom = 1;

    zoomImage.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = currentZoom;
      } else if (e.touches.length === 1) {
        // Drag start
        e.preventDefault();
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
        isDragging = true;
      }
    });

    zoomImage.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate center point of the two touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        // Update pointer position for zoom percentage indicator
        pointerX = centerX;
        pointerY = centerY;

        // Calculate current distance
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // Calculate zoom factor
        const zoomFactor = currentDistance / initialTouchDistance;
        currentZoom = limitZoom(initialZoom * zoomFactor);

        updateZoomImage();
        showZoomPercentage();
      } else if (e.touches.length === 1 && isDragging) {
        // Single touch drag
        e.preventDefault();
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        limitTranslation();
        updateZoomImage();
      }
    });

    zoomImage.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) {
        initialTouchDistance = 0;
        initialZoom = currentZoom;
      }

      if (e.touches.length === 0) {
        isDragging = false;
        lastTranslateX = translateX;
        lastTranslateY = translateY;
      }
    });
  }

  // Function to simulate progress over time
  async function simulateProgress(start, end, detailMessage) {
    const duration = 500; // Duration in milliseconds
    const steps = 10; // Number of steps
    const increment = (end - start) / steps;

    updateProgress(start, detailMessage);

    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, duration / steps));
      updateProgress(start + increment * i, detailMessage);
    }
  }

  // Initialize drag and drop
  initializeDragAndDrop();
});
