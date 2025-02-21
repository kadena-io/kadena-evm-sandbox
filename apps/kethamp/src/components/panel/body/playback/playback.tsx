'use client';

import { useContext, useContextDispatch } from '@app/context/context';
import { TTransaction } from '@app/context/context.type';
import UseActions from '@app/hooks/actions';
import React from 'react';
import styles from './playback.module.css';

const Playback: React.FC = () => {
  const dispatch = useContextDispatch();
  const {
    playlist: {
      run: runPlaylist,
      // get: getPlaylist,
    },
    deploy,
    reset,
  } = UseActions();
  const state = useContext();

  const { networks, graph, transactions, deployments } = state || {};
  const { list: networksList } = networks || {};
  const { active: activeGraph, data: graphData, options } = graph || {};
  const {
    stepSize = 10,
    maxStepCount = 10,
    progress = 0,
    volume = 0,
  } = options || {};

  const timerRef = React.useRef(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const rangeRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioTrackRef = React.useRef<HTMLDivElement>(null);
  const audioRangeRef = React.useRef<HTMLInputElement>(null);
  const graphContainerRef = React.useRef<HTMLDivElement>(null);

  const [blockNrs, setBlockNrs] = React.useState<
    [string | number, string | number]
  >([0, 0]);
  const [timerLabel, setTimerLabel] = React.useState<string>('N/A');
  const [activeTitle, setActiveTitle] = React.useState(
    'Select account or transaction',
  );
  const [isInteracting, setIsInteracting] = React.useState(false);
  const [interactionTitle, setInteractionTitle] = React.useState('');
  const [activeMetaData, setActiveMetaData] = React.useState<
    Record<string, string | number>
  >({
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
    [maxStepCount],
  );

  const stopPlayer = React.useCallback((isNoTimeout = false) => {
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

  const forwards = React.useCallback(
    (isStopPlayer = true) => {
      dispatch({
        type: 'SET_PROGRESS',
        payload: {
          direction: 'forwards',
          next: progress + stepSize,
        },
      });

      if (isStopPlayer) {
        stopPlayer();
      }
    },
    [dispatch, progress, stepSize, stopPlayer],
  );

  const backwards = React.useCallback(() => {
    dispatch({
      type: 'SET_PROGRESS',
      payload: {
        direction: 'backwards',
        next: progress - stepSize,
      },
    });

    stopPlayer();
  }, [dispatch, progress, stepSize, stopPlayer]);

  const play = React.useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.play();
    }

    runPlaylist();
  }, [audioRef.current, runPlaylist]);

  React.useEffect(() => {
    const range = rangeRef.current;
    const audioRange = audioRangeRef.current;

    if (range) {
      range.addEventListener('input', (e: Event) => {
        const next = parseInt((e.target as HTMLInputElement).value, 10);
        dispatch({
          type: 'SET_PROGRESS',
          payload: {
            direction: 'forwards',
            isPlaying: false,
            next,
          },
        });

        setIsInteracting(true);
        setInteractionTitle(`Progress: ${next}%`);

        stopPlayer();
      });

      range.addEventListener('change', () => {
        setIsInteracting(false);
        setInteractionTitle('');
      });
    }

    if (audioRange) {
      audioRange.addEventListener('input', (e: Event) => {
        const volume = Number((e.target as HTMLInputElement).value);

        if (audioRef.current) {
          audioRef.current.volume = volume;
        }

        if (audioRef.current) {
          dispatch({
            type: 'SET_VOLUME',
            payload: {
              volume,
            },
          });
        }

        setIsInteracting(true);
        setInteractionTitle(`Volume: ${parseInt(String(volume * 100), 10)}%`);
      });

      audioRange.addEventListener('change', () => {
        setIsInteracting(false);
        setInteractionTitle('');
      });
    }

    return () => {
      if (range) {
        range.removeEventListener('input', () => {});
        range.removeEventListener('change', () => {});
      }

      if (audioRange) {
        audioRange.removeEventListener('input', () => {});
        audioRange.removeEventListener('change', () => {});
      }
    };
  }, [
    dispatch,
    stopPlayer,
    rangeRef.current,
    audioRangeRef.current,
    audioRef.current,
  ]);

  React.useEffect(() => {
    if (activeGraph?.account) {
      const { name, chain, address, balance } = activeGraph.account;
      setActiveTitle(`${name} @ ${chain} ${balance} | Address: ${address}`);
      setActiveMetaData({
        a: '-',
        b: '-',
      });
    } else if (activeGraph?.transaction?.title) {
      setActiveTitle(activeGraph.transaction.title);
      setActiveMetaData({
        a: '-',
        b: '-',
      });
    } else {
      setActiveTitle('Select account or transaction');
      setActiveMetaData({
        a: '-',
        b: '-',
      });
    }
  }, [activeGraph, setActiveTitle]);

  React.useEffect(() => {
    if (
      deployments?.isDeployed &&
      transactions?.list?.block?.length &&
      blockNrs.length
    ) {
      const [startBlockNr, endBlockNr] = blockNrs;
      let title = `Blocks between ${startBlockNr} and ${endBlockNr} contains ${transactions.list.block.length} transactions`;

      if (startBlockNr === endBlockNr) {
        title = `Block ${startBlockNr} with a single transactions`;
      }

      setActiveTitle(title);
    } else {
      setActiveTitle('No deployments found, please deploy a contract');
    }

    return () => {
      if (timerRef.current && progress === 100 - stepSize) {
        stopPlayer();
      }
    };
  }, [
    blockNrs,
    deployments?.isDeployed,
    progress,
    stepSize,
    stopPlayer,
    transactions,
  ]);

  React.useEffect(() => {
    if (!deployments?.isDeployed) {
      setBlockNrs([0, 0]);
      setActiveTitle('No deployments found, please deploy a contract');
    }
  }, [deployments?.isDeployed, setBlockNrs, setActiveTitle]);

  React.useEffect(() => {
    if (deployments?.isDeployed) {
      if (transactions?.list?.block?.length) {
        const blockNrs = transactions.list.block.map(
          (item) => item.blockNumber,
        );
        const minBlockNr = Math.min(...blockNrs);
        const maxBlockNr = Math.max(...blockNrs);
        setBlockNrs([minBlockNr, maxBlockNr]);
      } else {
        setBlockNrs([0, 0]);
      }
    }
  }, [transactions?.list, setBlockNrs, deployments?.isDeployed]);

  React.useEffect(() => {
    if (deployments?.isDeployed && blockNrs.length) {
      const [startBlockNr, endBlockNr] = blockNrs;

      if (startBlockNr === endBlockNr) {
        setTimerLabel(String(startBlockNr));
      } else if (startBlockNr === 0) {
        setTimerLabel('N/A');
      } else {
        setTimerLabel(startBlockNr + '-' + endBlockNr);
      }
    } else {
      setTimerLabel('N/A');
    }
  }, [setTimerLabel, blockNrs, deployments?.isDeployed]);

  React.useEffect(() => {
    if (audioRef.current && state?.graph.options.volume) {
      if (audioRangeRef.current) {
        audioRangeRef.current.value = String(state.graph.options.volume);
      }
      audioRef.current.volume = state.graph.options.volume;
    } else if (audioRef.current?.volume) {
      audioRef.current.volume = 0;
    }
  }, [audioRef.current, state?.graph.options.volume, audioRangeRef.current]);

  if (!graphData) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.main}>
        <span className={[styles.uiDisplayText, styles.i1].join(' ')}>
          <span className="text-lg opacity-50">#</span>
          {timerLabel}
        </span>

        <div className={styles.indicators}>
          <span className={styles.char}>0</span>
          <span className={[styles.char, styles.active].join(' ')}>A</span>
          <span className={styles.char}>I</span>
          <span className={styles.char}>D</span>
          <span className={styles.char}>V</span>
        </div>

        <div className={styles.graphWrapper}>
          {deployments?.isDeployed ? (
            <>
              <div
                ref={graphContainerRef}
                className={styles.graphContainer}
                title="Chain 0 transactions"
              >
                {Object.values(graphData)
                  .map((d) => d.filter((d) => d.network === topGraphId))
                  .map((d, i) => (
                    <div
                      key={`graph-top--${i * stepSize}`}
                      className={[
                        styles.bar,
                        progress === i * stepSize ? styles.active : null,
                      ].join(' ')}
                      style={{ height: getBarHeight(d) }}
                    />
                  ))}
              </div>
              <div
                className={styles.graphContainer}
                title="Chain 1 transactions"
              >
                {Object.values(graphData)
                  .map((d) => d.filter((d) => d.network === bottomGraphId))
                  .map((d, i) => (
                    <div
                      key={`graph-bottom--${i * stepSize}`}
                      className={[
                        styles.bar,
                        progress === i * stepSize ? styles.active : null,
                      ].join(' ')}
                      style={{ height: getBarHeight(d) }}
                    />
                  ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div
        className={[
          styles.uiDisplayText,
          styles.i2,
          isInteracting ? styles.noTransition : null,
        ].join(' ')}
      >
        {isInteracting ? (
          <>
            <span className={styles.i2text}>{interactionTitle}</span>
            <span className={styles.i2text}>{interactionTitle}</span>
          </>
        ) : (
          <>
            <span className={styles.i2text}>{activeTitle}</span>
            <span className={styles.i2text}>{activeTitle}</span>
          </>
        )}
      </div>
      <div className={[styles.uiDisplayText, styles.i3i4wrapper].join(' ')}>
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
          disabled={!deployments?.isDeployed}
        />
      </div>
      <div
        ref={audioTrackRef}
        className={styles.audioTrack}
        style={{
          backgroundPositionY: `${volume * -420 + (volume > 0 ? 15 : 0)}px`,
        }}
      >
        <div
          className={styles.audioTrackHandle}
          style={{ backgroundPositionX: `${volume * 100}%` }}
        />
        <input
          ref={audioRangeRef}
          className={styles.audioProgress}
          type="range"
          min={0}
          max={1}
          step={1 / 28}
          disabled={!deployments?.isDeployed}
        />
      </div>
      <audio ref={audioRef} controls className={styles.audioInput}>
        <source src="/assets/audio/winamp.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      <div className={styles.buttons}>
        <button
          className={[styles.button, styles.prev].join(' ')}
          onClick={() => backwards()}
          disabled={progress === 0}
          title="Go one step back"
        />
        <button
          className={[styles.button, styles.play].join(' ')}
          onClick={() => play()}
          title="Run the playlist - initiate relevant transactions"
        />
        <button
          className={[styles.button, styles.stop].join(' ')}
          onClick={reset}
          title="Reset the playlist"
        />
        <button
          className={[styles.button, styles.next].join(' ')}
          onClick={() => forwards()}
          disabled={progress === 100}
          title="Go one step forward"
        />
        <button
          className={[styles.button, styles.eject].join(' ')}
          onClick={() => deploy()}
          title="Deploy the initial contract"
        />
      </div>
      <div className={styles.logoKadena} />
      <div className={styles.logoEthDenver2025} />
    </section>
  );
};

export default Playback;
