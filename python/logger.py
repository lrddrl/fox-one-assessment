class Logger:
    def __init__(self) -> None:
        self._messages: list[str] = []

    def log(self, message: str) -> None:
        self._messages.append(message)

    def get_logs(self) -> list[str]:
        return list(self._messages)

    def search(self, query: str) -> list[str]:
        needle = query.casefold()
        matched_messages = []
        
        for message in self._messages:
            normalized_message = message.casefold()
            if needle in normalized_message:
                matched_messages.append(message)
                
        return matched_messages


if __name__ == "__main__":
    log = Logger()
    log.log("Server started on :8000")
    log.log("GET /scoreboard 200")
    log.log("MiniMax request failed: timeout")
    print(log.get_logs())
    print(log.search("fail"))