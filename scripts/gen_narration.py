import asyncio
import edge_tts
import os

# 나레이션 텍스트 (장면별)
NARRATIONS = [
    (1, "낚시는요, 그냥 떠나는 게 아니에요."),
    (2, "어디서 물이 오르는지,"),
    (3, "현장은 어떤지 미리 보고,"),
    (4, "선장은 직접, 크루는 함께."),
    (5, "그렇게 준비한 하루는"),
    (6, "낚싯대가 확실히 다르게 휩니다."),
    (7, "오늘도, 좋은 사람들과 좋은 조황."),
    (8, "낚시GO. 잘 아는 낚시, 더 즐거운 낚시."),
]

# 한국어 남성 음성 (자연스럽고 따뜻한 톤)
VOICE = "ko-KR-InJoonNeural"   # 남성, 따뜻한 중저음
OUT_DIR = "cf-video/audio"
os.makedirs(OUT_DIR, exist_ok=True)

async def generate():
    for num, text in NARRATIONS:
        out_file = f"{OUT_DIR}/narr_{num:02d}.mp3"
        print(f"  [{num}/8] 생성 중: {text}")
        communicate = edge_tts.Communicate(
            text=text,
            voice=VOICE,
            rate="-8%",    # 약간 느리게 (자연스러운 나레이션 속도)
            volume="+10%", # 볼륨 약간 높게
            pitch="-3Hz"   # 약간 낮고 묵직하게
        )
        await communicate.save(out_file)
        print(f"    [OK] {out_file}")

    print("\n[완료] 나레이션 8개 생성 완료!")

asyncio.run(generate())
