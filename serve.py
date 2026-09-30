# Servidor local sin caché para la demo de SULPHUR: python serve.py  ->  http://localhost:5173
import http.server

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

NoCache.extensions_map['.js'] = 'text/javascript'
http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(('', 5173), NoCache) as httpd:
    print('SULPHUR en http://localhost:5173', flush=True)
    httpd.serve_forever()
