"""小说辅助工具 - 新建小说 / 添加卷与章节

结构:
  _novels/<小说名>/
    ├── README.md                  # 小说首页（可选）
    └── <NNN>_<卷名>/
        └── 第<NNN>章_<章节名>.md

用法:
  python tools/new-novel.py new 小说名称 [卷名]        # 新建小说（默认卷名 "正文"）
  python tools/new-novel.py add 小说名称 卷名 章节名称   # 添加章节（卷不存在则自动新建）
  python tools/new-novel.py list                       # 列出所有小说
"""

import os
import sys
import re
from datetime import date

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOVELS_DIR = os.path.join(BASE_DIR, "_novels")

VOLUME_RE = re.compile(r"^(\d{3})_(.+)$")
CHAPTER_RE = re.compile(r"^第(\d+)章_(.+)\.md$")


def slugify(name):
    """将小说名转为适合做文件名的形式"""
    return re.sub(r'[<>:"/\\|?*]', "", name).strip()


def _list_volumes(novel_dir):
    """返回 [(卷号, 卷名, 目录名), ...] 按卷号排序"""
    volumes = []
    for d in os.listdir(novel_dir):
        m = VOLUME_RE.match(d)
        if m and os.path.isdir(os.path.join(novel_dir, d)):
            volumes.append((int(m.group(1)), m.group(2), d))
    volumes.sort()
    return volumes


def _list_chapters(volume_dir):
    """返回 [(章号, 章节名, 文件名), ...] 按章号排序"""
    chapters = []
    for f in os.listdir(volume_dir):
        m = CHAPTER_RE.match(f)
        if m:
            chapters.append((int(m.group(1)), m.group(2), f))
    chapters.sort()
    return chapters


def list_novels():
    if not os.path.isdir(NOVELS_DIR):
        print("还没有任何小说。")
        return
    novels = [d for d in os.listdir(NOVELS_DIR)
              if os.path.isdir(os.path.join(NOVELS_DIR, d))]
    if not novels:
        print("还没有任何小说。")
        return
    print(f"📚 共 {len(novels)} 部小说：\n")
    for n in novels:
        dir_path = os.path.join(NOVELS_DIR, n)
        volumes = _list_volumes(dir_path)
        chapter_total = sum(len(_list_chapters(os.path.join(dir_path, v[2]))) for v in volumes)
        print(f"  《{n}》 — {len(volumes)} 卷 {chapter_total} 章")
        for num, name, vdir in volumes:
            print(f"    └ {num:03d}_{name}/")
            for chnum, ctitle, fname in _list_chapters(os.path.join(dir_path, vdir)):
                print(f"        └ {fname}")


def new_novel(name, volume_name="正文"):
    dir_name = slugify(name)
    target = os.path.join(NOVELS_DIR, dir_name)
    if os.path.exists(target):
        print(f"❌ 小说《{name}》已存在: {target}")
        return
    os.makedirs(target)
    today = date.today().isoformat()

    # README.md（小说首页）
    readme = f"""---
layout: novel
novel: {name}
title: {name}
description:
permalink: /novels/{dir_name}/
---

《{name}》的故事从这里开始。
"""
    with open(os.path.join(target, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    # 第一卷 + 序章
    volume_dir = f"001_{volume_name}"
    os.makedirs(os.path.join(target, volume_dir))
    prologue = f"""---
novel: {name}
volume: {volume_dir}
chapter: 1
title: 序章
description:
date: {today}
tags: []
---

# 序章

故事从这里开始……
"""
    with open(os.path.join(target, volume_dir, "第001章_序章.md"), "w", encoding="utf-8") as f:
        f.write(prologue)

    print(f"✅ 新建小说《{name}》成功！")
    print(f"   目录: {target}")
    print(f"   已生成 README.md + {volume_dir}/第001章_序章.md")


def add_chapter(name, volume_name, title):
    dir_name = slugify(name)
    target = os.path.join(NOVELS_DIR, dir_name)
    if not os.path.isdir(target):
        print(f"❌ 小说《{name}》不存在。")
        print(f"   先运行: python tools/new-novel.py new \"{name}\"")
        return

    # 查找同名卷，没有则新建
    volume_dir = None
    for num, vname, vdir in _list_volumes(target):
        if vname == volume_name:
            volume_dir = os.path.join(target, vdir)
            break
    if volume_dir is None:
        next_num = max((v[0] for v in _list_volumes(target)), default=0) + 1
        volume_dir = os.path.join(target, f"{next_num:03d}_{volume_name}")
        os.makedirs(volume_dir)

    chapters = _list_chapters(volume_dir)
    next_chapter = max((c[0] for c in chapters), default=0) + 1
    today = date.today().isoformat()
    filename = f"第{next_chapter:03d}章_{title}.md"

    content = f"""---
novel: {name}
volume: {os.path.basename(volume_dir)}
chapter: {next_chapter}
title: {title}
description:
date: {today}
tags: []
---

# 第{next_chapter}章 {title}

"""
    with open(os.path.join(volume_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ 添加章节《{title}》成功！")
    print(f"   文件: {os.path.join(volume_dir, filename)}")
    print(f"   {os.path.basename(volume_dir)} · 第 {next_chapter} 章")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "new":
        if len(sys.argv) < 3:
            print("用法: python tools/new-novel.py new 小说名称 [卷名]")
            sys.exit(1)
        new_novel(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "正文")
    elif cmd == "add":
        if len(sys.argv) < 5:
            print("用法: python tools/new-novel.py add 小说名称 卷名 章节名称")
            sys.exit(1)
        add_chapter(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "list":
        list_novels()
    else:
        print(__doc__)
        sys.exit(1)
