'use client'
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileReaderEvent extends ProgressEvent {
  target: FileReader;
}

const ProfileBanner = () => {
  const [image, setImage] = useState<string | null>(null);
  const [bannerText, setBannerText] = useState("#NOT HIRING");
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
          // Reset zoom and position when new image is uploaded
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

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create circular cutout
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, canvas.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw circle outline
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update the final canvas
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

    // Copy from preview canvas
    canvas.width = previewCanvasRef.current.width;
    canvas.height = previewCanvasRef.current.height;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    // Adjusted banner parameters
    const bannerInnerRadius = radius * 0.7;  // Increased inner radius
    const startAngle = Math.PI * 0.25;         // Earlier start angle
    const endAngle = Math.PI * 1.15;           // Later end angle
    const fadeLength = Math.PI * 0.2;          // Longer fade length

    ctx.save();
    // Create clipping path for circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    // Draw the image
    ctx.drawImage(previewCanvasRef.current, 0, 0);
    ctx.restore();

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

    // -----------------------------
    // NEW TEXT DRAWING CODE STARTS
    // -----------------------------
    ctx.save();

    // Determine the arc available for banner text.
    // (This is the banner arc without the faded parts.)
    const bannerStartAngle = startAngle + fadeLength;
    const bannerEndAngle = endAngle - fadeLength;
    const availableAngle = bannerEndAngle - bannerStartAngle;
    const arcMid = (bannerStartAngle + bannerEndAngle) / 2;

    // Set the text radius to be centered within the banner:
    // midway between the banner's inner radius and the outer circle.
    const textRadius = (bannerInnerRadius + radius) / 2;

    // Optionally, set the font size based on the banner’s height.
    const bannerHeight = radius - bannerInnerRadius;
    const fontSize = bannerHeight * 0.5; // adjust as needed
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (bannerText.length === 0) {
      // nothing to draw
    } else if (bannerText.length === 1) {
      // For a single character, simply place it at the midpoint of the arc.
      const angle = arcMid;
      const x = centerX + textRadius * Math.cos(angle);
      const y = centerY + textRadius * Math.sin(angle);
      ctx.save();
      ctx.translate(x, y);
      // Rotate so that the text is tangential to the circle.
      ctx.rotate(angle - Math.PI / 2);
      ctx.fillText(bannerText, 0, 0);
      ctx.restore();
    } else {
      // For multiple characters, use (say) 90% of the available arc so that the text
      // doesn’t run right to the edge. This gives a small margin.
      const totalTextAngle = availableAngle * 0.9;
      const letterSpacing = totalTextAngle / (bannerText.length - 1);
      // Set the starting angle so that the text is centered along the banner.
      const startTextAngle = arcMid - totalTextAngle / 2;

      for (let i = 0; i < bannerText.length; i++) {
        const char = bannerText[bannerText.length - i - 1];
        const angle = startTextAngle + i * letterSpacing;
        const x = centerX + textRadius * Math.cos(angle);
        const y = centerY + textRadius * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y);
        // Rotate so the character is oriented tangentially.
        ctx.rotate(angle + Math.PI * 1.5);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    // -----------------------------
    // NEW TEXT DRAWING CODE ENDS
    // -----------------------------
  };

  useEffect(() => {
    updateFinalCanvas();
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

      <div className="space-y-4">
        <Label htmlFor="banner-text">Banner Text</Label>
        <Input
          id="banner-text"
          value={bannerText}
          onChange={(e) => setBannerText(e.target.value)}
          placeholder="Enter banner text"
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

        {image && (
          <Button onClick={handleDownload} className="w-full">
            Download Image
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;