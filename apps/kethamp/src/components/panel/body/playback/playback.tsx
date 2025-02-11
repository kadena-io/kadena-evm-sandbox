"use client";

import React from "react";
import styles from "./playback.module.css";
import UseActions from "@app/hooks/actions";
import { useContext, useContextDispatch } from "@app/context/context";

const Playback: React.FC = () => {
  const dispatch = useContextDispatch();
  const { playlist, deploy, reset } = UseActions();
  const {
    networks: {
      list: networksList,
    },
    graph: {
      active: activeGraph,
      data: graphData,
      options: {
        stepSize,
        maxStepCount,
        progress,
        isPlaying,
      },
    },
    transactions,
    deployments,
  } = useContext();
  
  const timerRef = React.useRef<any>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const rangeRef = React.useRef<HTMLInputElement>(null);
  const graphContainerRef = React.useRef<HTMLDivElement>(null);

  const [blockNrs, setBlockNrs] = React.useState<[string|number, string|number]>([0,0]);
  const [timerLabel, setTimerLabel] = React.useState<string>('N/A');
  const [activeTitle, setActiveTitle] = React.useState("Select account or transaction");
  const [activeMetaData, setActiveMetaData] = React.useState<Record<string, string|number>>({
    a: '-',
    b: '-',
  });

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

  const stopPlayer = React.useCallback((isNoTimeout=false) => {
    const track = trackRef.current;

    if (track && timerRef.current) {
      if (!isNoTimeout) {
        setTimeout(() => {
          track.classList.remove(styles.playing);
        }, 1000);
      } else {
        track.classList.remove(styles.playing);
      }

      clearInterval(timerRef.current);
    }
  }, []);

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
  }, [dispatch]);

  const forwards = React.useCallback((isStopPlayer=true) => {
    dispatch({
      type: "SET_PROGRESS",
      payload: {
        direction: "forwards",
        next: progress + stepSize,
      },
    });
    
    isStopPlayer && stopPlayer();
  }, [dispatch, progress, stepSize, stopPlayer]);

  const backwards = React.useCallback(() => {
    dispatch({
      type: "SET_PROGRESS",
      payload: {
        direction: "backwards",
        next: progress - stepSize,
      },
    });

    stopPlayer();
  }, [dispatch, progress, stepSize, stopPlayer]);

  const playHandler = React.useCallback(async () => {
    if (isPlaying) {
      stopPlayer(true);
      dispatch({
        type: "RESET_PROGRESS"
      });
    }

    if (progress === 100) {
      dispatch({
        type: "RESET_PROGRESS"
      });
    }

    if (trackRef.current) {
      trackRef.current.classList.add(styles.playing);
    }

    timerRef.current = setInterval(() => {
      const progressValue = parseInt(rangeRef.current.value, 10) ?? 0

      dispatch({
        type: "SET_PROGRESS",
        payload: {
          direction: "forwards",
          isPlaying: progressValue + stepSize !== 100,
          next: progressValue + stepSize,
        }
      });

      if (progressValue === 100) {
        stopPlayer();
      }
    }, 1000);
  }, [isPlaying, progress, stopPlayer, dispatch, stepSize]);

  React.useEffect(() => {
    const range = rangeRef.current;
    const track = trackRef.current;

    if (range && track) {
      range.addEventListener("input", (e) => {
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            direction: "forwards",
            isPlaying: false,
            next: parseInt(e.target.value, 10),
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
    if (activeGraph.account) {
      const {
        name,
        chain,
        address,
        balance,
      } = activeGraph.account
      setActiveTitle(`${name} @ ${chain} ${balance} | Address: ${address}`);
      setActiveMetaData({
        a: '-',
        b: '-',
      })
    } else if (activeGraph.transaction) {
      setActiveTitle(activeGraph.transaction?.title);
      setActiveMetaData({
        a: '-',
        b: '-',
      })
    } else {
      setActiveTitle("Select account or transaction");
      setActiveMetaData({
        a: '-',
        b: '-',
      })
    }
  }, [activeGraph, setActiveTitle]);

  React.useEffect(() => {
    if (deployments.isDeployed && transactions.list?.block?.length && blockNrs.length) {
      const [startBlockNr, endBlockNr] = blockNrs
      setActiveTitle("Blocks between " + startBlockNr + " and " + endBlockNr + " containing " + transactions.list.block.length + " transactions are displayed");
    } else {
      setActiveTitle("No deployments found, please deploy a contract");
    }

    return () => {
      if (timerRef.current && progress === 100-stepSize) {
        stopPlayer();
      }
    };
  }, [blockNrs, deployments.isDeployed, progress, stepSize, stopPlayer, transactions]);

  React.useEffect(() => {
    if (!deployments.isDeployed) {
      setBlockNrs([0,0]);
      setActiveTitle("No deployments found, please deploy a contract");
    }
  }, [deployments.isDeployed, setBlockNrs, setActiveTitle]);

  React.useEffect(() => {
    if (deployments.isDeployed) {
      if (transactions.list?.block?.length) {
        const blockNrs = transactions.list.block.map(item => item.blockNumber)
        const minBlockNr = Math.min(...blockNrs);
        const maxBlockNr = Math.max(...blockNrs);
        setBlockNrs([minBlockNr,maxBlockNr]);
      } else {
        setBlockNrs([0,0]);
      }
    }
  }, [transactions.list, setBlockNrs, deployments.isDeployed]);

  React.useEffect(() => {
    if (deployments.isDeployed && blockNrs.length) {
      const [startBlockNr, endBlockNr] = blockNrs
      
      if (startBlockNr === endBlockNr) {
        setTimerLabel(String(startBlockNr));
      } else if (startBlockNr === 0) {
        setTimerLabel("N/A");
      } else {
        setTimerLabel(startBlockNr + "-" + endBlockNr);
      }
    } else {
      setTimerLabel("N/A");
    }
  }, [setTimerLabel, blockNrs, deployments.isDeployed]);

  if (!graphData) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.main}>
        <span className={[styles.uiDisplayText, styles.i1].join(" ")}>
          <span className="text-lg opacity-50">#</span>{timerLabel}
        </span>

        <div className={styles.indicators}>
          <span>0</span>
          <span className={styles.active}>A</span>
          <span>I</span>
          <span>D</span>
          <span>V</span>
        </div>

        <div className={styles.graphWrapper}>
          {deployments.isDeployed ? <><div ref={graphContainerRef} className={styles.graphContainer}>
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
          </div></> : null}
        </div>
      </div>
      <div className={[styles.uiDisplayText, styles.i2].join(" ")}>
        <span>{activeTitle}</span>
        <span>- {activeTitle}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(" ")}>
        <span className={styles.i3}>{activeMetaData.a}</span>
        <span className={styles.i4}>{activeMetaData.b}</span>
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
          defaultValue={progress}
          disabled={!deployments.isDeployed}
        />
      </div>
      <div className={styles.buttons}>
        <button
          className={styles.prev}
          onClick={backwards}
          disabled={progress === 0}
        />
        <button className={styles.play} onClick={() => playlist()} />
        {/* <button
          className={styles.pause}
          onClick={() => playlist()}
        /> */}
        <button className={styles.stop} onClick={reset} />
        <button
          className={styles.next}
          onClick={forwards}
          disabled={progress === 100}
        />
        <button className={styles.eject} onClick={deploy} />
      </div>
      <div className={styles.logoKadena} />
      <div className={styles.logoEthDenver2025} />
    </section>
  );
};

export default Playback;
