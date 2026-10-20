import argparse
import functools
import http.server
import pathlib
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--no-open', action='store_true')
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
raiz = pathlib.Path(__file__).resolve().parent

class Revista(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        caminho = pathlib.Path(self.translate_path(self.path)).resolve()
        if not caminho.is_relative_to(raiz):
            self.send_error(403)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)

handler = functools.partial(Revista, directory=str(raiz))
try:
    servidor = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError:
    servidor = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
endereco = f'http://127.0.0.1:{servidor.server_port}/index.html'
print(f'Revista aberta em {endereco}', flush=True)
print('Feche esta janela para encerrar a revista.', flush=True)
if not args.no_open:
    webbrowser.open(endereco)
try:
    servidor.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    servidor.server_close()
