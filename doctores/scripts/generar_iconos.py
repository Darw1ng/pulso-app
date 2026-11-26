# Genera los íconos y el splash de Android desde la marca de Pulso (el cuadro turquesa con la
# línea de pulso de frontend/public/favicon.svg).
#
#   python scripts/generar_iconos.py        (o `npm run iconos`)
#
# Los PNG resultantes se versionan en android/app/src/main/res; solo hace falta correrlo cuando
# cambie la marca. Necesita Pillow.
#
# Qué produce:
#   mipmap-*/ic_launcher.png             ícono clásico: cuadro turquesa redondeado con el pulso
#   mipmap-*/ic_launcher_round.png       ícono redondo
#   mipmap-*/ic_launcher_foreground.png  primer plano del ícono adaptativo (Android 8+): el pulso
#                                        blanco sobre transparente, dentro de la zona segura 66/108
#   drawable*/splash.png                 turquesa con el pulso al centro (mismo tamaño que el de
#                                        la plantilla de Capacitor en cada carpeta)
#   ../marca/icono-1024.png              cuadrado a sangre y SIN alfa: el de las fichas de tienda
# iOS (ios/App/App/Assets.xcassets), si el proyecto existe:
#   AppIcon.appiconset/AppIcon-512@2x.png  el mismo de 1024 sin alfa (App Store Connect rechaza alfa)
#   Splash.imageset/splash-2732x2732*.png  turquesa con el pulso al centro (LaunchScreen.storyboard)
# El fondo del ícono adaptativo es @color/ic_launcher_background (#0E9498), no un PNG.
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
RES = RAIZ / "android" / "app" / "src" / "main" / "res"
TURQUESA, CLARO, BLANCO = (14, 148, 152), (19, 176, 160), (255, 255, 255)
# La línea de pulso del favicon, en su caja de 64: M10 32h12l5-14 10 28 6-18 4 8h7
PULSO = [(10, 32), (22, 32), (27, 18), (37, 46), (43, 28), (47, 36), (54, 36)]
SUPER = 4  # se dibuja 4x y se reduce: bordes suaves sin depender de un rasterizador de SVG


def degradado(lado):
    """Turquesa de la marca en diagonal (el de .brand-mark: 150deg, #0E9498 → #13B0A0)."""
    img = Image.new("RGB", (lado, lado))
    px = img.load()
    for y in range(lado):
        for x in range(lado):
            k = (x * 0.5 + y * 0.87) / (lado * 1.37)
            px[x, y] = tuple(round(a + (b - a) * k) for a, b in zip(TURQUESA, CLARO))
    return img


def pulso(lado, escala, color=BLANCO):
    """La línea de pulso centrada en un lienzo transparente; `escala` = fracción del lado."""
    n = lado * SUPER
    capa = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    f = n * escala / 64
    desfase = (n - 64 * f) / 2
    pts = [(desfase + x * f, desfase + y * f) for x, y in PULSO]
    grosor = max(2, round(5 * f))
    d.line(pts, fill=color + (255,), width=grosor, joint="curve")
    r = grosor / 2
    for x, y in pts:  # puntas y quiebres redondos
        d.ellipse((x - r, y - r, x + r, y + r), fill=color + (255,))
    return capa.resize((lado, lado), Image.LANCZOS)


def icono(lado, forma):
    n = lado * SUPER
    mascara = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(mascara)
    if forma == "redondo":
        d.ellipse((0, 0, n - 1, n - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, n - 1, n - 1), radius=round(n * 14 / 64), fill=255)
    img = degradado(lado).convert("RGBA")
    img.putalpha(mascara.resize((lado, lado), Image.LANCZOS))
    img.alpha_composite(pulso(lado, 0.92))
    return img


def main():
    for carpeta, base in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        destino = RES / f"mipmap-{carpeta}"
        icono(base, "cuadro").save(destino / "ic_launcher.png")
        icono(base, "redondo").save(destino / "ic_launcher_round.png")
        # 108dp de lienzo; la zona segura es el círculo central de 66dp.
        pulso(round(base * 108 / 48), 0.50).save(destino / "ic_launcher_foreground.png")

    for splash in sorted(RES.glob("drawable*/splash.png")):
        ancho, alto = Image.open(splash).size
        lienzo = Image.new("RGB", (ancho, alto), TURQUESA)
        lado = round(min(ancho, alto) * 0.34)
        marca = pulso(lado, 0.92)
        lienzo.paste(marca, ((ancho - lado) // 2, (alto - lado) // 2), marca)
        lienzo.save(splash)

    (RES / "values" / "ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        '    <color name="ic_launcher_background">#0E9498</color>\n</resources>\n',
        encoding="utf-8",
    )

    marca_dir = RAIZ / "marca"
    marca_dir.mkdir(exist_ok=True)
    tienda = degradado(1024)
    capa = pulso(1024, 0.92)
    tienda.paste(capa, (0, 0), capa)
    tienda.save(marca_dir / "icono-1024.png")

    ios = RAIZ / "ios" / "App" / "App" / "Assets.xcassets"
    if ios.exists():
        tienda.save(ios / "AppIcon.appiconset" / "AppIcon-512@2x.png")
        lado = 2732
        lienzo = Image.new("RGB", (lado, lado), TURQUESA)
        marca = pulso(round(lado * 0.2), 0.92)
        lienzo.paste(marca, ((lado - marca.width) // 2, (lado - marca.height) // 2), marca)
        for splash in sorted((ios / "Splash.imageset").glob("splash-*.png")):
            lienzo.save(splash)
    print("listo:", RES)


if __name__ == "__main__":
    main()
