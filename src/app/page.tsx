"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// 使用动态导入
const RobotDisplay = dynamic(() => import('@/components/image-upload-area').then(mod => ({ default: mod.RobotDisplay })), { ssr: false });
const AssessmentPanel = dynamic(() => import('@/components/assessment-panel').then(mod => ({ default: mod.AssessmentPanel })), { ssr: false });
import { ASSESSMENT_QUESTIONS as ALL_QUESTIONS, INITIAL_SLIDER_VALUE } from '@/config/questions';
import { getRandomRobots, ROBOTS_PER_ASSESSMENT } from '../config/robots';
import type { AssessmentQuestion, StoredRobotAssessment, RobotImage, AssessmentSession, AssessmentResult } from '@/types';
import { Bot, Save, Download, ChevronRight, Upload, ExternalLink, User, Brain, Award, Book, AlertTriangle, Info, Braces, PencilRuler, Clipboard, Activity, BrainCircuit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateCsvContent, downloadCsv } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Helper function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const calculateOverallScore = (values: number[]): number => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
};

// 简单的调试信息组件
function DebugInfo({ robot }: { robot: RobotImage | null }) {
  if (!robot) return null;
  
  return (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-yellow-500 h-5 w-5 mt-0.5" />
        <div className="text-xs text-yellow-700">
          <p className="font-medium">图片加载调试信息：</p>
          <div className="mt-1 font-mono text-[10px] break-all">
            <p>ID: {robot.id}</p>
            <p>名称: {robot.name}</p>
            <p>文件路径: {robot.filename}</p>
            <p>完整URL: {typeof window !== 'undefined' ? `${window.location.origin}${robot.filename}` : '(客户端渲染)'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RobotVisionaryPage() {
  // 用户信息状态
  const [userInfo, setUserInfo] = useState({
    name: '',
    age: '',
    gender: '',
    major: ''
  });
  const [showUserForm, setShowUserForm] = useState(true);
  
  const [shuffledQuestions, setShuffledQuestions] = useState<AssessmentQuestion[]>([]);
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [session, setSession] = useState<AssessmentSession>({
    selectedRobots: [],
    currentRobotIndex: 0,
    completedAssessments: []
  });
  const { toast } = useToast();

  // 添加跳转到结束界面的功能
  const handleSkipToEnd = () => {
    // 创建三个虚拟完成的评估记录
    const dummyAssessments: StoredRobotAssessment[] = [];
    for (let i = 0; i < 3; i++) {
      dummyAssessments.push({
        robotId: `robot${i+1}`,
        robotName: `测试机器人${i+1}`,
        robotImageUrl: `/robot-images/${i+1}_test.jpg`,
        timestamp: new Date().toISOString(),
        sliderValues: Array(27).fill(50), // 27个问题，全部评分50
        shuffledQuestionsSnapshot: shuffledQuestions.length > 0 ? [...shuffledQuestions] : [],
        overallScore: 50,
        userName: userInfo.name || '测试用户',
        userAge: Number(userInfo.age) || 25,
        userGender: userInfo.gender || '未指定',
        userMajor: userInfo.major || '测试专业'
      });
    }
    
    // 设置模拟的机器人数据
    const dummyRobots: RobotImage[] = Array(3).fill(null).map((_, i) => ({
      id: `robot${i+1}`,
      filename: `/robot-images/${i+1}_test.jpg`,
      name: `测试机器人${i+1}`
    }));
    
    // 更新session状态，直接跳转到结束界面
    setSession({
      selectedRobots: dummyRobots,
      currentRobotIndex: 3, // 设置为数组长度，表示已完成全部评估
      completedAssessments: dummyAssessments
    });
    
    // 关闭表单界面
    setShowUserForm(false);
    
    toast({
      title: "已跳转到结束界面",
      description: "这是一个测试功能，用于直接查看结束界面",
      duration: 3000,
    });
  };

  // 处理用户信息输入变化
  const handleUserInfoChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 提交用户信息
  const handleUserInfoSubmit = () => {
    // 简单验证
    if (!userInfo.name || !userInfo.age || !userInfo.gender || !userInfo.major) {
      toast({
        title: "请填写完整信息",
        description: "所有字段都是必填的",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // 验证年龄是否为数字
    if (isNaN(Number(userInfo.age)) || Number(userInfo.age) <= 0) {
      toast({
        title: "年龄格式错误",
        description: "请输入有效的年龄数字",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // 通过验证，隐藏表单并开始评估
    setShowUserForm(false);
    
    toast({
      title: "信息已保存",
      description: `${userInfo.name}，欢迎参与机器人评估！`,
      duration: 3000,
    });
    
    console.log("用户信息已保存，表单隐藏状态:", showUserForm);
  };

  // 初始化: 随机选择机器人和问题
  useEffect(() => {
    // 随机选择机器人
    const randomRobots = getRandomRobots(ROBOTS_PER_ASSESSMENT);
    // 随机排序问题
    const shuffled = shuffleArray(ALL_QUESTIONS);
    
    setSession(prev => ({
      ...prev,
      selectedRobots: randomRobots,
      currentRobotIndex: 0,
      completedAssessments: []
    }));
    
    setShuffledQuestions(shuffled);
  }, []);

  // 当问题加载后初始化滑块值
  useEffect(() => {
    if (shuffledQuestions.length > 0) {
      setSliderValues(shuffledQuestions.map(() => INITIAL_SLIDER_VALUE));
    }
  }, [shuffledQuestions]);

  // 调试：显示选中的机器人
  useEffect(() => {
    if (session.selectedRobots.length > 0) {
      console.log("Selected robots:", session.selectedRobots.map(r => ({ id: r.id, name: r.name, path: r.filename })));
    }
  }, [session.selectedRobots]);

  // 获取当前机器人
  const currentRobot = session.selectedRobots[session.currentRobotIndex] || null;

  // 检查所有问题是否都已回答（滑块值是否改变）
  const checkAllQuestionsAnswered = () => {
    if (sliderValues.length === 0) return false;
    
    // 检查是否有任何滑块值仍然为初始值
    const unansweredQuestions = sliderValues.filter(value => value === INITIAL_SLIDER_VALUE);
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "评估未完成",
        description: `还有 ${unansweredQuestions.length} 道问题未评分，请完成所有问题后再继续。`,
        variant: "destructive",
        duration: 4000,
      });
      return false;
    }
    
    return true;
  };

  // 保存当前机器人评估并进入下一个
  const handleSaveAndNext = () => {
    if (!currentRobot || shuffledQuestions.length === 0 || sliderValues.length !== shuffledQuestions.length) {
      toast({
        title: "错误",
        description: "评估数据不完整，无法保存。",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // 检查是否所有问题都已回答
    if (!checkAllQuestionsAnswered()) {
      return;
    }

    const overallScore = calculateOverallScore(sliderValues);
    const currentAssessment: StoredRobotAssessment = {
      robotId: currentRobot.id,
      robotName: currentRobot.name,
      robotImageUrl: currentRobot.filename,
      timestamp: new Date().toISOString(),
      sliderValues: [...sliderValues],
      shuffledQuestionsSnapshot: [...shuffledQuestions],
      overallScore,
      // 添加用户信息到评估数据
      userName: userInfo.name,
      userAge: Number(userInfo.age),
      userGender: userInfo.gender,
      userMajor: userInfo.major
    };

    // 保存当前评估
    setSession(prev => ({
      ...prev,
      completedAssessments: [...prev.completedAssessments, currentAssessment],
      currentRobotIndex: prev.currentRobotIndex + 1
    }));

    // 重置滑块值为初始值
    setSliderValues(shuffledQuestions.map(() => INITIAL_SLIDER_VALUE));

    toast({
      title: "已保存",
      description: `已保存对${currentRobot.name}的评估，总分: ${overallScore}%`,
      duration: 3000,
    });
  };

  // 完成所有评估并导出
  const handleFinishAndExport = () => {
    // 检查是否有完成的评估
    if (session.completedAssessments.length === 0) {
      toast({
        title: "没有数据",
        description: "没有可导出的数据。请至少评估一个机器人。",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // 导出CSV
    const csvContent = generateCsvContent(session.completedAssessments);
    if (!csvContent) {
      toast({
        title: "导出失败",
        description: "生成CSV内容时发生错误。",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const filename = `robot_assessments_${userInfo.name}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csvContent, filename);

    toast({
      title: "导出成功",
      description: `已导出${session.completedAssessments.length}个机器人的评估数据。`,
      duration: 5000,
    });
  };

  // 所有机器人评估完成
  const isAllCompleted = session.currentRobotIndex >= session.selectedRobots.length;
  
  // 计算进度
  const completionPercentage = session.selectedRobots.length > 0
    ? Math.round((session.completedAssessments.length / session.selectedRobots.length) * 100)
    : 0;

  // 开发调试用：强制跳过表单（仅用于测试）
  useEffect(() => {
    // 注释下面这行以禁用自动跳过表单模式
    // setShowUserForm(false);
    console.log("当前表单显示状态:", showUserForm);
  }, []);

  // 渲染评估完成界面
  if (isAllCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
          <div className="container flex h-20 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                智视未来
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">评估完成</h1>
            <p className="text-muted-foreground mb-8 max-w-xl">
              感谢您完成所有机器人的评估。您已评估了 {session.selectedRobots.length} 个机器人，生成了总共 {Object.keys(session.completedAssessments[0]?.sliderValues || {}).length * session.completedAssessments.length} 个评分数据点。
            </p>
            
            <div className="w-full max-w-md space-y-4">
              {/* 第一步：导出评估数据 */}
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex gap-2 items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
                  导出评估数据
                </h3>
                <Button 
                  onClick={handleFinishAndExport} 
                  className="w-full py-5"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" /> 导出评估数据 (CSV)
                </Button>
              </div>
              
              {/* 第二步：上传到WPS表单 */}
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex gap-2 items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
                  上传CSV文件到WPS表单
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <span className="font-bold text-red-500">重要提示：</span> 请将导出的CSV文件上传至以下WPS表单
                </p>
                <a 
                  href="https://f.wps.cn/g/GTGsCwjw/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center py-5 px-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-base transition-colors"
                >
                  <Upload className="mr-2 h-5 w-5" /> 前往WPS表单上传数据
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <p className="mt-4 text-sm text-muted-foreground">
                  表单名称：【WPS表单】邀你填写「数据采集」
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full py-5 mt-4"
                onClick={() => setSession(prev => ({ ...prev, currentRobotIndex: 0 }))}
                disabled={!session.selectedRobots.length}
              >
                <Bot className="mr-2 h-5 w-5" /> 开始新的评估
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-6 border-t bg-card">
          <div className="container flex flex-col items-center justify-center gap-2 md:h-20 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              智视未来 &copy; {new Date().getFullYear()}. 保留所有权利。本平台采用<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" className="text-primary underline hover:no-underline ml-1" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0许可证</a>，禁止商业使用及创建衍生作品。
            </p>
          </div>
        </footer>
        
        {/* 测试按钮 - 跳转到结束界面 */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={handleSkipToEnd}
            variant="outline"
            size="sm"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <span className="flex items-center">
              <ChevronRight className="mr-1 h-4 w-4" />
              跳转到结束界面
            </span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container flex h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              智视未来
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        {showUserForm ? (
          // 用户信息表单与研究说明
          <div className="grid md:grid-cols-12 gap-6">
            <Card className="md:col-span-5 shadow-lg rounded-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-card-foreground/5">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-primary">
                      参与者信息
                    </CardTitle>
                    <CardDescription>
                      请先填写您的基本信息再开始评估
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">姓名</Label>
                  <Input 
                    id="username" 
                    placeholder="请输入您的姓名" 
                    value={userInfo.name}
                    onChange={(e) => handleUserInfoChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">年龄</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    placeholder="请输入您的年龄" 
                    value={userInfo.age}
                    onChange={(e) => handleUserInfoChange('age', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Select 
                    value={userInfo.gender} 
                    onValueChange={(value) => handleUserInfoChange('gender', value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="请选择您的性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                      <SelectItem value="不愿透露">不愿透露</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="major">专业</Label>
                  <Input 
                    id="major" 
                    placeholder="请输入您所学的专业" 
                    value={userInfo.major}
                    onChange={(e) => handleUserInfoChange('major', e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleUserInfoSubmit} 
                  className="w-full mt-6 py-5 text-base"
                >
                  开始评估
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-7 shadow-lg rounded-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-card-foreground/5">
                <div className="flex items-center">
                  <Info className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-primary">
                      关于本研究
                    </CardTitle>
                    <CardDescription>
                      机器人评估研究项目的背景与目的
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Brain className="h-10 w-10 text-primary/80 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">研究目标</h3>
                      <p className="text-muted-foreground">
                        本研究旨在通过人类对机器人的评估数据，分析人们如何认知和评价不同类型机器人的潜能。您的参与将帮助我们更好地理解人类-机器人交互的认知基础。
                      </p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="flex items-start space-x-4">
                    <Clipboard className="h-10 w-10 text-primary/80 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">评估流程</h3>
                      <p className="text-muted-foreground">
                        您将评估3个随机选择的机器人形象，每个机器人需要回答27个关于其各方面潜能的问题。请确保每个问题都经过认真思考后再作答。
                      </p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="flex items-start space-x-4">
                    <Activity className="h-10 w-10 text-primary/80 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">数据用途</h3>
                      <p className="text-muted-foreground">
                        您的评估数据将用于科学研究，帮助我们分析人类对机器人能力的认知模式，并可能为未来机器人设计提供洞见。所有数据将以匿名方式处理。
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/5 p-4 mt-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <strong>重要提示：</strong> 评估过程中请确保对每个问题都进行评分，未完成所有问题将无法进入下一个机器人的评估。完成所有机器人评估后，请务必导出并提交您的评估数据。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !isAllCompleted ? (
          // 评估界面
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {session.selectedRobots.length > 0 && (
              <RobotDisplay 
                robot={currentRobot} 
                currentIndex={session.currentRobotIndex}
                totalRobots={session.selectedRobots.length}
              />
            )}
            
            {shuffledQuestions.length > 0 && sliderValues.length === shuffledQuestions.length ? (
              <AssessmentPanel
                questions={shuffledQuestions}
                sliderValues={sliderValues}
                onSliderValuesChange={setSliderValues}
                robotsAssessedCount={session.completedAssessments.length}
                totalRobotsToAssess={session.selectedRobots.length}
                isAssessmentActive={!!currentRobot}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-card rounded-lg shadow-lg p-6">
                <p className="text-muted-foreground">正在加载评估问题...</p>
              </div>
            )}
          </div>
        ) : (
          // 评估完成界面
          <Card className="shadow-lg rounded-lg overflow-hidden mb-6">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-card-foreground/5">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-primary mr-3" />
                <div>
                  <CardTitle className="text-xl font-semibold text-primary">评估完成</CardTitle>
                  <CardDescription>
                    您已完成所有{session.selectedRobots.length}个机器人的评估
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center py-6">
                <Bot className="mx-auto h-16 w-16 text-accent mb-4" />
                <h2 className="text-2xl font-bold mb-2">感谢您的参与！</h2>
                <p className="text-muted-foreground">
                  您的评估对我们的研究非常有价值。请按照以下步骤完成数据提交。
                </p>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground p-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
                  导出评估数据
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  首先，您需要下载包含您评估结果的CSV文件。
                </p>
                <Button 
                  onClick={handleFinishAndExport} 
                  className="w-full py-5 text-base"
                >
                  <Download className="mr-2 h-5 w-5" /> 导出评估数据 (CSV)
                </Button>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground p-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
                  上传CSV文件到WPS表单
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <span className="font-bold text-red-500">重要：</span> 请勿关闭此页面！请将下载的CSV文件上传到以下WPS表单链接：
                </p>
                <a 
                  href="https://f.wps.cn/g/GTGsCwjw/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center py-5 px-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-md font-medium text-base transition-all shadow-md hover:shadow-lg"
                >
                  <Upload className="mr-2 h-5 w-5" /> 前往WPS表单上传数据 - https://f.wps.cn/g/GTGsCwjw/
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">重要提示</p>
                      <p className="mt-1 text-xs text-amber-700">
                        上传CSV文件是本次研究数据收集的最后一步，对于研究数据分析至关重要。请确保完成此步骤后再关闭页面。表单名称为：【WPS表单】邀你填写「数据采集」。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 添加额外的提示和按钮 */}
              <div className="mt-8 text-center">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <h3 className="text-red-700 font-bold text-lg mb-2">请勿跳过上传步骤！</h3>
                  <p className="text-red-600">为确保您的评估数据能够被收集和分析，请务必完成CSV文件的上传。</p>
                </div>
                
                <a 
                  href="https://f.wps.cn/g/GTGsCwjw/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center py-4 px-8 bg-red-600 text-white hover:bg-red-700 rounded-md font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="mr-2 h-6 w-6" /> 立即上传到WPS表单
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {!showUserForm && !isAllCompleted && (
          <Card className="mt-6 lg:mt-8 shadow-lg rounded-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-card-foreground/5">
              <div className="flex items-center">
                <PencilRuler className="h-7 w-7 text-primary mr-3" />
                <CardTitle className="text-xl font-semibold text-primary">操作控制</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>完成进度</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                
                <Button 
                  onClick={handleSaveAndNext} 
                  disabled={!currentRobot || shuffledQuestions.length === 0} 
                  className="w-full py-6 text-lg"
                >
                  保存并评估下一个机器人 <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mt-2">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-400">
                      请确保完成对所有27个问题的评分，否则无法进入下一个机器人的评估。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-6 border-t bg-card">
        <div className="container flex flex-col items-center justify-center gap-2 md:h-20 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            智视未来 &copy; {new Date().getFullYear()}. 保留所有权利。本平台采用<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" className="text-primary underline hover:no-underline ml-1" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0许可证</a>，禁止商业使用及创建衍生作品。
          </p>
        </div>
      </footer>
      
      {/* 测试按钮 - 跳转到结束界面 */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={handleSkipToEnd}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
        >
          <span className="flex items-center">
            <ChevronRight className="mr-1 h-4 w-4" />
            跳转到结束界面
          </span>
        </Button>
      </div>
    </div>
  );
}
