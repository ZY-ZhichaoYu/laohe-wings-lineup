# 张子冲主场卡片编辑记录

- 工具模式：内置 image_gen 图像编辑，未使用 CLI/API 回退。
- 编辑目标：用户上传的红色球衣全身照（20 号、橙色队长袖标）。
- 样式参考：用户上传的赖飞扬 47 号红黑卡，只参考背景、边框及鹰徽。
- 输出：`assets/players/20-张子冲-home-v2.png`。原人物照片与旧卡片保留。
- 原始生成文件：`C:/Users/Administrator/.codex/generated_images/01a1883b-2aeb-7942-bea6-db5ab751feea/exec-e6da2550-c67b-417e-8a98-1c310843705f.png`。
- 检查：黑红斜向背景、双红边、20 号、队徽清晰；面部朝向、短发、下垂手臂、红球衣和橙队长袖标与目标照片一致。AI 编辑图像并非逐像素无损合成，网页使用前可与源图对照。

## 最终提示词

```text
Use case: identity-preserve, background replacement.
Asset type: finished 3:4 portrait football player trading card for a real team website.

Input image 1 is the EDIT TARGET and the only source of the person: Zhang Zichong, number 20, wearing a red LAOHE WINGS jersey, orange captain armband and dark blue shorts, standing with arms relaxed, looking to the viewer's right.
Input image 2 is a STYLE REFERENCE ONLY: use its black/red distressed diagonal background, fine red double rounded border, and the LAOHE WINGS eagle team crest. Do not use that person's face, hair, glasses, crossed arms, body or jersey construction.

Edit image 1 into one finished red home-kit card. Preserve the actual person's facial features, expression, short hairstyle, skin tone, gaze angle, original body pose, lowered arms, orange armband, red jersey texture, chest logos and LAOHE WINGS lettering. Do not beautify, change facial structure, change age, add glasses, turn him front-facing, cross his arms or invent another pose. Treat this as faithful photo compositing rather than redrawing a different player.
Replace only the white surrounding background with a deep black and dark crimson diagonal brush/grunge texture matching reference 2, with restrained red light accents. Include a thin red double rounded rectangular border near the edges. Reuse the supplied LAOHE WINGS eagle crest in the upper-right corner.
Composition: portrait aspect ratio 3:4. Enlarge and crop the original photo to show the full head through upper thighs, keeping the face large enough to read on a small website player card. Keep the original proportions, shoulders, upper arms and hands if they fit; do not fabricate cropped parts. Keep head safely inside the border with room above it. Place large distressed red number "20" in the upper-left background, away from the face. Do not place the number 47 anywhere.
Exact new text: "20" only. Existing jersey and crest lettering should remain as in the inputs. No name caption, no extra slogan, no watermark, no additional people.
Opaque full background; no transparency.
```

## 蓝色客场卡补齐（2026-10-29）

- 工具模式：内置 `image_gen.imagegen`，编辑；未使用 CLI/API fallback。
- 人物唯一来源：`C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-8Evy5F.png`（用户新指定的红球衣原照）。
- 球衣、边框、徽章、背景参考：`assets/players/20-张子冲-away.png`；明确禁止使用旧蓝卡面孔或正面姿态。
- 最终文件：`assets/players/20-张子冲-away-v2.png`；1086 × 1448，PNG，2,533,769 字节。
- 原始生成文件：`C:/Users/Administrator/.codex/generated_images/01a1883b-2aeb-7942-bea6-db5ab751feea/exec-202d93e5-e5bc-4531-a4a1-59e4f997a06e.png`。
- 视觉检查：新原照中的面容、短发、朝右视线、站姿及放松下垂双臂保留；橙色队长袖标保留。球衣已替换为蓝色浙江大学 SAA 客场球衣，背景为深蓝金色斜纹，金色 20 与双金边清晰。没有沿用旧卡正面肖像。徽章微小环形文字属于生成细节，不承诺逐字无损。
- 原照与旧主客场卡保留，不覆盖。

### 蓝色客场卡最终提示词

```text
Use case: identity-preserve, photo edit with kit replacement and background replacement.
Asset type: finished portrait football player card for a real team's website.
Requested canvas: exactly 1086 x 1448 pixels, 3:4 portrait aspect ratio, opaque image.

INPUT ROLES:
Image 1 (white background, red jersey, orange captain armband, number 20 shorts) is the ONLY source of the human identity, face, hair, body proportions and pose. This is the new photograph the user selected.
Image 2 (old blue/gold card) is a STYLE AND CLOTHING REFERENCE ONLY. Ignore and discard its person's face, hairstyle, body, front-facing pose and proportions. Do not copy or blend the old card's head or stance.

PRIMARY EDIT:
Create a blue away-kit version of the person in Image 1, not a variation of Image 2's portrait. Strictly preserve Image 1's real facial features, expression, short hair, skin tone, gaze toward the viewer's right, head angle, shoulders, standing body angle, relaxed lowered arms and orange captain armband on the same arm. Do not face him toward the camera, cross his arms, change his age or use the old card's facial features.
Replace only the red jersey with the blue Zhejiang University SAA kit shown in Image 2: royal blue torso, dark navy sleeves and V neckline, gold shoulder and sleeve edging, gold KELME chest mark, round School of Aeronautics and Astronautics Zhejiang University crest, white Zhejiang University lettering above large SAA. Fit the new jersey naturally to the original stance, preserving the orange captain armband.
Replace the white backdrop with dark navy and black, diagonal blue/gold distressed brush texture matching Image 2. Use a fine double rounded gold border near the edges. Put a large textured gold "20" in the upper left, and the round blue/white Zhejiang University School of Aeronautics and Astronautics crest from Image 2 in the upper right.
COMPOSITION: Enlarge the Image 1 person to show the entire head down through upper thighs, shoulders and naturally lowered upper/lower arms, matching his original relaxed stance. Keep head fully inside the frame, with number and crest unobstructed. The face must be large and clear at small website card sizes. The original pose may be cropped but must not be redesigned.
TEXT: Only card number "20", existing jersey labels "KELME", "Zhejiang University", "SAA", and existing crest text. No player name, no captions, no extra logos, no watermark, no position badge.
Preserve the original person's recognizable identity and natural photographic appearance, without beauty retouching. No other person. No red-black card background. No old blue card head/pose.
```

## 蓝色客场卡学院徽定点修复（2026-10-29）

- 工具模式：内置 `image_gen.imagegen`，局部编辑；`transparent_background: false`。未使用 Python 或其他图像编辑工具。
- 输入 1（编辑目标）：修复前的 `assets/players/20-张子冲-away-v2.png`，即上节蓝卡；该输入已原样备份到仓库外 `../tmp-captain-card/20-张子冲-away-v2-before-crest-fix.png`。修复前 SHA256：`789BFBDAEC385030D444DEC5B5E8E672199165B9880DE99D6F2D7B93AFCE686F`。
- 输入 2（真实学院徽参考）：`assets/team/logo-away.jpg`。
- 修复范围：右上角学院徽的图形与中英文环形文字，人物面容、朝向、站姿、蓝色球衣、橙色队长袖标及卡面构图保持。
- 修正版文件：`assets/players/20-张子冲-away-v2.png`；1086 × 1448，PNG，2,242,399 字节。此版本为当前最终蓝卡，替代上节生成结果。
- 修正版 SHA256：`99E508BE54E34407E53718AF19A26E64B37B6D77FB3DFC1EBC8FC4136022F28B`。
- 原始生成文件：`C:/Users/Administrator/.codex/generated_images/01a1883b-2aeb-7942-bea6-db5ab751feea/exec-17f8b9d8-9201-445d-9a52-a204985ebd6b.png`；仅原样复制到项目目标路径。
- 视觉检查：右上中文已可读为“浙江大学航空航天学院”，英文环形文字与真实参考图案恢复；图像生成仍不属于逐像素无损贴图。

### 学院徽修复最终完整提示词

以下按实际提交内容原样记录；其中“11 Chinese characters”为计数笔误，后面的逐字列表与要求的学院名称均为正确的 10 个汉字。

```text
Use case: precise-object-edit. Make exactly one localized correction to an existing finished player card.
Image 1 is the edit target: the blue/gold number 20 player card.
Image 2 is the authentic Zhejiang University School of Aeronautics and Astronautics crest, to be inserted as an exact matching visual asset.

Edit ONLY the large circular crest at the upper-right corner of Image 1. Replace its current malformed ring text and distorted crest with the authentic circular crest from Image 2, matching the existing circular placement and size, cleanly on the dark navy background. Remove only the white square corners of the reference outside its circular logo silhouette. Reproduce the reference crest faithfully: same blue outer ring, white interior, blue sweeping aerospace shapes, gray underlying forms, and orange/red upward accent. Most importantly, COPY the authentic white lettering from the supplied logo. Do not improvise letter shapes or create pseudo-Chinese. The upper arc is exactly 浙江大学航空航天学院 (11 Chinese characters: 浙 江 大 学 航 空 航 天 学 院). The surrounding English lettering must read exactly SCHOOL OF AERONAUTICS AND ASTRONAUTICS, ZHEJIANG UNIVERSITY, as visibly written in the authentic logo reference.

Keep absolutely everything else in Image 1 unchanged: the player's recognizable face, short hair, rightward gaze, head angle, blue jersey, chest branding, orange captain armband, relaxed hanging arms and hands, body pose, number 20 in top left and on shorts, double gold border, all gold/blue diagonal background strokes, crop, scale and lighting. Do not redraw or reinterpret the person. Do not modify the small badge on the jersey. No change outside the upper-right circular logo.
Output exactly 1086 x 1448 pixels, opaque PNG, preserving the card's 3:4 portrait composition. No extra text or watermark.
```
