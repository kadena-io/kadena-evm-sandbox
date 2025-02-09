"use client";

import React from "react";
import styles from "./playback.module.css"
import UseActions from "@app/hooks/actions";
import UseData from "@app/hooks/data";

export type PlaybackProps = {
  data: {
    accounts: any;
    transactions: any;
  };
  handlers?: { [key: string]: () => void };
};

const Playback: React.FC<PlaybackProps> = ({
  data,
}) => {
  const {
    playlist,
    deploy,
    reset,
  } = UseActions();
  const {
    graphData,
    networks,
    options: {
      stepSize,
      maxStepCount,
    }
  } = UseData({ data });
  const timerRef = React.useRef<any>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const rangeRef = React.useRef<HTMLInputElement>(null);
  const graphContainerRef = React.useRef<HTMLDivElement>(null);
  
  const [topGraphId, bottomGraphId] = networks;
  const [progress, setProgress] = React.useState(0);

  const getBarHeight = React.useCallback((data) => {
    if (graphContainerRef.current && maxStepCount > 0) {
      const container = graphContainerRef.current;
      const height = container.clientHeight;
      const stepHeight = height / maxStepCount;
      
      return `${data.length * stepHeight}px`;
    }
  }, [maxStepCount]);

  const resetPlayer = React.useCallback(() => {
    if (trackRef.current) {
      trackRef.current.classList.remove(styles.playing);
      
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.backgroundPositionX = '0%';
          setProgress(0);
        }
      }, 400);
    }
  }, [trackRef]);

  const forwards = React.useCallback(() => {
    if (progress < 100) {
      setProgress((prev) => {
        const next = prev + stepSize;

        if (next > 100) {
          return 100;
        }

        return next;
      });
    }
  }, [progress, stepSize]);

  const backwards = React.useCallback(() => {
    if (progress > 0) {
      setProgress((prev) => {
        const next = prev - stepSize;

        if (next < 0) {
          return 0;
        }

        return next;
      });
    }
  }, [progress, stepSize]);

  const playHandler = React.useCallback(async () => {
    if (progress === 100) {
      setProgress(0);
    }

    if (trackRef.current) {
      trackRef.current.classList.add(styles.playing);
    }
    
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepSize;

        if (next > 100) {
          clearInterval(timerRef.current);
          return 100;
        }

        return next;
      });
    }, 1000);
  }, [progress, stepSize]);

  React.useEffect(() => {
    const range = rangeRef.current;
    const track = trackRef.current;

    if (range && track) {
      range.addEventListener('input', () => {
        setProgress(parseInt(range.value));
        track.classList.remove(styles.playing);
        clearInterval(timerRef.current);
      });
    }

    return () => {
      if (range) {
        range.removeEventListener('input', () => {});
      }
    }
  }, [setProgress]);

  // React.useEffect(() => {
  //   console.log('graphData', graphData);
  // }, [graphData]);

  React.useEffect(() => {
    console.log('networks', networks);
  }, [networks]);

  React.useEffect(() => {
    console.log('maxStepCount', maxStepCount);
  }, [maxStepCount]);

  return (
    <section className={styles.container}>
      <div className={styles.main}>
        <span className={[styles.uiDisplayText, styles.i1].join(' ')}>{progress}</span>

        <div className={styles.indicators}>
          <span>0</span>
          <span className={styles.active}>A</span>
          <span>I</span>
          <span>D</span>
          <span>V</span>
        </div>

        <div className={styles.graphWrapper}>
          <div ref={graphContainerRef} className={styles.graphContainer}>
            {Object.values(graphData)
              .map((d) => d.filter(d => d.network === topGraphId))
              .map((d, i) => 
                <div key={`graph-top--${i * stepSize}`} className={[styles.bar, (progress === i * stepSize ? styles.active : null)].join(' ')} style={{ height: getBarHeight(d) }} />
              )}
          </div>
          <div className={styles.graphContainer}>
            {Object.values(graphData)
              .map((d) => d.filter(d => d.network === bottomGraphId))
              .map((d, i) =>
                <div key={`graph-bottom--${i * stepSize}`} className={[styles.bar, (progress === i * stepSize ? styles.active : null)].join(' ')} style={{ height: getBarHeight(d) }} />
              )}
          </div>
        </div>
      </div>
      <div className={[styles.uiDisplayText, styles.i2].join(' ')}>
        <span>{'AA'}</span>
        <span>{'BB'}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(' ')}>
        <span className={styles.i3}>{'DD'}</span>
        <span className={styles.i4}>{'EE'}</span>
      </div>
      <div ref={trackRef} className={styles.track} style={{ backgroundPositionX: `${progress}%` }}>
        <input
          ref={rangeRef}
          className={styles.progress}
          type="range"
          min="0" max={100}
          step={stepSize}
          defaultValue={progress.toString()}
        />
      </div>
      <div className={styles.buttons}>
        <button className={styles.prev} onClick={backwards} disabled={progress===0} />
        <button className={styles.play} onClick={playHandler} />
        <button className={styles.pause} onClick={playlist} /> {/* @TODO: Temporaryly using playlist as pause */}
        <button className={styles.stop} onClick={reset} />
        <button className={styles.next} onClick={forwards} disabled={progress===100} />
        <button className={styles.eject} onClick={deploy} />
      </div>
    </section>
  )
}

export default Playback;
