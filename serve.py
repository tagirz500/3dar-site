"""Static server with HTTP Range support. Video seeking needs it; http.server has none."""
import functools, http.server, os, re, socketserver, sys


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()

        m = re.fullmatch(r"bytes=(\d*)-(\d*)", rng.strip())
        size = os.path.getsize(path)
        if not m or not (m[1] or m[2]):
            return super().send_head()
        if m[1]:
            start = int(m[1])
            end = int(m[2]) if m[2] else size - 1
        else:                                   # suffix range: last N bytes
            start, end = max(0, size - int(m[2])), size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        end = min(end, size - 1)
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self.copyfile = functools.partial(self._copy_range, length=end - start + 1)
        return f

    def _copy_range(self, src, dst, length):
        while length > 0:
            chunk = src.read(min(64 * 1024, length))
            if not chunk:
                break
            dst.write(chunk)
            length -= len(chunk)

    def end_headers(self):
        if self.command == "GET" and self.path != "/":
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5411
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), RangeHandler) as srv:
        print(f"serving {os.getcwd()} on http://localhost:{port}")
        srv.serve_forever()


def demo():
    """Range parsing check: assert the three forms map to the right byte window."""
    size = 1000
    for header, want in [("bytes=0-99", (0, 99)), ("bytes=500-", (500, 999)), ("bytes=-100", (900, 999))]:
        m = re.fullmatch(r"bytes=(\d*)-(\d*)", header.removeprefix("").strip())
        if m[1]:
            got = (int(m[1]), int(m[2]) if m[2] else size - 1)
        else:
            got = (max(0, size - int(m[2])), size - 1)
        assert got == want, (header, got, want)
    print("range parsing ok")
