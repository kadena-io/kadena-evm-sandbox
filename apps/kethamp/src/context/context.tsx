"use client";

import React from "react";

const Context = React.createContext(null);
const ContextDispatch = React.createContext(null);

const ContextProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(
    stateReducer,
    initialState,
  );

  return (
    <Context.Provider value={state}>
      <ContextDispatch.Provider value={dispatch}>
        {children}
      </ContextDispatch.Provider>
    </Context.Provider>
  );
};

export function useContext() {
  return React.useContext(Context);
}

export function useContextDispatch() {
  return React.useContext(ContextDispatch);
}


function groupByStep(list, step) {
  const grouped: Record<string, any[]> = {};
  const keys = Object.keys(list).map(parseFloat);

  const minKey = Math.floor(Math.min(...keys) / step) * step;
  const maxKey = Math.ceil(Math.max(...keys) / step) * step;

  for (let i = minKey; i <= maxKey; i += step) {
    grouped[i] = [];
  }

  keys.forEach(key => {
    const groupKey = Math.floor(key / step) * step;
    grouped[groupKey]?.push(...list[key.toString()]);
  });

  return grouped
}

function groupTransactions(transactions, stepSize) {
  if (transactions) {
    const minBlockNumber = transactions.reduce((acc, d) => Math.min(acc, d.blockNumber), Infinity);
    const lastBlockNumber = transactions.reduce((acc, d) => Math.max(acc, d.blockNumber), 0);
    const duration = lastBlockNumber - minBlockNumber;
    const steps = 100 / duration;

    const transactionsByPercentage = transactions.reduce((acc, d) => {
      const percentage = ((d.blockNumber - minBlockNumber) / duration) * 100;
      const step = Math.floor(percentage * steps);
      
      return {
        ...acc,
        [percentage]: acc[step] ? [...acc[step], d] : [d],
      }
    }, {});

    return groupByStep(transactionsByPercentage, stepSize);
  }
}

function networks(transactions) {
  if (!transactions) {
    return [];
  }

  return transactions.reduce((acc, d) => {
    if (!acc.includes(d.network)) {
      return [...acc, d.network];
    }

    return acc;
  }, []);
}

function maxSize(data) {
  if (!data) {
    return 0;
  }

  return Object.values(data).reduce((count: number, arr) => {
    if (arr.length > count) {
      return arr.length;
    }

    return count
  }, 0);
}

function getTransactionsList (state, graphData) {
  const { progress } = state.graph.options;

  if (graphData) {
    return graphData[progress] ?? [];
  }
  
  return state.graph.data[progress] ?? [];
}

function getTransactionsListByNetwork (state, networkList, graphData) {
  const { progress } = state.graph.options;
  let data = state.graph.data[progress] ?? [];
  
  if (graphData) {
    data = graphData[progress] ?? [];
  }

  if (data && (networkList || state.networks.list)) {
    
    debugger

    return (networkList || state.networks.list).reduce((list, networkId) => {
      return [
        ...list,
        {
          title: networkId,
          list: data.filter(d => d.network === networkId),
        },
      ]
    }, []);
  }

  return [];
}

function stateReducer(state, action) {
  switch (action.type) {
    case "UPDATE_DATA":
      {
        const graphData = groupTransactions(action.payload.transactions, state.graph.options.stepSize);
        const networkData = networks(action.payload.transactions);
        
        return {
          ...state,
          networks: {
            ...state.networkds,
            list: networkData,
          },
          accounts: {
            ...state.accounts,
            data: action.payload.accounts,
            list: [],
          },
          transactions: {
            ...state.transactions,
            data: action.payload.transactions,
            list: {
              block: getTransactionsList(state, graphData),
              network: getTransactionsListByNetwork(state, networkData, graphData),
            },
          },
          graph: {
            ...state.graph,
            data: graphData,
            options: {
              ...state.graph.options,
              maxStepCount: maxSize(graphData),
            }
          },
        };
      }

    case "UPDATE_ACCOUNTS":
      return {
        ...state,
        accounts: {
          data: action.payload.accounts,
          list: [],/* accounts(action.payload.transactions) */
        },
      };
    
    case "UPDATE_TRANSCATIONS":
      return {
        ...state,
        transactions: action.payload.transactions,
      };

    case "RESET_PROGRESS": {
      return {
        ...state,
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            progress: 0,
          }
        }
      }
    }

    case "SET_PROGRESS": {
      const progress = action.payload.progress ?? state.graph.options.progress;
      let next = action.payload.next ?? 0;

      if (action.payload.direction === 'forwards') {
        if (progress < 100) {
          if (next > 100) {
            next = 100;
          }
        }
      } else if (action.payload.direction === 'backwards') {
        if (progress > 0 && next < 0) {
          next = 0;
        }
      }

      const nextState = {...state };
      nextState.graph.options.progress = next;

      return {
        ...state,
        transactions: {
          ...state.transactions,
          list: {
            block: getTransactionsList(nextState),
            network: getTransactionsListByNetwork(nextState),
          },
        },
        networks: {
          ...state.networks,
        },
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            progress: action.payload.progress ?? next,
          }
        }
      }
    }

    case "LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    default:
      return state;
  }
}

const initialState = {
  isLoading: true,
  
  accounts: {
    isLoading: false,
    list: [],
    data: {},
  },
  transactions: {
    isLoading: false,
    list: [],
    data: {},
  },
  graph: {
    data: {},
    options: {
      progress: 0,
      stepSize: 10,
      maxStepCount: 0,
    },
  },
  networks: {
    list: [],
  },
}

export default ContextProvider;
