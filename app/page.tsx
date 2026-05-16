"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

interface Comment {
  id: string;
  username: string;
  text: string;
  avatar?: string;
}

export default function SorteioPage() {
  const [postUrl, setPostUrl] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<Comment | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const fetchComments = async () => {
    if (!postUrl.includes("instagram.com")) {
      alert("Por favor, insira um link válido do Instagram.");
      return;
    }

    setLoading(true);
    setWinner(null);
    setComments([]);

    try {
      const response = await fetch("/api/fetch-comments", {
        method: "POST",
        body: JSON.stringify({ postUrl }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar comentários.");
      }

      if (data.comments && data.comments.length > 0) {
        setComments(data.comments);
      } else {
        alert("Nenhum comentário encontrado neste post.");
      }
    } catch (err: any) {
      alert(err.message);
      console.error("Erro no fetch:", err);
    } finally {
      setLoading(false);
    }
  };

 const drawWinner = async () => {
    if (comments.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * comments.length);
      const chosen = comments[randomIndex];
      
      setWinner(chosen);
      setIsSpinning(false);

      const { error } = await supabase.from("giveaways").insert({
        post_url: postUrl,
        instagram_post_id: chosen.id,
        winner_username: chosen.username,
        winner_comment: chosen.text,
        winner_avatar: chosen.avatar || ""
      });

      if (error) console.error("Erro ao salvar no Supabase:", error.message);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            INSTA-SORTEIO
          </h1>
          <p className="text-gray-400 mt-2">Sorteador Partiu Guaratuba</p>
        </header>

        {/* Seção de Entrada */}
        <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl">
          <input
            type="text"
            placeholder="Cole o link do post (Reel ou Foto)..."
            className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all text-white"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
          />
          <button
            onClick={fetchComments}
            disabled={loading || !postUrl}
            className="w-full mt-4 bg-white text-black font-bold py-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Buscando comentários..." : "Carregar Lista"}
          </button>
        </section>

        {/* Seção de Resultados */}
        {comments.length > 0 && (
          <section className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 font-medium">
                {comments.length} comentários carregados
              </span>
              <button 
                onClick={drawWinner}
                disabled={isSpinning}
                className="bg-pink-600 px-6 py-2 rounded-full font-bold hover:bg-pink-500 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSpinning ? "SORTEANDO..." : "SORTEAR AGORA!"}
              </button>
            </div>

            {winner && (
              <div className={`p-8 rounded-3xl border-2 text-center transition-all duration-500 ${
                isSpinning ? 'border-zinc-700 opacity-50 scale-95' : 'border-green-500 bg-green-500/10 scale-100 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
              }`}>
                <h2 className="text-xs uppercase tracking-[0.2em] text-green-500 font-bold mb-2">
                  🏆 Ganhador(a) 🏆
                </h2>
                <p className="text-4xl font-black mt-2 tracking-tight">@{winner.username}</p>
                <div className="h-px bg-zinc-800 w-1/2 mx-auto my-4" />
                <p className="text-zinc-300 italic text-lg">"{winner.text}"</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}