from typing import Optional, Any


class SparseTape:
    """
    Unbounded two-way infinite Turing Machine tape represented as a sparse map.
    Missing keys evaluate to the blank_symbol.
    """

    def __init__(self, blank_symbol: str = "_", initial_content: Optional[dict[int, str]] = None):
        self.blank_symbol = blank_symbol
        # Store only non-blank symbols for memory efficiency and sparse storage
        self._cells: dict[int, str] = {}
        if initial_content:
            for idx, symbol in initial_content.items():
                if symbol != self.blank_symbol:
                    self._cells[int(idx)] = symbol

    @classmethod
    def from_input(cls, input_string: str, blank_symbol: str = "_") -> "SparseTape":
        """Initialize tape with input string placed starting at index 0."""
        tape = cls(blank_symbol=blank_symbol)
        for idx, char in enumerate(input_string):
            if char != blank_symbol:
                tape._cells[idx] = char
        return tape

    def read(self, index: int) -> str:
        """Read the symbol at the given index. Returns blank_symbol if cell is empty."""
        return self._cells.get(index, self.blank_symbol)

    def write(self, index: int, symbol: str) -> None:
        """
        Write a symbol to the cell at index.
        If symbol equals blank_symbol, the entry is pruned to keep storage sparse.
        """
        if symbol == self.blank_symbol:
            self._cells.pop(index, None)
        else:
            self._cells[index] = symbol

    def non_blank_range(self) -> Optional[tuple[int, int]]:
        """Return (min_index, max_index) of non-blank cells, or None if tape is completely blank."""
        if not self._cells:
            return None
        keys = self._cells.keys()
        return min(keys), max(keys)

    def get_window(self, center: int, radius: int = 10) -> list[dict[str, Any]]:
        """
        Return a bounded window of cells centered around an index (typically head position).
        Each cell dictionary contains: index, symbol, is_blank.
        """
        start = center - radius
        end = center + radius
        cells = []
        for idx in range(start, end + 1):
            sym = self.read(idx)
            cells.append({
                "index": idx,
                "symbol": sym,
                "is_blank": sym == self.blank_symbol
            })
        return cells

    def to_dict(self) -> dict[int, str]:
        """Return shallow copy of non-blank cells."""
        return dict(self._cells)

    def clone(self) -> "SparseTape":
        """Return an independent copy of this tape."""
        return SparseTape(blank_symbol=self.blank_symbol, initial_content=self._cells)

    def __repr__(self) -> str:
        nb = self.non_blank_range()
        if not nb:
            return f"SparseTape(empty, blank='{self.blank_symbol}')"
        return f"SparseTape(range=[{nb[0]}, {nb[1]}], count={len(self._cells)}, blank='{self.blank_symbol}')"
