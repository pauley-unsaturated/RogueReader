#!/usr/bin/env python3
"""
Pixel-perfect sprite processor that preserves quality for game use.
Uses flood-fill for background removal and ensures proper centering.
"""
import os
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

def create_game_ready_sprites(source_image_path, output_dir, target_size=32):
    """
    Create game-ready sprites from source image, preserving pixel art quality.
    """
    try:
        img = Image.open(source_image_path).convert("RGBA")
        width, height = img.size

        print(f"Processing {width}x{height} source image...")

        # Extract individual frames (assuming 2x2 grid)
        frame_width = width // 2
        frame_height = height // 2

        os.makedirs(output_dir, exist_ok=True)

        for frame_num in range(4):
            row = frame_num // 2
            col = frame_num % 2

            # Extract frame
            left = col * frame_width
            top = row * frame_height
            right = left + frame_width
            bottom = top + frame_height

            frame = img.crop((left, top, right, bottom))

            # Process this frame
            processed_frame = process_single_frame(frame, target_size)

            # Save frame
            frame_path = os.path.join(output_dir, f"wizard_idle_{frame_num + 1}.png")
            processed_frame.save(frame_path)
            print(f"Created: {frame_path} ({processed_frame.size})")

        return True

    except Exception as e:
        print(f"Error processing sprites: {e}")
        return False

def process_single_frame(frame, target_size):
    """
    Process a single frame to be game-ready.
    """
    # Step 1: Remove background more carefully
    frame = smart_background_removal(frame)

    # Step 2: Find the actual sprite bounds (non-transparent area)
    sprite_bounds = get_sprite_bounds(frame)

    if sprite_bounds:
        # Crop to sprite bounds with some padding
        left, top, right, bottom = sprite_bounds
        padding = 2
        left = max(0, left - padding)
        top = max(0, top - padding)
        right = min(frame.width, right + padding)
        bottom = min(frame.height, bottom + padding)

        cropped = frame.crop((left, top, right, bottom))
    else:
        cropped = frame

    # Step 3: Resize intelligently
    # First resize to a reasonable intermediate size, then to target
    intermediate_size = 128
    if cropped.width > intermediate_size or cropped.height > intermediate_size:
        # Resize to intermediate size maintaining aspect ratio
        cropped.thumbnail((intermediate_size, intermediate_size), Image.LANCZOS)

    # Step 4: Smart centering and final sizing
    final_sprite = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))

    # Calculate scaling to fit while preserving aspect ratio
    max_sprite_size = target_size - 4  # Leave 2px padding on each side
    scale_factor = min(max_sprite_size / cropped.width, max_sprite_size / cropped.height)

    if scale_factor < 1:
        # Need to scale down
        new_width = int(cropped.width * scale_factor)
        new_height = int(cropped.height * scale_factor)
        cropped = cropped.resize((new_width, new_height), Image.NEAREST)

    # Center the sprite with slight vertical offset for character sprites
    sprite_x = (target_size - cropped.width) // 2
    # Bias characters slightly toward bottom (more ground contact)
    sprite_y = (target_size - cropped.height) // 2 + 1

    # Ensure we don't go out of bounds
    sprite_x = max(0, min(sprite_x, target_size - cropped.width))
    sprite_y = max(0, min(sprite_y, target_size - cropped.height))

    final_sprite.paste(cropped, (sprite_x, sprite_y), cropped)
    print(f"Centered sprite at ({sprite_x}, {sprite_y}) in {target_size}x{target_size} canvas")

    return final_sprite

def smart_background_removal(img):
    """
    Remove background using flood-fill for better edge preservation.
    """
    # Work with a copy
    result = img.copy()
    width, height = result.size

    # Sample edge pixels to find background color
    edge_pixels = []

    # Sample top and bottom edges
    for x in range(0, width, max(1, width // 20)):
        edge_pixels.append(result.getpixel((x, 0))[:3])  # Top edge
        edge_pixels.append(result.getpixel((x, height-1))[:3])  # Bottom edge

    # Sample left and right edges
    for y in range(0, height, max(1, height // 20)):
        edge_pixels.append(result.getpixel((0, y))[:3])  # Left edge
        edge_pixels.append(result.getpixel((width-1, y))[:3])  # Right edge

    # Find most common edge color
    color_counts = {}
    for pixel in edge_pixels:
        color_counts[pixel] = color_counts.get(pixel, 0) + 1

    if not color_counts:
        return result

    bg_color = max(color_counts.items(), key=lambda x: x[1])[0]
    print(f"Detected background color: {bg_color}")

    # Use flood fill from corners with the detected background color
    corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]

    for corner_x, corner_y in corners:
        try:
            corner_pixel = result.getpixel((corner_x, corner_y))[:3]
            # Only flood fill if corner matches our detected background
            if color_distance(corner_pixel, bg_color) < 30:
                # Use ImageDraw for flood fill
                ImageDraw.floodfill(result, (corner_x, corner_y), (0, 0, 0, 0), thresh=25)
        except Exception as e:
            print(f"Flood fill from corner {corner_x},{corner_y} failed: {e}")
            continue

    return result

def color_distance(color1, color2):
    """Calculate color distance using simple Euclidean distance."""
    return sum((a - b) ** 2 for a, b in zip(color1, color2)) ** 0.5

def get_sprite_bounds(img):
    """
    Get the bounding box of non-transparent pixels.
    """
    data = np.array(img)

    # Find non-transparent pixels
    non_transparent = data[:, :, 3] > 0

    if not np.any(non_transparent):
        return None

    # Find bounds
    rows = np.any(non_transparent, axis=1)
    cols = np.any(non_transparent, axis=0)

    top = np.argmax(rows)
    bottom = len(rows) - np.argmax(rows[::-1]) - 1
    left = np.argmax(cols)
    right = len(cols) - np.argmax(cols[::-1]) - 1

    return (left, top, right + 1, bottom + 1)

def create_optimized_spritesheet(frames_dir, output_path):
    """
    Create an optimized spritesheet from individual frames.
    """
    frame_files = [
        os.path.join(frames_dir, f"wizard_idle_{i}.png")
        for i in range(1, 5)
    ]

    # Check if all frames exist
    for f in frame_files:
        if not os.path.exists(f):
            print(f"Frame missing: {f}")
            return False

    # Load frames
    frames = [Image.open(f) for f in frame_files]
    frame_size = frames[0].size[0]  # Assuming square frames

    # Create 2x2 spritesheet
    sheet_size = frame_size * 2
    spritesheet = Image.new('RGBA', (sheet_size, sheet_size), (0, 0, 0, 0))

    # Arrange frames in 2x2 grid
    for i, frame in enumerate(frames):
        x = (i % 2) * frame_size
        y = (i // 2) * frame_size
        spritesheet.paste(frame, (x, y), frame)

    spritesheet.save(output_path)
    print(f"Created spritesheet: {output_path}")
    return True

def main():
    source_sprite = "public/assets/sprites/characters/wizard_sprite.png"
    output_dir = "public/assets/sprites/characters/wizard_optimized"

    print("Pixel-Perfect Sprite Processor")
    print("=" * 35)

    if not os.path.exists(source_sprite):
        print(f"Source sprite not found: {source_sprite}")
        return

    # Create game-ready 64x64 sprites for better quality
    print("Creating 64x64 game sprites...")
    if create_game_ready_sprites(source_sprite, output_dir, target_size=64):
        print("✓ Individual frames created")

        # Create optimized spritesheet
        sheet_path = "public/assets/sprites/characters/wizard_optimized_sheet.png"
        if create_optimized_spritesheet(output_dir, sheet_path):
            print("✓ Optimized spritesheet created")
    else:
        print("✗ Sprite processing failed")

if __name__ == "__main__":
    main()