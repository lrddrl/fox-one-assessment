"""Task 3 - OOP design & API thinking.

A minimal in-memory log store: append messages, read them back, search them.

Design
------
The class has exactly one responsibility: keep log messages in arrival order
and hand them back, optionally filtered by a search term.

* Storage is a ``list[str]``. Append is O(1) amortised and the list preserves
  insertion order for free - exactly the semantics a log needs. There is no
  requirement for random access, dedup, or eviction, so nothing more elaborate
  is justified.
* ``get_logs`` returns a *copy*. Returning the internal list would let callers
  mutate our state by accident (``logger.get_logs().clear()``). The copy keeps
  the class in charge of its own data. Trade-off: O(n) time + memory per call,
  which is fine at this scale; a caller that needs streaming could be given an
  iterator method later.
* ``search`` is a case-insensitive substring match - the least surprising
  default. Not regex (a different, more error-prone contract) and not
  word-boundary matching (callers often search for fragments like error codes).

What this class deliberately does NOT do
----------------------------------------
* timestamps / levels / structured fields -> a ``LogRecord`` value object and
  a richer ``log()`` can be added later without breaking today's callers.
* writing anywhere (file, stdout, network) -> that is a separate "sink"
  concern; keeping it out keeps this class trivially testable.
* synchronisation -> documented as "not thread-safe"; wrap the body of the
  methods in a ``threading.Lock`` if the instance is shared across threads.

Scaling note
------------
``search`` is O(n * m) (n messages x query length) - it rescans everything.
That is fine for thousands, even tens of thousands, of lines. For millions of
rows or heavy query volume the answer is an inverted index (token -> set of
message ids) maintained on ``log()``: faster reads, paid for in write time and
memory. That is a materially more complex object and is not warranted by this
interface.
"""


class Logger:
    """An ordered, in-memory collection of log messages.

    Not thread-safe: guard with a lock if shared across threads.
    """

    def __init__(self) -> None:
        # The single source of truth: messages in the order they were logged.
        self._messages: list[str] = []

    def log(self, message: str) -> None:
        """Append ``message`` to the log."""
        self._messages.append(message)

    def get_logs(self) -> list[str]:
        """Return every message in log order.

        A shallow copy is returned so callers cannot mutate internal state.
        """
        return list(self._messages)

    def search(self, query: str) -> list[str]:
        """Return the messages that contain ``query`` (case-insensitive).

        Matching is substring-based, so ``search("err")`` finds
        ``"Server error"``. An empty query matches every message, mirroring how
        "no filter" normally behaves ("" is a substring of any string).
        """
        needle = query.casefold()  # casefold() > lower() for robust case folding
        return [message for message in self._messages if needle in message.casefold()]


if __name__ == "__main__":
    log = Logger()
    log.log("Server started on :8000")
    log.log("GET /scoreboard 200")
    log.log("MiniMax request failed: timeout")
    print(log.get_logs())
    print(log.search("fail"))  # -> ['MiniMax request failed: timeout']
