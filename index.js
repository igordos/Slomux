// Slomux - реализация Flux, в которой, как следует из названия, что-то сломано.
// Нужно починить то, что сломано, и подготовить Slomux к использованию на больших проектах, где крайне важна производительность

// ВНИМАНИЕ! Замена slomux на готовое решение не является решением задачи

const createStore = (reducer, initialState) => {
  let currentState = initialState
  let listeners = []
  
  const getState = () => currentState
  // Диспатч действия и уведомление подписчиков
  const dispatch = action => {
    const nextState = reducer(currentState, action);

    // Если состояние изменилось, обновляем его и уведомляем подписчиков
    if (nextState !== currentState) {
      currentState = nextState;
      listeners.forEach(listener => listener());
    }
  };

  // Подписка на изменения состояния
  const subscribe = listener => {
    listeners.push(listener);

    // Возвращаем функцию для отписки
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  return { getState, dispatch, subscribe }
}

const Context = React.createContext(null) 

const useSelector = (selector, equalityFn = (a, b) => a === b) => { 
  const ctx = React.useContext(Context)
 
  if (!ctx) {
    throw new Error("useSelector must be used within a Provider");
  }
  
  const { store } = ctx;
  
  const [selectedState, setSelectedState] = React.useState(() => selector(store.getState()));

  React.useEffect(() => {
    const checkForUpdates = () => {
      const newState = selector(store.getState());

      if (!equalityFn(selectedState, newState)) {
        setSelectedState(newState);
      }
    };

    const unsubscribe = store.subscribe(checkForUpdates);
    checkForUpdates(); // Проверка при монтировании

    return () => unsubscribe(); // Отписка при размонтировании
  }, [store, selector, equalityFn, selectedState]);

  
  return selectedState;
}
const useDispatch = () => {
  const ctx = React.useContext(Context)
  
  if (!ctx) {
    throw new Error("useDispatch must be used within a Provider");
  }
  
  return ctx.store.dispatch
}

const Provider = ({ store, children }) => {
  return <Context.Provider value={{ store }}>{children}</Context.Provider>
}

// APP

// actions
const UPDATE_COUNTER = 'UPDATE_COUNTER'
const CHANGE_STEP_SIZE = 'CHANGE_STEP_SIZE'

// action creators
const updateCounter = value => ({
  type: UPDATE_COUNTER,
  payload: value,
})

const changeStepSize = value => ({
  type: CHANGE_STEP_SIZE,
  payload: value,
})

// reducers
const defaultState = {
  counter: 1,
  stepSize: 1,
}

const reducer = (state = defaultState, action) => {
  switch(action.type) {
    case UPDATE_COUNTER:
      return {
        ...state,
        counter: state.counter + action.payload,
      }
    case CHANGE_STEP_SIZE:
      return {
        ...state, 
        stepSize: action.payload,
      };
    
    default:
      return state;
  }
}

// ВНИМАНИЕ! Использование собственной реализации useSelector и dispatch обязательно
const Counter = () => {  
  const counter = useSelector(state => state.counter);
  const stepSize = useSelector(state => state.stepSize);
  const dispatch = useDispatch();

  return (
    <div>
      <button onClick={() => dispatch(updateCounter(-1 * stepSize))}>-</button>
      <span> {counter} </span>
      <button onClick={() => dispatch(updateCounter(1 * stepSize))}>+</button>
    </div>
  )
}

const Step = () => {
  const stepSize = useSelector(state => state.stepSize, (current, prev) => current === prev)
  const dispatch = useDispatch()

  return (
    <div>
      <div>Значение счётчика должно увеличиваться или уменьшаться на заданную величину шага</div>
      <div>Текущая величина шага: {stepSize}</div>
      <input
        type="range"
        min="1"
        max="5"
        value={stepSize}
        onChange={({ target }) => dispatch(changeStepSize(target.value))}
      />
    </div>
  )
}

ReactDOM.render(
  <Provider store={createStore(reducer, defaultState)}>
      <Step />
      <Counter />
  </Provider>,
  document.getElementById('app')
)

