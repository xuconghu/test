"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot } from 'lucide-react'; 
import type { RobotImage } from '@/types';

// 检查是否在GitHub Pages下运行
const isGitHubPages = typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.hostname.includes('xuconghu.github'));
// 添加正确的路径前缀
const getImagePath = (path: string) => {
  // 确保在GitHub Pages环境下路径正确
  if (isGitHubPages) {
    // 去除多余的斜杠，避免路径重复
    const cleanPath = path.startsWith('/test') 
      ? path 
      : `/test${path.startsWith('/') ? path : `/${path}`}`;
    console.log('使用GitHub Pages路径:', cleanPath);
    return cleanPath;
  }
  console.log('使用开发环境路径:', path);
  return path;
};

// 开发调试用
const debugImagePath = (path: string) => {
  const finalPath = getImagePath(path);
  console.log('图片路径处理:', {
    原始路径: path,
    最终路径: finalPath,
    是否GitHub环境: isGitHubPages,
    当前网址: typeof window !== 'undefined' ? window.location.href : '服务器端渲染',
    完整URL: typeof window !== 'undefined' ? `${window.location.origin}${finalPath}` : '服务器端渲染'
  });
  return finalPath;
};

interface RobotDisplayProps {
  robot: RobotImage | null;
  currentIndex: number;
  totalRobots: number;
}

export function RobotDisplay({ robot, currentIndex, totalRobots }: RobotDisplayProps) {
  if (robot) {
    console.log('Displaying robot:', robot.id, robot.name, robot.filename);
  }

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-card-foreground/5">
        <CardTitle className="text-xl font-semibold text-primary">当前机器人</CardTitle>
        <CardDescription>
          {robot ? `正在评估: ${robot.name} (${currentIndex + 1}/${totalRobots})` : '准备中...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="aspect-[4/3] w-full bg-muted/50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-accent transition-colors">
          {robot ? (
            <div className="relative w-full h-full">
              <Image
                src={debugImagePath(robot.filename)}
                alt={robot.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
                data-ai-hint="robot image"
                onError={(e) => {
                  console.error('图片加载失败:', robot.filename);
                  // 尝试修改路径重新加载
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src.includes('/test/test/')) {
                    // 修复重复的路径前缀
                    img.src = img.src.replace('/test/test/', '/test/');
                    console.log('尝试修复路径:', img.src);
                  } else if (!img.src.includes('/test/')) {
                    // 添加缺失的路径前缀
                    const newSrc = `/test/${img.src.split('/').pop()}`;
                    img.src = newSrc;
                    console.log('尝试添加前缀:', newSrc);
                  }
                }}
                loading="eager"
              />
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground space-y-2">
              <Bot className="mx-auto h-16 w-16 opacity-70" />
              <p className="text-base font-medium">正在准备机器人图片...</p>
              <p className="text-xs mt-1">评估将在图片加载完成后开始。</p>
            </div>
          )}
        </div>
        
        {/* 调试信息区域 - 仅在有机器人数据时显示 */}
        {robot && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
            <details>
              <summary className="font-semibold text-amber-800 cursor-pointer">
                图片路径调试信息 (点击展开)
              </summary>
              <div className="mt-2 font-mono text-[10px] break-all space-y-1 text-amber-700">
                <p><span className="font-semibold">ID:</span> {robot.id}</p>
                <p><span className="font-semibold">名称:</span> {robot.name}</p>
                <p><span className="font-semibold">文件路径:</span> {robot.filename}</p>
                <p><span className="font-semibold">实际图片URL:</span> {typeof window !== 'undefined' ? `${window.location.origin}${debugImagePath(robot.filename)}` : '未知'}</p>
                <p><span className="font-semibold">环境:</span> {isGitHubPages ? 'GitHub Pages' : '开发环境'}</p>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
