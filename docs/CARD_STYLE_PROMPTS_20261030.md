# 球员卡版式统一制作记录

日期：2026-10-30。模式：内置 image_gen 编辑，每张单独调用；8 张输出原样复制到项目，原照和此前版本保留。

主要校正：将新卡宽厚切角的号码改为存量卡的细长圆角字形，统一号码比例及边距；缩小张子冲蓝卡偏大的学院徽。编辑约束固定原有人物、面部、球衣与背景。以存量 9、20、31 号卡作参考，不能把参考卡人物当作身份来源。

补充输入：张子冲客场编辑的第三张参考为 `assets/players/9-金世纪-away.jpg`，用于学院徽比例；沈熙洲、徐文浩客场编辑的第三张参考为 `assets/players/31-黄于翀-home.png`，仅用于数字 1 的字形，不采用红色。下文中第一张均为编辑目标，第二张均为字形参考。

## assets/players/9-李炳灿-away-v2.png

编辑目标：`assets/players/9-李炳灿-away.png`。字形参考：`assets/players/9-金世纪-away.jpg`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-e5f5ffee-de43-41df-aa14-00abbbd90dfa.png`。

```text
Use case: precise-object-edit, identity-preserve.
Edit target IMAGE 1: the current blue/gold away player card for Li Bingcan, copper-haired man.
IMAGE 2 is the EXISTING LEGACY card of a DIFFERENT man Jin Shiji wearing the same kit. Use IMAGE 2 ONLY for the EXACT upper-left numeral 9 typography and scale. Never borrow or change the person's face.
Deliver one finished opaque 1086x1448 portrait 3:4 card.
The user flags the new digit as too bulky and a different typeface. Make ONLY a local change to IMAGE 1's upper-left NUMBER GRAPHIC. Remove the angular octagonal block numeral and faithfully transfer/reproduce IMAGE 2's narrow, tall, rounded condensed numeral '9', with its exact silhouette, counter shape, distressed flecks, color, height and margin. It must look like the same card series as IMAGE 2.
At 1086x1448 the 9 should be approximately 130 pixels wide, 280-290 pixels tall, top at 75-80 pixels, left at 100-120 pixels, matching IMAGE 2. Do NOT use a broad collegiate/angular/octagonal font. Do NOT stretch the narrow 9 wider. Same legacy-size numeral, NOT giant.
Repair any uncovered area using IMAGE 1's existing diagonal background. Absolutely everything else in IMAGE 1 is invariant: identical face, hair, expression, gaze, skin texture, full person, pose, crossed arms or hand position, uniform, jersey logos and writing, lighting, portrait scale, top-right crest, double border, background outside this local patch. No pose or identity changes. Preserve the original photograph; this is a typography correction, not a new portrait.
Only text '9'. No new captions, no watermark, no reference person's face.
```

## assets/players/9-李炳灿-home-v2.png

编辑目标：`assets/players/9-李炳灿-home.png`。字形参考：`assets/players/9-金世纪-home.jpg`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-affb0bf3-c5c8-4710-98d7-f4bf01343d39.png`。

```text
Use case: precise-object-edit, identity-preserve.
Edit target IMAGE 1: the current red/black home player card for Li Bingcan, copper-haired man.
IMAGE 2 is the EXISTING LEGACY card of a DIFFERENT man Jin Shiji wearing the same kit. Use IMAGE 2 ONLY for the EXACT upper-left numeral 9 typography and scale. Never borrow or change the person's face.
Deliver one finished opaque 1086x1448 portrait 3:4 card.
The user flags the new digit as too bulky and a different typeface. Make ONLY a local change to IMAGE 1's upper-left NUMBER GRAPHIC. Remove the angular octagonal block numeral and faithfully transfer/reproduce IMAGE 2's narrow, tall, rounded condensed numeral '9', with its exact silhouette, counter shape, distressed flecks, color, height and margin. It must look like the same card series as IMAGE 2.
At 1086x1448 the 9 should be approximately 130 pixels wide, 280-290 pixels tall, top at 75-80 pixels, left at 100-120 pixels, matching IMAGE 2. Do NOT use a broad collegiate/angular/octagonal font. Do NOT stretch the narrow 9 wider. Same legacy-size numeral, NOT giant.
Repair any uncovered area using IMAGE 1's existing diagonal background. Absolutely everything else in IMAGE 1 is invariant: identical face, hair, expression, gaze, skin texture, full person, pose, crossed arms or hand position, uniform, jersey logos and writing, lighting, portrait scale, top-right crest, double border, background outside this local patch. No pose or identity changes. Preserve the original photograph; this is a typography correction, not a new portrait.
Only text '9'. No new captions, no watermark, no reference person's face.
```

## assets/players/20-张子冲-home-v4.png

编辑目标：`assets/players/20-张子冲-home-v3.png`。字形参考：`assets/players/20-张子冲-home.png`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-d7d7714e-eefc-4ed2-a294-43de355b5cd1.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target, latest #20 Zhang Zichong home card with the correct original face looking to viewer right, folded arms and orange captain armband.
IMAGE 2 is an OLD #20 card, used ONLY for its narrower smaller upper-left '20' typography. Its PERSON is NOT the target; do not copy its old face/pose. 
Produce one opaque 1086x1448 portrait 3:4 image.
Make a restrained localized graphic correction: replace IMAGE 1's overly wide bulky upper-left '20' with IMAGE 2's exact tall, narrow, rounded condensed sans-serif numerals. Match legacy scale, natural narrow zero and slim two, distressed red/gold texture, same color. Not a wide collegiate/block/octagonal typeface.
At 1086x1448, target total '20' box x80..315, y75..345 (about 235 wide, 270 tall). Copy the narrow stroke proportions from IMAGE 2 instead of widening the numerals. The digit cluster must leave the portrait's hair clear. Subtle dark speckles, no bright bevel/3D decoration.

ONLY these card graphics may change. Preserve IMAGE 1's entire person and photographic body exactly: FACE, facial features, expression, gaze to viewer right, head angle, short black hair, age, skin, ears, crossed forearms, orange captain band, clothing color, all jersey graphics, lighting and scale. No new human or face from other references. Keep its border and existing grunge background intact except tiny repaired areas previously covered by old graphics. Do not change pose or composition.
Only numeral '20', no extra words or captions. This is graphic typography harmonization, not a new portrait.
```

## assets/players/20-张子冲-away-v4.png

编辑目标：`assets/players/20-张子冲-away-v3.png`。字形参考：`assets/players/20-张子冲-away.png`。学院徽比例另参照老9号蓝卡。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-37728c6c-152f-4616-bfe1-60fa240581dd.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target, latest #20 Zhang Zichong away card with the correct original face looking to viewer right, folded arms and orange captain armband.
IMAGE 2 is an OLD #20 card, used ONLY for its narrower smaller upper-left '20' typography. Its PERSON is NOT the target; do not copy its old face/pose. IMAGE 3 is an existing #9 blue card, only for standard crest diameter.
Produce one opaque 1086x1448 portrait 3:4 image.
Make a restrained localized graphic correction: replace IMAGE 1's overly wide bulky upper-left '20' with IMAGE 2's exact tall, narrow, rounded condensed sans-serif numerals. Match legacy scale, natural narrow zero and slim two, distressed red/gold texture, same color. Not a wide collegiate/block/octagonal typeface.
At 1086x1448, target total '20' box x80..315, y75..345 (about 235 wide, 270 tall). Copy the narrow stroke proportions from IMAGE 2 instead of widening the numerals. The digit cluster must leave the portrait's hair clear. Subtle dark speckles, no bright bevel/3D decoration.
Also reduce ONLY the oversized top-right academy crest to the legacy set's normal diameter: about 210 pixels on this 1086-wide card, center about (928,164), top about 60. Use IMAGE 3 only to reproduce the normal crest size and position. Keep the original emblem artwork, colors and lettering, no redesign.
ONLY these card graphics may change. Preserve IMAGE 1's entire person and photographic body exactly: FACE, facial features, expression, gaze to viewer right, head angle, short black hair, age, skin, ears, crossed forearms, orange captain band, clothing color, all jersey graphics, lighting and scale. No new human or face from other references. Keep its border and existing grunge background intact except tiny repaired areas previously covered by old graphics. Do not change pose or composition.
Only numeral '20', no extra words or captions. This is graphic typography harmonization, not a new portrait.
```

## assets/players/19-沈熙洲-home-v2.png

编辑目标：`assets/players/19-沈熙洲-home.png`。字形参考：`assets/players/31-黄于翀-home.png`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-254d7f19-ddf5-4c77-b02b-b02479851fbb.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target: the existing Shen Xizhou, curly black hair red home football card. Keep this exact person, face, hairstyle, expression, skin, glasses if present, body pose, entire uniform and lighting.
IMAGE 2 is a DIFFERENT PLAYER'S legacy card used ONLY for condensed upper-left number typography, standard size and color. 
Create one opaque 1086x1448 portrait 3:4 finished card. Make ONLY a localized edit to IMAGE 1's UPPER-LEFT NUMBER GRAPHIC.
Replace the overly wide, angular, octagonal collegiate block number with '19' in the SAME TALL NARROW ROUNDED CONDENSED sans-serif lettering as IMAGE 2's legacy series. Keep slim proportions, rounded vertical bowls and subtle distressed flecks. Absolutely NO wide/blocky/angular/octagonal sports font. Preserve genuine curved 9 and narrow '1' shape.
Standard numeral bounds for this two-digit card at 1086x1448: left near 85px, top near 80px, height about 265px, total width about 210-225px. Separate glyphs naturally, not merged or stretched. Same restrained deep red as legacy cards. Make the numeric cluster distinctly narrower than IMAGE 1, with open background between it and the hair. Restore the tiny exposed patches using existing background streaks.
Everything outside this localized upper-left digit region must remain as IMAGE 1: entire face/photograph/body/pose, jersey and chest wording, top-right badge, double rounded border, grunge texture, contrast and composition. Do not use the reference person's face. No facial retouch, slimming, age change, pose adjustment or new background. This is ONLY consistent typography across existing player cards.
Only text '19'; no extra numbers, captions or watermark.
```

## assets/players/19-沈熙洲-away-v2.png

编辑目标：`assets/players/19-沈熙洲-away.png`。字形参考：`assets/players/9-金世纪-away.jpg`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-b7d349f5-5b6e-412b-8d03-898b3a317275.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target: the existing Shen Xizhou, curly black hair blue away football card. Keep this exact person, face, hairstyle, expression, skin, glasses if present, body pose, entire uniform and lighting.
IMAGE 2 is a DIFFERENT PLAYER'S legacy card used ONLY for condensed upper-left number typography, standard size and color. IMAGE 3 supplies the existing condensed '1' stroke proportions, only numeral styling; don't use its red color.
Create one opaque 1086x1448 portrait 3:4 finished card. Make ONLY a localized edit to IMAGE 1's UPPER-LEFT NUMBER GRAPHIC.
Replace the overly wide, angular, octagonal collegiate block number with '19' in the SAME TALL NARROW ROUNDED CONDENSED sans-serif lettering as IMAGE 2's legacy series. Keep slim proportions, rounded vertical bowls and subtle distressed flecks. Absolutely NO wide/blocky/angular/octagonal sports font. Preserve genuine curved 9 and narrow '1' shape.
Standard numeral bounds for this two-digit card at 1086x1448: left near 85px, top near 80px, height about 265px, total width about 210-225px. Separate glyphs naturally, not merged or stretched. Same restrained aged gold as legacy cards. Make the numeric cluster distinctly narrower than IMAGE 1, with open background between it and the hair. Restore the tiny exposed patches using existing background streaks.
Everything outside this localized upper-left digit region must remain as IMAGE 1: entire face/photograph/body/pose, jersey and chest wording, top-right badge, double rounded border, grunge texture, contrast and composition. Do not use the reference person's face. No facial retouch, slimming, age change, pose adjustment or new background. This is ONLY consistent typography across existing player cards.
Only text '19'; no extra numbers, captions or watermark.
```

## assets/players/21-徐文浩-home-v2.png

编辑目标：`assets/players/21-徐文浩-home.png`。字形参考：`assets/players/31-黄于翀-home.png`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-ca221043-0835-4892-a524-2dff996a3fe0.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target: the existing Xu Wenhao, round metal glasses red home football card. Keep this exact person, face, hairstyle, expression, skin, glasses if present, body pose, entire uniform and lighting.
IMAGE 2 is a DIFFERENT PLAYER'S legacy card used ONLY for condensed upper-left number typography, standard size and color. 
Create one opaque 1086x1448 portrait 3:4 finished card. Make ONLY a localized edit to IMAGE 1's UPPER-LEFT NUMBER GRAPHIC.
Replace the overly wide, angular, octagonal collegiate block number with '21' in the SAME TALL NARROW ROUNDED CONDENSED sans-serif lettering as IMAGE 2's legacy series. Keep slim proportions, rounded vertical bowls and subtle distressed flecks. Absolutely NO wide/blocky/angular/octagonal sports font. Preserve genuine curved 2 and narrow '1' shape.
Standard numeral bounds for this two-digit card at 1086x1448: left near 85px, top near 80px, height about 265px, total width about 210-225px. Separate glyphs naturally, not merged or stretched. Same restrained deep red as legacy cards. Make the numeric cluster distinctly narrower than IMAGE 1, with open background between it and the hair. Restore the tiny exposed patches using existing background streaks.
Everything outside this localized upper-left digit region must remain as IMAGE 1: entire face/photograph/body/pose, jersey and chest wording, top-right badge, double rounded border, grunge texture, contrast and composition. Do not use the reference person's face. No facial retouch, slimming, age change, pose adjustment or new background. This is ONLY consistent typography across existing player cards.
Only text '21'; no extra numbers, captions or watermark.
```

## assets/players/21-徐文浩-away-v2.png

编辑目标：`assets/players/21-徐文浩-away.png`。字形参考：`assets/players/9-金世纪-away.jpg`。

输出来源：`C:\Users\Administrator\.codex\generated_images\01a187eb-fe58-7c32-bc98-dfd00f572389\exec-3e647dbe-17a2-4657-8562-9b8a5c412e86.png`。

```text
Use case: precise-object-edit / identity-preserve.
IMAGE 1 is the edit target: the existing Xu Wenhao, round metal glasses blue away football card. Keep this exact person, face, hairstyle, expression, skin, glasses if present, body pose, entire uniform and lighting.
IMAGE 2 is a DIFFERENT PLAYER'S legacy card used ONLY for condensed upper-left number typography, standard size and color. IMAGE 3 supplies the existing condensed '1' stroke proportions, only numeral styling; don't use its red color.
Create one opaque 1086x1448 portrait 3:4 finished card. Make ONLY a localized edit to IMAGE 1's UPPER-LEFT NUMBER GRAPHIC.
Replace the overly wide, angular, octagonal collegiate block number with '21' in the SAME TALL NARROW ROUNDED CONDENSED sans-serif lettering as IMAGE 2's legacy series. Keep slim proportions, rounded vertical bowls and subtle distressed flecks. Absolutely NO wide/blocky/angular/octagonal sports font. Preserve genuine curved 2 and narrow '1' shape.
Standard numeral bounds for this two-digit card at 1086x1448: left near 85px, top near 80px, height about 265px, total width about 210-225px. Separate glyphs naturally, not merged or stretched. Same restrained aged gold as legacy cards. Make the numeric cluster distinctly narrower than IMAGE 1, with open background between it and the hair. Restore the tiny exposed patches using existing background streaks.
Everything outside this localized upper-left digit region must remain as IMAGE 1: entire face/photograph/body/pose, jersey and chest wording, top-right badge, double rounded border, grunge texture, contrast and composition. Do not use the reference person's face. No facial retouch, slimming, age change, pose adjustment or new background. This is ONLY consistent typography across existing player cards.
Only text '21'; no extra numbers, captions or watermark.
```


