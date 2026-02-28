import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Play, RotateCcw, Star, Home, User, School, Sparkles, Trophy, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

// --- COMPONENTS ---
const CloudBackground = () => {
  const clouds = useMemo(() => [
    { id: 1, size: 120, top: '10%', duration: 25, delay: 0 },
    { id: 2, size: 180, top: '25%', duration: 35, delay: -10 },
    { id: 3, size: 100, top: '45%', duration: 20, delay: -5 },
    { id: 4, size: 200, top: '65%', duration: 45, delay: -20 },
    { id: 5, size: 140, top: '80%', duration: 30, delay: -15 },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-10]">
      {/* Brighter sky blue gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7DD3FC] via-[#BAE6FD] to-white opacity-60" />
      
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          initial={{ x: '-20%' }}
          animate={{ x: '120%' }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: "linear",
            delay: cloud.delay
          }}
          style={{
            position: 'absolute',
            top: cloud.top,
            fontSize: cloud.size,
            opacity: 0.9,
            filter: 'brightness(0) invert(1)', // Force white color, removed blur to keep it crisp
          }}
        >
          ☁️
        </motion.div>
      ))}
    </div>
  );
};

// --- CONSTANTS ---
const ASSETS = {
  // 소리 효과
  COIN_SOUND: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 
  SPEND_SOUND: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  POPUP_SOUND: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', 
  CERT_SOUND: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // 수료증 팡파르
  FAIL_SOUND: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // 실패 소리
  AVATARS: {
    JJANGI: { 
      id: 'jjangi', 
      name: '짱이', 
      emoji: '🦗', 
      desc: '오늘 즐겁게 쓰는 게 제일 좋은 소비왕' 
    },
    EONGI: { 
      id: 'eongi', 
      name: '엉이', 
      emoji: '🦉', 
      desc: '내일을 위해 씨앗을 심는 투자왕' 
    },
    RAMI: { 
      id: 'rami', 
      name: '람이', 
      emoji: '🐿️', 
      desc: '튼튼한 금고를 만드는 저축왕' 
    },
  },
  BOARD_EVENTS: [
    { type: 'income', label: '분리수거', amount: 900, grid: { col: 1, row: 1 } },
    { type: 'income', label: '동생 돌보기', amount: 1000, grid: { col: 2, row: 1 } },
    { type: 'income', label: '용돈', amount: 1400, grid: { col: 3, row: 1 } },
    { type: 'income', label: '안마하기', amount: 1100, grid: { col: 4, row: 1 } },
    { type: 'income', label: '방 청소하기', amount: 800, grid: { col: 4, row: 2 } },
    { type: 'income', label: '설거지', amount: 900, grid: { col: 4, row: 3 } },
    { type: 'income', label: '심부름', amount: 700, grid: { col: 4, row: 4 } },
    { type: 'income', label: '신발 정리', amount: 600, grid: { col: 3, row: 4 } },
    { type: 'income', label: '청소기 돌리기', amount: 1000, grid: { col: 2, row: 4 } },
    { type: 'income', label: '신발장 정리', amount: 1200, grid: { col: 1, row: 4 } },
    { type: 'income', label: '요리하기', amount: 800, grid: { col: 1, row: 3 } },
    { type: 'income', label: '화분에 물 주기', amount: 700, grid: { col: 1, row: 2 } },
  ]
};

const CHOICE_SITUATIONS = [
  {
    id: 1,
    title: "상황 1: [유행 vs 미래]",
    options: [
      { id: 'a', label: "요즘 가장 인기 많은 장난감을 사요!", cost: -3000, reward: 0, backText: "기분 최고! 오늘 하루가 정말 즐거워졌어요!", emoji: "🧸", category: "행복 소비" },
      { id: 'b', label: "시험 공부를 위해 예쁜 공책을 사요!", cost: -1500, reward: 4500, backText: "꿈을 위한 투자! 공부를 열심히 해서 장학금을 받았어요! (+4,500원)", emoji: "📓", category: "미래 투자" }
    ]
  },
  {
    id: 2,
    title: "상황 2: [달콤함 vs 인내]",
    options: [
      { id: 'a', label: "요즘 아주 핫한 두바이 쫀득 쿠키를 사요!", cost: -2000, reward: 0, backText: "달콤함 폭발! 맛있는 간식 덕분에 에너지가 충전됐어요!", emoji: "🍪", category: "행복 소비" },
      { id: 'b', label: "더 멋진 미래의 나를 위해 지금은 꾹 참아요!", cost: 0, reward: 6000, backText: "계획적인 습관! 인내심 덕분에 이자가 붙어 돈이 더 많아졌어요! (+6,000원)", emoji: "🧘", category: "성실 저축 & 나눔" }
    ]
  },
  {
    id: 3,
    title: "상황 3: [맛있는 음식 vs 경험]",
    options: [
      { id: 'a', label: "친구들과 화끈하고 맛있는 마라탕을 사 먹어요!", cost: -5000, reward: 0, backText: "매콤달콤 꿀맛! 친구들과 즐겁게 먹어서 기분이 좋아졌어요!", emoji: "🍜", category: "행복 소비" },
      { id: 'b', label: "지혜를 쌓기 위해 박물관 체험학습을 가요!", cost: -5000, reward: 5000, backText: "지식은 최고의 자산! 똑똑해진 덕분에 퀴즈 대회 상금을 탔어요! (+5,000원)", emoji: "🏛️", category: "미래 투자" }
    ]
  },
  {
    id: 4,
    title: "상황 4: [나눔 vs 즐거움]",
    options: [
      { id: 'a', label: "어려운 나라의 친구들을 위해 기부를 해요!", cost: -1000, reward: 8000, backText: "마음의 부자! 부모님이 좋은 일을 했다며 대견해하며 용돈을 주셨어요! (+8,000원)", emoji: "🤝", category: "성실 저축 & 나눔" },
      { id: 'b', label: "짜릿한 재미! 인형 뽑기 기계에서 인형을 뽑아요!", cost: -1500, reward: 0, backText: "두근두근 재미! 귀여운 인형을 얻어서 친구들에게 자랑했어요!", emoji: "🕹️", category: "행복 소비" }
    ]
  },
  {
    id: 5,
    title: "상황 5: [게임 vs 투자]",
    options: [
      { id: 'a', label: "내 캐릭터를 화려하게 꾸며줄 게임 스킨을 사요!", cost: -2000, reward: 0, backText: "패션 대장! 친구들이 내 모습을 보고 부러워하며 박수를 쳐요!", emoji: "👕", category: "행복 소비" },
      { id: 'b', label: "내가 좋아하는 게임 회사의 주인이 되어~", cost: -2000, reward: 5000, backText: "회사가 쑥쑥 성장! 투자 수익금으로 기분 좋은 소식이 왔어요! (+5,000원)", emoji: "📈", category: "미래 투자" }
    ]
  },
  {
    id: 6,
    title: "상황 6: [뜻밖의 행운] 주머니 속에서 우연히 5000원을 발견했다!",
    options: [
      { id: 'a', label: "편의점으로 달려가 좋아하는 간식과 장난감을 잔뜩 고른다!", cost: -3000, reward: 0, backText: "생각지도 못한 행운으로 얻는 깜짝 기쁨!", emoji: "🍭", category: "행복 소비" },
      { id: 'b', label: "은행에 저축해요.", cost: 0, reward: 5500, backText: "저축했더니 이자를 받았어요! (+500원)", emoji: "💰", category: "성실 저축 & 나눔" }
    ]
  },
  {
    id: 7,
    title: "상황 7: [세뱃돈의 기적] 설날에 세뱃돈으로 10,000원을 받았어요!",
    options: [
      { id: 'a', label: "00전자 주식을 사요.", cost: 0, reward: 15000, backText: "배당금을 받아 5,000원이 추가되었어요!", emoji: "📈", category: "미래 투자" },
      { id: 'b', label: "은행에 저축해요.", cost: 0, reward: 11000, backText: "이자를 받아 1,000원이 추가되었어요!", emoji: "🏦", category: "성실 저축 & 나눔" }
    ]
  }
];

const STORAGE_KEY = 'rich_school_data';

export default function App() {
  const [userName, setUserName] = useState('');
  const [userMoney, setUserMoney] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'avatar' | 'game' | 'choice' | 'accountBook' | 'result' | 'compound' | 'certificate'>('avatar');
  const [boardPosition, setBoardPosition] = useState(0);
  const [boardHistory, setBoardHistory] = useState<{ id: number, label: string, amount: number }[]>([]);

  const getStageInfo = () => {
    switch (currentScreen) {
      case 'avatar': return { step: '준비', title: '입학 준비' };
      case 'game': return { step: '1단계', title: '종잣돈 모으기' };
      case 'choice': return { step: '2단계', title: '선택의 갈림길' };
      case 'accountBook': return { step: '3단계', title: '용돈기입장 확인' };
      case 'result': return { step: '최종', title: '정체성 리포트' };
      case 'compound': return { step: '4단계', title: '복리 마법' };
      case 'certificate': return { step: '수료', title: '부자학교 수료' };
      default: return { step: '', title: '' };
    }
  };
  const stageInfo = getStageInfo();

  const [isRolling, setIsRolling] = useState(false);
  const [lastDice, setLastDice] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showGraduationPopup, setShowGraduationPopup] = useState(false);

  // 2단계 상태
  const [showChoiceWelcome, setShowChoiceWelcome] = useState(false);
  const [showChoiceEnd, setShowChoiceEnd] = useState(false);
  const [choiceStep, setChoiceStep] = useState(0);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [showStars, setShowStars] = useState(false);
  const [userChoices, setUserChoices] = useState<{ situationId: number, choiceId: string, label: string, cost: number, reward: number, category: string }[]>([]);
  const [diaryText, setDiaryText] = useState('');

  // 4단계 상태
  const [compoundYears, setCompoundYears] = useState(1);
  const [customRate, setCustomRate] = useState(0.02);
  const [showCompoundWelcome, setShowCompoundWelcome] = useState(false);
  const [showCompoundPopup, setShowCompoundPopup] = useState(false);

  // 퀴즈 상태
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [hoveredBlank, setHoveredBlank] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const blankRects = useRef<Record<string, { left: number, top: number, right: number, bottom: number }>>({});

  // 초기 데이터 로드 (로컬 스토리지 활용)
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userName) setUserName(parsed.userName);
        if (parsed.userMoney !== undefined) setUserMoney(parsed.userMoney);
        if (parsed.totalIncome !== undefined) setTotalIncome(parsed.totalIncome);
        if (parsed.totalExpense !== undefined) setTotalExpense(parsed.totalExpense);
        if (parsed.selectedAvatar) setSelectedAvatar(parsed.selectedAvatar);
        if (parsed.currentScreen) setCurrentScreen(parsed.currentScreen);
        if (parsed.boardPosition !== undefined) setBoardPosition(parsed.boardPosition);
        if (parsed.boardHistory) setBoardHistory(parsed.boardHistory);
        if (parsed.userChoices) setUserChoices(parsed.userChoices);
        if (parsed.diaryText) setDiaryText(parsed.diaryText);
        if (parsed.quizAnswers) setQuizAnswers(parsed.quizAnswers);
        if (parsed.quizCompleted !== undefined) setQuizCompleted(parsed.quizCompleted);
      } catch (e) {
        console.error('데이터 복구 실패:', e);
      }
    }
    console.log('앱이 로컬 모드로 시작되었습니다.');
  }, []);

  // 데이터 변경 시 로컬 스토리지 저장
  useEffect(() => {
    const dataToSave = {
      userName,
      userMoney,
      totalIncome,
      totalExpense,
      selectedAvatar,
      currentScreen,
      boardPosition,
      boardHistory,
      userChoices,
      diaryText,
      quizAnswers,
      quizCompleted
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [userName, userMoney, totalIncome, totalExpense, selectedAvatar, currentScreen, boardPosition, boardHistory, userChoices, diaryText, quizAnswers, quizCompleted]);

  // 소리 재생 함수
  const playSound = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('소리 재생 실패:', e));
  }, []);

  const handleQuizDrop = useCallback((blankId: string, word: string) => {
    playSound(ASSETS.COIN_SOUND);
    setQuizAnswers(prev => {
      const next = { ...prev, [blankId]: word };
      if (Object.keys(next).length === 3) {
        setQuizCompleted(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444']
        });
      }
      return next;
    });
  }, [playSound]);

  const downloadCertificate = useCallback(() => {
    if (certificateRef.current === null) return;
    
    toPng(certificateRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `부자학교_수료증_${userName || '어린이'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('수료증 다운로드 실패:', err);
      });
  }, [certificateRef, userName]);

  useEffect(() => {
    if (currentScreen === 'certificate') {
      playSound(ASSETS.CERT_SOUND);
    }
  }, [currentScreen, playSound]);

  // 데이터 저장 (로컬 모드)
  const saveData = useCallback(async (type: 'income' | 'expense', amount: number, description: string) => {
    // 로컬 상태만 업데이트 (GAS 연동 제거)
    console.log(`[Local Save] ${type}: ${amount} (${description})`);
  }, []);

  // 주사위 던지기 및 단계별 이동
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    const dice = Math.floor(Math.random() * 6) + 1;
    setLastDice(dice);

    // 주사위 굴리는 애니메이션 대기 후 이동 시작
    setTimeout(() => {
      let stepsRemaining = dice;
      let currentPos = boardPosition;

      const moveOneStep = () => {
        if (stepsRemaining > 0) {
          currentPos = (currentPos + 1) % ASSETS.BOARD_EVENTS.length;
          setBoardPosition(currentPos);
          stepsRemaining--;
          setTimeout(moveOneStep, 300); // 0.3초마다 한 칸씩 이동
        } else {
          // 최종 도착 시 이벤트 발생
          const event = ASSETS.BOARD_EVENTS[currentPos];
          
          // 수입 누적 및 저장
          if (event.amount > 0) {
            setTotalIncome(t => t + event.amount);
            saveData('income', event.amount, event.label);
          }
          
          setUserMoney(prev => {
            const newMoney = Math.max(0, prev + event.amount);
            playSound(ASSETS.COIN_SOUND);
            
            // 목표 달성 체크 (10,000원)
            if (newMoney >= 10000) {
              setTimeout(() => setShowGraduationPopup(true), 500);
            }
            
            return newMoney;
          });

          // 기록장에 추가
          setBoardHistory(prev => [{
            id: Date.now(),
            label: event.label,
            amount: event.amount
          }, ...prev]);

          setIsRolling(false);
        }
      };

      moveOneStep();
    }, 1000);
  };

  const getAvatarEmoji = (id: string | null) => {
    if (!id) return '🦗';
    const key = id.toUpperCase() as keyof typeof ASSETS.AVATARS;
    return ASSETS.AVATARS[key]?.emoji || '🦗';
  };

  const getAvatarName = (id: string | null) => {
    if (!id) return '';
    const key = id.toUpperCase() as keyof typeof ASSETS.AVATARS;
    return ASSETS.AVATARS[key]?.name || '';
  };

  const handleGoHome = () => {
    if (currentScreen === 'avatar') return;
    
    // 브라우저 환경에 따라 confirm 창이 차단될 수 있어 직접 초기화를 진행합니다.
    // 사용자가 실수로 누르는 것을 방지하려면 나중에 커스텀 모달을 구현할 수 있습니다.
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    
    // 모든 상태 초기화
    setUserName('');
    setUserMoney(0);
    setTotalIncome(0);
    setTotalExpense(0);
    setSelectedAvatar(null);
    setCurrentScreen('avatar');
    setBoardPosition(0);
    setBoardHistory([]);
    setIsRolling(false);
    setLastDice(0);
    setShowWelcomePopup(false);
    setShowGraduationPopup(false);
    setShowChoiceWelcome(false);
    setShowChoiceEnd(false);
    setChoiceStep(0);
    setFlippedCard(null);
    setShowStars(false);
    setUserChoices([]);
    setDiaryText('');
    setCompoundYears(1);
    setCustomRate(0.02);
    setShowCompoundWelcome(false);
    setShowCompoundPopup(false);
    setShowQuizPopup(false);
    setQuizAnswers({});
    setQuizCompleted(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-x-hidden">
      <CloudBackground />
      
      {/* 상단바 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
            title="홈으로 이동"
          >
            <span className="text-2xl">🏫</span>
            <h1 className="text-xl font-bold text-blue-600">
              복리의 부자학교
            </h1>
          </button>
          
          {/* 단계 표시기 */}
          <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            <span className="text-xs font-black text-blue-500 bg-white px-1.5 py-0.5 rounded border border-blue-200 uppercase">
              {stageInfo.step}
            </span>
            <span className="text-sm font-bold text-blue-700 whitespace-nowrap">
              {stageInfo.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="hidden sm:flex items-center gap-1 text-gray-600 font-medium mr-2">
              <User size={16} />
              {userName}님
            </div>
          )}
          <div className="bg-blue-100 px-4 py-2 rounded-full flex items-center gap-2 border-2 border-blue-200 shadow-sm relative">
            <Coins className="text-yellow-600" size={20} />
            <span className="font-bold text-blue-800">{userMoney.toLocaleString()}원</span>
          </div>
        </div>
      </header>

      <main className="mt-24 w-full max-w-5xl px-4 flex-1 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {currentScreen === 'avatar' && (
            <motion.div
              key="avatar-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12 w-full py-10"
            >
              {/* 히로 섹션 */}
              <div className="text-center space-y-4">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="inline-block p-4 bg-blue-100 rounded-[32px] text-5xl mb-2"
                >
                  🏫
                </motion.div>
                <h2 className="text-4xl font-black !text-black tracking-tight">
                  부자학교 입학을 환영해요!
                </h2>
                <p className="text-xl !text-black font-bold whitespace-nowrap">
                  이름을 입력하고 나의 소비 습관과 가장 닮은 캐릭터를 골라봅시다.
                </p>
              </div>

              {/* 이름 입력 섹션 */}
              <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-2xl border-4 border-blue-50 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10" />
                <label className="text-lg font-black text-blue-600 flex items-center gap-2 relative z-10">
                  <User size={20} />
                  나의 이름
                </label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="이름을 입력해주세요"
                  className="w-full px-6 py-4 rounded-2xl border-4 border-gray-50 focus:border-blue-400 outline-none transition-all text-xl font-bold bg-gray-50/50 relative z-10"
                />
              </div>
              
              {/* 아바타 선택 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {Object.values(ASSETS.AVATARS).map((avatar, index) => (
                  <motion.div
                    key={avatar.id}
                    initial={{ y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4 + index, 
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                    whileHover={{ scale: 1.05, y: -15, rotate: [0, -1, 1, 0] }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`cursor-pointer bg-white/80 backdrop-blur-md p-8 rounded-[48px] shadow-xl border-8 transition-all flex flex-col items-center text-center gap-6 relative ${
                      selectedAvatar === avatar.id 
                        ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100' 
                        : 'border-white hover:border-blue-100'
                    }`}
                  >
                    {selectedAvatar === avatar.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg z-20"
                      >
                        <Star fill="currentColor" size={24} />
                      </motion.div>
                    )}
                    
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-inner transition-colors ${
                      selectedAvatar === avatar.id ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      {avatar.emoji}
                    </div>

                    <div className="space-y-2">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black inline-block mb-1 whitespace-nowrap">
                        {avatar.id === 'jjangi' ? '소비왕' : avatar.id === 'eongi' ? '투자왕' : '저축왕'}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">{avatar.name}</h3>
                      <p className="text-gray-500 font-bold leading-tight px-2 whitespace-nowrap">{avatar.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                disabled={!selectedAvatar || !userName.trim()}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={selectedAvatar && userName.trim() ? {
                  backgroundColor: ["#2563eb", "#3b82f6", "#2563eb"],
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={async () => {
                  if (selectedAvatar && userName.trim()) {
                    setCurrentScreen('game');
                    setShowWelcomePopup(true);
                  }
                }}
                className={`mt-6 px-20 py-6 rounded-[32px] text-2xl font-black shadow-2xl transition-all border-b-8 relative overflow-hidden group ${
                  (selectedAvatar && userName.trim())
                    ? 'bg-blue-600 text-white border-blue-800' 
                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  입학하기! <Sparkles className="group-hover:animate-spin" />
                </span>
                {selectedAvatar && userName.trim() && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                )}
              </motion.button>
            </motion.div>
          )}

          {currentScreen === 'game' && (
            <motion.div
              key="game-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start relative pb-10"
            >
                {/* 메인 보드판 (7) */}
                <div className="flex-1 w-full flex flex-col items-center gap-8">
                  {/* 웰컴 팝업 */}
                  <AnimatePresence>
                    {showWelcomePopup && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ scale: 0.8, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 text-center space-y-6 border-4 border-blue-100"
                        >
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-blue-600 break-keep">
                              🎓 복리의 부자학교 입학을 환영합니다!
                            </h3>
                            <div className="h-1 w-20 bg-blue-100 mx-auto rounded-full" />
                          </div>
                          
                          <div className="text-gray-600 leading-relaxed space-y-4 text-lg text-left break-keep">
                            <p>
                              안녕하세요. 부자가 되기 위한 첫 번째 수업은 <strong className="text-blue-600">마법 눈덩이의 시작, 종잣돈 모으기!</strong>예요.
                            </p>
                            <p>
                              주사위를 던져 동네를 돌며 성실하게 돈을 모아보세요.
                            </p>
                            <p className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <strong className="text-blue-700">목표:</strong> 딱 10,000원을 모으면 이 단계를 졸업하고, 돈이 스스로 일하게 만드는 <strong className="text-blue-600">복리 마법</strong>을 배울 수 있어요!
                            </p>
                            <p className="font-bold text-gray-800 text-center">
                              "자, 함께 출발해 볼까요?"
                            </p>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowWelcomePopup(false)}
                            className="w-full py-4 bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-lg hover:bg-blue-600 transition-colors"
                          >
                            네, 알겠어요! 출발!
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 졸업 축하 팝업 */}
                  <AnimatePresence>
                    {showGraduationPopup && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                      >
                        <motion.div
                          initial={{ scale: 0.8, rotate: -5 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center space-y-8 border-8 border-yellow-400 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />
                          <div className="text-6xl">🎉</div>
                          <div className="space-y-2">
                            <h3 className="text-3xl font-black text-gray-900">
                              축하합니다! 🥳
                            </h3>
                            <p className="text-blue-600 font-bold text-xl">목표 금액 10,000원 달성!</p>
                          </div>
                          
                          <div className="text-gray-600 leading-relaxed text-lg space-y-4">
                            <p>대단해요! 성실하게 일해서 목표 금액 10,000원을 모두 모았어요.</p>
                            <p>하지만 진짜 부자가 되려면 돈을 버는 것만큼 <br/><span className="text-blue-600 font-bold">어떻게 사용하는지</span>가 더 중요하답니다.</p>
                            <p className="font-bold text-gray-800 text-center">"이제 [2단계: 선택의 갈림길]로 가서 <br/>여러분의 소중한 종잣돈을 지혜롭게 사용해 볼까요?"</p>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowGraduationPopup(false);
                              setCurrentScreen('choice');
                              setShowChoiceWelcome(true);
                            }}
                            className="w-full py-5 bg-yellow-400 text-yellow-900 rounded-2xl text-2xl font-black shadow-xl hover:bg-yellow-500 transition-colors"
                          >
                            다음 수업으로 가기!
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 보드판 그리드 */}
                  <div className="board-grid">
                    {ASSETS.BOARD_EVENTS.map((event, index) => (
                      <div
                        key={index}
                        className={`board-slot ${boardPosition === index ? 'active' : ''}`}
                        style={{ 
                          gridColumn: event.grid.col, 
                          gridRow: event.grid.row 
                        }}
                      >
                        <span className={`text-3xl font-black ${event.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {event.amount > 0 ? `+${event.amount}` : event.amount}
                        </span>
                        <span className="text-sm text-gray-500 font-bold mt-2">{event.label}</span>
                      </div>
                    ))}

                    {/* 중앙 영역 */}
                    <div className="board-center p-6 text-center space-y-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium">{userName}님의 현재 잔액</p>
                        <p className="text-4xl font-black text-blue-600 tracking-tight">
                          {userMoney.toLocaleString()}원
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <AnimatePresence mode="wait">
                            {isRolling ? (
                              <motion.div
                                key="rolling"
                                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.4, ease: "linear" }}
                                className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-blue-100"
                              >
                                🎲
                              </motion.div>
                            ) : (
                              <motion.div
                                key="dice-result"
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-4xl font-black text-blue-600 border-4 border-blue-500"
                              >
                                {lastDice || '?'}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <motion.button
                          whileHover={!isRolling && userMoney < 10000 ? { scale: 1.05 } : {}}
                          whileTap={!isRolling && userMoney < 10000 ? { scale: 0.95 } : {}}
                          disabled={isRolling || userMoney >= 10000}
                          onClick={rollDice}
                          className={`px-8 py-4 rounded-2xl text-xl font-bold shadow-xl flex items-center gap-3 transition-all ${
                            isRolling || userMoney >= 10000 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60' 
                              : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                          }`}
                        >
                          <Play fill="currentColor" size={24} />
                          {userMoney >= 10000 ? '목표 달성 완료!' : '주사위 던지기'}
                        </motion.button>
                      </div>
                    </div>

                    {/* 아바타 캐릭터 이동 */}
                    <motion.div
                      layout
                      transition={{ 
                        type: "spring", 
                        stiffness: 150, 
                        damping: 20,
                        mass: 0.8
                      }}
                      className="z-20 w-full h-full pointer-events-none flex items-center justify-center"
                      style={{
                        gridColumn: ASSETS.BOARD_EVENTS[boardPosition].grid.col,
                        gridRow: ASSETS.BOARD_EVENTS[boardPosition].grid.row,
                      }}
                    >
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-2xl bg-white text-3xl"
                      >
                        {getAvatarEmoji(selectedAvatar)}
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* 나의 용돈 기록장 사이드바 (3) */}
                <div className="w-full lg:w-[320px] flex flex-col h-[600px] mt-0 lg:mt-0">
                  <div className="bg-white rounded-t-[32px] p-6 border-x-4 border-t-4 border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      🧾 나의 용돈 기록장
                    </h3>
                  </div>
                  
                  <div className="flex-1 bg-white border-x-4 border-gray-100 overflow-y-auto p-4 space-y-3 relative receipt-shadow custom-scrollbar">
                    {/* 영수증 느낌의 점선 */}
                    <div className="absolute top-0 left-0 right-0 h-1 border-t-2 border-dashed border-gray-200" />
                    
                    <AnimatePresence initial={false}>
                      {boardHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                          <Coins size={40} />
                          <p className="font-bold">아직 기록이 없어요!</p>
                          <p className="text-xs">주사위를 던져보세요.</p>
                        </div>
                      ) : (
                        boardHistory.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                ⭐
                              </div>
                              <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                            </div>
                            <span className={`font-black text-sm ${item.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                              {item.amount > 0 ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()}원
                            </span>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 영수증 하단 톱니바퀴 모양 */}
                  <div className="h-6 bg-white border-x-4 border-gray-100 relative overflow-hidden rounded-b-[32px]">
                    <div className="absolute bottom-0 left-0 right-0 flex">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-6 h-6 bg-[#f0f9ff] rounded-full -mb-3" />
                      ))}
                    </div>
                  </div>
                </div>
            </motion.div>
          )}

          {currentScreen === 'choice' && (
            <motion.div
              key="choice-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-8 w-full max-w-4xl"
            >
              {/* 별 가루 애니메이션 */}
              {showStars && (
                <div className="fixed inset-0 pointer-events-none z-[150]">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 1, 
                        scale: 0,
                        x: window.innerWidth / 2, 
                        y: window.innerHeight / 2 
                      }}
                      animate={{ 
                        opacity: 0, 
                        scale: 1.5,
                        x: window.innerWidth / 2 + (Math.random() - 0.5) * 600,
                        y: window.innerHeight / 2 + (Math.random() - 0.5) * 600,
                        rotate: 360
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute text-yellow-400 text-3xl"
                    >
                      ⭐
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 2단계 시작 팝업 */}
              <AnimatePresence>
                {showChoiceWelcome && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center space-y-6 border-4 border-blue-100"
                    >
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-blue-600">
                          🎓 제2교시: 선택의 갈림길로 출발!
                        </h3>
                        <div className="h-1 w-20 bg-blue-100 mx-auto rounded-full" />
                      </div>
                      
                      <div className="text-gray-600 leading-relaxed space-y-4 text-lg text-left">
                        <p>이제 여러분이 성실하게 모은 종잣돈을 사용할 시간이에요.</p>
                        <p>이곳에서는 7가지 선택의 순간이 기다리고 있어요.</p>
                        <p>지금 당장의 행복을 고를까요? 아니면 미래의 더 큰 나를 위해 투자할까요?</p>
                        <p className="font-bold text-gray-800 text-center">"정답은 없어요! 여러분의 마음이 가는 대로 신중하게 선택해 보세요."</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowChoiceWelcome(false)}
                        className="w-full py-4 bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-lg hover:bg-blue-600 transition-colors"
                      >
                        모험 시작하기!
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 활동 종료 팝업 */}
              <AnimatePresence>
                {showChoiceEnd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center space-y-6 border-4 border-yellow-100"
                    >
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-yellow-600">
                          📜 모험의 기록이 저장되었습니다!
                        </h3>
                        <div className="h-1 w-20 bg-yellow-100 mx-auto rounded-full" />
                      </div>
                      
                      <div className="text-gray-600 leading-relaxed space-y-4 text-lg text-left">
                        <p>와우! 7번의 중요한 선택을 모두 마쳤군요.</p>
                        <p>여러분이 장난감을 샀을 때의 즐거움과 박물관을 갔을 때의 지혜가 모두 용돈 기입장에 적혔어요.</p>
                        <p className="font-bold text-gray-800 text-center">"이제 결과를 확인해 볼까요?"</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowChoiceEnd(false);
                          setCurrentScreen('accountBook');
                        }}
                        className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl text-xl font-bold shadow-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                      >
                        용돈기입장 확인하기 ➔
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 메인 활동: 카드 선택 */}
              {!showChoiceWelcome && !showChoiceEnd && (
                <div className="w-full flex flex-col items-center gap-12">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-gray-800">
                      {CHOICE_SITUATIONS[choiceStep].title}
                    </h2>
                    <p className="text-gray-500">둘 중 하나를 선택해 보세요!</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
                    {CHOICE_SITUATIONS[choiceStep].options.map((option) => (
                      <div 
                        key={option.id} 
                        className="perspective-1000 h-[300px] w-full cursor-pointer"
                        onClick={() => {
                          if (flippedCard) return;
                          setFlippedCard(option.id);
                          
                          // 돈 계산
                          const totalChange = option.cost + option.reward;
                          
                          // 선택 결과 반영 및 저장
                          const type = totalChange < 0 ? 'expense' : 'income';
                          const amount = Math.abs(totalChange);
                          const desc = `[${CHOICE_SITUATIONS[choiceStep].title}] ${option.label}`;
                          saveData(type, amount, desc);

                          setUserMoney(prev => Math.max(0, prev + totalChange));
                          
                          // 통계 누적
                          if (option.cost < 0) {
                            setTotalExpense(prev => prev + Math.abs(option.cost));
                          }
                          if (option.reward > 0) {
                            setTotalIncome(prev => prev + option.reward);
                          }

                          if (option.reward > 0) {
                            setShowStars(true);
                            playSound(ASSETS.COIN_SOUND);
                            setTimeout(() => setShowStars(false), 1500);
                          } else if (option.cost < 0) {
                            playSound(ASSETS.SPEND_SOUND);
                          }

                          // 선택 데이터 저장
                          setUserChoices(prev => [
                            ...prev,
                            {
                              situationId: CHOICE_SITUATIONS[choiceStep].id,
                              choiceId: option.id,
                              label: option.label,
                              cost: option.cost,
                              reward: option.reward,
                              category: option.category
                            }
                          ]);

                          // 다음 단계로 이동
                          setTimeout(() => {
                            if (choiceStep < CHOICE_SITUATIONS.length - 1) {
                              setChoiceStep(prev => prev + 1);
                              setFlippedCard(null);
                            } else {
                              setShowChoiceEnd(true);
                            }
                          }, 5000);
                        }}
                      >
                        <motion.div
                          animate={{ rotateY: flippedCard === option.id ? 180 : 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                          className="relative w-full h-full preserve-3d"
                        >
                          {/* 앞면 */}
                          <div className="absolute inset-0 backface-hidden bg-white rounded-[32px] shadow-xl border-4 border-blue-50 flex flex-col items-center justify-center p-6 gap-4">
                            <span className="text-6xl">{option.emoji}</span>
                            <h4 className="text-xl font-bold text-gray-800 text-center leading-tight">{option.label}</h4>
                            {CHOICE_SITUATIONS[choiceStep].id === 2 && option.id === 'b' ? (
                               <p className="text-blue-500 font-black text-xl">+0원</p>
                            ) : CHOICE_SITUATIONS[choiceStep].id === 6 && option.id === 'b' ? (
                               <p className="text-blue-500 font-black text-xl">+5,000원</p>
                            ) : CHOICE_SITUATIONS[choiceStep].id === 7 ? (
                               <p className="text-blue-500 font-black text-xl">+10,000원</p>
                            ) : option.cost !== 0 && (
                              <p className="text-red-500 font-black text-xl">
                                {option.cost.toLocaleString()}원
                              </p>
                            )}
                          </div>

                          {/* 뒷면 */}
                          <div 
                            className="absolute inset-0 backface-hidden bg-blue-500 rounded-[32px] shadow-xl border-4 border-blue-400 flex flex-col items-center justify-center p-6 gap-4 text-white rotate-y-180"
                          >
                            <span className="text-6xl">✨</span>
                            <h4 className="text-lg font-black text-center leading-snug">{option.backText}</h4>
                            {CHOICE_SITUATIONS[choiceStep].id === 6 && option.id === 'b' ? (
                              <p className="text-yellow-300 font-black text-2xl">+500원</p>
                            ) : CHOICE_SITUATIONS[choiceStep].id === 7 ? (
                              <p className="text-yellow-300 font-black text-2xl">
                                {option.id === 'a' ? '+5,000원' : '+1,000원'}
                              </p>
                            ) : option.reward > 0 && (
                              <p className="text-yellow-300 font-black text-2xl">
                                +{option.reward.toLocaleString()}원
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {CHOICE_SITUATIONS.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          i === choiceStep ? 'w-12 bg-blue-500' : 'w-3 bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === 'accountBook' && (
            <motion.div
              key="account-book-screen"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8 w-full max-w-4xl bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border-8 border-blue-50 relative overflow-hidden"
              style={{ transformOrigin: "left center" }}
            >
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50" />
              
              <div className="w-full flex flex-col md:flex-row justify-between items-center border-b-4 border-blue-100 pb-6 gap-4">
                <h2 className="text-3xl md:text-4xl font-black text-blue-600 flex items-center gap-3">
                  📖 {userName}님의 비밀 용돈기입장
                </h2>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                  최종 성장: {userMoney.toLocaleString()}원
                </div>
              </div>

              {/* 1. 통계 요약 (Dashboard) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 text-center">
                  <p className="text-sm font-bold text-green-600 mb-1">💰 총 수입</p>
                  <p className="text-2xl font-black text-green-700">{totalIncome.toLocaleString()}원</p>
                </div>
                <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 text-center">
                  <p className="text-sm font-bold text-red-600 mb-1">💸 총 지출</p>
                  <p className="text-2xl font-black text-red-700">{totalExpense.toLocaleString()}원</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 text-center">
                  <p className="text-sm font-bold text-blue-600 mb-1">📈 나의 성장</p>
                  <p className="text-2xl font-black text-blue-700">{userMoney.toLocaleString()}원</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {/* 2. 소비 카테고리 분석 */}
                <div className="bg-gray-50 p-8 rounded-[32px] border-2 border-gray-100 flex flex-col items-center gap-6">
                  <h3 className="text-xl font-black text-gray-800">어디에 가장 많이 썼을까?</h3>
                  <div className="flex gap-6 items-end h-40 w-full justify-center px-4">
                    {[
                      { label: '행복 소비', color: 'bg-pink-400', key: '행복 소비' },
                      { label: '미래 투자', color: 'bg-blue-400', key: '미래 투자' },
                      { label: '성실 저축 & 나눔', color: 'bg-yellow-400', key: '성실 저축 & 나눔' }
                    ].map((cat) => {
                      const score = userChoices
                        .filter(c => c.category === cat.key)
                        .reduce((acc, curr) => acc + Math.abs(curr.cost) + curr.reward, 0);
                      
                      const maxScore = Math.max(...['행복 소비', '미래 투자', '성실 저축 & 나눔'].map(k => 
                        userChoices.filter(c => c.category === k).reduce((acc, curr) => acc + Math.abs(curr.cost) + curr.reward, 0)
                      )) || 1;
                      
                      const height = Math.max(10, (score / maxScore) * 120);
                      return (
                        <div key={cat.label} className="flex flex-col items-center gap-2 flex-1">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height }}
                            className={`w-full max-w-[40px] ${cat.color} rounded-t-xl shadow-md`}
                          />
                          <span className="text-[10px] md:text-xs font-bold text-gray-500 text-center leading-tight">{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    {userChoices.filter(c => c.category === '미래 투자').length >= 2 
                      ? "미래를 준비하는 멋진 투자자시군요!" 
                      : "지금의 행복도 좋지만, 조금 더 저축해보는 건 어떨까요?"}
                  </p>
                </div>

                {/* 3. 상세 내역 리스트 (영수증 스타일) */}
                <div className="bg-white p-6 rounded-[32px] border-4 border-dashed border-gray-200 flex flex-col gap-4">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    🧾 상세 영수증
                  </h3>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {userChoices.map((choice, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2 text-sm">
                        <div>
                          <p className="font-bold text-gray-700">{choice.label}</p>
                          <p className="text-[10px] text-gray-400">{choice.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">{choice.cost.toLocaleString()}원</p>
                          {choice.reward > 0 && <p className="text-[10px] text-blue-500">보너스 +{choice.reward.toLocaleString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. 메타인지 질문 (한 줄 일기) */}
              <div className="w-full bg-yellow-50 p-8 rounded-[32px] border-4 border-yellow-100 space-y-4">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  ✍️ 오늘의 경제 일기
                </h3>
                <p className="text-gray-600 font-medium">가장 기억에 남는 선택은 무엇인가요? 그 이유는?</p>
                <textarea 
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="여기에 여러분의 생각을 적어주세요..."
                  className="w-full h-24 p-4 rounded-2xl border-2 border-yellow-200 focus:border-yellow-400 outline-none transition-all resize-none text-gray-700"
                />
              </div>

              {/* 5. 최종 전환 버튼 */}
              <AnimatePresence>
                {diaryText.trim().length > 5 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      boxShadow: ["0px 0px 0px rgba(234, 179, 8, 0)", "0px 0px 20px rgba(234, 179, 8, 0.6)", "0px 0px 0px rgba(234, 179, 8, 0)"]
                    }}
                    transition={{ 
                      boxShadow: { repeat: Infinity, duration: 2 },
                      default: { type: "spring", stiffness: 260, damping: 20 }
                    }}
                    onClick={() => {
                      setCurrentScreen('result');
                    }}
                    className="w-full py-6 bg-yellow-400 text-yellow-900 rounded-3xl text-2xl font-black shadow-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-3"
                  >
                    나의 진짜 정체성 확인하기 ✨
                  </motion.button>
                )}
              </AnimatePresence>
              
              {!diaryText.trim().length || diaryText.trim().length <= 5 ? (
                <p className="text-gray-400 text-sm animate-pulse">일기를 6글자 이상 쓰면 정체성을 확인할 수 있어요!</p>
              ) : null}
            </motion.div>
          )}

          {currentScreen === 'result' && (
            <motion.div
              key="result-screen"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-4xl relative z-10"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-blue-600">📊 나의 경제 정체성 리포트</h2>
                <p className="text-gray-500 text-lg">{userName}님의 선택을 분석한 결과예요!</p>
              </div>

              <div className="w-full bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border-8 border-blue-100 flex flex-col gap-12">
                {/* 1. 데이터 시각화 (막대 그래프) */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-gray-800 text-center">나의 경제 활동 점수</h3>
                  <div className="flex justify-around items-end h-64 w-full px-4 border-b-4 border-gray-100 pb-2">
                    {[
                      { label: '행복 소비', color: 'bg-pink-400', key: '행복 소비', emoji: '🛍️' },
                      { label: '미래 투자', color: 'bg-blue-400', key: '미래 투자', emoji: '🚀' },
                      { label: '성실 저축 & 나눔', color: 'bg-yellow-400', key: '성실 저축 & 나눔', emoji: '🍯' }
                    ].map((cat) => {
                      // 점수 계산: 해당 카테고리의 절대값 비용 + 보상
                      const score = userChoices
                        .filter(c => c.category === cat.key)
                        .reduce((acc, curr) => acc + Math.abs(curr.cost) + curr.reward, 0);
                      
                      // 최대 점수 대비 비율 (최소 높이 20px 보장)
                      const maxScore = Math.max(...['행복 소비', '미래 투자', '성실 저축 & 나눔'].map(k => 
                        userChoices.filter(c => c.category === k).reduce((acc, curr) => acc + Math.abs(curr.cost) + curr.reward, 0)
                      )) || 1;
                      
                      const height = Math.max(20, (score / maxScore) * 200);

                      return (
                        <div key={cat.label} className="flex flex-col items-center gap-4 flex-1">
                          <div className="text-xs font-bold text-gray-400">{score.toLocaleString()}</div>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                            className={`w-full max-w-[60px] ${cat.color} rounded-t-2xl shadow-lg relative group`}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                              {cat.emoji}
                            </div>
                          </motion.div>
                          <span className="text-xs md:text-sm font-black text-gray-600 text-center leading-tight h-10 flex items-center">
                            {cat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 정체성 분석 및 메시지 */}
                {(() => {
                  const categories = ['행복 소비', '미래 투자', '성실 저축 & 나눔'];
                  const scores = categories.map(k => ({
                    key: k,
                    score: userChoices.filter(c => c.category === k).reduce((acc, curr) => acc + Math.abs(curr.cost) + curr.reward, 0)
                  }));
                  const topCategory = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current).key;
                  
                  let resultData = {
                    title: "",
                    name: "",
                    emoji: "",
                    msg: "",
                    id: ""
                  };

                  if (topCategory === '행복 소비') {
                    resultData = {
                      title: "에너지 넘치는 소비왕",
                      name: "짱이형",
                      emoji: "🦗",
                      msg: "지금 이 순간의 행복을 아주 소중하게 생각하는 친구군요! 신나게 쓴 만큼 오늘 하루도 즐거웠나요? 나중에 더 큰 행복을 위해 '참기' 마법도 조금씩 연습해봐요!",
                      id: "jjangi"
                    };
                  } else if (topCategory === '미래 투자') {
                    resultData = {
                      title: "똑똑한 미래 설계자",
                      name: "엉이형",
                      emoji: "🦉",
                      msg: "멀리 내다보는 눈을 가졌네요! 나를 성장시키는 일에 돈을 쓸 줄 아는 당신은 진정한 투자왕이에요. 여러분의 파란색 점수는 잠시 후 '복리 마법'을 만나 엄청나게 커질 거예요!",
                      id: "eongi"
                    };
                  } else {
                    resultData = {
                      title: "든든하고 따뜻한 저축왕",
                      name: "람이형",
                      emoji: "🐿️",
                      msg: "와! 튼튼한 금고에 돈을 차곡차곡 모으고, 남을 돕는 따뜻한 마음까지 가졌군요. 성실하게 모은 돈은 절대 배신하지 않아요. 여러분은 주변을 행복하게 만드는 따뜻한 부자가 될 거예요!",
                      id: "rami"
                    };
                  }

                  return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000 fill-mode-both">
                      <div className="bg-blue-50 p-8 rounded-[32px] border-4 border-blue-100 text-center space-y-4">
                        <div className="text-7xl">{resultData.emoji}</div>
                        <div className="space-y-1">
                          <p className="text-blue-600 font-bold">[{resultData.title}, {resultData.name}]</p>
                          <h4 className="text-3xl font-black text-gray-900">{userName}님은 {resultData.name} 스타일!</h4>
                        </div>
                        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                          {resultData.msg}
                        </p>
                      </div>

                      {/* 3. 메타인지 비교 (반전 포인트) */}
                      <div className="text-center p-6 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200">
                        <p className="text-gray-700 font-medium">
                          💡 <span className="font-black">반전 포인트!</span> <br/>
                          {selectedAvatar === resultData.id ? (
                            `와! 처음 선택한 아바타(${getAvatarName(selectedAvatar)})와 실제 행동이 똑같아요! 자신을 아주 잘 알고 있군요!`
                          ) : (
                            `당신은 처음엔 스스로를 ${getAvatarName(selectedAvatar)}라고 생각했지만, 실제 행동은 누구보다 ${resultData.title}인 ${resultData.name} 스타일이었네요!`
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. 다음 단계 버튼 및 되돌아가기 */}
                <div className="flex flex-col gap-4 w-full">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const futureInvestmentCount = userChoices.filter(c => c.category === '미래 투자').length;
                      const initialRate = 0.02 + (futureInvestmentCount * 0.015);
                      setCustomRate(initialRate);
                      setCompoundYears(1);
                      setShowCompoundWelcome(true);
                      setCurrentScreen('compound');
                    }}
                    className="w-full py-6 bg-blue-600 text-white rounded-3xl text-2xl font-black shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                  >
                    다음: 복리 마법 부리러 가기 ➔
                  </motion.button>
                  
                  <button 
                    onClick={() => setCurrentScreen('accountBook')}
                    className="text-gray-400 font-bold hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    ⬅️ 용돈기입장 다시 확인하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'compound' && (
            <motion.div
              key="compound-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8 w-full max-w-5xl bg-gradient-to-b from-blue-50 to-white p-6 md:p-10 rounded-[40px] shadow-2xl border-8 border-white relative overflow-hidden"
            >
              {/* 눈 내리는 배경 장식 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, 800],
                      x: [0, (Math.random() - 0.5) * 100]
                    }}
                    transition={{ 
                      duration: 5 + Math.random() * 5, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: Math.random() * 5
                    }}
                    className="absolute text-blue-200"
                    style={{ left: `${Math.random() * 100}%`, top: -20 }}
                  >
                    ❄️
                  </motion.div>
                ))}
              </div>

              <div className="text-center space-y-2 relative z-10">
                <h2 className="text-4xl font-black text-blue-600 flex items-center justify-center gap-3">
                  <Sparkles className="text-yellow-400" /> 복리의 마법 체험하기
                </h2>
                <p className="text-gray-600 text-lg font-medium">
                  수익률과 시간이 만나면 어떤 마법이 일어날까요? 직접 조절해 보세요!
                </p>
              </div>

              {/* 복리 계산 및 시뮬레이션 로직 */}
              {(() => {
                const pv = userMoney;
                const rateShadow = 0.02; // 평범한 저축 (2%)
                const rateMain = customRate; // 사용자가 조절하는 수익률
                
                const fvShadow = pv * Math.pow(1 + rateShadow, compoundYears);
                const fvMain = pv * Math.pow(1 + rateMain, compoundYears);

                // 진행도 (0 ~ 1) - 시간 기준
                const progress = (compoundYears - 1) / 29;
                
                // 시각적 스케일 계산 (더 작게 시작하고 캡을 씌움)
                const getScale = (fv: number, pv: number) => {
                  const ratio = fv / pv;
                  // 로그 스케일을 사용하여 너무 커지는 것 방지
                  return 0.8 + Math.log10(ratio) * 1.2;
                };

                const scaleShadow = getScale(fvShadow, pv);
                const scaleMain = getScale(fvMain, pv);

                // 격차(Gap) 계산 - 수평 위치 제어
                // 기본적으로 progress에 따라 0% -> 75% 이동
                // 수익률 차이에 따라 추가 보너스 거리 부여 (최대 90%까지)
                const basePos = progress * 70;
                const bonusPos = progress * (rateMain - rateShadow) * 150;
                
                const xOffsetShadow = basePos;
                const xOffsetMain = Math.min(90, basePos + bonusPos);

                return (
                  <div className="w-full space-y-10 relative z-10">
                    {/* 시뮬레이션 트랙 영역 */}
                    <div className="relative h-[400px] bg-blue-50/50 rounded-[40px] border-4 border-white shadow-inner overflow-hidden flex items-end pb-20 px-10">
                      {/* 지면 */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-100 to-transparent" />
                      
                      {/* 피니시 라인 */}
                      <div className="absolute right-10 top-0 bottom-0 w-1 border-r-4 border-dashed border-blue-200 opacity-30" />

                      {/* 1. 그림자 눈덩이 (Shadow Snowball) */}
                      <motion.div
                        animate={{ 
                          left: `${xOffsetShadow}%`,
                        }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        className="absolute bottom-20 flex flex-col items-center z-10"
                      >
                        {/* 라벨 (스케일 영향 안 받음) */}
                        <div className="absolute -top-12 whitespace-nowrap text-center opacity-60">
                          <p className="text-[10px] font-bold text-gray-400">평범한 저축 (2%)</p>
                          <p className="text-xs font-black text-gray-500">{Math.floor(fvShadow).toLocaleString()}원</p>
                        </div>
                        {/* 눈덩이 본체 (스케일 적용) */}
                        <motion.div 
                          animate={{ 
                            scale: scaleShadow,
                            rotate: compoundYears * 40,
                            opacity: 0.4
                          }}
                          className="w-12 h-12 bg-gray-200 rounded-full border-2 border-gray-300 flex items-center justify-center text-2xl grayscale"
                        >
                          ⚪
                        </motion.div>
                      </motion.div>

                      {/* 2. 메인 눈덩이 (Main Snowball) */}
                      <motion.div
                        animate={{ 
                          left: `${xOffsetMain}%`,
                        }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        className="absolute bottom-20 flex flex-col items-center z-20"
                      >
                        {/* 눈덩이 본체 (스케일 적용) */}
                        <motion.div
                          animate={{ 
                            scale: scaleMain
                          }}
                          className="relative z-10"
                        >
                          {/* 황금빛 오라 */}
                          <motion.div
                            animate={{ 
                              scale: [1, 1.3, 1],
                              opacity: [0.2, 0.5, 0.2]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-[-15px] bg-yellow-300/40 blur-2xl rounded-full"
                          />
                          <motion.div 
                            animate={{ rotate: compoundYears * 60 }}
                            className="w-16 h-16 bg-white rounded-full shadow-2xl border-4 border-blue-400 flex items-center justify-center text-4xl relative z-10"
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-blue-400/10">✨</div>
                            ⚪
                          </motion.div>
                          
                          {/* 반짝이는 입자 */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="absolute inset-[-20px] pointer-events-none"
                          >
                            <Sparkles className="text-yellow-400 absolute top-0 left-1/2 -translate-x-1/2" size={20} />
                            <Sparkles className="text-blue-400 absolute bottom-0 left-1/2 -translate-x-1/2" size={16} />
                          </motion.div>
                        </motion.div>

                        {/* 라벨 (스케일 영향 안 받음, 눈덩이보다 위에 위치하도록 z-index 부여 및 위치 조정) */}
                        <div className="absolute -top-28 whitespace-nowrap text-center z-30 pointer-events-none">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold mb-1 shadow-lg mx-auto w-fit">
                            나의 결과 ({(rateMain * 100).toFixed(1)}%)
                          </div>
                          <motion.p 
                            key={fvMain}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-black text-blue-600 drop-shadow-sm"
                          >
                            {Math.floor(fvMain).toLocaleString()}원
                          </motion.p>
                        </div>
                      </motion.div>

                      {/* 격차(Gap) 표시선 */}
                      {compoundYears > 5 && xOffsetMain > xOffsetShadow && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute bottom-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent z-0"
                          style={{ 
                            left: `calc(${xOffsetShadow}% + 30px)`, 
                            width: `calc(${xOffsetMain - xOffsetShadow}% + 10px)` 
                          }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-orange-500 bg-white px-2 py-0.5 rounded-full border border-orange-200 shadow-sm">
                            격차: +{Math.floor(fvMain - fvShadow).toLocaleString()}원
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* 컨트롤 패널 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 1. 시간 슬라이더 */}
                      <div className="bg-white p-6 rounded-[32px] shadow-lg border-2 border-blue-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-black">🕒</div>
                            <span className="font-black text-gray-700">시간 여행</span>
                          </div>
                          <span className="text-blue-600 font-black">{compoundYears}년 후</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="30"
                          value={compoundYears}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCompoundYears(val);
                            if (val === 15 && !showCompoundPopup) setShowCompoundPopup(true);
                          }}
                          className="w-full h-4 bg-blue-50 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-gray-300">
                          <span>1년</span>
                          <span>15년</span>
                          <span>30년</span>
                        </div>
                      </div>

                      {/* 2. 수익률 슬라이더 */}
                      <div className="bg-white p-6 rounded-[32px] shadow-lg border-2 border-orange-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-black">📈</div>
                            <span className="font-black text-gray-700">수익률 조절</span>
                          </div>
                          <span className="text-orange-500 font-black">{(customRate * 100).toFixed(1)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="200" // 0% ~ 20%
                          value={customRate * 1000}
                          onChange={(e) => {
                            setCustomRate(parseInt(e.target.value) / 1000);
                          }}
                          className="w-full h-4 bg-orange-50 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-gray-300">
                          <span>0%</span>
                          <span>10%</span>
                          <span>20%</span>
                        </div>
                      </div>
                    </div>

                    {/* 시작 안내 팝업 */}
                    <AnimatePresence>
                      {showCompoundWelcome && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-white p-10 rounded-[40px] shadow-2xl border-8 border-blue-400 text-center space-y-8 max-w-lg mt-20"
                          >
                            <div className="space-y-2">
                              <h3 className="text-xl font-black text-blue-500">제4교시</h3>
                              <h2 className="text-3xl font-black text-gray-900 leading-tight">
                                복리의 마법, <br/>눈덩이를 굴려라!
                              </h2>
                            </div>
                            
                            <div className="space-y-4 text-gray-600 font-bold leading-relaxed">
                              <p>
                                드디어 기다리던 시간이에요! 여러분이 신중하게 선택하며 모은 소중한 돈이 이제 <span className="text-blue-600">복리의 마법</span>을 만날 시간입니다.
                              </p>
                              <p>
                                여러분이 투자한 미래의 씨앗이 30년 뒤에 얼마나 큰 산이 되어 돌아올까요? 시간이 흐를수록 돈이 스스로 일하며 눈덩이처럼 커지는 광경을 직접 확인해 보세요.
                              </p>
                              <p className="text-blue-500 text-lg">
                                "준비됐나요? 이제 시간 여행 슬라이더를 밀어 마법을 시작해 보세요!"
                              </p>
                            </div>

                            <button 
                              onClick={() => setShowCompoundWelcome(false)}
                              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-blue-700 transition-colors"
                            >
                              마법 시작하기! ✨
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* 칭찬 팝업 */}
                    <AnimatePresence>
                      {showCompoundPopup && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-8 rounded-[40px] shadow-2xl border-8 border-yellow-400 text-center space-y-6 max-w-sm"
                        >
                          <div className="text-6xl">🚀</div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">격차가 보이시나요?</h3>
                            <p className="font-bold text-gray-600 leading-relaxed">
                              수익률이 조금만 더 높아도 <br/>
                              시간이 흐를수록 <span className="text-blue-600">엄청난 차이</span>가 생겨요! <br/>
                              "이것이 바로 복리의 마법입니다."
                            </p>
                          </div>
                          <button 
                            onClick={() => setShowCompoundPopup(false)}
                            className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg shadow-lg hover:bg-yellow-500 transition-colors"
                          >
                            시뮬레이션 계속하기! 🏁
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 최종 버튼 */}
                    {compoundYears === 30 && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-6 pt-6"
                      >
                        <div className="bg-blue-600/5 p-6 rounded-[32px] border-2 border-blue-100 text-center w-full">
                          <p className="text-gray-500 font-bold mb-2">30년 후, 당신의 선택은...</p>
                          <p className="text-4xl font-black text-blue-600">
                            {Math.floor(fvMain).toLocaleString()}원
                          </p>
                          <p className="text-lg text-gray-600 mt-2 font-bold">
                            평범한 저축보다 <span className="text-orange-500 font-black">{(((fvMain - fvShadow) / fvShadow) * 100).toFixed(0)}%</span>나 더 많이 모았어요!
                          </p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setShowQuizPopup(true);
                          }}
                          className="w-full py-8 bg-blue-600 text-white rounded-[32px] text-3xl font-black shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-4 border-b-8 border-blue-800"
                        >
                          복리의 마법 정리하기 🎓
                        </motion.button>
                      </motion.div>
                    )}

                    {/* 드래그 앤 드롭 퀴즈 팝업 */}
                    <AnimatePresence>
                      {showQuizPopup && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="bg-white w-full max-w-6xl p-6 md:p-8 rounded-[50px] shadow-2xl border-[12px] border-blue-400 relative overflow-hidden"
                          >
                            {/* 배경 장식 */}
                            <div className="absolute top-0 right-0 p-6 opacity-10 text-7xl pointer-events-none">🎓</div>
                            <div className="absolute bottom-0 left-0 p-6 opacity-10 text-7xl pointer-events-none">💰</div>

                            <div className="text-center space-y-6 relative z-10">
                              <div className="space-y-2">
                                <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">🎓 복리의 마법 정리하기!</h3>
                                <p className="text-blue-500 font-bold text-lg md:text-xl">단어를 끌어다 놓거나, 클릭해서 빈칸을 채워보세요!</p>
                              </div>

                              <div className="space-y-4 py-2 text-left w-fit mx-auto">
                                {[
                                  { id: 'blank1', text: '복리의 마법이 일어나려면 충분한', suffix: '이 필요해요.', answer: '시간' },
                                  { id: 'blank2', text: '눈덩이를 더 빨리 키우고 싶다면 높은', suffix: '이 중요해요.', answer: '수익률' },
                                  { id: 'blank3', text: '이 두 가지가 만나면 마법처럼 불어나는', suffix: '를 볼 수 있어요!', answer: '눈덩이' },
                                ].map((q) => (
                                  <div key={q.id} className="flex items-center gap-3 text-lg md:text-2xl font-bold text-gray-700 whitespace-nowrap">
                                    <span className="shrink-0">{q.text}</span>
                                    <button 
                                      id={q.id}
                                      onClick={() => {
                                        if (selectedWord && !quizAnswers[q.id]) {
                                          if (q.answer === selectedWord) {
                                            handleQuizDrop(q.id, selectedWord);
                                            setSelectedWord(null);
                                          } else {
                                            setSelectedWord(null);
                                            playSound(ASSETS.FAIL_SOUND);
                                          }
                                        }
                                      }}
                                      className={`min-w-[120px] md:min-w-[140px] h-[50px] md:h-[64px] border-4 border-dashed rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                                        quizAnswers[q.id] 
                                          ? 'bg-blue-600 border-blue-700 text-white border-solid shadow-lg scale-105' 
                                          : selectedWord 
                                            ? 'bg-yellow-50 border-yellow-400 animate-pulse cursor-pointer'
                                            : hoveredBlank === q.id
                                              ? 'bg-blue-50 border-blue-400 scale-105'
                                              : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      {quizAnswers[q.id] ? (
                                        <motion.div
                                          layoutId={`word-${quizAnswers[q.id]}`}
                                          className="font-black text-white text-2xl md:text-3xl"
                                        >
                                          {quizAnswers[q.id]}
                                        </motion.div>
                                      ) : (
                                        <span className="text-gray-300 text-xs md:text-base font-bold">여기를 클릭!</span>
                                      )}
                                    </button>
                                    <span className="shrink-0">{q.suffix}</span>
                                  </div>
                                ))}
                              </div>

                              {!quizCompleted ? (
                                <div className="bg-blue-50/50 p-6 md:p-8 rounded-[40px] border-4 border-white shadow-inner">
                                  <p className="text-base md:text-lg text-blue-600 mb-4 font-black flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 md:w-6 md:h-6" /> 아래 단어들을 빈칸으로 옮겨주세요!
                                  </p>
                                  <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
                                    {['시간', '수익률', '눈덩이'].filter(k => !Object.values(quizAnswers).includes(k)).map((word) => (
                                      <motion.div
                                        key={word}
                                        layoutId={`word-${word}`}
                                        drag
                                        dragSnapToOrigin={true}
                                        dragMomentum={false}
                                        onDragStart={() => {
                                          setSelectedWord(word);
                                          // 드래그 시작 시 빈칸들의 위치를 미리 계산하여 성능 최적화
                                          const rects: Record<string, any> = {};
                                          ['blank1', 'blank2', 'blank3'].forEach(id => {
                                            const el = document.getElementById(id);
                                            if (el) {
                                              const r = el.getBoundingClientRect();
                                              rects[id] = {
                                                left: r.left + window.scrollX,
                                                top: r.top + window.scrollY,
                                                right: r.right + window.scrollX,
                                                bottom: r.bottom + window.scrollY
                                              };
                                            }
                                          });
                                          blankRects.current = rects;
                                        }}
                                        onDrag={(e, info) => {
                                          const { x, y } = info.point;
                                          let found = null;
                                          
                                          for (const id in blankRects.current) {
                                            if (quizAnswers[id]) continue;
                                            const rect = blankRects.current[id];
                                            const buffer = 40;
                                            if (x >= rect.left - buffer && x <= rect.right + buffer && 
                                                y >= rect.top - buffer && y <= rect.bottom + buffer) {
                                              found = id;
                                              break;
                                            }
                                          }
                                          if (hoveredBlank !== found) setHoveredBlank(found);
                                        }}
                                        onDragEnd={(e, info) => {
                                          const { x, y } = info.point;
                                          let droppedOn = null;
                                          
                                          for (const id in blankRects.current) {
                                            if (quizAnswers[id]) continue;
                                            const rect = blankRects.current[id];
                                            const buffer = 60;
                                            if (x >= rect.left - buffer && x <= rect.right + buffer && 
                                                y >= rect.top - buffer && y <= rect.bottom + buffer) {
                                              droppedOn = id;
                                              break;
                                            }
                                          }

                                          if (droppedOn) {
                                            const target = [
                                              { id: 'blank1', answer: '시간' },
                                              { id: 'blank2', answer: '수익률' },
                                              { id: 'blank3', answer: '눈덩이' }
                                            ].find(b => b.id === droppedOn);

                                            if (target && target.answer === word) {
                                              handleQuizDrop(droppedOn, word);
                                            } else {
                                              playSound(ASSETS.FAIL_SOUND);
                                            }
                                          }
                                          setHoveredBlank(null);
                                          setSelectedWord(null);
                                          blankRects.current = {};
                                        }}
                                        onClick={() => setSelectedWord(prev => prev === word ? null : word)}
                                        whileHover={{ scale: 1.1, rotate: 2 }}
                                        whileDrag={{ scale: 1.1, zIndex: 100, rotate: 0 }}
                                        className={`px-6 md:px-10 py-3 md:py-5 rounded-3xl font-black text-xl md:text-3xl shadow-2xl cursor-grab active:cursor-grabbing border-4 transition-all ${
                                          selectedWord === word 
                                            ? 'bg-yellow-400 border-yellow-500 text-yellow-900 scale-110 ring-8 ring-yellow-100' 
                                            : 'bg-white border-gray-100 text-gray-800 hover:border-blue-400'
                                        }`}
                                      >
                                        {word}
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, y: 30 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-6"
                                >
                                  <div className="bg-green-50 p-6 md:p-8 rounded-[40px] border-8 border-green-100 shadow-xl">
                                    <p className="text-green-600 font-black text-2xl md:text-3xl leading-tight">
                                      ✨ 대단해요! ✨ <br/>
                                      복리의 마법을 완벽하게 마스터했습니다!
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setShowQuizPopup(false);
                                      setCurrentScreen('certificate');
                                    }}
                                    className="w-full py-8 bg-blue-600 text-white rounded-[40px] text-4xl font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 border-b-[12px] border-blue-800 active:border-b-0 active:translate-y-2"
                                  >
                                    나의 부자학교 수료증 확인하기 🎓
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {currentScreen === 'certificate' && (
            <motion.div
              key="certificate-screen"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-4xl"
            >
              <div ref={certificateRef} className="bg-white p-1 md:p-2 rounded-[40px] shadow-2xl border-4 border-yellow-500/30 relative overflow-hidden">
                {/* 수료증 속지 */}
                <div className="bg-[#FFFDF5] p-12 md:p-20 rounded-[36px] border-[12px] border-double border-yellow-400 text-center space-y-12 relative">
                  {/* 수료증 배경 장식 */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="grid grid-cols-4 gap-20 rotate-12 scale-150">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="text-8xl">🏫</div>
                      ))}
                    </div>
                  </div>

                  {/* 상단 장식 */}
                  <div className="flex justify-between items-center px-10">
                    <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl">🎓</motion.div>
                    <div className="space-y-2">
                      <h2 className="text-6xl font-black text-gray-900 tracking-[0.3em] drop-shadow-sm">수 료 증</h2>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-0.5 w-12 bg-yellow-500" />
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <div className="h-0.5 w-12 bg-yellow-500" />
                      </div>
                    </div>
                    <motion.div animate={{ rotate: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl">📜</motion.div>
                  </div>

                  {/* 본문 */}
                  <div className="space-y-10 py-6">
                    <div className="space-y-2">
                      <p className="text-4xl font-black text-blue-600 border-b-4 border-blue-100 inline-block px-4 pb-2">
                        성명: {userName}
                      </p>
                    </div>
                    
                    <div className="space-y-6 text-2xl font-bold text-gray-700 leading-relaxed">
                      <p>
                        위 어린이는 <span className="text-blue-600 font-black">'복리의 부자학교'</span>에서 <br/>
                        성실하게 종잣돈을 모으고, <br/>
                        지혜로운 선택으로 미래를 설계하여 <br/>
                        <span className="text-3xl font-black text-gray-900 bg-yellow-200 px-2">진정한 부자의 마음가짐</span>을 <br/>
                        갖추었기에 이 증서를 수여합니다.
                      </p>
                    </div>
                  </div>

                  {/* 하단 정보 */}
                  <div className="pt-10 space-y-4 relative">
                    <p className="text-xl font-bold text-gray-500">2026년 2월 27일</p>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-4xl font-black text-gray-900">복리의 부자학교 교장 🏫</p>
                    </div>

                    {/* 직인 (글씨와 겹치지 않도록 더 오른쪽 아래로 이동) */}
                    <div className="absolute bottom-[-10px] right-[-20px] md:right-[-40px]">
                      <motion.div 
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="w-28 h-28 rounded-xl border-4 border-red-500 flex items-center justify-center text-red-500 font-black text-xl rotate-12 bg-white/50 backdrop-blur-sm shadow-lg"
                      >
                        <div className="border-2 border-red-500 p-1 w-full h-full flex items-center justify-center">
                          복리의<br/>부자학교
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* 장식 별들 */}
                  <div className="absolute top-20 left-10 text-yellow-400 opacity-40"><Sparkles size={40} /></div>
                  <div className="absolute bottom-20 left-20 text-blue-400 opacity-40"><Sparkles size={30} /></div>
                  <div className="absolute top-40 right-10 text-yellow-400 opacity-40"><Sparkles size={30} /></div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadCertificate}
                  className="px-12 py-6 bg-blue-600 text-white rounded-3xl text-2xl font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3 border-b-8 border-blue-800"
                >
                  <Download size={24} /> 수료증 저장하기
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoHome}
                  className="px-12 py-6 bg-gray-900 text-white rounded-3xl text-2xl font-black shadow-2xl hover:bg-black transition-all flex items-center gap-3 border-b-8 border-gray-700 cursor-pointer"
                >
                  <RotateCcw size={24} /> 처음으로 돌아가기
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full py-8 text-center text-gray-400 text-sm">
        © 2026 복리의 부자학교 - {userName ? `${userName}님과 함께하는 ` : ''}재미있게 배우는 경제 이야기
      </footer>
    </div>
  );
}
