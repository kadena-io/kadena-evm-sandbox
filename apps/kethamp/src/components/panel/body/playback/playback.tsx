"use client";

import React from "react";
import styles from "./playback.module.css";
import UseActions from "@app/hooks/actions";
import { useContext, useContextDispatch } from "@app/context/context";

const Playback: React.FC = () => {
  const dispatch = useContextDispatch();
  const { playlist, deploy } = UseActions();
  const {
    networks: {
      list: networksList,
    },
    graph: {
      data: graphData,
      options: {
        stepSize,
        maxStepCount,
        progress,
      },
    },
  } = useContext();
  
  const timerRef = React.useRef<any>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const rangeRef = React.useRef<HTMLInputElement>(null);
  const graphContainerRef = React.useRef<HTMLDivElement>(null);

  const [topGraphId, bottomGraphId] = networksList;

  const getBarHeight = React.useCallback(
    (data) => {
      if (graphContainerRef.current && maxStepCount > 0) {
        const container = graphContainerRef.current;
        const height = container.clientHeight;
        const stepHeight = height / maxStepCount;

        return `${data.length * stepHeight}px`;
      }
    },
    [maxStepCount]
  );

  const stopPlayer = React.useCallback(() => {
    const track = trackRef.current;

    if (track && timerRef.current) {
      track.classList.remove(styles.playing);
      clearInterval(timerRef.current);
    }
  }, [trackRef.current, timerRef.current]);

  const resetPlayer = React.useCallback(() => {
    if (trackRef.current) {
      trackRef.current.classList.remove(styles.playing);

      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.backgroundPositionX = "0%";
          dispatch({
            type: "RESET_PROGRESS"
          });
        }
      }, 400);
    }
  }, [trackRef]);

  const forwards = React.useCallback(() => {
    dispatch({
      type: "SET_PROGRESS",
      payload: {
        direction: "forwards",
        next: progress + stepSize,
      },
    });
    
    stopPlayer();
  }, [progress, dispatch, stopPlayer]);

  const backwards = React.useCallback(() => {
    dispatch({
      type: "SET_PROGRESS",
      payload: {
        direction: "backwards",
        next: progress - stepSize,
      },
    });

    stopPlayer();
  }, [progress, dispatch, stopPlayer]);

  const playHandler = React.useCallback(async () => {
    if (progress === 100) {
      dispatch({
        type: "RESET_PROGRESS"
      });
    }

    if (trackRef.current) {
      trackRef.current.classList.add(styles.playing);
    }

    timerRef.current = setInterval(() => {
      dispatch({
        type: "SET_PROGRESS",
        payload: {
          direction: "forwards",
        },
      });

      if (progress > 100) {
        clearInterval(timerRef.current);
        return 100;
      }
    }, 1000);
  }, [dispatch, progress]);

  React.useEffect(() => {
    const range = rangeRef.current;
    const track = trackRef.current;

    if (range && track) {
      range.addEventListener("input", () => {
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            progress: parseInt(range.value),
          },
        });
        
        stopPlayer();
      });
    }

    return () => {
      if (range) {
        range.removeEventListener("input", () => {});
      }
    };
  }, [dispatch, stopPlayer]);

  React.useEffect(() => {
    console.log({progress})
    return () => {
      if (timerRef.current && progress === 100-stepSize) {
        stopPlayer();
      }
    };
  }, [progress, stepSize, stopPlayer]);

  if (!graphData) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.main}>
        <span className={[styles.uiDisplayText, styles.i1].join(" ")}>
          {progress}
        </span>

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
              .map((d) => d.filter((d) => d.network === topGraphId))
              .map((d, i) => (
                <div
                  key={`graph-top--${i * stepSize}`}
                  className={[
                    styles.bar,
                    progress === i * stepSize ? styles.active : null,
                  ].join(" ")}
                  style={{ height: getBarHeight(d) }}
                />
              ))}
          </div>
          <div className={styles.graphContainer}>
            {Object.values(graphData)
              .map((d) => d.filter((d) => d.network === bottomGraphId))
              .map((d, i) => (
                <div
                  key={`graph-bottom--${i * stepSize}`}
                  className={[
                    styles.bar,
                    progress === i * stepSize ? styles.active : null,
                  ].join(" ")}
                  style={{ height: getBarHeight(d) }}
                />
              ))}
          </div>
        </div>
      </div>
      <div className={[styles.uiDisplayText, styles.i2].join(" ")}>
        <span>{"AA"}</span>
        <span>{"BB"}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(" ")}>
        <span className={styles.i3}>{"DD"}</span>
        <span className={styles.i4}>{"EE"}</span>
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        style={{ backgroundPositionX: `${progress}%` }}
      >
        <input
          ref={rangeRef}
          className={styles.progress}
          type="range"
          min="0"
          max={100}
          step={stepSize}
          defaultValue={progress.toString()}
        />
      </div>
      <div className={styles.buttons}>
        <button
          className={styles.prev}
          onClick={backwards}
          disabled={progress === 0}
        />
        <button className={styles.play} onClick={playHandler} />
        <button
          className={styles.pause}
          onClick={() => playlist("crosschain")}
        />{" "}
        {/* @TODO: Temporaryly using playlist as pause */}
        {/* @TODO: you can also call playlist with 'chain1' */}
        <button className={styles.stop} onClick={() => playlist("chain0")} />
        <button
          className={styles.next}
          onClick={forwards}
          disabled={progress === 100}
        />
        <button className={styles.eject} onClick={deploy} />
      </div>
    </section>
  );
};

export default Playback;
