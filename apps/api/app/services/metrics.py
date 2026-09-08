from collections import Counter
from threading import Lock

class Metrics:
    def __init__(self):self.counters=Counter();self._lock=Lock()
    def increment(self,name:str,labels:str="")->None:
        with self._lock:self.counters[(name,labels)]+=1
    def prometheus(self)->str:
        with self._lock:items=sorted(self.counters.items())
        return "\n".join(f'{name}{{key="{labels}"}} {value}' if labels else f"{name} {value}" for (name,labels),value in items)+"\n"
