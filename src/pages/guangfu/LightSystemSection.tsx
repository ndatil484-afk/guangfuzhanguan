import { useCallback, useEffect, useRef, useState } from 'react';
import { useScrubProgress } from '@/lib/useScrubProgress';
import { useChapterReveal } from '@/lib/useChapterReveal';
import GfAmbientParticles from '@/components/GfAmbientParticles';
import spatial1 from '@/assets/spatial/spatial-1.png';
import spatial2 from '@/assets/spatial/spatial-2.png';
import spatial3 from '@/assets/spatial/spatial-3.png';
import spatial4 from '@/assets/spatial/spatial-4.png';

/**
 * Chapter 07 — 空间体验 (Spatial Experience)
 *
 * 4 张空间图按顺序切换。所有图绝对定位、整张重叠铺满同一视口，
 * 用 opacity 互相切换——任何时刻都只有一张完整图可见，**不会出现
 * 两张图各占一半的"半张图"中间帧**。
 *
 * 切换进度由 slideT ∈ [0,1] 驱动，三等分对应 3 次切换：
 *   · 第 1 段 (0   – 1/3)：图 1 ⇆ 图 2
 *   · 第 2 段 (1/3 – 2/3)：图 2 ⇆ 图 3
 *   · 第 3 段 (2/3 – 1  )：图 3 ⇆ 图 4
 * 在每一段内部，相邻两张图 opacity 互相反向插值（一张 1→0、一张
 * 0→1）；同时整张图带轻微 scale 放大营造"推镜"质感。
 *
 * 滚轮 / 触摸板 / 键盘 → 改变 progress → 实时更新 slideT → 平滑插值。
 * 右下角 ← / → 按钮辅助切换：**只更新内部状态变量，绝不调用任何
 * 页面级 scrollTo**。点击期间给 4 张图临时启用 CSS transition，让
 * opacity 与 scale 平滑过渡到目标图对应的状态；buttonOverrideRef
 * 锁定 slideT 直到用户实际滚动滚轮，避免过渡结束后被 useEffect
 * 拉回原位。
 */

const IMAGES = [
  { src: spatial1, label: '空间 · 一', en: 'SPATIAL · 01' },
  { src: spatial2, label: '空间 · 二', en: 'SPATIAL · 02' },
  { src: spatial3, label: '空间 · 三', en: 'SPATIAL · 03' },
  { src: spatial4, label: '空间 · 四', en: 'SPATIAL · 04' },
];

// 第 i 张图对应的 progress（slideT 中心点 = i/3，与 progress 等价，
// 因为 slideT 三段拼接后是 progress 的分段线性映射且中心对齐）。
const INDEX_TO_PROGRESS = IMAGES.map((_v, i) => i / (IMAGES.length - 1));

function seg(p: number, s: number, e: number) {
  if (e <= s) return p <= s ? 0 : 1;
  return Math.max(0, Math.min(1, (p - s) / (e - s)));
}

class AmbientAudio {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private isPlaying = false;
  private backgroundOscillators: OscillatorNode[] = [];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    // 1. 先清空 intervals，防止新的声音被创建
    this.intervals.forEach(iv => clearInterval(iv));
    this.intervals = [];

    // 2. 强制停止所有正在运行的音频上下文
    if (this.ctx) {
      try {
        // 直接关闭音频上下文，这样所有声音都会立即停止
        this.ctx.close();
        this.ctx = null;
      } catch {}
    }

    // 3. 清空所有数组
    this.gains = [];
    this.oscillators = [];
    this.backgroundOscillators = [];

    this.isPlaying = false;
  }

  play(index: number) {
    this.stop();
    this.init();
    if (!this.ctx) return;

    this.isPlaying = true;

    switch (index) {
      case 0:
        this.startCantoneseOperaLoop();
        break;
      case 1:
        this.startGuangdongMusicLoop();
        break;
      case 2:
        this.startTeahouseLoop();
        break;
      case 3:
        this.startLingnanNightLoop();
        break;
    }
  }

  private createContinuousOscillator(freq: number, type: OscillatorType = 'sine', volume: number = 0.02) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2);
    osc.start();
    this.backgroundOscillators.push(osc);
    this.gains.push(gain);
  }

  private createGong(duration: number = 2, volume: number = 0.08) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + duration);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    gain2.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc2.start();
    osc2.stop(this.ctx.currentTime + duration);

    this.oscillators.push(osc, osc2);
    this.gains.push(gain, gain2);
  }

  private createFlute(freq: number, duration: number = 1.2, volume: number = 0.08) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = freq * 2.5;
    filter.Q.value = 1;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
    this.oscillators.push(osc);
    this.gains.push(gain);
  }

  private createPipaNote(freq: number, duration: number = 0.8, volume: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'bandpass';
    filter.frequency.value = freq * 1.5;
    filter.Q.value = 2;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
    this.oscillators.push(osc);
    this.gains.push(gain);
  }

  private createErhuNote(freq: number, duration: number = 1.5, volume: number = 0.12) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 2;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
    this.oscillators.push(osc, osc2);
    this.gains.push(gain);
  }

  private createZhengNote(freq: number, duration: number = 2, volume: number = 0.08) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    gain2.gain.setValueAtTime(0, this.ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(volume * 0.3, this.ctx.currentTime + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc2.start();
    osc2.stop(this.ctx.currentTime + duration);

    this.oscillators.push(osc, osc2);
    this.gains.push(gain, gain2);
  }

  private createXiao(freq: number, duration: number = 2, volume: number = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
    this.oscillators.push(osc);
    this.gains.push(gain);
  }

  private startCantoneseOperaLoop() {
    this.createContinuousOscillator(130.81, 'sine', 0.02);
    this.createContinuousOscillator(164.81, 'sine', 0.015);
    this.createContinuousOscillator(196.00, 'sine', 0.01);

    this.createGong(3, 0.04);

    const playErhuMelody = () => {
      const notes = [523.25, 659.25, 783.99, 880.00, 659.25, 523.25, 392.00, 440.00];
      notes.forEach((freq, i) => {
        setTimeout(() => this.createErhuNote(freq, 1.5, 0.12), i * 400);
      });
    };

    const playPipa = () => {
      const pipaNotes = [659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 392.00, 440.00];
      pipaNotes.forEach((freq, i) => {
        setTimeout(() => this.createPipaNote(freq, 0.8, 0.1), i * 300);
      });
    };

    playErhuMelody();
    playPipa();

    this.intervals.push(setInterval(playErhuMelody, 3500));
    this.intervals.push(setInterval(playPipa, 2800));
    this.intervals.push(setInterval(() => this.createGong(4, 0.03), 10000));
  }

  private startGuangdongMusicLoop() {
    this.createContinuousOscillator(261.63, 'sine', 0.015);
    this.createContinuousOscillator(329.63, 'sine', 0.01);
    this.createContinuousOscillator(392.00, 'sine', 0.008);
    this.createContinuousOscillator(523.25, 'sine', 0.005);

    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    const playGaohu = () => {
      const melody = [7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0];
      melody.forEach((noteIdx, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          osc.type = 'sine';
          osc.frequency.value = pentatonic[noteIdx] * 1.5;
          filter.type = 'lowpass';
          filter.frequency.value = 2000;
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.5);
          this.oscillators.push(osc);
          this.gains.push(gain);
        }, i * 500);
      });
    };

    const playQin = () => {
      const notes = [4, 2, 0, 2, 4, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0];
      notes.forEach((noteIdx, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = pentatonic[noteIdx];
          osc2.type = 'sine';
          osc2.frequency.value = pentatonic[noteIdx] * 2;
          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
          osc.start();
          osc2.start();
          osc.stop(this.ctx.currentTime + 2.5);
          osc2.stop(this.ctx.currentTime + 2.5);
          this.oscillators.push(osc, osc2);
          this.gains.push(gain);
        }, i * 400);
      });
    };

    const playDizi = () => {
      const notes = [5, 7, 5, 4, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4];
      notes.forEach((noteIdx, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = pentatonic[noteIdx] * 2;
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.8);
          this.oscillators.push(osc);
          this.gains.push(gain);
        }, i * 450);
      });
    };

    playGaohu();
    playQin();
    playDizi();

    this.intervals.push(setInterval(playGaohu, 7000));
    this.intervals.push(setInterval(playQin, 6500));
    this.intervals.push(setInterval(playDizi, 6500));
  }

  private startTeahouseLoop() {
    this.createContinuousOscillator(392.00, 'sine', 0.015);
    this.createContinuousOscillator(493.88, 'sine', 0.01);
    this.createContinuousOscillator(587.33, 'sine', 0.006);

    const playZheng = () => {
      const notes = [392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 329.63];
      notes.forEach((freq, i) => {
        setTimeout(() => this.createZhengNote(freq, 2.5, 0.08), i * 550);
      });
    };

    const playXiao = () => {
      const xiaoNotes = [523.25, 587.33, 659.25, 587.33, 523.25, 440.00, 392.00, 329.63];
      xiaoNotes.forEach((freq, i) => {
        setTimeout(() => this.createXiao(freq, 3, 0.06), i * 700);
      });
    };

    const playErhu = () => {
      const erhuNotes = [392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 329.63];
      erhuNotes.forEach((freq, i) => {
        setTimeout(() => this.createErhuNote(freq, 2, 0.1), i * 600);
      });
    };

    playZheng();
    playXiao();
    playErhu();

    this.intervals.push(setInterval(playZheng, 4500));
    this.intervals.push(setInterval(playXiao, 5500));
    this.intervals.push(setInterval(playErhu, 5000));
  }

  private startLingnanNightLoop() {
    this.createContinuousOscillator(196.00, 'sine', 0.02);
    this.createContinuousOscillator(246.94, 'sine', 0.015);
    this.createContinuousOscillator(293.66, 'sine', 0.01);

    const playErhu = () => {
      const erhuNotes = [440.00, 523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 440.00, 392.00];
      erhuNotes.forEach((freq, i) => {
        setTimeout(() => this.createErhuNote(freq, 3, 0.12), i * 700);
      });
    };

    const playZheng = () => {
      const zhengNotes = [261.63, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 261.63];
      zhengNotes.forEach((freq, i) => {
        setTimeout(() => this.createZhengNote(freq, 3.5, 0.07), i * 800);
      });
    };

    const playFlute = () => {
      const fluteNotes = [523.25, 659.25, 783.99, 659.25, 523.25, 440.00, 392.00, 440.00];
      fluteNotes.forEach((freq, i) => {
        setTimeout(() => this.createFlute(freq, 2, 0.08), i * 600);
      });
    };

    playErhu();
    playZheng();
    playFlute();

    this.intervals.push(setInterval(playErhu, 7000));
    this.intervals.push(setInterval(playZheng, 7200));
    this.intervals.push(setInterval(playFlute, 5000));
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export default function LightSystemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<Array<HTMLDivElement | null>>([]);
  const titleRef = useRef<HTMLDivElement>(null);

  const { progress } = useScrubProgress(sectionRef, { range: 'full', lead: 1, initial: 0.08 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const isAnimatingRef = useRef(false);
  const buttonOverrideRef = useRef<number | null>(null);
  const audioRef = useRef<AmbientAudio>(new AmbientAudio());
  const isAudioPlayingRef = useRef(false);
  const prevIndexRef = useRef(0);

  const computeOpacities = useCallback((slideT: number): number[] => {
    return IMAGES.map((_v, i) => {
      const center = i / (IMAGES.length - 1);
      const d = Math.abs(slideT - center) * (IMAGES.length - 1);
      return Math.max(0, 1 - d);
    });
  }, []);

  const applySlideState = useCallback(
    (slideT: number) => {
      const ops = computeOpacities(slideT);
      IMAGES.forEach((_img, i) => {
        const slide = slidesRef.current[i];
        if (slide) {
          slide.style.opacity = String(ops[i]);
          const scale = 1 + (1 - ops[i]) * 0.04;
          slide.style.transform = `scale(${scale.toFixed(4)})`;
        }
      });
    },
    [computeOpacities],
  );

  useChapterReveal(sectionRef, innerRef);

  useEffect(() => {
    const p = progress;
    const pSlide1 = seg(p, 0, 1 / 3);
    const pSlide2 = seg(p, 1 / 3, 2 / 3);
    const pSlide3 = seg(p, 2 / 3, 1);
    const scrollSlideT = (pSlide1 + pSlide2 + pSlide3) / 3;
    const slideT = buttonOverrideRef.current ?? scrollSlideT;

    applySlideState(slideT);

    if (titleRef.current) {
      titleRef.current.style.opacity = String(Math.max(0, 1 - p * 4));
    }

    const nearest = Math.round(slideT * (IMAGES.length - 1));
    if (nearest !== prevIndexRef.current) {
      prevIndexRef.current = nearest;
      setActiveIndex(nearest);
      if (isAudioPlayingRef.current) {
        audioRef.current.stop();
        setIsAudioPlaying(false);
        isAudioPlayingRef.current = false;
      }
    }
  }, [progress, applySlideState]);

  useEffect(() => {
    const clearOverride = () => {
      if (buttonOverrideRef.current === null) return;
      buttonOverrideRef.current = null;
      slidesRef.current.forEach((el) => {
        if (el) el.style.transition = '';
      });
    };
    window.addEventListener('wheel', clearOverride, { passive: true });
    window.addEventListener('touchmove', clearOverride, { passive: true });
    window.addEventListener('keydown', clearOverride, { passive: true });
    return () => {
      window.removeEventListener('wheel', clearOverride);
      window.removeEventListener('touchmove', clearOverride);
      window.removeEventListener('keydown', clearOverride);
    };
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current.stop();
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (isAudioPlayingRef.current) {
      audioRef.current.stop();
      setIsAudioPlaying(false);
      isAudioPlayingRef.current = false;
    } else {
      audioRef.current.play(activeIndex);
      setIsAudioPlaying(true);
      isAudioPlayingRef.current = true;
    }
  }, [activeIndex]);

  const goTo = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= IMAGES.length) return;
      if (isAnimatingRef.current) return;
      if (targetIdx === activeIndex) return;

      const targetSlideT = INDEX_TO_PROGRESS[targetIdx];

      isAnimatingRef.current = true;
      setIsAnimating(true);
      setActiveIndex(targetIdx);
      buttonOverrideRef.current = targetSlideT;

      slidesRef.current.forEach((el) => {
        if (!el) return;
        el.style.transition = 'opacity 0.7s cubic-bezier(0.65, 0, 0.35, 1), transform 0.7s cubic-bezier(0.65, 0, 0.35, 1)';
      });
      applySlideState(targetSlideT);

      if (isAudioPlayingRef.current) {
        audioRef.current.stop();
        setIsAudioPlaying(false);
        isAudioPlayingRef.current = false;
      }

      const finalize = () => {
        slidesRef.current.forEach((el) => {
          if (el) el.style.transition = '';
        });
        isAnimatingRef.current = false;
        setIsAnimating(false);
      };
      const fallback = window.setTimeout(finalize, 1200);

      const leadSlide = slidesRef.current[activeIndex] || slidesRef.current[0];
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
        if (leadSlide) leadSlide.removeEventListener('transitionend', onEnd);
        window.clearTimeout(fallback);
        finalize();
      };
      if (leadSlide) leadSlide.addEventListener('transitionend', onEnd);
    },
    [activeIndex, applySlideState],
  );

  return (
    <section
      ref={sectionRef}
      id="chapter-08"
      data-chapter="08"
      data-title="四幕空间"
      className="gf-chapter"
      style={{ position: 'relative', height: '160vh', width: '100%', background: 'transparent' }}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{
          position: 'absolute',
          inset: 0,
          willChange: 'opacity, transform',
        }}
      >
        <div
          className="gf-chapter-inner"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {IMAGES.map((img, i) => (
            <div
              key={img.en}
              ref={(el) => { slidesRef.current[i] = el; }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                opacity: i === 0 ? 1 : 0,
                willChange: 'opacity, transform',
                transform: 'scale(1)',
                zIndex: 1,
              }}
            >
              <img
                src={img.src}
                alt={img.label}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}

          <GfAmbientParticles
            count={40}
            opacity={0.25 * (1 - seg(progress, 0.85, 1))}
            minSize={0.4}
            maxSize={1.6}
            color={[201, 168, 76]}
            driftX={12}
            driftY={16}
            style={{ zIndex: 4 }}
          />

          <div
            aria-label="空间图片切换"
            style={{
              position: 'absolute',
              bottom: 'max(28px, 4vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 8,
            }}
          >
            <button
              type="button"
              aria-label={isAudioPlaying ? '暂停音效' : '播放音效'}
              onClick={toggleAudio}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(201, 168, 76, 0.45)',
                background: isAudioPlaying ? 'rgba(201, 168, 76, 0.2)' : 'rgba(20, 18, 28, 0.42)',
                color: 'var(--gf-gold-light, #e6cf86)',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {isAudioPlaying ? '◼' : '♪'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(20, 18, 28, 0.42)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(201, 168, 76, 0.28)',
              }}
            >
              <button
                type="button"
                aria-label="上一张"
                onClick={() => goTo((activeIndex - 1 + IMAGES.length) % IMAGES.length)}
                disabled={isAnimating}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid rgba(201, 168, 76, 0.45)',
                  background: 'transparent',
                  color: 'var(--gf-gold-light, #e6cf86)',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s, opacity 0.2s',
                }}
              >
                ‹
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {IMAGES.map((_img, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    style={{
                      width: i === activeIndex ? '18px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: i === activeIndex ? 'var(--gf-gold-light, #e6cf86)' : 'rgba(245, 240, 232, 0.35)',
                      transition: 'all 0.3s ease',
                      display: 'block',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="下一张"
                onClick={() => goTo((activeIndex + 1) % IMAGES.length)}
                disabled={isAnimating}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid rgba(201, 168, 76, 0.45)',
                  background: 'transparent',
                  color: 'var(--gf-gold-light, #e6cf86)',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s, opacity 0.2s',
                }}
              >
                ›
              </button>
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 'max(80px, 12vh)',
              left: 'max(28px, 4vw)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              zIndex: 7,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
            }}
          >
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '0.4em', color: '#c9a84c', opacity: 0.85 }}>CHAPTER</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', color: '#c9a84c', lineHeight: 1 }}>07</span>
            <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(245,240,232,0.7)', marginLeft: '6px' }}>空间体验</span>
          </div>

          <div
            ref={titleRef}
            style={{
              position: 'absolute',
              top: 'max(80px, 12vh)',
              right: 'max(28px, 4vw)',
              textAlign: 'right',
              zIndex: 7,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
            }}
          >
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.32em', color: '#a89bd0', opacity: 0.85 }}>SPATIAL EXPERIENCE</div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '14px', letterSpacing: '0.18em', color: 'rgba(245,240,232,0.7)', marginTop: '4px' }}>横向推镜 · 四幕空间</div>
          </div>
        </div>
      </div>
    </section>
  );
}
