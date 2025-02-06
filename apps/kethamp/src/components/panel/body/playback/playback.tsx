"use client";

import React from "react";
import styles from "./playback.module.css"

export type PlaybackProps = {
  readonly i1: [number, number];
  readonly i2: string;
  readonly i3: number;
  readonly i4: number;
  readonly progress: number;
  readonly progressSteps: number;
  onChange?: (progress: number) => void;
};

const Playback: React.FC<PlaybackProps> = ({
  i1:_i1,
  i2:_i2,
  i3:_i3,
  i4:_i4,
  progress: _progress,
  progressSteps,
  onChange,
}) => {
  const [i1, setI1] = React.useState('');
  const [i2, setI2] = React.useState(_i2);
  const [i3, setI3] = React.useState(_i3);
  const [i4, setI4] = React.useState(_i4);
  const [progress, setProgress] = React.useState(_progress);

  const rangeRef = React.useRef<HTMLInputElement>(null);
  
  const setHandler = React.useCallback((progressValue: number) => {
    setProgress(progressValue);
    onChange?.(progressValue);
  }, [onChange])

  React.useEffect(() => {
    setI1(_i1.join(':'));
  }, [_i1]);

  React.useEffect(() => {
    setI2(_i2);
  }, [_i2]);

  React.useEffect(() => {
    setI3(_i3);
  }, [_i3]);

  React.useEffect(() => {
    setI4(_i4);
  }, [_i4]);

  React.useEffect(() => {
    const currentRangeRef = rangeRef.current;
    
    if (currentRangeRef) {
      currentRangeRef.addEventListener('change', (e) => {
        setHandler(parseInt((e.target as HTMLInputElement).value));
      });

      return () => {
        currentRangeRef.removeEventListener('input', () => {});
      }
    }
  }, []);

  React.useEffect(() => {
    setProgress(_progress);
  }, [_progress]);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <span className={[styles.uiDisplayText, styles.i1].join(' ')}>{i1}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i2].join(' ')}>
        <span>{i2}</span>
        <span>{i2}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(' ')}>
        <span className={styles.i3}>{i3}</span>
        <span className={styles.i4}>{i4}</span>
      </div>
      <div className={styles.track} style={{ backgroundPositionX: `${progress}%` }}>
        <input
          ref={rangeRef}
          className={styles.progress}
          type="range"
          min="0" max={100} step={Math.ceil(100 / progressSteps)}
          defaultValue={progress.toString()}
          />
      </div>
    </div>
  )
}

export default Playback;
