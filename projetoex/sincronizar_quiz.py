"""Copia as perguntas do perguntas.json para o plano B dentro do quiz.js.
Rode depois de editar o perguntas.json:  python sincronizar_quiz.py"""
import json

perguntas = json.load(open("perguntas.json", encoding="utf-8"))
caminho = "static/quiz.js"
s = open(caminho, encoding="utf-8").read().replace("\r\n", "\n")
a = s.index("const perguntas = [")
b = s.index("\n];", a) + 3
s = s[:a] + "const perguntas = " + json.dumps(perguntas, ensure_ascii=False, indent=2) + ";" + s[b:]
open(caminho, "w", encoding="utf-8").write(s)
print("quiz.js atualizado com", len(perguntas), "perguntas")
