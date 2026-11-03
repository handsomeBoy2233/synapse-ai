@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 正在运行 node build-data.js 更新视频数据...
echo ========================================
echo.
node build-data.js
echo.
if %errorlevel% equ 0 (
    echo [成功] 数据文件已更新！可上传 videos_core.js、videos_data.js、videos_player.js
) else (
    echo [失败] 生成过程中出现错误，请检查上方提示信息。
)
echo.
pause
