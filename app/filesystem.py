
import os
from typing import Any


def _get_write_type(content: Any):
    if isinstance(content, str):
        return 'w'
    elif isinstance(content, bytes):
        return 'wb'
    else:
        raise TypeError(f"content must be str or bytes, not {type(content)}")
        
        
class FileSystem:
    def __init__(self, root: str) -> None:
        self.root = root
    
    def save(self, path: str, content: str) -> None:
        with open(os.path.join(self.root, path), _get_write_type(content)) as f:
            f.write(content)
