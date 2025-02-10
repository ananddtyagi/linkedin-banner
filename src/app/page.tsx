'use client'
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileReaderEvent extends ProgressEvent {
  target: FileReader;
}

const ProfileBanner = () => {
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
      reader.onload = (e: FileReaderEvent) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setImage(e.target.result as string);
          // Reset zoom and position when a new image is uploaded
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        };
        img.src = e.target.result as string;
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

    // Copy the preview canvas onto the final canvas
    canvas.width = previewCanvasRef.current.width;
    canvas.height = previewCanvasRef.current.height;
    ctx.drawImage(previewCanvasRef.current, 0, 0);

    // Since an image is uploaded, always draw the banner shape.
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    // Adjusted banner parameters
    const bannerInnerRadius = radius * 0.7;  // Increased inner radius
    const startAngle = Math.PI * 0.25;         // Earlier start angle
    const endAngle = Math.PI * 1.15;           // Later end angle
    const fadeLength = Math.PI * 0.2;          // Longer fade length

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

    // Draw banner text if any text is provided.
    // (If bannerText is blank, only the banner shape is shown.)
    ctx.save();
    const bannerStartAngle = startAngle + fadeLength;
    const bannerEndAngle = endAngle - fadeLength;
    const arcMid = (bannerStartAngle + bannerEndAngle) / 2;
    const textRadius = (bannerInnerRadius + radius) / 2;
    const bannerHeight = radius - bannerInnerRadius;
    const fontSize = bannerHeight * 0.5; // Adjust as needed
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (bannerText.trim() !== "") {
      if (bannerText.length === 1) {
        // Single character: center it along the arc.
        const angle = arcMid;
        const x = centerX + textRadius * Math.cos(angle);
        const y = centerY + textRadius * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText(bannerText, 0, 0);
        ctx.restore();
      } else {
        // Multiple characters: adjust spacing using measured letter widths.
        const letters = bannerText.split("").reverse();
        const gapPx = 4; // Fixed gap in pixels between letters

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Always show the image upload option */}
      <div className="space-y-4">
        <Label htmlFor="image-upload">Upload Profile Picture</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="cursor-pointer"
        />
      </div>

      {/* Only show banner options and preview once an image is uploaded */}
      {image && (
        <>
          <div className="space-y-4">
            <Label htmlFor="banner-text">Banner Text</Label>
            <Input
              id="banner-text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="Enter banner text"
              maxLength={18}
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="banner-color">Banner Color</Label>
            <Input
              id="banner-color"
              type="color"
              value={bannerColor}
              onChange={(e) => setBannerColor(e.target.value)}
              className="h-12 cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="text-color">Text Color</Label>
            <Input
              id="text-color"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-12 cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-move"
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

            <div className="flex gap-4 items-center justify-center">
              <input
                type="range"
                min="10"
                max="500"
                value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="w-64"
              />
              <span className="min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <Button onClick={handleDownload} className="w-full">
              Download Image
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileBanner;