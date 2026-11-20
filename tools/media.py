"""Turn Harshit's source files into web-sized media for the site."""
import subprocess, pathlib, shutil
from PIL import Image

U = pathlib.Path("/mnt/user-data/uploads")
D = U / "Desktop"
S3 = D / "INM SEM3"
S4 = D / "inm sem4"
DR = S3 / "content creation/demo reel/images nd graphics"
OUT = pathlib.Path("/home/claude/site/media")
OUT.mkdir(parents=True, exist_ok=True)
TMP = pathlib.Path("/home/claude/m/tmp"); TMP.mkdir(parents=True, exist_ok=True)

Image.MAX_IMAGE_PIXELS = None

def img(src, name, w=1600, q=80):
    o = OUT / f"{name}.webp"
    if o.exists(): return
    im = Image.open(src)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(o, "WEBP", quality=q, method=6)

def pdfpages(src, name, pages, w=1600, r=120):
    for i, p in enumerate(pages, 1):
        base = TMP / f"{name}-{p}"
        if not (OUT / f"{name}-{i:02d}.webp").exists():
            subprocess.run(["pdftoppm", "-r", str(r), "-png", "-f", str(p), "-l", str(p), "-singlefile", str(src), str(base)], check=True)
            img(f"{base}.png", f"{name}-{i:02d}", w)

def vid(src, name, w=1280, crf=27, audio=True, start=None, dur=None, fps=None):
    o = OUT / f"{name}.mp4"
    if o.exists(): return
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y"]
    if start is not None: cmd += ["-ss", str(start)]
    cmd += ["-i", str(src)]
    if dur is not None: cmd += ["-t", str(dur)]
    vf = f"scale='min({w},iw)':-2"
    if fps: vf += f",fps={fps}"
    cmd += ["-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    cmd += (["-c:a", "aac", "-b:a", "96k"] if audio else ["-an"])
    cmd += [str(o)]
    subprocess.run(cmd, check=True)

def poster(video, name, t=1.0, w=1280):
    o = OUT / f"{name}.webp"
    if o.exists(): return
    png = TMP / f"{name}.png"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(t), "-i", str(video), "-frames:v", "1", str(png)], check=True)
    img(png, name, w)

# ---------- Dairy Drop ----------
for i, n in enumerate([1, 2, 6, 11, 14, 21, 25, 26, 28, 30, 31], 1):
    f = S3 / "UX/behance" / ("Test.png" if n == 1 else f"Test{n}.png")
    img(f, f"dd-{i:02d}")
img(S3 / "UX/mockups/Two Milk Bottles Mockup.png", "dd-bottles", 1400)
img(S3 / "UX/mockups/tote bag mockup.png", "dd-tote", 1400)

# ---------- Missing Piece ----------
pdfpages(S4 / "UX/Missing Piece — Progress Meeting 1–2.pdf", "mp", [1, 3, 4, 13, 14], 1600, 110)

# ---------- SolSip ----------
pdfpages(U / "SolSip_Presentation.pdf", "ss", [1, 2, 4, 5, 6, 9, 10], 1600, 60)
CC = S3 / "content creation/Final Assignment"
vid(CC / "exports/Youtube video.mp4", "ss-film", 1280, 27)
vid(CC / "exports/tik tok.mp4", "ss-vertical", 540, 28)
vid(CC / "videos/Soda Juice Ads.mp4", "ss-cans", 1280, 27)
vid(CC / "exports/Youtube video.mp4", "ss-loop", 640, 30, False, 2, 5)
poster(OUT / "ss-film.mp4", "ss-film-poster", 6)

# ---------- Seneca Career Fair ----------
vid(S4 / "vfx/Career Fair v02.mp4", "cf-film", 1280, 27)
vid(S4 / "vfx/Career Fair v02.mp4", "cf-loop", 640, 30, False, 3, 5)
img(S4 / "vfx/ica4/CAREER FAIR.png", "cf-logo", 1200)
prev = S4 / "vfx/ica4/fiinalllll/career_fair_scenes/previews"
for i, f in enumerate(sorted(prev.glob("*.png")), 1):
    img(f, f"cf-scene-{i:02d}", 1400)
poster(OUT / "cf-film.mp4", "cf-film-poster", 8)

# ---------- The Night We Met ----------
tn = {"19d6e942": "tn-hero", "069acb3e": "tn-cover-light", "434d7b50": "tn-cover-dark", "09ad59a7": "tn-poster",
      "9aa4cdb1": "tn-brand-poster", "7e8dd85f": "tn-lyrics", "58e0275e": "tn-phones", "baa21d87": "tn-cd-light",
      "677c4db9": "tn-cd-dark", "80c1abe3": "tn-hands"}
for k, n in tn.items():
    src = next(U.glob(f"{k}-image.*")); img(src, n)
vid(S4 / "vfx/moving poster Project.aep_AME/final.mp4", "tn-motion", 720, 26, False)
vid(S4 / "vfx/moving poster Project.aep_AME/final.mp4", "tn-loop", 480, 30, False, 0, 6)

# ---------- Workplace ----------
for k, n in {"68a2e7f2": "wp-1-line", "851cb9b1": "wp-2-flat", "2e92a1d6": "wp-3-light", "65f2c9e3": "wp-4-final"}.items():
    img(next(U.glob(f"{k}-image.*")), n, 1800)

# ---------- Recycle ----------
vid(S3 / "vfx/HarshitBawa_A3.mp4", "rc-film", 1280, 26)
vid(S3 / "vfx/HarshitBawa_A3.mp4", "rc-loop", 640, 30, False)
poster(OUT / "rc-film.mp4", "rc-poster", 3)

# ---------- Joji magazine ----------
for k, n in {"09d6aeea": "jj-spread-1", "757b598b": "jj-spread-2", "f27d24f1": "jj-spread-3"}.items():
    img(next(U.glob(f"{k}-image.*")), n, 1800)
for i in (1, 2, 3):
    img(S3 / f"personal/magazine{i}.png", f"jj-mock-{i}", 1600)

# ---------- Football Legends (with Sahar Fallahi) ----------
pdfpages(DR / "ICONS_Sharar & Harshit.pdf", "fl", [1, 5, 6, 10, 12, 13, 14, 15], 1600, 70)

# ---------- See You Again ----------
sya = S3 / "vfx/see you again folder/see you again folder/see you again Actual.aep_AME/HarshitBawa_FinalAssignment.mp4"
vid(sya, "sy-film", 1280, 26)
vid(S3 / "vfx/animatic.mp4", "sy-animatic", 1280, 28)
vid(sya, "sy-loop", 640, 30, False, 4, 5)
poster(sya, "sy-poster", 10)

# ---------- Motion tiles ----------
vid(U / "2b58d769-logo_weezy.mp4", "mo-weezy", 960, 26, False, 0, 3)
vid(S4 / "vfx/ica3/INM402  ICA-3  v02.mp4", "mo-electrofest", 720, 28, False)
vid(U / "bb013ad0-image.gif", "mo-hobi", 960, 24, False)
vid(S3 / "3d/Final3d_HarshitBawa/3d_Final_HarshitBawa.mp4", "mo-3d", 960, 27, False)
for name, t in [("mo-electrofest", 1.5), ("mo-3d", 1.5), ("mo-weezy", 2.6)]:
    poster(OUT / f"{name}.mp4", f"{name}-poster", t, 960)

# ---------- Video work ----------
vid(U / "Group6__Assignement__2.mp4", "vd-group6", 1280, 28)
vid(U / "Group6__Assignement__2.mp4", "vd-group6-loop", 640, 30, False, 10, 5)
poster(OUT / "vd-group6.mp4", "vd-group6-poster", 12)

# ---------- Illustration / gallery ----------
gal = {
    U / next(x.name for x in U.glob("6108a1b8-image.*")): "il-garden",
    U / next(x.name for x in U.glob("c43b962f-image.*")): "il-lowpoly",
    U / next(x.name for x in U.glob("13cd0614-image.*")): "il-poster-noface",
    U / next(x.name for x in U.glob("3d027812-image.*")): "il-poster-hp",
    U / next(x.name for x in U.glob("fba4e273-image.*")): "il-poster-coco",
    DR / "4-01_1.jpeg": "sk-hands",
    DR / "kiss1-01.jpeg": "sk-kiss",
    DR / "david-01.jpeg": "sk-david",
    DR / "Portrait process.jpg": "pt-process",
    DR / "Character+painting process.jpg": "pt-character",
    DR / "1 (3)-02.jpeg": "pt-phonecase",
    DR / "manifesto final.jpg": "pr-manifesto",
    DR / "sai byook 7.jpg": "il-067",
}
for src, n in gal.items():
    img(src, n, 1400)

# ---------- brand ----------
B = D / "HarshitBawa_Contact & About page"
for f in ["hobi-icon-logo.svg", "hobi-side-logo.svg", "hobi-text-logo.svg", "hobi-text-logo2.svg", "star-icon.svg", "three-stars-logo.svg"]:
    shutil.copy(B / f, OUT / f)
for f in ["3d-icon.svg", "animation-icon.svg", "design-icon.svg", "illustration-icon.svg"]:
    shutil.copy(B / "images" / f, OUT / f)
shutil.copy(B / "confirmation-sound.mp3", OUT / "confirmation-sound.mp3")
shutil.copy(S4 / "career planing/resume/Resume_harshitbawa.pdf", OUT / "Harshit_Bawa_Resume.pdf")
shutil.copy("/home/claude/anim/wordmark.mp4", OUT / "wordmark.mp4")
print("done")
