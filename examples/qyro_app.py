"""
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
    print(f"[Component B - CheckoutSummary] Re-rendered with total: ${total:.2f}")

# Subscribing to specific slices
unsub_user = store.select(select_user_name, on_user_changed)
unsub_cart = store.select(select_cart_total, on_cart_total_changed)

print("\n-- Dispatching CART/ADD_ITEM --")
# ONLY Component B will be notified! Component A is completely skipped!
store.dispatch(Action("CART/ADD_ITEM", {"name": "Trackball Mouse", "price": 65, "qty": 1}))

print("\n-- Dispatching USER/SET_NAME --")
# ONLY Component A will be notified! Component B is completely skipped!
store.dispatch(Action("USER/SET_NAME", "Bob Engineer"))

print(f"\nDevTools traces captured: {len(devtools.history)}")
for trace in devtools.history:
    print(f"Trace #{trace.index} [{trace.action.type}] changed: {trace.changed_paths} ({trace.duration_ms:.2f}ms)")
