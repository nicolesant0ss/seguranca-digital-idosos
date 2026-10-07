"""
Back-end do projeto "Golpe do Amor: Reconheça e se Proteja" (Squad 5 - USJT).

Responsabilidades:
  - Servir as perguntas do quiz SEM revelar a resposta certa
  - Corrigir cada resposta e devolver a explicação
  - Calcular a pontuação final
  - Guardar estatísticas ANÔNIMAS (sem nome, IP ou qualquer dado pessoal)

Rodar localmente:
  pip install -r requirements.txt
  python app.py
  -> abra http://localhost:5000
"""
import json
import os
import sqlite3
import threading
import urllib.parse
import urllib.request
from contextlib import closing
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).parent
DB_PATH = os.environ.get("QUIZ_DB", str(BASE_DIR / "quiz.db"))

ARQUIVOS_PUBLICOS = {
    "index.html",
    "resultados.html",
    "quiz.js",
    "style.css",
    "imagemex.png",
    "pergunta01.jpeg", "pergunta02.jpeg", "pergunta03.jpeg",
    "pergunta04.jpeg", "pergunta05.jpeg", "pergunta06.jpeg",
    "pergunta07.jpeg", "pergunta08.jpeg", "pergunta09.jpeg",
    "pergunta10.jpeg",
}

app = Flask(__name__, static_folder=None, static_url_path="")

# ------------------------------------------------- Google Forms
# Cole aqui (ou defina como variável de ambiente) os dados do SEU formulário.
# Veja o passo a passo no README.
GOOGLE_FORM_URL = os.environ.get(
    "GOOGLE_FORM_URL",
    "https://docs.google.com/forms/d/e/1FAIpQLSdsKR-9VmSp5Edb6UUtnAfMsMtAV0h7CtKnkB85CtPrxDigcg/formResponse",
)
ENTRY_PONTUACAO = os.environ.get("ENTRY_PONTUACAO", "entry.2116103135")
ENTRY_PERCENTUAL = os.environ.get("ENTRY_PERCENTUAL", "entry.414317942")
ENTRY_DETALHES = os.environ.get("ENTRY_DETALHES", "entry.1146158771")


def _post_google_forms(campos):
    corpo = urllib.parse.urlencode(campos).encode("utf-8")
    req = urllib.request.Request(GOOGLE_FORM_URL, data=corpo, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:  # nunca derruba o quiz por causa do Forms
        print("Aviso: não foi possível enviar ao Google Forms:", e)


def enviar_para_google_forms(pontuacao, total, detalhes):
    """Envia o resultado ao Google Forms em segundo plano."""
    if not GOOGLE_FORM_URL:
        return
    campos = {
        ENTRY_PONTUACAO: f"{pontuacao}/{total}",
        ENTRY_PERCENTUAL: f"{round(pontuacao / total * 100)}%",
        ENTRY_DETALHES: detalhes,
    }
    threading.Thread(target=_post_google_forms, args=(campos,), daemon=True).start()


# ---------------------------------------------------------------- dados
with open(BASE_DIR / "perguntas.json", encoding="utf-8") as f:
    PERGUNTAS = {p["id"]: p for p in json.load(f)}


# ------------------------------------------------------------- banco
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_db()) as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS respostas (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                pergunta_id INTEGER NOT NULL,
                correta     INTEGER NOT NULL,
                criada_em   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS partidas (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                pontuacao INTEGER NOT NULL,
                total     INTEGER NOT NULL,
                criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS feedback (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                avaliacao  TEXT NOT NULL,
                criada_em  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        db.commit()


init_db()


# ------------------------------------------------------------ helpers
def erro(msg, status=400):
    return jsonify({"erro": msg}), status


def indice_certo(pergunta):
    return next(i for i, o in enumerate(pergunta["opcoes"]) if o["certa"])


def validar_resposta(pergunta_id, opcao):
    """Devolve (pergunta, None) se válido, ou (None, mensagem_de_erro)."""
    if not isinstance(pergunta_id, int) or isinstance(pergunta_id, bool):
        return None, "pergunta_id deve ser um número inteiro."
    pergunta = PERGUNTAS.get(pergunta_id)
    if pergunta is None:
        return None, "Pergunta não encontrada."
    if (
        not isinstance(opcao, int)
        or isinstance(opcao, bool)
        or not 0 <= opcao < len(pergunta["opcoes"])
    ):
        return None, "Opção inválida."
    return pergunta, None


# -------------------------------------------------------------- rotas
@app.get("/")
def home():
    return send_from_directory(str(BASE_DIR), "index.html")


@app.get("/<path:filename>")
def servir_estatico(filename):
    if filename in ARQUIVOS_PUBLICOS:
        return send_from_directory(str(BASE_DIR), filename)
    return erro("Não encontrado", 404)


@app.get("/api/perguntas")
def listar_perguntas():
    """Perguntas sem 'certa' e sem 'explicacao' (a correção é feita aqui)."""
    saida = [
        {
            "id": p["id"],
            "imagem": p["imagem"],
            "imagemAlt": p["imagemAlt"],
            "pergunta": p["pergunta"],
            "opcoes": [{"texto": o["texto"]} for o in p["opcoes"]],
        }
        for p in PERGUNTAS.values()
    ]
    return jsonify(saida)


@app.post("/api/responder")
def responder():
    """Corpo: {"pergunta_id": 1, "opcao": 2} -> correção + explicação."""
    dados = request.get_json(silent=True) or {}
    pergunta, msg = validar_resposta(dados.get("pergunta_id"), dados.get("opcao"))
    if msg:
        return erro(msg)

    opcao = dados["opcao"]
    correta = bool(pergunta["opcoes"][opcao]["certa"])

    with closing(get_db()) as db:
        db.execute(
            "INSERT INTO respostas (pergunta_id, correta) VALUES (?, ?)",
            (pergunta["id"], int(correta)),
        )
        db.commit()

    return jsonify(
        {
            "correta": correta,
            "indice_correto": indice_certo(pergunta),
            "explicacao": pergunta["opcoes"][opcao]["explicacao"],
        }
    )


@app.post("/api/resultado")
def resultado():
    """
    Corpo: {"respostas": [{"pergunta_id": 1, "opcao": 2}, ...]}
    A pontuação é calculada aqui no servidor.
    """
    dados = request.get_json(silent=True) or {}
    respostas = dados.get("respostas")
    if not isinstance(respostas, list) or not respostas:
        return erro("Envie a lista 'respostas'.")
    if len(respostas) > len(PERGUNTAS):
        return erro("Respostas demais.")

    vistos = set()
    pontuacao = 0
    detalhes = []
    for r in respostas:
        if not isinstance(r, dict):
            return erro("Formato de resposta inválido.")
        pergunta, msg = validar_resposta(r.get("pergunta_id"), r.get("opcao"))
        if msg:
            return erro(msg)
        if pergunta["id"] in vistos:
            return erro("Pergunta repetida.")
        vistos.add(pergunta["id"])
        certa = bool(pergunta["opcoes"][r["opcao"]]["certa"])
        pontuacao += int(certa)
        detalhes.append(f"P{pergunta['id']}: {'certo' if certa else 'errado'}")

    total = len(PERGUNTAS)
    with closing(get_db()) as db:
        db.execute(
            "INSERT INTO partidas (pontuacao, total) VALUES (?, ?)", (pontuacao, total)
        )
        db.commit()

    enviar_para_google_forms(pontuacao, total, " | ".join(detalhes))

    return jsonify(
        {
            "pontuacao": pontuacao,
            "total": total,
            "percentual": round(pontuacao / total * 100),
        }
    )


@app.get("/api/estatisticas")
def estatisticas():
    """Visão geral para o grupo apresentar no projeto."""
    with closing(get_db()) as db:
        partidas = db.execute(
            "SELECT COUNT(*) AS n, AVG(pontuacao * 1.0 / total) AS media FROM partidas"
        ).fetchone()
        por_pergunta = db.execute(
            """
            SELECT pergunta_id,
                   COUNT(*)      AS respostas,
                   SUM(correta)  AS acertos
            FROM respostas
            GROUP BY pergunta_id
            ORDER BY pergunta_id
            """
        ).fetchall()
        feedback_rows = db.execute(
            """
            SELECT avaliacao, COUNT(*) AS total
            FROM feedback
            GROUP BY avaliacao
            """
        ).fetchall()

    return jsonify(
        {
            "partidas_concluidas": partidas["n"],
            "media_de_acertos_percentual": round((partidas["media"] or 0) * 100),
            "por_pergunta": [
                {
                    "pergunta_id": r["pergunta_id"],
                    "pergunta": PERGUNTAS[r["pergunta_id"]]["pergunta"],
                    "respostas": r["respostas"],
                    "taxa_de_acerto_percentual": round(r["acertos"] / r["respostas"] * 100),
                }
                for r in por_pergunta
            ],
            "feedback": {row["avaliacao"]: row["total"] for row in feedback_rows},
        }
    )


@app.post("/api/feedback")
def feedback():
    """Corpo: {"avaliacao": "sim"} – registra a autoavaliação pós-quiz."""
    dados = request.get_json(silent=True) or {}
    avaliacao = dados.get("avaliacao")
    if avaliacao not in ("sim", "mais_ou_menos", "nao"):
        return erro("Avaliação inválida. Use: sim, mais_ou_menos ou nao.")
    with closing(get_db()) as db:
        db.execute("INSERT INTO feedback (avaliacao) VALUES (?)", (avaliacao,))
        db.commit()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
