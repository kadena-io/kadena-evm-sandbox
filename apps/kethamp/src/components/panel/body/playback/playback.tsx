"use client";

import React from "react";
import styles from "./playback.module.css";
import UseActions from "@app/hooks/actions";
import { useContext, useContextDispatch } from "@app/context/context";
import { TTransaction } from "@app/context/context.type";

const Playback: React.FC = () => {
  const dispatch = useContextDispatch();
  const { playlist, deploy, reset } = UseActions();
  const state = useContext();

  const {
    networks,
    graph,
    transactions,
    deployments,
  } = state || {};
  const {
    list: networksList,
  } = networks || {};
  const {
    active: activeGraph,
    data: graphData,
    options,
  } = graph || {};
  const {
    stepSize = 10,
    maxStepCount = 10,
    progress = 0,
  } = options || {};
  
  const timerRef = React.useRef(null);
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

  const [topGraphId, bottomGraphId] = networksList || [];

  const getBarHeight = React.useCallback(
    (data: TTransaction[]) => {
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

  const forwards = React.useCallback((isStopPlayer=true) => {
    dispatch({
      type: "SET_PROGRESS",
      payload: {
        direction: "forwards",
        next: progress + stepSize,
      },
    });
    
    if (isStopPlayer) {
      stopPlayer()
    }
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

  React.useEffect(() => {
    const range = rangeRef.current;

    if (range) {
      range.addEventListener("input", (e: Event) => {
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            direction: "forwards",
            isPlaying: false,
            next: parseInt((e.target as HTMLInputElement).value, 10),
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
  }, [dispatch, stopPlayer, rangeRef.current]);

  React.useEffect(() => {
    if (activeGraph?.account) {
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
    } else if (activeGraph?.transaction?.title) {
      setActiveTitle(activeGraph.transaction.title);
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
    if (deployments?.isDeployed && transactions?.list?.block?.length && blockNrs.length) {
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
  }, [blockNrs, deployments?.isDeployed, progress, stepSize, stopPlayer, transactions]);

  React.useEffect(() => {
    if (!deployments?.isDeployed) {
      setBlockNrs([0,0]);
      setActiveTitle("No deployments found, please deploy a contract");
    }
  }, [deployments?.isDeployed, setBlockNrs, setActiveTitle]);

  React.useEffect(() => {
    if (deployments?.isDeployed) {
      if (transactions?.list?.block?.length) {
        const blockNrs = transactions.list.block.map(item => item.blockNumber)
        const minBlockNr = Math.min(...blockNrs);
        const maxBlockNr = Math.max(...blockNrs);
        setBlockNrs([minBlockNr,maxBlockNr]);
      } else {
        setBlockNrs([0,0]);
      }
    }
  }, [transactions?.list, setBlockNrs, deployments?.isDeployed]);

  React.useEffect(() => {
    if (deployments?.isDeployed && blockNrs.length) {
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
  }, [setTimerLabel, blockNrs, deployments?.isDeployed]);

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
          <span className={styles.char}>0</span>
          <span className={[styles.char, styles.active].join(' ')}>A</span>
          <span className={styles.char}>I</span>
          <span className={styles.char}>D</span>
          <span className={styles.char}>V</span>
        </div>

        <div className={styles.graphWrapper}>
          {deployments?.isDeployed ? <><div ref={graphContainerRef} className={styles.graphContainer}>
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
        <span className={styles.i2text}>{activeTitle}</span>
        <span className={styles.i2text}>- {activeTitle}</span>
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(" ")}>
        <span className={styles.i3text}>{activeMetaData.a}</span>
        <span className={styles.i3text}>{activeMetaData.b}</span>
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
          // defaultValue={progress}
          disabled={!deployments?.isDeployed}
        />
      </div>
      <div className={styles.buttons}>
        <button
          className={[styles.button, styles.prev].join(" ")}
          onClick={() => backwards()}
          disabled={progress === 0}
        />
        <button className={[styles.button, styles.play].join(" ")} onClick={() => playlist()} />
        {/* <button
          className={[styles.button, styles.pause].join(" ")}
          onClick={() => playlist()}
        /> */}
        <button className={[styles.button, styles.stop].join(" ")} onClick={reset} />
        <button
          className={[styles.button, styles.next].join(" ")}
          onClick={() => forwards()}
          disabled={progress === 100}
        />
        <button className={[styles.button, styles.eject].join(" ")} onClick={() => deploy()} />
      </div>
      <div className={styles.logoKadena} />
      <div className={styles.logoEthDenver2025} />
    </section>
  );
};

export default Playback;
