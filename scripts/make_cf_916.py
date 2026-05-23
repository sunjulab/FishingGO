import subprocess
import os

CF_DIR = r"cf-final"
AUD_DIR = r"cf-video/audio"
TMP_DIR = r"cf-video/tmp2"
OUT_DIR = r"cf-video"
os.makedirs(TMP_DIR, exist_ok=True)

SCENES = [
    "Scene_01_새벽항구_포인트확인.png",
    "Scene_02_선상_해양날씨.png",
    "Scene_03_방파제_포인트지도.png",
    "Scene_04_차안_커플.png",
    "Scene_05_낚싯대_알림.png",
    "Scene_06_파이팅_액션.png",
    "Scene_07_귀항_커플_업로드.png",
    "Scene_08_브랜드_엔딩.png",
]

# 9:16 세로 포맷 필터 (블러 배경 + 중앙 원본)
# 1080x1920 기준
VFILTER = (
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
    "crop=1080:1920,setsar=1[bg];"
    "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,"
    "boxblur=30:5[blurred];"
    "[blurred]scale=1080:1920:force_original_aspect_ratio=increase,"
    "crop=1080:1920[bg2];"
    "[0:v]scale=-2:608[fg];"
    "[bg2][fg]overlay=(W-w)/2:(H-h)/2,"
    "fade=t=in:st=0:d=0.4,fade=t=out:st=3.6:d=0.4[v]"
)

clips = []
print("[START] 9:16 클립 + 나레이션 생성...")
for i, scene in enumerate(SCENES):
    n = i + 1
    img = os.path.join(CF_DIR, scene)
    aud = os.path.join(AUD_DIR, f"narr_{n:02d}.mp3")
    out = os.path.join(TMP_DIR, f"clip_{n:02d}.mp4")
    clips.append(out)

    print(f"  [{n}/8] {scene[:30]}...")

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-i", aud,
        "-filter_complex", VFILTER,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-t", "4",
        "-shortest",
        out
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out):
        print(f"    [OK]")
    else:
        print(f"    [FAIL] {result.stderr[-200:]}")

# concat 파일 생성
concat_file = os.path.join(OUT_DIR, "concat2.txt")
with open(concat_file, "w", encoding="ascii") as f:
    for c in clips:
        f.write(f"file '{c.replace(chr(92), '/')}'\n")

# 최종 합치기
final = os.path.join(OUT_DIR, "FishingGO_CF_9x16.mp4")
print("\n[MERGE] 최종 영상 합치는 중...")
cmd = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat_file,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    final
]
result = subprocess.run(cmd, capture_output=True)

if os.path.exists(final):
    size = os.path.getsize(final) / (1024*1024)
    print(f"\n{'='*40}")
    print(f"[DONE] FishingGO_CF_9x16.mp4")
    print(f"[SIZE] {size:.1f} MB")
    print(f"[RES]  1080 x 1920 (9:16 세로)")
    print(f"[TIME] 32초")
    print(f"[PATH] {os.path.abspath(final)}")
else:
    print("[ERROR]", result.stderr.decode()[-300:])
