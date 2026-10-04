# PyDux 3.0

> High-performance, UI-Agnostic State Management for Python Desktop Applications (Qyro, PySide6, PyQt5, Tkinter, Kivy).

## 🚀 What is PyDux 3.0?

In legacy state libraries like **PPGStore** and **Pydux 1.x/2.x**, any store update triggered an unconditional notification loop:

```python
# ❌ THE OLD FULL FAN-OUT PROBLEM (Pydux 2.0)
def _notify_observers(self):
    for observer in Pydux._observers:
        observer.on_store_change(...) # Every component re-renders!
```

If Component A cared about `user.name`, Component B cared about `cart.total`, and Component C modified `cart`: **Component A, B, and C all re-rendered**, wasting CPU cycles and freezing desktop GUI event loops.

### ✨ PyDux 3.0 Solution:
1. **Memoized Selectors**: Compute slices of state and cache results using customizable equality comparators (`shallow_equal`, `deep_equal`, referential `is`).
2. **Selective Dispatch**: Components subscribe to specific slices (`store.select(selector, listener)`). If the selected slice didn't change, the listener is **never invoked**.
3. **Clean Architecture**: Core store is 100% agnostic with zero GUI dependencies. No hardcoded `QTimer` or Qt locks.
4. **Desktop Thread-Safety**: Built-in `MainThreadBridge` synchronizes updates to the main GUI thread for Qt, Tkinter, and Kivy.
5. **State Tracking DevTools**: Action logging, JSON diff inspector, and time-travel debugging (`jump_to_state`, `undo`, `redo`).
6. **Qyro First-Class Integration**: Direct lifecycle integration with `qyro.ui.component.Component` and `qyro.ApplicationContext`.
