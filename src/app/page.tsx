'use client'
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileReaderEvent extends ProgressEvent<FileReader> {
  target: FileReader;
}

const CircularImage = ({ src, className }: { src: string, className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw image
      ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);

  return <canvas ref={canvasRef} className={className} />;
};

const ProfileBanner = () => {
  // Add state for carousel
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Add carousel animation effect
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const scrollSpeed = 1; // Pixels per frame
    let animationFrameId: number;

    const scroll = () => {
      setScrollPosition((prev) => {
        const newPosition = prev + scrollSpeed;
        if (newPosition >= carousel.scrollWidth / 2) {
          return 0;
        }
        return newPosition;
      });
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Initialize banner text to a default value.
  // (You can change this to an empty string if you prefer no default text.)
  const [bannerText, setBannerText] = useState("#NOT HIRING");
  const [image, setImage] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState("#ff0000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const img = new Image();
          img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
            setImage(result);
            // Reset zoom and position when a new image is uploaded
            setZoom(1);
            setPosition({ x: 0, y: 0 });
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setZoom(prev => Math.min(Math.max(0.1, prev + delta), 5));
  };

  useEffect(() => {
    if (image && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Set canvas size to match container
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Calculate scaling to fit image while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Calculate centering offsets
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image with current zoom and position
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        // Move to center, apply transforms, then move back
        ctx.translate(centerX, centerY);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX, -centerY);
        ctx.translate(position.x, position.y);

        // Draw the full image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        ctx.restore();

        // Fill only the area outside the circle with a semi-transparent mask
        ctx.save();
        ctx.beginPath();
        // Draw a rectangle that covers the entire canvas...
        ctx.rect(0, 0, canvas.width, canvas.height);
        // ...and then add a circular path for the inside area.
        ctx.arc(centerX, centerY, canvas.width / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill("evenodd");
        ctx.restore();

        // Draw the circle outline over the image (if desired)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, canvas.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Update the final canvas (banner overlay)
        updateFinalCanvas();
      };
      img.src = image;
    }
  }, [image, zoom, position]);

  const updateFinalCanvas = () => {
    if (!canvasRef.current || !previewCanvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Copy dimensions from preview canvas
    canvas.width = previewCanvasRef.current.width;
    canvas.height = previewCanvasRef.current.height;

    // Clear the canvas with a transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    // Create a clipping path for the circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Draw the image from preview canvas
    ctx.drawImage(previewCanvasRef.current, 0, 0);
    ctx.restore();

    // Banner parameters
    const bannerInnerRadius = radius * 0.7;
    const startAngle = Math.PI * 0.25;
    const endAngle = Math.PI * 1.15;
    const fadeLength = Math.PI * 0.2;

    // Draw the solid center portion of the banner
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle + fadeLength, endAngle - fadeLength, false);
    ctx.arc(centerX, centerY, bannerInnerRadius, endAngle - fadeLength, startAngle + fadeLength, true);
    ctx.closePath();
    ctx.fillStyle = bannerColor;
    ctx.fill();

    // Create and draw the start gradient
    const startGradient = ctx.createRadialGradient(
      centerX + radius * Math.cos(startAngle + fadeLength),
      centerY + radius * Math.sin(startAngle + fadeLength),
      0,
      centerX + radius * Math.cos(startAngle + fadeLength),
      centerY + radius * Math.sin(startAngle + fadeLength),
      radius * fadeLength
    );
    startGradient.addColorStop(0, bannerColor);
    startGradient.addColorStop(0.5, bannerColor);
    startGradient.addColorStop(1, `${bannerColor}00`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + fadeLength, false);
    ctx.arc(centerX, centerY, bannerInnerRadius, startAngle + fadeLength, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = startGradient;
    ctx.fill();

    // Create and draw the end gradient
    const endGradient = ctx.createRadialGradient(
      centerX + radius * Math.cos(endAngle - fadeLength),
      centerY + radius * Math.sin(endAngle - fadeLength),
      0,
      centerX + radius * Math.cos(endAngle - fadeLength),
      centerY + radius * Math.sin(endAngle - fadeLength),
      radius * fadeLength
    );
    endGradient.addColorStop(0, bannerColor);
    endGradient.addColorStop(0.5, bannerColor);
    endGradient.addColorStop(1, `${bannerColor}00`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, endAngle - fadeLength, endAngle, false);
    ctx.arc(centerX, centerY, bannerInnerRadius, endAngle, endAngle - fadeLength, true);
    ctx.closePath();
    ctx.fillStyle = endGradient;
    ctx.fill();

    // Draw banner text if any text is provided
    ctx.save();
    const bannerStartAngle = startAngle + fadeLength;
    const bannerEndAngle = endAngle - fadeLength;
    const arcMid = (bannerStartAngle + bannerEndAngle) / 2;
    const textRadius = (bannerInnerRadius + radius) / 2;
    const bannerHeight = radius - bannerInnerRadius;
    const fontSize = bannerHeight * 0.5;
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (bannerText.trim() !== "") {
      if (bannerText.length === 1) {
        const angle = arcMid;
        const x = centerX + textRadius * Math.cos(angle);
        const y = centerY + textRadius * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText(bannerText, 0, 0);
        ctx.restore();
      } else {
        const letters = bannerText.split("").reverse();
        const gapPx = 4;

        const letterWidths = letters.map(letter => ctx.measureText(letter).width);
        const offsets: number[] = [];
        let currentOffset = letterWidths[0] / 2;
        offsets.push(currentOffset);
        for (let i = 1; i < letters.length; i++) {
          currentOffset += (letterWidths[i - 1] / 2) + gapPx + (letterWidths[i] / 2);
          offsets.push(currentOffset);
        }
        const totalArcPx = offsets[offsets.length - 1] - offsets[0];
        const totalArcAngle = totalArcPx / textRadius;
        const startTextAngle = arcMid - totalArcAngle / 2 - (offsets[0] / textRadius);

        for (let i = 0; i < letters.length; i++) {
          const letterAngle = startTextAngle + (offsets[i] / textRadius);
          const x = centerX + textRadius * Math.cos(letterAngle);
          const y = centerY + textRadius * Math.sin(letterAngle);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(letterAngle - Math.PI / 2);
          ctx.fillText(letters[i], 0, 0);
          ctx.restore();
        }
      }
    }
    ctx.restore();
  };

  // Redraw the banner whenever its properties change.
  useEffect(() => {
    if (image) updateFinalCanvas();
  }, [bannerText, bannerColor, textColor]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "profile-with-banner.png";
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-between">
      <div className="flex flex-col items-center">
        {/* Title at the top */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mt-8 mb-8 text-center tracking-tight px-4">
          LinkedIn Banner Editor
        </h1>

        {/* Carousel section */}
        <div className="w-full overflow-hidden mb-8 md:mb-10 rounded-xl py-4">
          <div
            ref={carouselRef}
            className="flex whitespace-nowrap px-2"
            style={{
              transform: `translateX(-${scrollPosition}px)`,
            }}
          >
            {/* Double the images to create seamless loop */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, index) => (
              <CircularImage
                key={index}
                src={`/example${num}.png`}
                className="h-32 w-32 md:h-48 md:w-48 inline-block mx-2 rounded-full drop-shadow-lg transition-transform duration-300 hover:scale-110 hover:z-10"
              />
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className={`bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl transition-transform transform ${!image ? 'hover:scale-105' : ''} w-[95%] max-w-4xl mx-auto p-8 md:p-12 mb-12 border border-gray-100`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {!image ? (
              <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4">
                <Label htmlFor="image-upload" className="text-lg md:text-xl font-semibold text-gray-700 block text-center">
                  Upload Your Profile Picture
                </Label>
                <div className="border-2 border-dashed border-gray-300 bg-gradient-to-br to-gray-50 rounded-2xl p-8 md:p-10 text-center w-full transition duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-sm hover:shadow-xl">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl md:text-5xl text-gray-400">📷</div>
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <Label htmlFor="image-upload" className="text-lg md:text-xl font-semibold text-gray-700 block text-center">
                    Upload Your Profile Picture
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 bg-gradient-to-br to-gray-50 rounded-2xl p-8 md:p-10 text-center w-full transition duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-sm hover:shadow-xl">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <div className="text-4xl md:text-5xl text-gray-400">📷</div>
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                  <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                    <canvas
                      ref={previewCanvasRef}
                      className="absolute top-0 left-0 w-full h-full cursor-move touch-none"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onWheel={handleWheel}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                  </div>
                </div>
                {image && (
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="banner-text" className="text-base md:text-lg font-semibold text-gray-700">
                        Banner Text
                      </Label>
                      <Input
                        id="banner-text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Enter banner text"
                        maxLength={18}
                        className="border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="banner-color" className="text-base md:text-lg font-semibold text-gray-700">
                          Banner Color
                        </Label>
                        <Input
                          id="banner-color"
                          type="color"
                          value={bannerColor}
                          onChange={(e) => setBannerColor(e.target.value)}
                          className="h-10 md:h-12 w-full cursor-pointer border border-gray-300 rounded-lg shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="text-color" className="text-base md:text-lg font-semibold text-gray-700">
                          Text Color
                        </Label>
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-10 md:h-12 w-full cursor-pointer border border-gray-300 rounded-lg shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base md:text-lg font-semibold text-gray-700">
                        Image Zoom
                      </Label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="10"
                          max="500"
                          value={zoom * 100}
                          onChange={(e) => setZoom(Number(e.target.value) / 100)}
                          className="flex-1"
                        />
                        <span className="min-w-[60px] text-center font-medium">
                          {Math.round(zoom * 100)}%
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full py-3 md:py-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105"
                    >
                      Download Image
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Credit text */}
      <div className="w-full py-4 text-center text-gray-600 text-sm border-t border-gray-200">
        © 2025, Made with ♥ by <a href="https://linkedin.com/in/ananddtyagi" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">Anand</a>
      </div>
    </div>
  );
};

export default ProfileBanner;