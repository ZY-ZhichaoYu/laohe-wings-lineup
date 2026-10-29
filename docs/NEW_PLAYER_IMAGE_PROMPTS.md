# 沈熙洲、徐文浩、李炳灿主场卡制作记录

模式：内置 image_gen 图片编辑；未使用 CLI 或独立 API 调用。
日期：2026-10-29。

三张图片均基于用户提供的原照制作。沈熙洲、徐文浩替换背景、统一边框与号码，保留人物外观、原姿态、红色球衣及现有印字；李炳灿另将白色外套编辑为球队球衣。照片中的人物与姓名对应关系由用户提供。

## 输出

- `assets/players/19-沈熙洲-home.png`
- `assets/players/21-徐文浩-home.png`
- `assets/players/9-李炳灿-home.png`

已查看生成结果：两张号码正确、头部完整、姿态与源照对应。沈熙洲保留交叉手臂；徐文浩保留正面站姿及圆眼镜，裁去上方空墙与底部相机页脚。生成编辑并非逐像素抠图，原始照片应继续保留用于核对。

## 源照片

- 沈熙洲：`codex-clipboard-bOrF02.png`。
- 徐文浩正面：`codex-clipboard-KLS3uI.png`；侧面辅助：`codex-clipboard-v6PDuW.png`。
- 卡面风格参考：用户提供的 47 号红黑卡 `codex-clipboard-pr7KsD.png`，仅用于背景、边框及鹰队徽。

## 最终提示词：19 号

```text
Use case: identity-preserve photographic background edit.
Asset: one finished 3:4 vertical football player card.
Input 1 is the EDIT TARGET: the supplied red-jersey portrait of Shen Xizhou with crossed arms. Input 2 is STYLE REFERENCE ONLY: the red-black number 47 card; never use or blend that reference person's face/body.
Preserve the person in input 1 extremely faithfully: exact face shape, eyes, nose, mouth, hair, skin texture, expression, body proportions, crossed-arm pose, red jersey pattern and its original eagle badge and LAOHE WINGS print. Do not beautify, make younger, change the pose, alter the jersey or reconstruct another face. Retain photographic realism.
Replace only the plain black background with the same subtle black and deep-red diagonal brush textures as the style reference; add its thin rounded double red border. Head must remain fully inside the frame. Crop/compose from full hair to waist, keeping crossed arms intact and the subject large enough to recognize in a small website card.
Top left: large distressed red number "19". Top right: use the same crowned LAOHE WINGS eagle emblem as the style reference. Do not include 47 anywhere. No player name, other added words, captions, watermark, or extra people. Opaque background.
```

## 最终提示词：21 号

```text
Use case: identity-preserve photographic background edit.
Asset: one finished 3:4 vertical football player card.
Input 1 is the EDIT TARGET: Xu Wenhao standing front-facing in a red LAOHE WINGS jersey and round glasses against a wall. Input 2 shows the SAME PERSON from the side, supporting identity reference ONLY. Input 3 is STYLE REFERENCE ONLY: a red-black number 47 player card; never use or blend that person's face/body.
Preserve the front-facing target person's actual identity and appearance extremely faithfully: exact face shape, eyes, nose, lips, short black hair, round glasses, natural skin texture and expression, body proportions, arms-behind-back pose, red jersey pattern, existing shirt eagle badge and LAOHE WINGS lettering. Do not beautify skin, slim the person, invent folded arms, change hairstyle or substitute the side pose.
Crop the excess wall above the head and the camera-brand footer out of the composition, framing the subject from fully visible hair to waist with a small top margin. Keep the source posture and the recognizable photographed face, not an illustrated or idealized reconstruction.
Replace the wall behind the subject with the same subtle black and deep-red diagonal brush textures as input 3 and add a thin rounded double red border. Top left: large distressed red number "21". Top right: use the same crowned LAOHE WINGS eagle emblem from input 3. No 47, no name, no other added words, watermark, captions, or people. Opaque background.
```


## 9 号李炳灿主场卡（追加）

- 制作日期：2026-10-29。
- 模式：内置 `image_gen.imagegen` 编辑，使用 `referenced_image_paths`；非 CLI、非重新生成虚构人物。
- 身份与人物原照：用户明确指认的 `D:\xwechat_files\wxid_u27s6o3vli4x12_f369\temp\RWTemp\2026-10\5e8c3ebd76d686a675c6f19a832abdba.jpg`。
- 风格与球衣参考：`assets/players/19-沈熙洲-home.png`，仅参考卡面、球衣、队徽，不参考人物外貌。
- 输出：`assets/players/9-李炳灿-home.png`，1086 × 1448，RGB。
- 视觉检查：保留浅棕发色与原照面部特征、闭嘴表情，完整保留头发；白色外套换为球队红黑球衣；左上 9、右上鹰队徽、黑红斜纹及细双边框清晰，未出现其他号码。衣服与下半身构图为生成式编辑，应保留原照用于后续比对。

### 最终提示词：9 号

```text
Use case: identity-preserve outfit and background photo edit.
Asset: a single finished red-black home-kit football player card, portrait 3:4, target resolution 1086 by 1448.
Input 1 is the sole EDIT TARGET and identity reference: the supplied outdoor selfie of Li Bingcan, the young man with light brown/copper hair and a neutral closed-mouth expression. Input 2 is STYLE/UNIFORM REFERENCE ONLY, showing number 19 and a different person. Do not copy, mix, or borrow any facial or bodily features from input 2.
Preserve the target's recognizable face exactly and naturally: same face shape, brow/eye shapes, nose, lips, expression, pale complexion, light brown/copper hair color, hairline and parted tousled hairstyle. Preserve his head angle and youthful appearance. No beauty-filter reshaping, no smile, no glasses, no facial hair, no darkening his hair. Keep photographic realism.
Change the white jacket and undershirt into the same red-and-black LAOHE WINGS football jersey shown in input 2, with its red tonal pattern, black collar, same eagle club crest, white manufacturer mark and chest wording "LAOHE WINGS". Frame him naturally from complete hair to waist/upper hip, with shoulders at a natural slight angle; do not introduce the crossed-arm pose from input 2. His face should remain the supplied person's, not an imagined replacement.
Replace the outdoor city and foliage with the same black/deep-red diagonal grunge brush background as the reference card; use the same thin rounded double red border. Large distressed red "9" at the upper left, crowned LAOHE WINGS eagle club emblem at upper right. No 19 anywhere. No added name, captions, extra wording, watermark or extra people. Opaque background. The full hair and facial features must not be covered by the number or emblem.
```
