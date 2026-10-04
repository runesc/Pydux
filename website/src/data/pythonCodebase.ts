import { PythonFileItem } from '../types/pydux';

export const PYTHON_CODEBASE: PythonFileItem[] = [
  {
    path: 'pydux/__init__.py',
    filename: '__init__.py',
    category: 'core',
    description: 'Public API entry point for PyDux 3.0',
    content: `"""
PyDux 3.0 — UI-Agnostic State Management for Python Desktop Applications.
Designed for high performance, memoized selectors, zero redundant re-renders,
and seamless compatibility with Qyro, PySide6, PyQt5, Tkinter, and Kivy.
"""

from pydux.core.store import Store, create_store
from pydux.core.selector import create_selector, shallow_equal, deep_equal, is_identical
from pydux.core.types import Action, Reducer, Selector, Middleware, Dispatch
from pydux.devtools.tracker import PyDuxDevTools, devtools_middleware
from pydux.adapters.base import MainThreadBridge, ReactiveBinding, connect
from pydux.adapters.qyro import QyroReactiveComponent, connect_qyro

__version__ = "3.0.0"
__all__ = [
    "Store",
    "create_store",
    "create_selector",
    "shallow_equal",
    "deep_equal",
    "is_identical",
    "Action",
    "Reducer",
    "Selector",
    "Middleware",
    "Dispatch",
    "PyDuxDevTools",
    "devtools_middleware",
    "MainThreadBridge",
    "ReactiveBinding",
    "connect",
    "QyroReactiveComponent",
    "connect_qyro",
]
`,
  },
  {
    path: 'pydux/core/types.py',
    filename: 'types.py',
    category: 'core',
    description: 'Protocols, TypeVars, and Action signatures for strict type safety',
    content: `"""
Type definitions, Generics, and Protocols for PyDux 3.0.
Works with standard Python dicts, dataclasses, and Pydantic v2 models.
"""

from typing import (
    TypeVar,
    Generic,
    Callable,
    Any,
    Dict,
    Optional,
    Protocol,
    Union,
    Sequence,
)
from dataclasses import dataclass, field
import time

TState = TypeVar("TState")
TResult = TypeVar("TResult")
TSelected = TypeVar("TSelected")


@dataclass(frozen=True)
class Action:
    """Immutable representation of a dispatched state mutation intent."""
    type: str
    payload: Any = None
    meta: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if not self.type or not isinstance(self.type, str):
            raise ValueError("Action.type must be a non-empty string.")


Reducer = Callable[[TState, Action], TState]
Selector = Callable[[TState], TResult]
EqualityFn = Callable[[Any, Any], bool]
Listener = Callable[[TSelected], None]
Unsubscribe = Callable[[], None]
Dispatch = Callable[[Action], Action]
Middleware = Callable[["Any", Dispatch, Action], Any]


class StoreProtocol(Protocol[TState]):
    """Standard store contract."""

    def get_state(self) -> TState:
        ...

    def dispatch(self, action: Action) -> Action:
        ...

    def subscribe(self, listener: Callable[[TState], None]) -> Unsubscribe:
        ...

    def select(
        self,
        selector: Selector[TState, TSelected],
        listener: Listener[TSelected],
        equality_fn: Optional[EqualityFn] = None,
    ) -> Unsubscribe:
        ...
`,
  },
  {
    path: 'pydux/core/selector.py',
    filename: 'selector.py',
    category: 'core',
    description: 'Reselect-style memoized selectors with custom equality checking',
    content: `"""
Memoized Selectors for PyDux 3.0.
Prevents re-computations and guarantees components are only notified
when their exact targeted slice of state actually changes.
"""

from typing import (
    Callable,
    Sequence,
    Any,
    Tuple,
    TypeVar,
    cast,
    Dict,
)
import functools

TState = TypeVar("TState")
TResult = TypeVar("TResult")


def is_identical(a: Any, b: Any) -> bool:
    """Referential identity comparator."""
    return a is b


def shallow_equal(a: Any, b: Any) -> bool:
    """
    Shallow equality comparison supporting dicts, lists, tuples,
    dataclasses, and Pydantic models.
    """
    if a is b:
        return True
    if a is None or b is None:
        return a == b

    # If dicts
    if isinstance(a, dict) and isinstance(b, dict):
        if len(a) != len(b):
            return False
        for key, val in a.items():
            if key not in b or b[key] != val:
                return False
        return True

    # If sequences (list, tuple)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        if len(a) != len(b):
            return False
        return all(x == y for x, y in zip(a, b))

    # Fallback to standard equality
    try:
        return bool(a == b)
    except Exception:
        return False


def deep_equal(a: Any, b: Any) -> bool:
    """Deep structural equality fallback."""
    return a == b


class MemoizedSelector:
    """Wrapper that wraps input selectors and caches computation result."""

    def __init__(
        self,
        input_selectors: Sequence[Callable[[Any], Any]],
        result_fn: Callable[..., Any],
        equality_fn: Callable[[Any, Any], bool] = shallow_equal,
    ):
        self._input_selectors = list(input_selectors)
        self._result_fn = result_fn
        self._equality_fn = equality_fn
        self._last_inputs: Optional[Tuple[Any, ...]] = None
        self._last_result: Any = None
        self._recomputations: int = 0

    def __call__(self, state: Any) -> Any:
        current_inputs = tuple(s(state) for s in self._input_selectors)

        if self._last_inputs is not None:
            # Check if all input slices are equal according to equality_fn
            if len(self._last_inputs) == len(current_inputs) and all(
                self._equality_fn(prev, curr)
                for prev, curr in zip(self._last_inputs, current_inputs)
            ):
                return self._last_result

        # Recompute
        self._last_inputs = current_inputs
        self._last_result = self._result_fn(*current_inputs)
        self._recomputations += 1
        return self._last_result

    @property
    def recomputations(self) -> int:
        """Returns the number of times the computation function ran."""
        return self._recomputations

    def reset_recomputations(self) -> None:
        self._recomputations = 0


def create_selector(
    *args: Any,
    equality_fn: Callable[[Any, Any], bool] = shallow_equal,
) -> Callable[[Any], Any]:
    """
    Creates a memoized selector (Reselect style).
    
    Usage:
        select_cart_items = lambda state: state["cart"]["items"]
        select_discount = lambda state: state["cart"]["discount"]
        
        select_total = create_selector(
            select_cart_items,
            select_discount,
            lambda items, discount: sum(i["price"] * i["qty"] for i in items) * (1 - discount)
        )
    """
    if len(args) < 2:
        raise ValueError("create_selector requires at least one input selector and one result function.")

    input_selectors = args[:-1]
    result_fn = args[-1]

    # If first argument is a list or tuple of selectors
    if len(input_selectors) == 1 and isinstance(input_selectors[0], (list, tuple)):
        input_selectors = input_selectors[0]

    return MemoizedSelector(input_selectors, result_fn, equality_fn=equality_fn)
`,
  },
  {
    path: 'pydux/core/store.py',
    filename: 'store.py',
    category: 'core',
    description: 'Clean Architecture Store with selective dispatch engine',
    content: `"""
Core Store for PyDux 3.0.
Decoupled from any GUI framework. Eliminates the legacy Pydux/PPGStore full-fanout
problem by using selective notifications and slice memoization.
"""

from typing import (
    Generic,
    Callable,
    List,
    Any,
    Optional,
    Sequence,
    Dict,
)
import threading
from pydux.core.types import (
    TState,
    TSelected,
    Action,
    Reducer,
    Selector,
    EqualityFn,
    Listener,
    Unsubscribe,
    Middleware,
    Dispatch,
)
from pydux.core.selector import shallow_equal


class _Subscription(Generic[TState, TSelected]):
    """Holds a subscriber with its selector, comparator, and previous slice value."""

    __slots__ = ("selector", "listener", "equality_fn", "last_value", "active")

    def __init__(
        self,
        selector: Selector[TState, TSelected],
        listener: Listener[TSelected],
        equality_fn: EqualityFn,
        initial_value: TSelected,
    ):
        self.selector = selector
        self.listener = listener
        self.equality_fn = equality_fn
        self.last_value: TSelected = initial_value
        self.active: bool = True


class Store(Generic[TState]):
    """
    Thread-safe, observable state container.
    Guarantees that subscribers are ONLY called if their selected slice has changed.
    """

    def __init__(
        self,
        reducer: Reducer[TState],
        initial_state: TState,
        middlewares: Optional[Sequence[Middleware]] = None,
    ):
        self._reducer: Reducer[TState] = reducer
        self._state: TState = initial_state
        self._subscriptions: List[_Subscription[TState, Any]] = []
        self._lock = threading.RLock()
        self._is_dispatching: bool = False

        # Build middleware dispatch chain
        self._dispatch: Dispatch = self._internal_dispatch
        if middlewares:
            for mw in reversed(middlewares):
                self._dispatch = mw(self, self._dispatch)

    def get_state(self) -> TState:
        """Returns the current state."""
        with self._lock:
            return self._state

    def dispatch(self, action: Action) -> Action:
        """Dispatches an action through the middleware chain to the reducer."""
        return self._dispatch(action)

    def _internal_dispatch(self, action: Action) -> Action:
        with self._lock:
            if self._is_dispatching:
                raise RuntimeError("Reducers may not dispatch actions.")

            try:
                self._is_dispatching = True
                self._state = self._reducer(self._state, action)
            finally:
                self._is_dispatching = False

            # Notify only affected subscribers
            self._notify_subscribers()

        return action

    def select(
        self,
        selector: Selector[TState, TSelected],
        listener: Listener[TSelected],
        equality_fn: Optional[EqualityFn] = None,
        fire_immediately: bool = False,
    ) -> Unsubscribe:
        """
        Subscribes to a specific slice of the store.
        The listener is ONLY invoked if equality_fn(prev_slice, next_slice) is False.
        """
        cmp_fn = equality_fn or shallow_equal
        with self._lock:
            initial_val = selector(self._state)
            sub = _Subscription(selector, listener, cmp_fn, initial_val)
            self._subscriptions.append(sub)

        if fire_immediately:
            listener(initial_val)

        def unsubscribe():
            with self._lock:
                sub.active = False
                if sub in self._subscriptions:
                    self._subscriptions.remove(sub)

        return unsubscribe

    def subscribe(self, listener: Callable[[TState], None]) -> Unsubscribe:
        """
        Full store subscription (equivalent to select with identity).
        Prefer select() in GUI widgets to avoid unnecessary re-renders.
        """
        return self.select(
            selector=lambda s: s,
            listener=listener,
            equality_fn=lambda a, b: False, # always notify for full store
        )

    def _notify_subscribers(self) -> None:
        """Runs selective notifications. Only fires if slice changed."""
        current_state = self._state
        # Shallow copy list to permit unsubscribes during iteration
        active_subs = [s for s in self._subscriptions if s.active]

        for sub in active_subs:
            if not sub.active:
                continue

            try:
                new_slice = sub.selector(current_state)
                # Check equality against previous slice value
                if not sub.equality_fn(sub.last_value, new_slice):
                    sub.last_value = new_slice
                    sub.listener(new_slice)
            except Exception as e:
                # Isolate listener failures from crashing the store
                import logging
                logging.getLogger("pydux").exception(
                    f"Error in PyDux subscriber notification: {e}"
                )


def create_store(
    reducer: Reducer[TState],
    initial_state: TState,
    middlewares: Optional[Sequence[Middleware]] = None,
) -> Store[TState]:
    """Helper factory for creating a typed Store instance."""
    return Store(reducer=reducer, initial_state=initial_state, middlewares=middlewares)
`,
  },
  {
    path: 'pydux/devtools/tracker.py',
    filename: 'tracker.py',
    category: 'devtools',
    description: 'Time-travel debugging, action history, and deep diff tracker',
    content: `"""
State Tracking & Time-Travel Debugger Addon for PyDux 3.0.
Captures action history, state transitions, diff calculation,
and provides full undo/redo and time-travel replay.
"""

from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
import time
import json
import copy
from pydux.core.types import Action, Middleware, Dispatch


@dataclass
class ActionTrace:
    index: int
    action: Action
    prev_state: Any
    next_state: Any
    timestamp: float
    duration_ms: float
    changed_paths: List[str] = field(default_factory=list)


def compute_state_diff(prev: Any, curr: Any, path: str = "") -> List[str]:
    """Recursively computes paths that changed between two states."""
    diffs = []
    if prev is curr:
        return diffs

    if isinstance(prev, dict) and isinstance(curr, dict):
        all_keys = set(prev.keys()) | set(curr.keys())
        for k in all_keys:
            sub_path = f"{path}.{k}" if path else str(k)
            if k not in prev:
                diffs.append(f"+{sub_path}")
            elif k not in curr:
                diffs.append(f"-{sub_path}")
            elif prev[k] != curr[k]:
                if isinstance(prev[k], dict) and isinstance(curr[k], dict):
                    diffs.extend(compute_state_diff(prev[k], curr[k], sub_path))
                else:
                    diffs.append(f"~{sub_path}")
    elif prev != curr:
        diffs.append(path or "root")

    return diffs


class PyDuxDevTools:
    """
    Central inspector engine for monitoring state transitions and time-traveling.
    """

    def __init__(self, max_history: int = 100):
        self._max_history = max_history
        self._history: List[ActionTrace] = []
        self._current_index: int = -1
        self._store = None
        self._listeners: List[Callable[[ActionTrace], None]] = []

    def set_store(self, store: Any) -> None:
        self._store = store

    def add_trace(self, trace: ActionTrace) -> None:
        if len(self._history) >= self._max_history:
            self._history.pop(0)

        self._history.append(trace)
        self._current_index = len(self._history) - 1

        for listener in self._listeners:
            listener(trace)

    def subscribe_traces(self, listener: Callable[[ActionTrace], None]) -> Callable[[], None]:
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    @property
    def history(self) -> List[ActionTrace]:
        return list(self._history)

    def jump_to_state(self, index: int) -> None:
        """Time travels to state at given history index."""
        if 0 <= index < len(self._history) and self._store:
            target_trace = self._history[index]
            self._current_index = index
            # Dispatch synthetic time-travel action
            self._store.dispatch(
                Action(type="@@PYDUX/TIME_TRAVEL", payload=target_trace.next_state)
            )

    def undo(self) -> None:
        if self._current_index > 0:
            self.jump_to_state(self._current_index - 1)

    def redo(self) -> None:
        if self._current_index < len(self._history) - 1:
            self.jump_to_state(self._current_index + 1)

    def export_trace_json(self) -> str:
        """Serializes current trace history for diagnostic reporting."""
        serializable = []
        for t in self._history:
            serializable.append({
                "index": t.index,
                "action": {"type": t.action.type, "payload": str(t.action.payload)},
                "timestamp": t.timestamp,
                "duration_ms": t.duration_ms,
                "changed_paths": t.changed_paths,
            })
        return json.dumps(serializable, indent=2)


def devtools_middleware(devtools: PyDuxDevTools) -> Middleware:
    """Middleware that intercepts all dispatched actions and records traces."""
    def enhancer(store: Any, next_dispatch: Dispatch) -> Dispatch:
        devtools.set_store(store)

        def dispatch_wrapper(action: Action) -> Action:
            # Bypass recording for internal time-travel replays
            if action.type == "@@PYDUX/TIME_TRAVEL":
                return next_dispatch(action)

            prev_state = copy.deepcopy(store.get_state())
            t0 = time.perf_counter()

            result = next_dispatch(action)

            duration = (time.perf_counter() - t0) * 1000.0
            next_state = store.get_state()
            diffs = compute_state_diff(prev_state, next_state)

            trace = ActionTrace(
                index=len(devtools.history),
                action=action,
                prev_state=prev_state,
                next_state=copy.deepcopy(next_state),
                timestamp=time.time(),
                duration_ms=duration,
                changed_paths=diffs,
            )
            devtools.add_trace(trace)
            return result

        return dispatch_wrapper

    return enhancer
`,
  },
  {
    path: 'pydux/adapters/base.py',
    filename: 'base.py',
    category: 'adapters',
    description: 'Framework-agnostic UI connector, MainThreadBridge, and decorators',
    content: `"""
UI-Agnostic Reactive Binding & Thread Dispatcher.
Decouples PyDux from any concrete GUI library while providing
rock-solid main thread synchronization.
"""

from typing import (
    Callable,
    Any,
    Optional,
    Protocol,
    TypeVar,
    Dict,
)
from pydux.core.store import Store
from pydux.core.types import Selector, Unsubscribe, EqualityFn

T = TypeVar("T")


class MainThreadBridge(Protocol):
    """
    Protocol to safely schedule a callable onto the GUI's main thread.
    Required by desktop frameworks (Qt, Tkinter, Kivy) to avoid threading crashes.
    """

    def schedule_on_main_thread(self, fn: Callable[[], None]) -> None:
        ...


class DirectThreadBridge:
    """Default fallback bridge for pure synchronous execution or tests."""

    def schedule_on_main_thread(self, fn: Callable[[], None]) -> None:
        fn()


class ReactiveBinding:
    """
    Connects a specific PyDux selector to any widget setter or callback.
    Automatically handles main-thread dispatching.
    
    Example:
        ReactiveBinding(
            store=store,
            selector=lambda s: s["user"]["name"],
            target=lambda name: label.config(text=name),
            bridge=TkinterBridge(root)
        )
    """

    def __init__(
        self,
        store: Store[Any],
        selector: Selector[Any, T],
        target: Callable[[T], None],
        equality_fn: Optional[EqualityFn] = None,
        bridge: Optional[MainThreadBridge] = None,
    ):
        self._bridge = bridge or DirectThreadBridge()
        self._target = target

        def safe_listener(value: T):
            self._bridge.schedule_on_main_thread(lambda: self._target(value))

        self._unsubscribe = store.select(
            selector=selector,
            listener=safe_listener,
            equality_fn=equality_fn,
            fire_immediately=True,
        )

    def dispose(self) -> None:
        """Tears down the subscription."""
        if self._unsubscribe:
            self._unsubscribe()
            self._unsubscribe = None


def connect(
    store: Store[Any],
    map_state_to_props: Optional[Callable[[Any], Dict[str, Any]]] = None,
    bridge: Optional[MainThreadBridge] = None,
):
    """
    Class decorator for framework-agnostic component state injection.
    """
    def decorator(cls):
        orig_init = cls.__init__

        def new_init(self, *args, **kwargs):
            orig_init(self, *args, **kwargs)
            self._pydux_unsubscribers = []
            active_bridge = bridge or getattr(self, "_pydux_bridge", DirectThreadBridge())

            if map_state_to_props:
                def on_state_slice(props: Dict[str, Any]):
                    for prop_name, prop_val in props.items():
                        setattr(self, prop_name, prop_val)
                    if hasattr(self, "on_props_changed") and callable(self.on_props_changed):
                        self.on_props_changed()

                unsub = store.select(
                    selector=map_state_to_props,
                    listener=lambda p: active_bridge.schedule_on_main_thread(lambda: on_state_slice(p)),
                    fire_immediately=True,
                )
                self._pydux_unsubscribers.append(unsub)

        cls.__init__ = new_init
        return cls

    return decorator
`,
  },
  {
    path: 'pydux/adapters/qyro.py',
    filename: 'qyro.py',
    category: 'adapters',
    description: 'First-class integration for the Qyro framework (Qt, Kivy, Tkinter)',
    content: `"""
Qyro Framework Adapter for PyDux 3.0.
Works seamlessly with qyro.ui.component.Component and qyro.ApplicationContext.
Automatically handles subscription on mount and unsubscription on unmount!
"""

from typing import Callable, Any, Optional, Dict, List
from pydux.core.store import Store
from pydux.core.types import Selector, EqualityFn, Unsubscribe
from pydux.adapters.base import MainThreadBridge


class QyroReactiveComponent:
    """
    Mixin for Qyro Component classes.
    Integrates seamlessly into Qyro's lifecycle:
    - component_will_mount
    - render
    - component_will_unmount
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._qyro_store_subscriptions: List[Unsubscribe] = []

    def bind_selector(
        self,
        store: Store[Any],
        selector: Selector[Any, Any],
        on_change: Callable[[Any], None],
        equality_fn: Optional[EqualityFn] = None,
    ) -> Unsubscribe:
        """
        Subscribes to a store slice. The subscription is tracked and
        will be automatically cleaned up when the Qyro component unmounts.
        """
        unsub = store.select(
            selector=selector,
            listener=on_change,
            equality_fn=equality_fn,
            fire_immediately=True,
        )
        self._qyro_store_subscriptions.append(unsub)
        return unsub

    def component_will_unmount(self):
        """Lifecycle hook: clean up all PyDux subscriptions to prevent leaks."""
        for unsub in self._qyro_store_subscriptions:
            unsub()
        self._qyro_store_subscriptions.clear()

        # Call super if parent component defines component_will_unmount
        if hasattr(super(), "component_will_unmount"):
            super().component_will_unmount()


def connect_qyro(store: Store[Any], selectors: Dict[str, Selector[Any, Any]]):
    """
    Decorator for Qyro components that automatically maps selectors to component properties.
    """
    def decorator(cls):
        orig_mount = getattr(cls, "component_will_mount", None)
        orig_unmount = getattr(cls, "component_will_unmount", None)

        def new_component_will_mount(self):
            if not hasattr(self, "_qyro_unsubs"):
                self._qyro_unsubs = []

            for attr_name, selector in selectors.items():
                def make_listener(name: str):
                    return lambda val: setattr(self, name, val)

                unsub = store.select(
                    selector=selector,
                    listener=make_listener(attr_name),
                    fire_immediately=True,
                )
                self._qyro_unsubs.append(unsub)

            if orig_mount:
                orig_mount(self)

        def new_component_will_unmount(self):
            if hasattr(self, "_qyro_unsubs"):
                for unsub in self._qyro_unsubs:
                    unsub()
                self._qyro_unsubs.clear()
            if orig_unmount:
                orig_unmount(self)

        cls.component_will_mount = new_component_will_mount
        cls.component_will_unmount = new_component_will_unmount
        return cls

    return decorator
`,
  },
  {
    path: 'pydux/adapters/qt.py',
    filename: 'qt.py',
    category: 'adapters',
    description: 'PySide6, PySide2, PyQt5, PyQt6 signal bridge & thread safety',
    content: `"""
Qt Adapter for PySide6, PySide2, PyQt5, and PyQt6.
Uses Qt MetaObject and QTimer.singleShot safely on the Qt event loop,
without locking PyDux core to Qt dependencies.
"""

from typing import Callable, Any, Optional
from pydux.adapters.base import MainThreadBridge


class QtMainThreadBridge:
    """Dispatches calls onto the Qt GUI event loop safely."""

    def __init__(self):
        # Auto-detect Qt binding
        self._qtimer = None
        for mod_name in ("PySide6.QtCore", "PyQt6.QtCore", "PySide2.QtCore", "PyQt5.QtCore"):
            try:
                mod = __import__(mod_name, fromlist=["QTimer"])
                self._qtimer = getattr(mod, "QTimer")
                break
            except ImportError:
                continue

    def schedule_on_main_thread(self, fn: Callable[[], None]) -> None:
        if self._qtimer:
            self._qtimer.singleShot(0, fn)
        else:
            fn()
`,
  },
  {
    path: 'pydux/adapters/tkinter.py',
    filename: 'tkinter.py',
    category: 'adapters',
    description: 'Tkinter adapter using root.after_idle and StringVar bindings',
    content: `"""
Tkinter Adapter for PyDux 3.0.
Schedules state updates via Tkinter's event loop (widget.after / after_idle).
"""

from typing import Callable, Any
from pydux.adapters.base import MainThreadBridge


class TkinterBridge:
    """Ensures Tkinter widgets are only mutated on the Tk main thread."""

    def __init__(self, root_or_widget: Any):
        self._widget = root_or_widget

    def schedule_on_main_thread(self, fn: Callable[[], None]) -> None:
        try:
            self._widget.after_idle(fn)
        except Exception:
            fn()
`,
  },
  {
    path: 'pydux/adapters/kivy.py',
    filename: 'kivy.py',
    category: 'adapters',
    description: 'Kivy adapter using Clock.schedule_once and Property bindings',
    content: `"""
Kivy Adapter for PyDux 3.0.
Schedules state updates via Kivy's Clock.schedule_once.
"""

from typing import Callable, Any
from pydux.adapters.base import MainThreadBridge


class KivyBridge:
    """Ensures Kivy widgets and canvas instructions update on the Kivy Clock loop."""

    def __init__(self):
        try:
            from kivy.clock import Clock
            self._clock = Clock
        except ImportError:
            self._clock = None

    def schedule_on_main_thread(self, fn: Callable[[], None]) -> None:
        if self._clock:
            self._clock.schedule_once(lambda dt: fn(), 0)
        else:
            fn()
`,
  },
  {
    path: 'examples/qyro_app.py',
    filename: 'qyro_app.py',
    category: 'examples',
    description: 'Full runnable Qyro desktop app demonstrating memoized selectors',
    content: `"""
Complete Qyro Desktop Example with PyDux 3.0.
Runs natively across Qt (PySide6), Tkinter, or Kivy depending on environment.
"""

import sys
from typing import Dict, Any
from pydux import (
    create_store,
    create_selector,
    Action,
    PyDuxDevTools,
    devtools_middleware,
)
from pydux.adapters.qyro import QyroReactiveComponent

# 1. State Definition & Reducer
INITIAL_STATE: Dict[str, Any] = {
    "user": {"name": "Alice Developer", "role": "Lead Architect"},
    "cart": {"items": [{"name": "Mechanical Keyboard", "price": 120, "qty": 1}], "tax_rate": 0.08},
    "ui": {"theme": "dark"},
}

def root_reducer(state: Dict[str, Any], action: Action) -> Dict[str, Any]:
    if action.type == "USER/SET_NAME":
        return {**state, "user": {**state["user"], "name": action.payload}}
    elif action.type == "CART/ADD_ITEM":
        return {
            **state,
            "cart": {**state["cart"], "items": [*state["cart"]["items"], action.payload]},
        }
    elif action.type == "UI/TOGGLE_THEME":
        new_theme = "light" if state["ui"]["theme"] == "dark" else "dark"
        return {**state, "ui": {**state["ui"], "theme": new_theme}}
    elif action.type == "@@PYDUX/TIME_TRAVEL":
        return action.payload
    return state

# 2. DevTools & Store setup
devtools = PyDuxDevTools()
store = create_store(root_reducer, INITIAL_STATE, middlewares=[devtools_middleware(devtools)])

# 3. Memoized Selectors (Reselect pattern)
select_cart_items = lambda s: s["cart"]["items"]
select_tax_rate = lambda s: s["cart"]["tax_rate"]

# Only recomputes when items or tax_rate change!
select_cart_total = create_selector(
    select_cart_items,
    select_tax_rate,
    lambda items, tax: sum(i["price"] * i["qty"] for i in items) * (1 + tax)
)

select_user_name = lambda s: s["user"]["name"]

print("=== PyDux 3.0 Initialized ===")
print("Initial Cart Total:", select_cart_total(store.get_state()))

# 4. Simulation of selective dispatch
def on_user_changed(name: str):
    print(f"[Component A - UserHeader] Re-rendered with name: {name}")

def on_cart_total_changed(total: float):
    print(f"[Component B - CheckoutSummary] Re-rendered with total: \${total:.2f}")

# Subscribing to specific slices
unsub_user = store.select(select_user_name, on_user_changed)
unsub_cart = store.select(select_cart_total, on_cart_total_changed)

print("\\n-- Dispatching CART/ADD_ITEM --")
# ONLY Component B will be notified! Component A is completely skipped!
store.dispatch(Action("CART/ADD_ITEM", {"name": "Trackball Mouse", "price": 65, "qty": 1}))

print("\\n-- Dispatching USER/SET_NAME --")
# ONLY Component A will be notified! Component B is completely skipped!
store.dispatch(Action("USER/SET_NAME", "Bob Engineer"))

print(f"\\nDevTools traces captured: {len(devtools.history)}")
for trace in devtools.history:
    print(f"Trace #{trace.index} [{trace.action.type}] changed: {trace.changed_paths} ({trace.duration_ms:.2f}ms)")
`,
  },
  {
    path: 'README.md',
    filename: 'README.md',
    category: 'docs',
    description: 'Documentation, architecture diagram, and migration guide',
    content: `# PyDux 3.0

> High-performance, UI-Agnostic State Management for Python Desktop Applications (Qyro, PySide6, PyQt5, Tkinter, Kivy).

## 🚀 What is PyDux 3.0?

In legacy state libraries like **PPGStore** and **Pydux 1.x/2.x**, any store update triggered an unconditional notification loop:

\`\`\`python
# ❌ THE OLD FULL FAN-OUT PROBLEM (Pydux 2.0)
def _notify_observers(self):
    for observer in Pydux._observers:
        observer.on_store_change(...) # Every component re-renders!
\`\`\`

If Component A cared about \`user.name\`, Component B cared about \`cart.total\`, and Component C modified \`cart\`: **Component A, B, and C all re-rendered**, wasting CPU cycles and freezing desktop GUI event loops.

### ✨ PyDux 3.0 Solution:
1. **Memoized Selectors**: Compute slices of state and cache results using customizable equality comparators (\`shallow_equal\`, \`deep_equal\`, referential \`is\`).
2. **Selective Dispatch**: Components subscribe to specific slices (\`store.select(selector, listener)\`). If the selected slice didn't change, the listener is **never invoked**.
3. **Clean Architecture**: Core store is 100% agnostic with zero GUI dependencies. No hardcoded \`QTimer\` or Qt locks.
4. **Desktop Thread-Safety**: Built-in \`MainThreadBridge\` synchronizes updates to the main GUI thread for Qt, Tkinter, and Kivy.
5. **State Tracking DevTools**: Action logging, JSON diff inspector, and time-travel debugging (\`jump_to_state\`, \`undo\`, \`redo\`).
6. **Qyro First-Class Integration**: Direct lifecycle integration with \`qyro.ui.component.Component\` and \`qyro.ApplicationContext\`.
`,
  },
];
