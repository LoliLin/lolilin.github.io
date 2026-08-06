@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "BASE_DIR=%~dp0.."
set "NOVELS_DIR=%BASE_DIR%\_novels"

if "%1"=="" goto :usage
if "%1"=="new" goto :new
if "%1"=="add" goto :add
if "%1"=="list" goto :list
goto :usage

:usage
echo 小说辅助工具
echo.
echo 用法:
echo   new-novel.bat new "小说名称" ["卷名"]          新建一部小说（默认卷名 "正文"）
echo   new-novel.bat add "小说名称" "卷名" "章节名称"   添加章节（卷不存在则自动新建）
echo   new-novel.bat list                             列出所有小说
echo.
goto :end

:list
if not exist "%NOVELS_DIR%" (
    echo 还没有任何小说。
    goto :end
)
echo 📚 小说列表：
echo.
for /d %%d in ("%NOVELS_DIR%\*") do (
    set "vol_count=0"
    set "chap_count=0"
    echo  《%%~nxd》
    for /d %%v in ("%%d\*") do (
        set /a vol_count+=1
        echo     └ %%~nxv\
        for %%f in ("%%v\第*章_*.md") do (
            set /a chap_count+=1
            echo         └ %%~nxf
        )
    )
    echo     （!vol_count! 卷 !chap_count! 章）
)
goto :end

:new
if "%2"=="" (
    echo 请输入小说名称
    goto :end
)
set "NOVEL_NAME=%2"
set "VOLUME_NAME=正文"
if not "%3"=="" set "VOLUME_NAME=%3"
set "TARGET=%NOVELS_DIR%\%NOVEL_NAME%"
set "VOL_DIR=001_%VOLUME_NAME%"

if exist "%TARGET%" (
    echo ❌ 小说《%NOVEL_NAME%》已存在
    goto :end
)

mkdir "%TARGET%" 2>nul
mkdir "%TARGET%\%VOL_DIR%" 2>nul

rem 生成 README.md
(
echo ---
echo layout: novel
echo novel: %NOVEL_NAME%
echo title: %NOVEL_NAME%
echo description:
echo permalink: /novels/%NOVEL_NAME%/
echo ---
echo.
echo 《%NOVEL_NAME%》的故事从这里开始。
) > "%TARGET%\README.md"

rem 获取当前日期
for /f "tokens=1-3 delims=/-" %%a in ('echo %date%') do set "today=%%a-%%b-%%c"
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value 2^>nul') do set "dt=%%i"
if defined dt (
    set "today=!dt:~0,4!-!dt:~4,2!-!dt:~6,2!"
)

rem 生成序章
(
echo ---
echo novel: %NOVEL_NAME%
echo volume: %VOL_DIR%
echo chapter: 1
echo title: 序章
echo description:
echo date: !today!
echo tags: []
echo ---
echo.
echo # 序章
echo.
echo 故事从这里开始……
) > "%TARGET%\%VOL_DIR%\第001章_序章.md"

echo ✅ 新建小说《%NOVEL_NAME%》成功！
echo    目录: %TARGET%
echo    已生成 README.md + %VOL_DIR%\第001章_序章.md
goto :end

:add
if "%4"=="" (
    echo 用法: new-novel.bat add "小说名称" "卷名" "章节名称"
    goto :end
)
set "NOVEL_NAME=%2"
set "VOLUME_NAME=%3"
set "CHAPTER_NAME=%4"
set "TARGET=%NOVELS_DIR%\%NOVEL_NAME%"

if not exist "%TARGET%" (
    echo ❌ 小说《%NOVEL_NAME%》不存在
    goto :end
)

rem 查找同名卷；同时记录最大卷号
set "VOL_DIR="
set "max_vol=0"
for /d %%v in ("%TARGET%\*") do (
    set "vd=%%~nxv"
    for /f "tokens=1,* delims=_" %%a in ("!vd!") do (
        if "%%b"=="%VOLUME_NAME%" set "VOL_DIR=%%v"
        if %%a gtr !max_vol! set "max_vol=%%a"
    )
)
if not defined VOL_DIR (
    set /a next_vol=max_vol+1
    set "vol_padded=00!next_vol!"
    set "vol_padded=!vol_padded:~-3!"
    set "VOL_DIR=%TARGET%\!vol_padded!_%VOLUME_NAME%"
    mkdir "!VOL_DIR!" 2>nul
)

rem 找到卷内最大章节号
set "max_num=0"
for %%f in ("!VOL_DIR!\第*章_*.md") do (
    set "fname=%%~nf"
    set "num=!fname:~1,3!"
    if !num! gtr !max_num! set "max_num=!num!"
)
set /a next_num=max_num+1
set "padded=00!next_num!"
set "padded=!padded:~-3!"

rem 获取日期
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value 2^>nul') do set "dt=%%i"
if defined dt (
    set "today=!dt:~0,4!-!dt:~4,2!-!dt:~6,2!"
) else (
    set "today=2026-07-14"
)

(
echo ---
echo novel: %NOVEL_NAME%
echo volume: !VOL_DIR:%TARGET%\=!
echo chapter: !next_num!
echo title: %CHAPTER_NAME%
echo description:
echo date: !today!
echo tags: []
echo ---
echo.
echo # 第!next_num!章 %CHAPTER_NAME%
echo.
) > "!VOL_DIR!\第!padded!章_%CHAPTER_NAME%.md"

echo ✅ 添加章节《%CHAPTER_NAME%》成功！
echo    文件: !VOL_DIR!\第!padded!章_%CHAPTER_NAME%.md
echo    !VOL_DIR:%TARGET%\=! · 第 !next_num! 章
goto :end

:end
