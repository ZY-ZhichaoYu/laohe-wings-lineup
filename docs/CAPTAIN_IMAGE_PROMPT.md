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
