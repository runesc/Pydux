"""
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
