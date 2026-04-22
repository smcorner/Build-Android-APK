from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create gradient background
    img = Image.new('RGB', (size, size), '#667eea')
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Add robot icon effect (simplified)
    center = size // 2
    robot_size = size // 3
    
    # Robot head
    head_top = center - robot_size // 2
    head_left = center - robot_size // 2
    head_right = center + robot_size // 2
    head_bottom = center + robot_size // 3
    
    # Draw head
    draw.rounded_rectangle(
        [head_left, head_top, head_right, head_bottom],
        radius=robot_size // 6,
        fill='white'
    )
    
    # Eyes
    eye_size = robot_size // 6
    eye_y = head_top + robot_size // 4
    left_eye_x = center - robot_size // 4
    right_eye_x = center + robot_size // 4
    
    draw.ellipse(
        [left_eye_x - eye_size, eye_y - eye_size, 
         left_eye_x + eye_size, eye_y + eye_size],
        fill='#667eea'
    )
    draw.ellipse(
        [right_eye_x - eye_size, eye_y - eye_size,
         right_eye_x + eye_size, eye_y + eye_size],
        fill='#667eea'
    )
    
    # Antenna
    antenna_height = robot_size // 3
    draw.line(
        [(center, head_top), (center, head_top - antenna_height)],
        fill='white', width=max(2, size // 64)
    )
    draw.ellipse(
        [center - eye_size // 2, head_top - antenna_height - eye_size,
         center + eye_size // 2, head_top - antenna_height],
        fill='white'
    )
    
    # Body
    body_top = head_bottom + size // 20
    body_bottom = center + robot_size
    draw.rounded_rectangle(
        [head_left + robot_size // 6, body_top, 
         head_right - robot_size // 6, body_bottom],
        radius=robot_size // 8,
        fill='white'
    )
    
    # V letter overlay (for Vibe)
    try:
        font_size = size // 3
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Semi-transparent overlay
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    text = "V"
    try:
        bbox = overlay_draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        text_width = font_size
        text_height = font_size
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - size // 10
    
    # Draw text shadow
    overlay_draw.text((text_x + 2, text_y + 2), text, fill=(0, 0, 0, 80), font=font)
    overlay_draw.text((text_x, text_y), text, fill=(255, 255, 255, 200), font=font)
    
    # Composite
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    img = img.convert('RGB')
    
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Generate icons
os.chdir('/home/user/vibe-ai-agent')
create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')
print("Icons generated successfully!")
